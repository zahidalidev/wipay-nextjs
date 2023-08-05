import React from "react"
import styled from "styled-components"
import { motion } from "framer-motion"
import Loader from "react-loader-spinner"
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import { colors } from "../styles/colors"

const CardContainer = styled.div`
  /* height: calc(100vh - 97px); */
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`
const Card = styled(motion.div)`
  background: white;
  padding: 30px;
  border-radius: 5px;
  box-shadow: 0 0 7px rgba(118, 118, 118, 0.19);
  max-width: 320px;
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  align-items: center;
`
const Logo = styled.img`
  margin: 0 0 30px 0;
  width: 90px;
  object-fit: contain;
`
const LoadCopy = styled.p`
  font-weight: 500;
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 30px;
`

const HostedPaymentLoader = ({ refProp }) => (
  <CardContainer>
    <Card
      ref={refProp}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.4 }}
    >
      <Logo src={require("../images/unqueue-shoppers.svg")} />
      <LoadCopy>
        We are taking you to our payment provider to complete your purchase.
        Your information is handled securely by FAC and never touches our
        servers.
      </LoadCopy>
      <Loader type="Oval" color={colors.primary} height={40} width={40} />
    </Card>
  </CardContainer>
)

export default HostedPaymentLoader