
/**
 * Check cart for all valid item quantity
 * Check valid CC stripe payment method
 * Check valid user shipping country
 * Check valid shipping options on per product basis for shipment to user (shipping is applied per product, then further checked per shop if only once shipment applies)
 * Check shop has valid Stripe account
 * Fulfill payment using Stripe. Charge account, pay 92% to business. 8% to Minipost. Record payment on ledger
 */
export const checkoutNowWithCurrentCartItems = () => {

}

/**
 * Direct user to the checkout page where they can see all cart details before fulfilling Stripe payment 
 */
export const prepareCheckoutWithCurrentCartItems = () => {

}

export const addOneProductToCart = (id, style, option) => {

}

export const removeOneProductFromCart = (id, style, option) => {

}

export const setQuantityOfProduct = (id, style, option, quantity) => {

}

export const getCachedCart = () => {

}

export const updateCachedCart = () => {

}

export const getUserShippingData = () => {
    
}