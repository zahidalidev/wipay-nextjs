import React, { useRef, useState, useEffect } from "react"
import styled from "styled-components"
import Loader from "react-loader-spinner"

import withLocation from "../components/withLocation"
import { colors } from "../styles/colors"
import HostedPaymentLoader from "../components/wipay-loader"
import useFAC from "../components/custom-hooks/useFAC"
import { formatAmountForFAC } from "../lib/utils"

const InitiatePayment = () => {
  console.log('asdjaskdad---')
  const search = { name: 'asd', email: 'asd', phone: 'asd', total: '123123', storeId: 'asd', orderId: '123' }
  const { name, email, phone, total, storeId, orderId } = search

  // Custom Hooks
  const { loadFACHostedPaymentPage } = useFAC()

  const loadingCard = useRef(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    requirementsCheck()
  }, [])

  //Check that we have all the information
  const requirementsCheck = () => {
    if (!name || !email || !phone || !total || !storeId) {
      sendMessage("missing")
      return
    } else {
      setLoading(false)
      requestAnimationFrame(() => goToFACPaymentPage(orderId))
    }
  }

  const sendMessage = message => {
    if (typeof window !== "undefined") {
      window.ReactNativeWebView &&
        window.ReactNativeWebView.postMessage(message)
      return
    }
  }

  const goToFACPaymentPage = async orderId => {
    loadingCard.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })

    const formattedAmount = formatAmountForFAC(`${total}`)
    try {
      await loadFACHostedPaymentPage(
        name,
        email,
        phone,
        orderId,
        formattedAmount
      )
    } catch (err) {
      console.log("Error in goToFACPage")
      console.log({ err })
      if (err === "No HPP Security Token") {
        // We should go back to the cart and let the user try checkout out again
        alert(
          "Checkout session expired. We're taking you back to your cart to try again."
        )
        sendMessage("failed")
      }
      alert(
        "Something went wrong loading your checkout session. We're taking you back to your cart to try again."
      )
      sendMessage("failed")
    }
  }

  if (loading) {
    return (
      <Container>
        <Loader type="Oval" width={25} height={25} color={colors.primary} />
      </Container>
    )
  }

  return (
    <Container>
      <div>
        <HostedPaymentLoader refProp={loadingCard} />
      </div>
    </Container>
  )
}

export default withLocation(InitiatePayment)

const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  text-align: center;
`