import { cookies } from '../App.js';
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
export const checkoutNowWithCurrentCartItems = function(e) {
    
}

/**
 * Direct user to the checkout page where they can see all cart details before fulfilling Stripe payment 
 */
export const prepareCheckoutWithCurrentCartItems = function(e) {
    try {
        this.props.history.push('/checkout');
    } catch (err) {
        // Fail silently
    }
}

export const addOneProductToCart = async (product, userShippingData) => {
    try {
        let username = cookies.get('loggedIn');
        let hash = cookies.get('hash');
        let self = true;
        if (username && !userShippingData.hasOwnProperty("country")) {
            // User is logged in but their shipping data is not set
            return {
                error: "Please add shipping data to your account before adding products. Click here to update your shipping info",
                action: "shipping data input"
            }
        }
        if (username && hash && product && userShippingData.hasOwnProperty("country")) {
            return await fetch(currentshopurl + "s/addoneproducttocart", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self, product, userShippingData
                })

            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                if (result.hasOwnProperty("data")) {
                    if (result.data.hasOwnProperty("data")) {
                        if (result.data.data.hasOwnProperty("items") && result.data.data.hasOwnProperty("wishList")) {
                            updateCachedCart(result.data.data);
                        }
                    }
                }
                return result.data;
            })
            .catch((err) => {
                return false;
            });
        } else {
            // Either user is not logged in or they dont have any shipping data. Just allow product to be added to local cart even if shipping data is not accurate. Will validate and ask for shipping info at checkout
            return false;
        }
    } catch (err) {
        return false;
    }
}

/**
 * Will be used to removing cart product values and setting to a specific quantity for many or 1 products
 * @param {Object[]} products
 */
export const setQuantityOfProducts = async (products) => {
    if (cookies.get("loggedIn")) {
        let username = cookies.get('loggedIn');
        let hash = cookies.get('hash');
        let self = true;
        return await fetch(currentshopurl + 's/setproductquantites', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: corsdefault,
            body: JSON.stringify({
                username, hash, self, products
            })
        })
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            if (result.data) {
                if (result.cart) {
                    updateCachedCart(result.cart); // Necessarily updates local cart to get new cart values on checkout reload data
                }
                return result;
            }
            return {
                data: null,
                error: "did not complete"
            }
        })
        .catch((err) => {
            return {
                data: null,
                error: "did not complete"
            }
        });
    } else {

    }
}

export const getCachedCart = () => {
    try {
        return JSON.parse(window.localStorage.getItem('cachedcart'));
    } catch (err) {
        return false;
    }
}

export const updateCachedCart = (cart) => {
    try {
        window.localStorage.setItem('cachedcart', JSON.stringify(cart));
    } catch (err) {
        return false;
    }
}

export const updateSingleShippingOnProduct = async (productData, shippingRule) => {
    if (cookies.get('loggedIn') && cookies.get('hash')) {
        let username = cookies.get('loggedIn');
        let hash = cookies.get('hash');
        let self = true;
        return await fetch(currentshopurl + 's/updatesingleshippingonproduct', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            crednetials: corsdefault,
            body: JSON.stringify({
                username, hash, self, productData, shippingRule
            })
        })
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            console.log(result);
            if (result) {
                if (result.error) {
                    return false;
                }
                if (result.data) {
                    if (result.data.items) {
                        updateCachedCart(result.data);
                        return result;
                    }
                }
            }
        })
        .catch((err) => {
            console.log(err);
            return false;
        })
    } else {
        return false;
    }
}