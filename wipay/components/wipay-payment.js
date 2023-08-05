import React from "react"

const ACTION_URL = "https://tt.wipayfinancial.com/plugins/payments/request"

const ACCOUNT_NUMBER =
  process.env.NODE_ENV === "development"
    ? "1234567890"
    : process.env.GATSBY_WIPAY_ACCOUNT_NUMBER

const WipayPayment = ({
  amount,
  phone,
  email,
  name,
  orderId,
  returnUrl,
  paymentFormRef,
}) => {
  return (
    <form
      style={{ marginBottom: 0 }}
      action={ACTION_URL}
      method="post"
      // ref={(ref) => { paymentFormRef = ref; }}
      ref={paymentFormRef}
    >
      <input name="total" type="hidden" value={amount} />
      <input name="phone" type="hidden" value={phone} />
      <input name="email" type="hidden" value={email} />
      <input name="name" type="hidden" value={name} />
      <input name="order_id" type="hidden" value={orderId} />
      <input name="response_url" type="hidden" value={returnUrl} />
      <input name="country_code" type="hidden" value="TT" />
      {/* <input name="account_number" type="hidden" value={ACCOUNT_NUMBER} /> */}
      <input name="account_number" type="hidden" value="1234567890" />
      <input name="currency" type="hidden" value="TTD" />
      {/* <input name="environment" type="hidden" value="sandbox" /> */}
      <input
        name="environment"
        type="hidden"
        value="sandbox"
        // value={process.env.NODE_ENV === "development" ? "sandbox" : "live"}
      />
      <input name="fee_structure" type="hidden" value="merchant_absorb" />
      <input name="method" type="hidden" value="credit_card" />
      <input name="origin" type="hidden" value="payments-unqueue" />
      <input name="country_code" type="hidden" value="TT" />
    </form>
  )
}

export default WipayPayment