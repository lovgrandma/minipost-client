import React, { Component } from 'react';
import {
    Button
} from 'react-bootstrap';
import corsdefault from '../cors.js';
import currentshopurl from '../shopurl.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { prepareCheckoutWithCurrentCartItems, checkoutNowWithCurrentCartItems, getCachedCart, setQuantityOfProducts, updateSingleShippingOnProduct } from '../methods/ecommerce.js';
import { cookies } from '../App.js';
import { debounce } from '../methods/utility.js';

export default class Checkout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: "", cartData: [], wishListData: null, updateExceptions: null
        }
        this.debounceUpdateQuantity = this.debounceUpdateQuantity.bind(this);
    }

    async componentDidMount() {
        try {
            this.setCachedCartState();
            if (this.props.cloud) {
                this.setState({ cloud: this.props.cloud });
            } else if (cookies.get("contentDelivery")) {
                this.setState({ cloud: cookies.get("contentDelivery") });
            } else {
                if (this.props.fetchCloudUrl) {
                    let cloudData = await this.props.fetchCloudUrl(); // Retrieve data from server if cloud data nonexistent in props and cookies
                    this.setState({ cloud: cloudData });
                }
            }
        } catch (err) {
            this.setState({ error: err });
            // Fail silently
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.iteration !== this.props.iteration) {
            this.setCachedCartState();
        }
    }

    async componentWillUnmount() {
        try {
            let data = await this.doUpdateProductQuantity();
            if (data) {
                return true; // Component unmounted
            } else {
                return false; // Component unmounted
            }
        } catch (err) {
            // Fail silently
        }
    }

    setCachedCartState = () => {
        let cachedCart = getCachedCart();
        if (cachedCart) {
            this.setState({ cachedCart: cachedCart }, () => {
                this.getImagesAndTitlesForCartProducts(); // Do after state has changed cart so fetch request gets appropriate data
            });
        }
        return cachedCart;
    }

    /**
     * Will get appropriate images and titles for cart products to display to user
     * @returns {Boolean}
     */
    getImagesAndTitlesForCartProducts(getNewCart = false) {
        this.setState({ error: "" });
        if (cookies.get('loggedIn') && cookies.get('hash')) {
            let username = cookies.get('loggedIn');
            let hash = cookies.get('hash');
            let self = true;
            if (this.state.cachedCart) {
                let cachedCart = this.state.cachedCart;
                fetch(currentshopurl + "s/getimagesandtitlesforcartproducts", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        username, hash, self, cachedCart, getNewCart
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result.hasOwnProperty("error")) {
                        this.setState({ error: result.error });
                    } else {
                        if (result.hasOwnProperty("data")) {
                            if (result.data.hasOwnProperty("items")) {
                                this.setState({ cartData: [] }); // You need to set cartData arr to empty to ensure uncontrolled quantities are reloaded in correct sectors
                                this.setState({ cartData: result.data.items });
                            }
                            if (result.data.hasOwnProperty("wishList")) {
                                this.setState({ wishListData: [] });
                                this.setState({ wishListData: result.data.wishList });
                            }
                            if (result.data.hasOwnProperty("checkoutTruths")) {
                                this.setState({ checkoutTruths: result.data.checkoutTruths });
                            }
                        }
                    }
                })
                .catch((err) => {
                    return false;
                })
            } else {
                return false;
            }
        }
    }

    formatAPrice(number, ensureToFixed = true) {
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

    getTotal(type = "total") {
        try {
            switch(type) {
                case "total":
                    if (this.state.checkoutTruths) {
                        if (this.state.checkoutTruths.hasOwnProperty("totals")) {
                            if (this.state.checkoutTruths.totals.hasOwnProperty("total")) {
                                return this.formatAPrice(this.state.checkoutTruths.totals.total)
                            }
                        }
                    }
                    break;
                case "products":
                    if (this.state.checkoutTruths) {
                        if (this.state.checkoutTruths.hasOwnProperty("totals")) {
                            if (this.state.checkoutTruths.totals.hasOwnProperty("products")) {
                                return this.formatAPrice(this.state.checkoutTruths.totals.products)
                            }
                        }
                    }
                    break;
                case "shipping":
                    if (this.state.checkoutTruths) {
                        if (this.state.checkoutTruths.hasOwnProperty("totals")) {
                            if (this.state.checkoutTruths.totals.hasOwnProperty("shipping")) {
                                return this.formatAPrice(this.state.checkoutTruths.totals.shipping)
                            }
                        }
                    }
                    break;
                default:
                    return null;
            }
        } catch (err) {
            return null;
        }
    }

    resolveShopName(item) {
        if (item.hasOwnProperty("shopId") && this.state.checkoutTruths) {
            if (this.state.checkoutTruths.hasOwnProperty("shop")) {
                for (let i = 0; i < this.state.checkoutTruths.shop.length; i++) {
                    if (item.shopId == this.state.checkoutTruths.shop[i].id) {
                        return this.state.checkoutTruths.shop[i].name;
                    }
                }
            }
        }
        return "";
    }

    async changeShippingClass(e, item) {
        try {
            this.setState({ busy: true });
            let newShippingRule = e.target.value;
            let productIndex = e.target.getAttribute("index");
            let productCopy = this.state.cartData[productIndex];
            let data = await updateSingleShippingOnProduct(productCopy, newShippingRule);
            if (data) {
                this.setCachedCartState();
                this.setState({ busy: false });
            } else {
                this.setState({ busy: false });
            }
        } catch (err) {
            console.log(err);
            this.setState({ busy: false }); // Fail silently
        }
    }

    resolveSelectedShipping(item, ship) {
        try {
            if (item.hasOwnProperty("shippingClass")) {
                if (item.shippingClass.hasOwnProperty("shippingRule") && ship.hasOwnProperty("shippingRule")) {
                    if (item.shippingClass.shippingRule == ship.shippingRule) {
                        return true;
                    }
                }
            }
        } catch (err) {
            return false;
        }
        return false;
    }

    resolveShippingOptions(classes, item, index) {
        let result = [];
        for (let i = 0; i < classes.length; i++) {
            result.push(<option value={classes[i].shippingRule} key={i} uuid={classes[i].uuid} onChange={(e) => {this.changeShippingClass(e)}}>{classes[i].shippingRule}</option>);
        }
        return result;
    }

    setQuantityToNoneDelete(e) {
        try {
            let quantities = document.getElementsByClassName("checkout-quantity-dropdown");
            quantities[e.target.getAttribute("index")].value = 0;
            this.doUpdateProductQuantity();
        } catch (err) {
            // Fail silently
        }
    }

    // Go through all item quantites displayed on page and determine if equal to value in state. If not, update on server. Debounced
    async doUpdateProductQuantity() {
        try {
            if (!this.state.busy) {
                this.setState({ busy: true });
                let toChange = [];
                let quantities = document.getElementsByClassName("checkout-quantity-dropdown");
                for (let i = 0; i < quantities.length; i++) { // Each quantity value should map perfectly with cartData state
                    if (quantities[i].value != this.state.cartData[i].quantity) { // User has changed quantity on this product
                        toChange.push({
                            product: this.state.cartData[i], 
                            newQuantity: quantities[i].value
                        });
                    }
                }
                if (toChange.length > 0) {
                    let complete = await setQuantityOfProducts.call(this, toChange);
                    if (complete) {
                        if (complete.error) {
                            this.setState({ error: complete.error });
                        } else {
                            this.getImagesAndTitlesForCartProducts(true);
                        }
                        this.setState({ busy: false });
                    } else {
                        this.setState({ busy: false });
                    }
                } else {
                    this.setState({ busy: false });
                }
            }
        } catch (err) {
            this.setState({ busy: false }); // Fail silently
        }
    }

    debounceUpdateQuantity = debounce(() => this.doUpdateProductQuantity(), 5000);

    // Visually displays an exception for an update on quantity or deletes it if parameter for deleteException passed
    checkException(item, deleteException = false) {
        try {
            if (this.state.updateExceptions) {
                for (let i = 0; i < this.state.updateExceptions.length; i++) {
                    if (this.state.updateExceptions[i].changedQuantity) {
                        if (item.name == this.state.updateExceptions[i].product.name && item.option == this.state.updateExceptions[i].product.option && item.style == this.state.updateExceptions[i].product.style) {
                            if (deleteException) {
                                let temp = this.state.updateExceptions;
                                temp.splice(i, 1);
                                this.setState({ updateExceptions: temp });
                            } else {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        } catch (err) {
            return false; // Fail silently
        }
    }

    render() {
        return (
            <div className={this.props.fullCheckout ? "fullcheckout-flex max-width-1600 margin0auto" : ""}>
                <div className={this.state.busy ? "cover-page cover-on" : "cover-page cover-off"}></div>
                <div className="checkout-products-and-btn-container">
                    {
                        !this.props.fullCheckout ?
                            <Button className="transaction-button transaction-button-checkout btn-center cart-button-space transaction-button-cart-full-width" onClick={(e)=>{prepareCheckoutWithCurrentCartItems.call(this, e)}}>Checkout</Button>
                            : null
                    }
                    <div className={this.state.error ? this.state.error.length > 0 ? "err-status err-status-product-active err-status-active" : "err-status err-status-product err-status-hidden" : "err-status err-status-product err-status-hidden"}>{this.state.error}</div>
                    <div>
                        {
                            this.props.fullCheckout ?
                                <h3>Your Cart</h3>
                                : null
                        }
                        <div className="checkout-products-list-container">
                            {
                                this.state.cartData ?
                                    this.state.cartData.length > 0 ?
                                        this.state.cartData.map((item, index) => 
                                            <div className="checkout-product-flex-container">
                                                <div>
                                                    <img src={this.props.cloud ? this.props.cloud + "/" + item.image : ""} className="checkout-image-min"></img>
                                                </div>
                                                <div className="checkout-product-container">
                                                    <div className="checkout-product-name">{item.name}</div>
                                                    {
                                                        this.props.fullCheckout ?
                                                            <div className="checkout-product-shop">
                                                                {this.resolveShopName(item)}
                                                            </div>
                                                            : null
                                                    }
                                                    {
                                                        this.props.fullCheckout ?
                                                            <div className="checkout-product-full-product-data-container">
                                                                <div className="shipping-methods-container">
                                                                    <span className="weight600 grey-out shipping-label-text-checkout">shipping class:</span>
                                                                    <div>
                                                                        {
                                                                            item.validShippingClassesForUser ?
                                                                                item.validShippingClassesForUser.classes ?
                                                                                    item.validShippingClassesForUser.classes.length > 0 ?
                                                                                        <select name="product-options-select-container" id="product-options-select-container" className="product-options-select-dropdown" defaultValue={item.shippingClass.shippingRule} index={index} onChange={(e) => {this.changeShippingClass(e, item)}}>
                                                                                            {
                                                                                                item.validShippingClassesForUser ?
                                                                                                    item.validShippingClassesForUser.classes ?
                                                                                                            this.resolveShippingOptions(item.validShippingClassesForUser.classes, item)
                                                                                                        : null 
                                                                                                    : null
                                                                                            }
                                                                                        </select>
                                                                                        : <p className="err-status prompt-basic-s2 no-shipping-err">Unfortunately, this product does not ship to your country</p>
                                                                                    : null
                                                                                : null
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            : null
                                                    }
                                                    <div className="checkout-product-meta-data-container">
                                                        <div className="checkout-product-flex-data-container">
                                                            {
                                                                item.style ?
                                                                    <div className="checkout-product-style">{item.style}</div>
                                                                    : null
                                                            }
                                                            {
                                                                item.style && item.option ?
                                                                    <span>|</span>
                                                                    : null
                                                            }
                                                            {
                                                                item.option ?
                                                                    <div className="checkout-product-option grey-out">{item.option}</div>
                                                                    : null
                                                            }
                                                            {
                                                                item.quantity ?
                                                                    this.props.fullCheckout ?
                                                                        <div className="checkout-product-quantity checkout-product-quantity-min-checkout">
                                                                            <span className="grey-out"><FontAwesomeIcon className="edit-interact" icon={faCube} color={ '#919191' } alt="edit" /></span>
                                                                            <div className="align-vert"><input className="checkout-quantity-dropdown checkout-quantity-dropdown-full" type="number" id="quantity" name="quantity" min="0" max="1000000" defaultValue={item.quantity} onChange={(e) => {this.debounceUpdateQuantity()}}></input></div>
                                                                        </div>
                                                                        : item.quantity > 1 ?
                                                                            <div className="checkout-product-quantity checkout-product-quantity-min-checkout">
                                                                                <FontAwesomeIcon className="edit-interact" icon={faCube} color={ '#919191' } alt="edit" />
                                                                                <div>{item.quantity}</div>
                                                                            </div>
                                                                            : null
                                                                    : null
                                                            }
                                                        </div>
                                                        <div>
                                                            <div className="social-portal-times times-checkout-button" index={index} onClick={(e) => {this.setQuantityToNoneDelete(e)}}>&times;</div>
                                                        </div>
                                                    </div>
                                                    {
                                                        this.checkException(item) ?
                                                            <div className="err-status prompt-basic-s2 err-status-wide margin-top-5" onClick={(e) => {this.checkException(item, true)}}>We had to adjust the quantity since the amount you want is more than the seller has in stock</div>
                                                            : null
                                                    }
                                                </div>
                                                {
                                                    this.props.fullCheckout ?
                                                        <div className="fullcheckout-meta-data">
                                                            <div className="checkout-product-individual-price weight700">{item.price ? this.formatAPrice(item.price) : null}</div>
                                                            <div>
                                                                <div className="checkout-subtotal-quantity-block"><FontAwesomeIcon className="edit-interact" icon={faCube} color={ '#919191' } alt="edit" />&nbsp;{item.quantity}</div>
                                                                <div className="checkout-subtotal-text grey-out">Subtotal:</div>
                                                                <div className="checkout-product-individual-subtotal weight700">{item.calculatedTotal ? this.formatAPrice(item.calculatedTotal) : null}</div>
                                                            </div>
                                                        </div>
                                                        : null
                                                }
                                            </div>
                                        )
                                    : null
                                : null
                            }
                        </div>
                    </div>
                    <div>
                        {
                            this.state.cartData ?
                                this.state.cartData.length > 5 && !this.props.fullCheckout ?
                                    <Button className="transaction-button transaction-button-checkout btn-center cart-button-space transaction-button-cart-full-width" onClick={(e)=>{prepareCheckoutWithCurrentCartItems.call(this, e)}}>Checkout</Button>
                                    : null
                                : null
                        }
                    </div>
                    <div className="checkout-totals-container-padding">
                        { this.props.fullCheckout ?
                            <table className="totals-container">
                                {
                                    this.state.checkoutTruths ? this.state.checkoutTruths.totals ? this.state.checkoutTruths.totals.products ?
                                        <tr className="totals-label-and-price">
                                            <td><div className="grey-out weight600">Products:&nbsp;</div></td>
                                            <td><h5>{this.formatAPrice(this.state.checkoutTruths.totals.products)}</h5></td>
                                        </tr>
                                        : null : null : null
                                }
                                {
                                    this.state.checkoutTruths ? this.state.checkoutTruths.totals ? this.state.checkoutTruths.totals.shipping ?
                                        <tr className="totals-label-and-price">
                                            <td><div className="grey-out weight600">Shipping:&nbsp;</div></td>
                                            <td><h5>{this.formatAPrice(this.state.checkoutTruths.totals.shipping)}</h5></td>
                                        </tr>
                                        : null : null : null
                                }
                                {
                                    this.state.checkoutTruths ? this.state.checkoutTruths.totals ? this.state.checkoutTruths.totals.total ?
                                        <tr className="totals-label-and-price">
                                            <td><div className="grey-out weight600">Cart Subtotal:&nbsp;</div></td>
                                            <td><h3>{this.formatAPrice(this.state.checkoutTruths.totals.total)}</h3></td>
                                        </tr>
                                        : null : null : null
                                }
                            </table>
                            : null
                        }
                    </div>
                    <div>
                        {
                            this.props.fullCheckout && this.state.cartData.length > 0 ?
                                <div className="totals-container totals-container-place-order totals-container-place-order-main">
                                    <Button className="transaction-button transaction-button-checkout btn-center cart-button-space transaction-button-cart-full-width" onClick={(e)=>{checkoutNowWithCurrentCartItems.call(this, e)}}>Place Your Order</Button>
                                    <p className="prompt-basic-s2 grey-out">Placing with your order above will fulfill payment to the shop vendors and confirms your agreement with Minipost &copy; terms and conditions</p>
                                </div>
                                : null
                        }
                    </div>
                </div>
                {
                    this.props.fullCheckout ?
                        <div className="checkout-place-order-container">
                            <table className="totals-container totals-container-place-order">
                                {
                                    this.state.checkoutTruths ? this.state.checkoutTruths.totals ? this.state.checkoutTruths.totals.products ?
                                        <tr className="totals-label-and-price">
                                            <td><div className="grey-out weight600">Products:&nbsp;</div></td>
                                            <td><h5>{this.formatAPrice(this.state.checkoutTruths.totals.products)}</h5></td>
                                        </tr>
                                        : null : null : null
                                }
                                {
                                    this.state.checkoutTruths ? this.state.checkoutTruths.totals ? this.state.checkoutTruths.totals.shipping ?
                                        <tr className="totals-label-and-price">
                                            <td><div className="grey-out weight600">Shipping:&nbsp;</div></td>
                                            <td><h5>{this.formatAPrice(this.state.checkoutTruths.totals.shipping)}</h5></td>
                                        </tr>
                                        : null : null : null
                                }
                                {
                                    this.state.checkoutTruths ? this.state.checkoutTruths.totals ? this.state.checkoutTruths.totals.total ?
                                        <tr className="totals-label-and-price">
                                            <td><div className="grey-out weight600">Cart Subtotal:&nbsp;</div></td>
                                            <td><h3>{this.formatAPrice(this.state.checkoutTruths.totals.total)}</h3></td>
                                        </tr>
                                        : null : null : null
                                }
                            </table>
                            {
                                this.state.cartData.length > 0 ? 
                                    <div>
                                        <Button className="transaction-button transaction-button-checkout btn-center cart-button-space transaction-button-cart-full-width" onClick={(e)=>{checkoutNowWithCurrentCartItems.call(this, e)}}>Place Your Order</Button>
                                        <p className="prompt-basic-s2 grey-out">Placing with your order above will fulfill payment to the shop vendors and confirms your agreement with Minipost &copy; terms and conditions</p>
                                    </div>
                                    : null
                            }
                        </div>
                        : null
                }
            </div>
        )
    }
}