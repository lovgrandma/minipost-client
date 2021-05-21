import React, { Component, lazy, Suspense } from 'react';
import { CarouselProvider, Slider, Slide, Image, Dot, ImageWithZoom } from 'pure-react-carousel';
import {
    NavLink
} from 'react-router-dom';
import 'pure-react-carousel/dist/react-carousel.es.css';
import {
    Button
} from 'react-bootstrap';
import corsdefault from '../cors.js';
import currentshopurl from '../shopurl.js';
import parseBody from '../methods/htmlparser.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cookies } from '../App.js';
import { checkoutNowWithCurrentCartItems, prepareCheckoutWithCurrentCartItems, addOneProductToCart } from '../methods/ecommerce.js';

const Checkout = lazy(() => import('./checkout.js'));

export default class ProductSinglePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            product: {}, recommended: [], cloud: "", currStyleIndex: 0, currSelectedOption: -1, atleastOneValidOption: false, error: "", success: "", iteration: 1
        }
        this.optionsRef = React.createRef();
    }

    async componentDidMount() {
        this.loadProductData();
        if (this.props.cloud) {
            this.setState({ cloud: this.props.cloud });
        } else if (cookies.get("contentDelivery")) {
            this.setState({ cloud: cookies.get("contentDelivery" ) });
        } else {
            let cloudData = await this.props.fetchCloudUrl(); // Retrieve data from server if cloud data nonexistent in props and cookies
            this.setState({ cloud: cloudData });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.cloud != this.props.cloud) {
            this.setState({ cloud: this.props.cloud });
        }
    }

    /**
     * Should get product by data in url and retrieve shop and product data
     * Do append recommended products later
     * 
     * @param {void}
     * @returns {Boolean}
     */
    loadProductData() {
        try {
            let productId = "";
            if (window.location.href.match(/(product\?p)=([a-zA-Z0-9].*)/)) {
                if (window.location.href.match(/(product\?p)=([a-zA-Z0-9].*)/)[2]) {
                    productId = window.location.href.match(/(product\?p)=([a-zA-Z0-9].*)/)[2];
                }
            }
            let recommended = true;
            if (productId) {
                fetch(currentshopurl + "s/getsingleproductpagedata", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        productId, recommended
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        if (result.data) {
                            if (result.data.product) {
                                this.setState({ product: result.data.product });
                                this.setState({ atleastOneValidOption: this.resolveAtleastOneValidOption(result.data.product.styles) });
                                this.setState({ currSelectedOption: this.resolveFirstValidOptionOnCurrStyle(0) });
                            }
                            if (result.data.shop) {
                                this.setState({ shop: result.data.shop });
                            }
                            if (result.data.recommended) {
                                if (result.data.recommended.length > 0) {
                                    this.setState({ recommended: result.data.recommended });
                                }
                            }
                        }   
                    }
                })
                .catch((err) => {
                    return false;
                });
            } else {
                return false;
            }
        } catch (err) {
            return false; // Fail silently
        }
    }

    resolveAtleastOneValidOption(styles) {
        try {
            for (let i = 0; i < styles.length; i++) {
                for (let j = 0; j < styles[i].options.length; j++) {
                    if (styles[i].options[j].descriptor) {
                        if (styles[i].options[j].descriptor.length > 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    determineValidProduct() {
        return "Add To Cart";
    }

    resolveProductImgsLength() {
        try {
            if (this.state.product) {
                if (this.state.product.images) {
                    return this.state.product.images.length;
                }
            }
            return 0;
        } catch (err) {
            return 0;
        }
    }

    resolveProductAttribute(attribute) {
        try {
            switch(attribute) {
                case "name":
                    try {
                        return this.state.product.name;
                    } catch (err) {
                        return "";
                    }
                case "description":
                    try {
                        return this.state.product.description;
                    } catch (err) {
                        return "";
                    }
                case "shopName":
                    try {
                        return this.state.shop.name;
                    } catch (err) {
                        return "";
                    }
                case "owner":
                    try {
                        return this.state.shop.owner;
                    } catch (err) {
                        return "";
                    }
                default:
                    return "";
            }
        } catch (err) {
            return "";
        }
    }

    resolveCurrentOptions() {
        try {
            if (this.state.product) {
                if (this.state.product.styles && typeof this.state.currStyleIndex == "number") {
                    if (this.state.product.styles[this.state.currStyleIndex]) {
                        if (this.state.product.styles[this.state.currStyleIndex].options) {
                            return this.state.product.styles[this.state.currStyleIndex].options;
                        }
                    }
                }
            }
            return [];
        } catch (err) {
            return [];
        }
    }

    updateCurrStyle(e, index) {
        try {
            if (this.state.currStyleIndex != index) {
                this.setState({ currStyleIndex: index });
                this.setState({ currSelectedOption: this.resolveFirstValidOptionOnCurrStyle(index) });
            }
        } catch (err) {
            // Fail silently
        }
    }

    resolveCurrStyleIndex() {
        try {
            return this.state.currStyleIndex;
        } catch (err) {
            return -1;
        }
    }

    /**
     * Will find first image in collection of images with matching descriptor
     * @param {*} descriptor 
     * @returns 
     */
    findImgByDescriptor(descriptor) {
        try {
            if (descriptor && this.state.product) {
                if (this.state.product.images) {
                    for (let i = 0; i < this.state.product.images.length; i++) {
                        if (this.state.product.images[i].name == descriptor && this.state.product.images[i].url) {
                            return this.state.product.images[i].url;
                        }
                    }
                }
            } else {
                return null;
            }
        } catch (err) {
            return null;
        }
    }

    /**
     * Will successfully add current option of product to cart if all data valid, add amount tracking for when user adds 2 or more
     * @param {*} e 
     */
    resolveAddToCart = async(e) => {
        try {
            this.setState({ success: "" });
            this.setState({ error: "" });
            let shop = this.state.shop;
            if (shop.id) {
                let productMatch = {
                    id: "",
                    style: "",
                    option: "",
                    price: null,
                    shopId: shop.id
                }
                if (this.state.product.styles[this.state.currStyleIndex]) {
                    if (this.state.product.styles[this.state.currStyleIndex].options) {
                        if (this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption]) {
                            if (this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption].quantity > 0) {
                                productMatch.id = this.state.product.id;
                                productMatch.style = this.state.product.styles[this.state.currStyleIndex].descriptor;
                                productMatch.option = this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption].descriptor;
                                productMatch.price = this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption].price;
                            }
                        }
                    }
                }
                if (productMatch.id.length > 0) {
                    let userShippingData = {};
                    if (this.props.userShippingData) {
                        userShippingData = this.props.userShippingData;
                    }
                    let data = await addOneProductToCart(productMatch, userShippingData);
                    if (!data) {
                        this.setState({ error: "Was not able to add product to cart" });
                    } else if (data.hasOwnProperty("error")) {
                        this.setState({ error: data.error });
                    } else {
                        this.setState({ success: "Product added to cart" });
                        this.setState({ iteration: this.state.iteration + 1 }); // Iteration will force a new cart fetch on checkout every time
                    }
                } else {
                    this.setState({ error: "Was not able to add product to cart"});
                }
            } else {
                this.setState({ error: "Was not able to add product to cart"});
            }
        } catch (err) {
            console.log(err);
            // Fail silently
            try {
                this.setState({ error: "Was not able to add product to cart"});
            } catch (err) {
                // State not available
            }
        }
    }

    selectOption(e, index) {
        try {
            if (this.state.product.styles[this.state.currStyleIndex]) {
                if (this.state.product.styles[this.state.currStyleIndex].options) {
                    if (this.state.product.styles[this.state.currStyleIndex].options[index]) {
                        if (this.state.product.styles[this.state.currStyleIndex].options[index].quantity > 0) {
                            this.setState({ currSelectedOption: index });
                        }
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    resolveFirstValidOptionOnCurrStyle(styleIndex = null) {
        try {
            if (typeof styleIndex != "number") {
                styleIndex = this.state.currStyleIndex;
            }
            if (this.state.product.styles[styleIndex]) {
                if (this.state.product.styles[styleIndex].options) {
                    for (let i = 0; i < this.state.product.styles[styleIndex].options.length; i++) {
                        if (this.state.product.styles[styleIndex].options[i].quantity > 0) {
                            return i;
                        }
                    }
                }
            }
            return -1; // No valid option on current style
        } catch (err) {
            return -1;
            // Fail silently
        }
    }

    resolveCurrPrice() {
        try {
            if (this.state.product) {
                if (this.state.product.styles) {
                    if (this.state.product.styles[this.state.currStyleIndex]) {
                        if (this.state.product.styles[this.state.currStyleIndex].options) {
                            if (this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption]) {
                                if (this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption].hasOwnProperty("price")) {
                                    if (typeof this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption].price === "number") {
                                        if (parseFloat(this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption].price)) {
                                            return parseFloat(this.state.product.styles[this.state.currStyleIndex].options[this.state.currSelectedOption].price).toFixed(2);
                                        }
                                    }
                                }
                            }
                        }
                    } 
                }
            }
        } catch (err) {
            return null;
        }
    }

    render() {
        let fulfill = this.determineValidProduct(); 
        let imgsLength = this.resolveProductImgsLength();
        let productName = this.resolveProductAttribute("name");   
        let productDesc = this.resolveProductAttribute("description");
        let shopName = this.resolveProductAttribute("shopName");
        let shopOwner = this.resolveProductAttribute("owner");
        let currOptions = this.resolveCurrentOptions();
        let currStyleIndex = this.resolveCurrStyleIndex();
        let currPrice = this.resolveCurrPrice();
        return (
            <div className="single-product-page-container">
                <div className="single-product-page-images-container">
                    <div className="single-product-page-display-image">
                            <CarouselProvider
                                naturalSlideWidth={350}
                                naturalSlideHeight={550}
                                totalSlides={imgsLength}
                                className="single-product-carousel-provider"
                            >
                                <div className="single-product-page-thumbnails">
                                    {
                                        this.state.product ?
                                            this.state.product.images ?
                                                this.state.product.images.map((image, index) => 
                                                <Dot slide={index} className="slider-thumb-select-min">
                                                    <Image className="slider-thumb-select-min-img" src={this.state.cloud + "/" + image.url} hasMasterSpinner="false"></Image>
                                                </Dot>
                                                )
                                                : null
                                            : null
                                    }
                                </div>
                                <Slider className="main-product-img-slider">
                                    {
                                        this.state.product ?
                                            this.state.product.images ?
                                                this.state.product.images.map((image, index) => 
                                                    <Slide index={index}><ImageWithZoom src={this.state.cloud + "/" + image.url} hasMasterSpinner="false"></ImageWithZoom></Slide>
                                                )
                                                : null
                                            : null
                                    }
                                </Slider>
                            </CarouselProvider>
                    </div>
                </div>
                <div className="single-product-page-meta-container">
                    <div className="single-product-page-meta-inputs-container">
                        <div className="single-product-page-meta-info">
                            <NavLink exact to={"/shop?s=" + shopOwner}>
                                <p className="single-product-page-shop-name">{shopName}</p>
                            </NavLink>
                            <h3 className="single-product-page-title">{productName}</h3>
                            <div className="single-product-page-calculated-price"><span className="single-product-page-calculated-price-label weight600 grey-out">Price:</span><span className="single-product-page-calculated-price-value weight600">{!isNaN(currPrice) ? "$" + currPrice : ""}</span></div>
                            <p className="single-product-page-desc">{parseBody(productDesc)}</p>
                            <div className="product-page-product-styles-selection-container">
                                {
                                    this.state.product ?
                                        this.state.product.styles ?
                                            this.state.product.styles.length > 1 ? 
                                                this.state.product.styles.map((style, index) => 
                                                    <div key={index} onClick={(e) => {this.updateCurrStyle(e, index)}} className={currStyleIndex == index ? "product-page-product-style product-page-product-style-selected" : "product-page-product-style"}>
                                                        {
                                                            style.descriptor ?
                                                                this.findImgByDescriptor(style.descriptor) ?
                                                                    <img src={this.state.cloud + "/" + this.findImgByDescriptor(style.descriptor)} className="product-page-product-style-img-min"></img>
                                                                    : null
                                                                : null
                                                        }
                                                        <span>{style.descriptor}</span>
                                                    </div>
                                                )
                                            : null
                                        : null
                                    : null
                                }
                            </div>
                            <div className="product-page-options-select-container">
                                {
                                    currOptions ?
                                        currOptions.length > 1 && this.state.atleastOneValidOption ?
                                            <div>
                                                <div className="product-page-options-size-descriptor">Size</div>
                                                <div name="options" id="options" ref={this.optionsRef} className="product-page-options-select">
                                                    {
                                                        currOptions ? 
                                                            currOptions.map((option, index) => 
                                                                <div value={option.descriptor} key={index} index={index} className={this.state.currSelectedOption == index ? "option-size-selected" : "option-size-unselected"}  disabled={option.quantity ? "" : "true"} onClick={(e) => {this.selectOption(e, index)}}>{option.descriptor}</div>
                                                            )
                                                            : null
                                                    }
                                                </div>
                                            </div>
                                            : null
                                        : null   
                                }
                            </div>
                            <div className="product-page-action-button-container">
                                <Button className="transaction-button transaction-button-add-cart btn-center cart-button-space" onClick={(e)=>{this.resolveAddToCart(e)}}>{fulfill}</Button>
                            </div>
                            <div className={this.state.success ? this.state.success.length > 0 ? "generic-success generic-success-active" : "generic-success generic-success-hidden" : "generic-success generic-success-hidden"}>{this.state.success}</div>
                            <div className={this.state.error ? this.state.error.length > 0 ? "err-status err-status-product-active err-status-active" : "err-status err-status-product err-status-hidden" : "err-status err-status-product err-status-hidden"}>{this.state.error}</div>
                        </div>
                    </div>
                    <div className="single-product-page-action">
                        <Suspense fallback={<div className="fallback-loading"></div>}>
                            <Checkout {...this.props} fullCheckout={false} cloud={this.state.cloud} iteration={this.state.iteration} />
                        </Suspense>
                    </div>
                </div>
            </div>
        )
    }
}