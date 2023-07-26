import { useState } from "react"
import { parse, stringify } from "flatted"
import { parseString } from "xml2js"
import axios from "axios"

import {
  getFromLocalStorage,
  getWebsiteRootUrl,
  removeFromLocalStorage,
  setStringToLocalStorage,
} from "../../lib/utils"


const siteRoot = getWebsiteRootUrl()

const useFAC = () => {
  const [HPPSecurityToken, setHPPSecurityToken] = useState("")
  const [loading, setLoading] = useState(false)

  // Convert string to boolean
  const stringToBoolean = string =>
    string === "false" ||
    string === "undefined" ||
    string === "null" ||
    string === "0"
      ? false
      : !!string

  // Is FAC production mode enabled?
  const FACProduction = stringToBoolean(process.env.GATSBY_FAC_PRODUCTION)
  const FACUrlPrefix = FACProduction ? `marlin` : `ecm`
  const FACPagesetAndPagename = process.env.GATSBY_FAC_PAGESET_PAGENAME

  const HPPRootUrl = `https://${FACUrlPrefix}.firstatlanticcommerce.com/MerchantPages/${FACPagesetAndPagename}/`
  // Returns Hosted Payment Page Security Token if request was successful, else an empty string
  const getHPPSecurityToken = async (
    fullName,
    email,
    phone,
    orderId,
    amount
  ) => {
    // Amount is in the form of a string, e.g. "10.00"
    try {
      const response = await axios.post(
        `/.netlify/functions/get-hpp-security-token`,
        JSON.stringify({
          fullName: fullName,
          email: email,
          phone: phone,
          orderNumber: orderId,
          cardholderResponseUrl: `${siteRoot}/payment-complete?order_id=${orderId}`,
          totalAfterTax: `${amount}`,
          currency: "TTD",
        })
      )

      console.log(`Axios Response: ${stringify(response.data)}`) // data property of axios response object
      console.log(`Axios Status: ${stringify(response.status)}`) // status property of axios response object

      // server side FAC authorization request was sent & response returned
      if (response.status === 200) {
        let responseBody
        parseString(
          response.data.data,
          { explicitArray: false },
          function (err, result) {
            console.dir(result)
            responseBody = result
          }
        )

        console.log({ responseBody })

        // FAC HPP Security Token Received successfully. Token expires after 5 minutes
        if (responseBody.HostedPagePreprocessResponse.ResponseCode === "0") {
          console.log("We got our response!")
          setHPPSecurityToken(
            responseBody.HostedPagePreprocessResponse.SecurityToken
          )
          return responseBody.HostedPagePreprocessResponse.SecurityToken
        }
        // Request returned ResponseCode other than 0, so Security Token wasn't returned successfully

        return ""
      }
      // server side HPP Security Token request was sent but there was an error with the request or response
      if (response.status === 202) {
        const responseBody = parse(response.data.data)
        console.log(`FAC Response body: ${stringify(responseBody)}`)
        alert(
          "HPP Security Token Request Failed. Please Refresh site and try again, or contact Customer Support."
        )
        setLoading(false)
      }
    } catch (error) {
      console.log(error.message)
      // Handling different response codes received by axios
      // status:500 means there was a server side error at a level above FAC script. Eg. Netlify functions timeout limit reached, even through server side axios request & FAC server's timeout haven't been reached
      console.log(`Error: ${error}`)

      console.log(
        "HPP Token Request Failed. Likely due to  server side Error which stopped request to FAC being sent. Server error. Please Refresh Page & try again."
      )
      setLoading(false)
    }

    return ""
  }

  // Load FAC Hosted Payment Page
  const loadFACHostedPaymentPage = async (
    fullName,
    email,
    phone,
    orderId,
    amount
  ) => {
    // Only attempt to load HPP if in browser, and not when SSR is running
    if (!siteRoot) {
      throw new Error("Running in SSR mode")
    }

    // Get a Hosted Page Security token
    const HPPSecurityTokenLocal = await getHPPSecurityToken(
      fullName,
      email,
      phone,
      orderId,
      amount
    )

    // Did we get a security token
    if (!HPPSecurityTokenLocal) {
      throw new Error("No HPP Security Token")
    }
    console.log({ HPPSecurityTokenLocal })
    // Store to local state and local storage
    setHPPSecurityToken(HPPSecurityTokenLocal)

    const isSecurityTokenSavedToLocalStorage = setStringToLocalStorage(
      "HPPSecurityToken",
      HPPSecurityTokenLocal
    )

    // Only allow card payment if Security Token was saved to local storage
    if (isSecurityTokenSavedToLocalStorage) {
      if (typeof window !== "undefined") {
        window.open(`${HPPRootUrl + HPPSecurityTokenLocal}`, "_self")
      }
    } else {
      alert(
        "SecurityToken save to LocalStorage Error, Please refresh page & try again. If error continues please contact Customer Support"
      )
    }
  }

  const HPPResponse = async (HPPSecurityToken, RespCode, ReasonCode) => {
    // const HPPSecurityToken = router.query.ID
    // const RespCode = router.query.RespCode
    // const ReasonCode = router.query.ReasonCode

    const HPPSecurityTokenLocalStorage = getFromLocalStorage("HPPSecurityToken")

    // If Checkout URL has these params, then a Hosted Payment Page payment was carried out & redirected to this page
    // The same HPPSecurityToken must also be present in LocalStorage. This ensures that the url query params are from a new transaction, and not from navigating to an old url.
    // On completion of transaction the securityToken is removed from localStorage.
    // This prevents unnecessary requests to FAC servers from navigating back to an old page.

    // Verify if payment was successful
    console.log({
      HPPSecurityToken,
      ReasonCode,
      RespCode,
      HPPSecurityTokenLocalStorage,
    })

    if (
      HPPSecurityToken &&
      RespCode &&
      ReasonCode
      // Removing for now, causes issues in app. // TODO: use context instead.
      // HPPSecurityTokenLocalStorage &&
      // HPPSecurityToken === HPPSecurityTokenLocalStorage
    ) {
      const response = await getHostedPaymentPageResult(HPPSecurityToken)
      // A response of 1 means the payment was successful
      return response
    } else if (HPPSecurityToken === HPPSecurityTokenLocalStorage) {
      alert(
        "We're sorry. Your payment token timed out. Please go back to your cart and try again."
      )
      return false
    } else {
      alert(
        "We're sorry, there was an error processing your payment request. Please try again."
      )
      return false
    }
  }

  // Return: ResponseCode. 1 if HostedPageResults request shows transaction approved, else return the number corresponding to error
  // If request fails to find matching token with ResponseCode=1 on FAC's servers, the emails are not sent. This ensures that navigating back to the Checkout Page with the query params in the URL at a later date doesn't resend purchase emails just bebase the query param 'ResponseCode" = 1.

  const getHostedPaymentPageResult = async HPPSecurityToken => {
    // Remove the token from Local Storage immediately, it's been used and should not be used for any subsequent requests.
    removeFromLocalStorage("HPPSecurityToken")

    try {
      console.log("About to call get hosted page result")
      const response = await axios.post(`/.netlify/functions/get-hpp-result`, {
        HPPSecurityToken: `${HPPSecurityToken}`,
      })

      console.log(response.data) // data property of axios response object
      console.log(`Axios  HPP HTML Status: ${response.status}`) // status property of axios response object

      // FAC request was sent, and a successful response was received
      if (response.status === 200) {
        let responseBody
        parseString(
          response.data.data,
          { explicitArray: false },
          function (err, result) {
            console.dir(result)
            responseBody = result
          }
        )
        console.log(`FAC HPP Result Response body:`)
        console.log({ responseBody })

        // FAC HPP Result Response shows transaction was successful
        if (
          responseBody.HostedPageResultsResponse.AuthResponse
            .CreditCardTransactionResults.ResponseCode === "1" &&
          responseBody.HostedPageResultsResponse.AuthResponse
            .CreditCardTransactionResults.ReasonCode === "1"
        ) {
          // alert("Your payment was successful!")
          return {
            code: 1,
            data: responseBody.HostedPageResultsResponse.AuthResponse,
          }
        }

        // Invalid Security Token. Like from navigating back to old Checkout Page that has old token in url after a previous HPP purchase attempt
        // Or User took too long on Hosted Payment Page so token expired.
        if (
          responseBody.HostedPageResultsResponse.AuthResponse
            .CreditCardTransactionResults.ReasonCode === "3000" ||
          responseBody.HostedPageResultsResponse.AuthResponse
            .CreditCardTransactionResults.ReasonCode === "3001"
        ) {
          console.log(
            `HostedPageResult request returned. ReasonCodeDescription:  Invalid Security Token.`
          )
          alert(
            "Your payment was not successful. This happened because of a timeout, or an invalid payment token. Please go back and try again."
          )

          return {
            code: parseInt(
              responseBody.HostedPageResultsResponse.AuthResponse
                .CreditCardTransactionResults.ResponseCode
            ),
            data: responseBody.HostedPageResultsResponse.AuthResponse,
          }
        }

        // Request returned ResponseCode of 2, which means the transaction was declined.
        if (
          responseBody.HostedPageResultsResponse.AuthResponse
            .CreditCardTransactionResults.ResponseCode === "2"
        ) {
          console.log(`HostedPageResult request returned: transaction failed`)
          alert(
            responseBody.HostedPageResultsResponse.AuthResponse
              .CreditCardTransactionResults.ReasonCodeDescription
          )
          return {
            code: parseInt(
              responseBody.HostedPageResultsResponse.AuthResponse
                .CreditCardTransactionResults.ResponseCode
            ),
            data: responseBody.HostedPageResultsResponse.AuthResponse,
          }
        }

        if (
          responseBody.HostedPageResultsResponse.AuthResponse
            .CreditCardTransactionResults.ResponseCode === "3"
        ) {
          console.log(`HostedPageResult request returned: Error`)

          alert(
            "Error. Transaction Failed. Please Re-enter Card Details & Try Again."
          )
          return {
            code: parseInt(
              responseBody.HostedPageResultsResponse.AuthResponse
                .CreditCardTransactionResults.ResponseCode
            ),
            data: responseBody.HostedPageResultsResponse.AuthResponse,
          }
        }
      }
      // server side HostedPageResult request was sent but there was an error with the request or response
      // The transaction may or may not have been approved.
      if (response.status === 202) {
        const responseBody = response.data.data
        console.log(`FAC Response body: ${responseBody}`)
        console.log(`Server side error in sending request`)
        alert(
          "Error: HPP Result Request Failed. Your transaction may have been approved. Please Contact Customer Support."
        )
        setLoading(false)

        return 4
      }
    } catch (error) {
      console.log(`Error: ${error}`)
      console.log(error.message)
      console.log("Client side HostedPageResult request sending error")

      alert(
        "Error: HPP Result Request Failed. Your transaction may have been approved. Please Contact Customer Support."
      )
      setLoading(false)

      return 5
    }
  }

  return {
    loadFACHostedPaymentPage,
    getHostedPaymentPageResult,
    HPPSecurityToken,
    loading,
    HPPResponse,
  }
}

export default useFAC
