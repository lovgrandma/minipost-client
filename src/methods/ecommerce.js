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
export const checkoutNowWithCurrentCartItems = async function(e) {
    try {
        this.setState({ busy: true });
        setTimeout(() => {
            this.setState({ busy: false });
        }, 25000);
        if (cookies.get('loggedIn') && cookies.get('hash')) {
            let username = cookies.get('loggedIn');
            let hash = cookies.get('hash');
            let self = true;
            let checkCC = true;
            let getNewCart = true;
            let cachedCart = getCachedCart();
            let checkoutTruths = null;
            if (this.state.checkoutTruths) {
                checkoutTruths = this.state.checkoutTruths;
            }
            return await fetch(currentshopurl + 's/processcompletecheckout', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self, checkCC, getNewCart, cachedCart, checkoutTruths
                })
            })
            .then((response) => {
                return response.json();
            })
            .then(async (result) => {
                this.setState({ busy: false });
                console.log(result); // if success push user to completed checkout page
                if (result) {
                    if (result.orderRecord) {
                        if (result.orderRecord.paymentFulfilled) {
                            await emptyCachedCartItems(); // Empty cached cart items as well. User just completed the purchase
                            this.setState({ cartData: [], checkoutTruths: {} }, () => {
                                this.props.history.push('/order?o=' + result.orderRecord.id); // redirect user to receipt page
                            }); // Set stateful user cart to empty
                        }
                    }
                }
                return result;
            })
            .catch((err) => {
                this.setState({ checkoutError: "Failed to complete cart checkout" }); // Failed silently
                this.setState({ busy: false });
                return false;
            });
        } else {
            this.setState({ checkoutError: "Failed to complete cart checkout" }); // Failed silently
            this.setState({ busy: false });
            return false;
        }
    } catch (err) {
        this.setState({ checkoutError: "Failed to complete cart checkout" }); // Failed silently
        this.setState({ busy: false });
        return false;
    }
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
        if (username && !userShippingData) {
            return {
                error: "Please add shipping data to your account before adding products. Click here to update your shipping info. If you've already updated your shipping data and you're seeing this message please refresh",
                action: "shipping data input"
            }
        } else if (username && !userShippingData.hasOwnProperty("country")) {
            // User is logged in but their shipping data is not set
            return {
                error: "Please add shipping data to your account before adding products. Click here to update your shipping info. If you've already updated your shipping data and you're seeing this message please refresh",
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
export const setQuantityOfProducts = async function(products) {
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
            console.log(result);
            if (result.data) {
                if (result.cart) {
                    updateCachedCart(result.cart); // Necessarily updates local cart to get new cart values on checkout reload data
                }
                if (result.data[0].hasOwnProperty("changedQuantity")) { // Making sure we have the right type of data
                    this.setState({ updateExceptions: result.data });
                } else {
                    this.setState({ updateExceptions: null })
                }
                return result;
            }
            return {
                data: null,
                error: "did not complete"
            }
        })
        .catch((err) => {
            console.log(err);
            return {
                data: null,
                error: "did not complete"
            }
        });
    } else {
        return {
            data: null,
            error: "did not complete"
        }
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

/**
 * User is logging out. Delete cart session
 */
export const deleteCachedCart = () => {
    try {
        window.localStorage.removeItem("cachedcart");
    } catch (err) {
        console.log(err);
        // Fail silently
    }
}

export const emptyCachedCartItems = () => {
    try {
        let temp = JSON.parse(window.localStorage.getItem('cachedcart'));
        temp.items = [];
        window.localStorage.setItem('cachedcart', JSON.stringify(temp));
        return temp;
    } catch (err) {
        return false; // fail silently
    }
}

export const formatAPrice = function(number, ensureToFixed = true) {
    try {
        if (number) {
            var nf = new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: 'currency',
                currency: 'USD'
            });
            return nf.format(number);
        }
        return null;
    } catch (err) {
        return number;
    }
}

export const resolveOrderDesc = function(order, i) {
    try {
        let orders = [];
        let orderString = "";
        let more = false;
        for (let i = 0; i < order.cart.length; i++) {
            if (orders.length < 3) {
                if (orders.indexOf(order.cart[i].name) == -1) {
                    orders.push(order.cart[i].name);
                }
            } else {
                if (orders.indexOf(order.cart[i].name) == -1) {
                    more = true;
                }
                break;
            }
        }
        for (let i = 0; i < orders.length; i++) {
            if (i < orders.length - 1) {
                orderString += orders[i] + ", ";
            } else {
                orderString += orders[i];
            }
        }
        if (more) {
            return orderString + "..";
        }
        return orderString;
    } catch (err) {
        console.log(err);
        return "Order Numbered #" + i;
    }
}

export const resolveTotal = function(order) {
    try {
        return formatAPrice(order.totals.total);
    } catch (err) {
        return "Click to see order total";
    }
}

export const resolveOrderId = function(order) {
    try {
        return order.id;
    } catch (err) {
        return null;
    }
}

export const sendToOrderReceipt = function(order) {
    try {
        this.props.history.push("/order?o=" + order.id);
    } catch (err) {
        return false;
    }
}

export const resolveOrderShops = function(order) {
    try {
        let shops = [];
        let shopsString = "";
        let more = "";
        for (let i = 0; i < order.shops.length; i++) {
            if (shops.length < 3) {
                if (shops.indexOf(order.shops[i].name) == -1) {
                    shops.push(order.shops[i].name);
                }
            } else {
                if (shops.indexOf(order.shops[i].name) == -1) {
                    more = "..";
                }
                break;
            }
        }
        for (let i = 0; i < shops.length; i++) {
            if (i < shops.length -1) {
                shopsString += shops[i] + ", ";
            } else {
                shopsString += shops[i];
            }
        }
        if (shopsString.length > 0) {
            return "sold by " + shopsString + more;
        } else {
            return "";
        }
    } catch (err) {
        return null;
    }
}

export const redirectManageShopOrders = function() {
    try {
        this.props.history.push('/manageorders');
    } catch (err) {
        return null;
    }
}

export const formatAFee = function(numerator, denominator) {
    try {
        let dif = denominator - numerator;
        return ((dif / denominator) * 100).toFixed(1) + "%";
    } catch (err) {
        return null;
    }
}