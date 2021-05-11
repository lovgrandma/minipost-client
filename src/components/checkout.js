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
import { prepareCheckoutWithCurrentCartItems, getCachedCart } from '../methods/ecommerce.js';
import { cookies } from '../App.js';

export default class Checkout extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: "", cartData: null, wishListData: null
        }
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
                    cachedCart
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

    render() {
        return (
            <div>
                
                <Button className="transaction-button transaction-button-checkout btn-center cart-button-space" onClick={(e)=>{prepareCheckoutWithCurrentCartItems(e)}}>Checkout</Button>
                <div className={this.state.error ? this.state.error.length > 0 ? "err-status err-status-product-active err-status-active" : "err-status err-status-product err-status-hidden" : "err-status err-status-product err-status-hidden"}>{this.state.error}</div>
                <div className="checkout-products-list-container">
                    {
                        this.state.cartData ?
                            this.state.cartData.length > 0 ?
                                this.state.cartData.map((item) => 
                                    <div className="checkout-product-flex-container">
                                        <div>
                                            <img src={this.props.cloud ? this.props.cloud + "/" + item.image : ""} className="checkout-image-min"></img>
                                        </div>
                                        <div>
                                            <div className="checkout-product-name">{item.name}</div>
                                            <div className="checkout-product-meta-data-container">
                                                {
                                                    item.style ?
                                                        <div className="checkout-product-style">{item.style}</div>
                                                        : null
                                                }
                                                {
                                                    item.style && item.option ?
                                                        "|"
                                                        : null
                                                }
                                                {
                                                    item.option ?
                                                        <div className="checkout-product-option grey-out">{item.option}</div>
                                                        : null
                                                }
                                                {
                                                    item.quantity  && this.props.fullCheckout ?
                                                        <div className="checkout-product-quantity">{item.quantity}</div>
                                                        : null
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )
                            : null
                        : null
                    }
                </div>
            </div>
        )
    }
}