import React, { useEffect } from 'react'
import withLocation from '../components/withLocation'

const PaymentComplete = ({ search }) => {
  const { status, order_id, transaction_id } = search

  const checkStatus = () => {
    switch (status) {
      case 'success':
        sendMessage(transaction_id)
        break
      case 'failed':
        sendMessage('failed')
        break

      default:
        sendMessage('unknown')
        break
    }
  }

  const sendMessage = (message) => {
    console.log('Sending message: ' + message)
    if (typeof window !== 'undefined') {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(message)
      return
    }
  }

  useEffect(() => {
    checkStatus()
  })

  return (
    <div>
      <p>Completed</p>
    </div>
  )
}

export default withLocation(PaymentComplete)
