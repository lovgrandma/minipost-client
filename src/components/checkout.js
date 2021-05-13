import React, { Component } from 'react';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Dropdown,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import corsdefault from '../cors.js';
import currentshopurl from '../shopurl.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { prepareCheckoutWithCurrentCartItems, checkoutNowWithCurrentCartItems, getCachedCart } from '../methods/ecommerce.js';
import { cookies } from '../App.js';
import { debounce } from '../methods/utility.js';

export default class Checkout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: "", cartData: null, wishListData: null
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
    getImagesAndTitlesForCartProducts() {
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
                        username, hash, self, cachedCart
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
                                this.setState({ cartData: result.data.items });
                            }
                            if (result.data.hasOwnProperty("wishList")) {
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
                // console.log(parseFloat(number).toFixed(2));
                // if (ensureToFixed) {
                //     number = parseFloat(number).toFixed(2);
                // }
                return nf.format(number);
            }
            return null;
        } catch (err) {
            console.log(err);
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

    changeShippingClass(e, item) {

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

    resolveShippingOptions(classes, item) {
        let result = [];
        for (let i = 0; i < classes.length; i++) {
            result.push(<option value={classes[i].shippingRule} key={i} uuid={classes[i].uuid}>{classes[i].shippingRule}</option>);
        }
        return result;
    }

    doUpdateProductQuantity() {
        console.log("do update product quantity");
        // go through all item quantites displayed on page and determine if equal to value in state. If not, update on server. Debounced
    }

    debounceUpdateQuantity = debounce(() => this.doUpdateProductQuantity(), 5000);

    render() {
        return (
            <div className={this.props.fullCheckout ? "fullcheckout-flex" : ""}>
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
                                                                        <select name="product-options-select-container" id="product-options-select-container" defaultValue={item.shippingClass.shippingRule} onChange={(e) => {this.changeShippingClass(e, item)}}>
                                                                            {
                                                                                item.validShippingClassesForUser ?
                                                                                    item.validShippingClassesForUser.classes ?
                                                                                            this.resolveShippingOptions(item.validShippingClassesForUser.classes, item)
                                                                                        : null 
                                                                                    : null
                                                                            }
                                                                        </select>
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
                                                            <div className="social-portal-times times-checkout-button">&times;</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {
                                                    this.props.fullCheckout ?
                                                        <div className="fullcheckout-meta-data">
                                                            <div className="checkout-product-individual-price weight700">{item.price ? this.formatAPrice(item.price) : null}</div>
                                                            <div>
                                                                <div className="checkout-subtotal-quantity-block"><FontAwesomeIcon className="edit-interact" icon={faCube} color={ '#919191' } alt="edit" />&nbsp;{item.quantity}</div>
                                                                <div className="checkout-subtotal-text">Subtotal:</div>
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
                    <div>
                        <div className="totals-container">{this.state.checkoutTruths ? this.formatAPrice(this.state.checkoutTruths.totals.total) : null}</div>
                    </div>
                </div>
                {
                    this.props.fullCheckout ?
                        <div className="checkout-place-order-container">
                            <Button className="transaction-button transaction-button-checkout btn-center cart-button-space transaction-button-cart-full-width" onClick={(e)=>{checkoutNowWithCurrentCartItems.call(this, e)}}>Place Your Order</Button>
                        </div>
                        : null
                }
            </div>
        )
    }
}