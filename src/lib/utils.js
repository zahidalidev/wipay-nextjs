// Return website url if website is being run in browser and not SSR
// Else return empty string ''
export const getWebsiteRootUrl = () =>
  typeof window !== "undefined" ? window.location.origin : ""

// Sets specified localstorage key to value specified, and creates the key if it doesn't exist
// Return: True if value was set, false if it wasn't (from localstorage error or code running in SSR mode)
// Params:
// key: type string
// value: type string
export const setStringToLocalStorage = (key, value) => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))

      return true
    } catch {
      return false
    }
  }
  return false
}

// Returns the value of localStorage entry, or null if it doesn't exist.
// params: key: type string
export const getFromLocalStorage = key =>
  // return false if not running in browser, or 'cart' values from localStorage or falsy from JSON.parse
  typeof window !== "undefined"
    ? JSON.parse(window.localStorage.getItem(key))
    : null

// params: key: type string. The item to remove
// If key exists it's removed
export const removeFromLocalStorage = keyName => {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(keyName)
  }
}

export function formatAmountForFAC(amount, currency = "TTD") {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  })
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  for (let part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}

// Probably need to extract this to a hook
// Create our number formatter.
var formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "TTD",
})

export const numberToCurrency = price => {
  return formatter.format(price)
  // return formatter.format(price).replace(/(\.|,)00$/g, "")
}