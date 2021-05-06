import currentrooturl from '../url.js';
import currentshopurl from '../shopurl.js';
import corsdefault from '../cors.js';
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

export const addOneProductToCart = async (product) => {
    try {
        let username = cookies.get('loggedIn');
        let hash = cookies.get('hash');
        let self = true;
        if (username && hash && product) {
            return await fetch(currentshopurl + "s/addoneproducttocart", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self, product
                })

            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                console.log(result);
                if (result.error) {
                    return false;
                }
            })
            .catch((err) => {
                return false;
            });
        } else {
            return false;
        }
    } catch (err) {
        return false;
    }
}

export const removeOneProductFromCart = (id, style, option) => {

}

export const emptyCart = () => {

}

export const setQuantityOfProduct = (id, style, option, quantity) => {

}

export const getCachedCart = () => {

}

export const updateCachedCart = () => {

}

export const getUserShippingData = () => {

}