import React, { Component } from 'react';
import { CarouselProvider, Slider, Slide, ButtonBack, ButtonNext, Image, Dot, ImageWithZoom } from 'pure-react-carousel';
import {
    NavLink
} from 'react-router-dom';
import 'pure-react-carousel/dist/react-carousel.es.css';
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
import parseBody from '../methods/htmlparser.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowCircleLeft, faArrowCircleRight, faCartPlus, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { cookies } from '../App.js';
import { checkoutNowWithCurrentCartItems, prepareCheckoutWithCurrentCartItems } from '../methods/ecommerce.js';

export default class ProductSinglePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            product: {}, recommended: [], cloud: "", currStyleIndex: 0, atleastOneValidOption: false
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

    render() {
        let fulfill = this.determineValidProduct(); 
        let imgsLength = this.resolveProductImgsLength();
        let productName = this.resolveProductAttribute("name");   
        let productDesc = this.resolveProductAttribute("description");
        let shopName = this.resolveProductAttribute("shopName");
        let shopOwner = this.resolveProductAttribute("owner");
        let currOptions = this.resolveCurrentOptions();
        let currStyleIndex = this.resolveCurrStyleIndex();
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
                            <div className="single-product-page-calculated-price">{this.state.calcPrice}</div>
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
                                                <span className="product-page-options-size-span">Size:</span>
                                                <select name="options" id="options" ref={this.optionsRef} className="product-page-options-select">
                                                    {
                                                        currOptions ? 
                                                            currOptions.map((option, index) => 
                                                                <option value={option.descriptor} key={index} index={index} className={option.quantity ? "option-size-available" : "option-size-unavailable"} disabled={option.quantity ? false : true}>{option.descriptor}</option>
                                                            )
                                                            : null
                                                    }
                                                </select>
                                            </div>
                                            : null
                                        : null   
                                }
                            </div>
                            <div className="product-page-action-button-container">
                                <Button className="transaction-button transaction-button-add-cart btn-center cart-button-space" onClick={(e)=>{this.addToCart(false)}}>{fulfill}</Button>
                            </div>
                        </div>
                    </div>
                    <div className="single-product-page-action">
                        <Button className="transaction-button transaction-button-checkout btn-center cart-button-space" onClick={(e)=>{prepareCheckoutWithCurrentCartItems(e)}}>Checkout</Button>
                    </div>
                </div>
            </div>
        )
    }
}