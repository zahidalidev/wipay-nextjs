import React, { useRef, useState, useEffect } from "react"
import styled from "styled-components"
import Loader from "react-loader-spinner"

import withLocation from "../components/withLocation"
import { colors } from "../styles/colors"
import WipayPayment from "../components/wipay-payment"
import WiPayLoader from "../components/wipay-loader"

const InitiatePayment = ({ search }) => {
  const { name, email, phone, total, storeId, orderId } = search

  const paymentForm = useRef(null)
  const loadingCard = useRef(null)

  const [loading, setLoading] = useState(true)

  //Check that we have all the information
  const requirementsCheck = () => {
    if (!name || !email || !phone || !total || !storeId) {
      if (typeof window !== "undefined") {
        sendError()
        return
      }
    } else {
      setLoading(false)
      requestAnimationFrame(() => goToWipay())
    }
  }

  const sendError = () => {
    if (typeof window !== "undefined") {
      window.ReactNativeWebView &&
        window.ReactNativeWebView.postMessage("missing", "*")

      return
    }
  }

  useEffect(() => {
    requirementsCheck()
  }, [])

  const goToWipay = () => {
    paymentForm.current.submit()

    loadingCard.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
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
        <WiPayLoader refProp={loadingCard} />
        <WipayPayment
          amount={parseFloat(total).toFixed(2)}
          name={name}
          phone={phone}
          email={email}
          orderId={orderId}
          returnUrl={`${window.location.origin.toString()}/paymentComplete`}
          paymentFormRef={paymentForm}
        />
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