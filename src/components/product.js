import React, { Component } from 'react';
import {
    NavLink
} from 'react-router-dom';
import {
    Button
} from 'react-bootstrap';
import currentshopurl from '../shopurl.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';
import greyproduct from '../static/greyproduct.jpg';
import { faEdit, faEllipsisH, faPlus, faSave, faTrashAlt, faCopy, faArrowCircleUp } from '@fortawesome/free-solid-svg-icons';

import { cookies } from '../App.js';
import { debounce } from '../methods/utility.js';

export default class Product extends Component {
    constructor(props) {
        super(props);
        this.state = {
            shippingClassButton: "Set", currentStyle: 0, currentOption: 0, error: ""
        }
        this.shippingClassDropdownRef = new React.createRef();
        this.productOptionsSelectContainerRef = new React.createRef();
        this.productStylesSelectContainerRef = new React.createRef();
        this.prodNameIn = new React.createRef();
        this.prodDescIn = new React.createRef();
        this.prodPriceIn = new React.createRef();
        this.prodQuantityIn = new React.createRef();
        this.prodOptionDescIn = new React.createRef();
        this.prodStyleDescIn = new React.createRef();
        this.publishedRef = new React.createRef();
    }

    componentDidMount() {
        this.trackCurrentShippingClass();
    }

    componentDidUpdate() {
        this.trackCurrentShippingClass();
    }

    trackCurrentShippingClass(e) {
        if (this.shippingClassDropdownRef) {
            if (this.shippingClassDropdownRef.current) {
                if (this.shippingClassDropdownRef.current.value) {
                    if (this.shippingClassDropdownRef.current.value == "Create Shipping Class") {
                        if (this.state.shippingClassButton != "Go") {
                            this.setState({ shippingClassButton: "Go"});
                        }
                    } else {
                        if (this.state.shippingClassButton != "Add") {
                            this.setState({ shippingClassButton: "Add" });
                        }
                    }
                }
            }
        }
    }

    trackCurrentOption(e) {
        try {
            if (this.productOptionsSelectContainerRef) {
                if (this.productOptionsSelectContainerRef.current) {
                    if (this.productOptionsSelectContainerRef.current.value != this.state.currentOption && Number.isInteger(parseInt(this.productOptionsSelectContainerRef.current.value))) {
                        this.setState({ currentOption: parseInt(this.productOptionsSelectContainerRef.current.value) });
                    }
                }
            }
            if (this.prodOptionDescIn) {
                if (this.prodOptionDescIn.current && this.props.styles && this.state.currentStyle !== undefined) {
                    if (this.props.styles[this.state.currentStyle]) {
                        if (this.props.styles[this.state.currentStyle].options) {
                            if (this.props.styles[this.state.currentStyle].options[this.state.currentOption]) {
                                if (!this.props.styles[this.state.currentStyle].options[this.state.currentOption].descriptor) {
                                    this.prodOptionDescIn.current.value = "";
                                } else {
                                    this.prodOptionDescIn.current.value = this.props.styles[this.state.currentStyle].options[this.state.currentOption].descriptor;
                                }
                            }
                        }
                    }
                }
                this.updateOptionPriceAndQuantity();
            }
        } catch (err) {
            // fail silently
        }   
    }

    trackCurrentStyle(e) {
        try {
            if (this.productStylesSelectContainerRef) {
                if (this.productStylesSelectContainerRef.current) {
                    if (this.productStylesSelectContainerRef.current.value != this.state.currentStyle && Number.isInteger(parseInt(this.productStylesSelectContainerRef.current.value))) {
                        this.setState({ currentStyle: parseInt(this.productStylesSelectContainerRef.current.value), currentOption: 0 });
                        if (this.productOptionsSelectContainerRef) {
                            if (this.productOptionsSelectContainerRef.current) {
                                this.productOptionsSelectContainerRef.current.value = 0;
                            }
                        }
                    }
                }
            }
            if (this.prodStyleDescIn) {
                if (this.prodStyleDescIn.current && this.props.styles && this.state.currentStyle !== undefined) {
                    if (this.props.styles[this.state.currentStyle]) {
                        if (!this.props.styles[this.state.currentStyle].descriptor) {
                            this.prodStyleDescIn.current.value = "";
                        } else {
                            this.prodStyleDescIn.current.value = this.props.styles[this.state.currentStyle].descriptor;
                        }
                    }
                }
            }
            if (this.prodOptionDescIn && this.props.styles) {
                if (this.prodOptionDescIn.current && this.props.styles[this.state.currentStyle]) {
                    if (this.props.styles[this.state.currentStyle].options) {
                        if (this.props.styles[this.state.currentStyle].options[0]) {
                            this.prodOptionDescIn.current.value = this.props.styles[this.state.currentStyle].options[0].descriptor;
                        }
                    }
                }
            }
            this.updateOptionPriceAndQuantity();
        } catch (err) {
            console.log(err);
            // fail silently
        }
    }

    updateOptionPriceAndQuantity() {
        try {
            if (this.props.styles && this.state.currentStyle != undefined && this.prodQuantityIn && this.prodPriceIn) {
                if (this.props.styles[this.state.currentStyle].options && this.prodQuantityIn.current && this.prodPriceIn.current) {
                    if (this.props.styles[this.state.currentStyle].options[this.state.currentOption]) {
                        if (this.props.styles[this.state.currentStyle].options[this.state.currentOption].quantity >= 0) {
                            this.prodQuantityIn.current.value = this.props.styles[this.state.currentStyle].options[this.state.currentOption].quantity;
                        } else {
                            this.prodQuantityIn.current.value = 0;
                        }
                        if (this.props.styles[this.state.currentStyle].options[this.state.currentOption].price >= 0) {
                            this.prodPriceIn.current.value = this.props.styles[this.state.currentStyle].options[this.state.currentOption].price;
                        } else {
                            this.prodPriceIn.current.value = null;
                        }
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    determineShippingClassAction(e) {
        try {
            if (this.state.shippingClassButton == "Go") {
                this.props.toggleShippingPortal(true);
            } else {
                // set visual change that shipping class has been changed, will only update on post request/publish 
                if (this.shippingClassDropdownRef.current) {
                    let index = this.shippingClassDropdownRef.current.selectedIndex;
                    let uuid = this.props.shippingClasses[index].uuid;
                    this.props.updateLocalProductMeta(this.props.index, uuid, "appliedShipping");
                }
            }
        } catch (err) {
            // Fail silently
        } 
    }

    /**
     * Will get all styles from a specific index and copy them to all other styles
     * 
     * @param {*} e 
     * @returns {Array} Array of options objects
     */
    copyStyleOptionsToAll = (e) => {
        try {
            if (this.props.styles[this.state.currentStyle]) {
                if (this.props.styles[this.state.currentStyle].options) {
                    let tempStyles = this.props.styles;
                    for (let i = 0; i < tempStyles.length; i++) {
                        // Make shallow copy or else copy styles for all will function innapropriately. Will reference to part in memory not copy over
                        let options = [];
                        this.props.styles[this.state.currentStyle].options.forEach((option, index) => {
                            options.push({descriptor: option.descriptor, price: option.price , quantity: option.quantity });
                        });
                        tempStyles[i].options = options;
                    }
                    this.props.updateLocalProducts(this.props.index, tempStyles);
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    newStyle = (e) => {
        if (this.props.styles && this.state.currentStyle !== undefined) {
            let currentStyles = this.props.styles;
            currentStyles.push({ descriptor: "", options: [{descriptor: "", price: null, quantity: 0}] });
            this.setState({ currentOption: 0 });
            this.props.updateLocalProducts(this.props.index, currentStyles);
        }
    }

    removeCurrStyle = (e) => {
        if (this.props.styles && this.state.currentStyle !== undefined) {
            let currentStyles = this.props.styles;
            currentStyles.splice(this.state.currentStyle, 1);
            this.setState({ currentStyle: 0, currentOption: 0 });
            this.props.updateLocalProducts(this.props.index, currentStyles);
            this.trackCurrentStyle(e);
            this.trackCurrentOption(e);
        }
    }


    newOption = (e) => {
        if (this.props.styles && this.state.currentStyle !== undefined) {
            if (this.props.styles[this.state.currentStyle]) {
                if (this.props.styles[this.state.currentStyle].options) {
                    let currentStyles = this.props.styles;
                    currentStyles[this.state.currentStyle].options.push({ descriptor: "", price: null, quantity: 0 });
                    this.props.updateLocalProducts(this.props.index, currentStyles);
                }
            }
        }
    }

    removeCurrOption = (e) => {
        // Don't allow user to delete if only single option left. Makes no sense, would result in a non product
        // A product should always have 1 option internally even though it doesnt appear that way on the front end
        if (this.props.styles && this.state.currentStyle !== undefined) {
            if (this.props.styles[this.state.currentStyle]) {
                if (this.props.styles[this.state.currentStyle].options) {
                    let currentStyles = this.props.styles;
                    currentStyles[this.state.currentStyle].options.splice(this.state.currentOption, 1);
                    this.setState({ currentOption: 0 });
                    this.props.updateLocalProducts(this.props.index, currentStyles);
                }
            } 
        }
    }

    updateCurrStyleName = (e) => {
        try {
            if (this.props.styles && this.prodStyleDescIn && this.state.currentStyle !== undefined) {
                if (this.props.styles[this.state.currentStyle] && this.prodStyleDescIn.current) {
                    if (this.prodStyleDescIn.current.value !== undefined) {
                        let currentStyles = this.props.styles;
                        currentStyles[this.state.currentStyle].descriptor = this.prodStyleDescIn.current.value;
                        this.props.updateLocalProducts(this.props.index, currentStyles);
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    updateCurrOptionName = (e) => {
        try {
            if (this.props.styles && this.prodOptionDescIn && this.state.currentStyle !== undefined) {
                if (this.props.styles[this.state.currentStyle].options && this.prodOptionDescIn.current) {
                    if (this.prodOptionDescIn.current.value !== undefined && this.props.styles[this.state.currentStyle].options[this.state.currentOption]) {
                        let currentStyles = this.props.styles;
                        currentStyles[this.state.currentStyle].options[this.state.currentOption].descriptor = this.prodOptionDescIn.current.value;
                        this.props.updateLocalProducts(this.props.index, currentStyles);
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    updatePrice = (e) => {
        try {
            if (this.props.styles && this.state.currentStyle !== undefined) {
                let currentStyles = this.props.styles;
                if (currentStyles[this.state.currentStyle] && this.prodPriceIn) {
                    if (currentStyles[this.state.currentStyle].options && this.state.currentOption !== undefined && this.prodPriceIn.current) {
                        if (currentStyles[this.state.currentStyle].options[this.state.currentOption] && this.prodPriceIn.current.value !== undefined) {
                            if (currentStyles[this.state.currentStyle].options[this.state.currentOption].price != parseFloat(this.prodPriceIn.current.value)) {
                                currentStyles[this.state.currentStyle].options[this.state.currentOption].price = parseFloat(this.prodPriceIn.current.value);
                                this.props.updateLocalProducts(this.props.index, currentStyles, true);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // fail silently
        }
    }

    updateQuantity = (e) => {
      try {
            if (this.props.styles && this.state.currentStyle !== undefined) {
                let currentStyles = this.props.styles;
                if (currentStyles[this.state.currentStyle] && this.prodQuantityIn) {
                    if (currentStyles[this.state.currentStyle].options && this.state.currentOption !== undefined && this.prodQuantityIn.current) {
                        if (currentStyles[this.state.currentStyle].options[this.state.currentOption] && this.prodQuantityIn.current.value !== undefined) {
                            if (currentStyles[this.state.currentStyle].options[this.state.currentOption].quantity != parseInt(this.prodQuantityIn.current.value) && Number.isInteger(parseInt(this.prodQuantityIn.current.value))) {
                                currentStyles[this.state.currentStyle].options[this.state.currentOption].quantity = parseInt(this.prodQuantityIn.current.value);
                                this.props.updateLocalProducts(this.props.index, currentStyles);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // fail silently
        }
    }

    /**
     * Will return whether or not all styles/options have a set price. Quantity can be set to 0
     * @param {Array} styles 
     * @returns {Boolean} Whether prices are valid or not
     */
    resolveAllProductPrices = (styles) => {
        try {
            for (let i = 0; i < styles.length; i++) {
                if (styles.length > 1 && !styles[i].descriptor) {
                    return false; // Styles must be named if there are more than one
                }
                for (let j = 0; j < styles[i].options.length; j++) {
                    if (typeof Number(styles[i].options[j].price) != "number" || isNaN(styles[i].options[j].price)) {
                        return false; // There was a style/option with a null price. Not valid price
                    }
                    if (styles[i].options.length > 1 && !styles[i].options[j].descriptor) {
                        return false; // If there are more than 1 option on a style, the descriptors for options must be named before being published
                    }
                }
            }
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
    /**
     * This will finally save a product to the database on the users shop record.
     * In order to save a product the following things are required:
     * Name
     * Price (Price of 0 constitutes free)
     * Quantity (Quantity of 0 constitutes sold out)
     * Single Shipping Class applied (Product must ship somewhere unless "virtual" (future implementation))
     * 
     * Description, styles and options are not required, but can be added
     * Uuid is optional. If the server is not given a uuid it will create a new product, otherwise it will merge to that uuid
     * 
     * @param {Event} e
     * @returns {void} Will make a fetch request to db or return nothing (fail) It updates error state instead
     */
    saveProduct = (e) => {
        this.setState({ error: "" }); // Reset error state
        this.updatePrice(e);
        this.updateQuantity(e);
        try {
            let goodName = false;
            let goodStyles = false;
            let desc = "";
            let goodShipping = false;
            let id = "dummyid";
            if (this.props.id) {
                id = this.props.id;
            }
            if (this.prodNameIn) {
                if (this.prodNameIn.current) {
                    if (this.prodNameIn.current.value) {
                        if (this.prodNameIn.current.value.length > 0) {
                            goodName = this.prodNameIn.current.value;
                        }
                    }
                }
            }
            if (!goodName) {
                this.setState({ error: "Please name your product"});
                return;
            }
            if (this.prodPriceIn) {
                if (this.prodPriceIn.current) {
                    try {
                        if (typeof parseFloat(this.prodPriceIn.current.value) == "number") { // If this price is equal to a number, we know atleast this one is set
                            try {
                                goodStyles = this.resolveAllProductPrices(this.props.styles);
                            } catch (err) {
                                this.setState({ error: "Please enter a valid price and name for all styles/options"});
                                return;
                            }
                        } else {
                            this.setState({ error: "The current style does not have a valid price"});
                            return;
                        }
                    } catch (err) {
                        this.setState({ error: "The current style does not have a valid price"});
                        return;
                    }
                }
            }
            if (!goodStyles) {
                this.setState({ error: "Please enter a valid price and name for all styles/options"});
                return;
            }
            if (this.prodDescIn) {
                if (this.prodDescIn.current) {
                    if (this.prodDescIn.current.value) {
                        desc = this.prodDescIn.current.value;
                    }
                }
            }
            if (this.props.shipping) {
                if (this.props.shipping.length > 0) {
                    goodShipping = true;
                } else {
                    this.setState({ error: "You need atleast one shipping class applied to save this product"});
                    return;
                }
            }
            let published = false;
            if (this.publishedRef) {
                if (this.publishedRef.current) {
                    if (this.publishedRef.current.checked) {
                        published = true;
                    }
                }
            }
            let images = [];
            if (this.props.images) {
                images = this.props.images;
            }
            if (goodName && goodStyles && goodShipping) {
                let product = {
                    id: id,
                    name: goodName,
                    description: desc,
                    styles: this.props.styles,
                    shipping: this.props.shipping,
                    published: published,
                    images: images
                }
                this.sendProductToServerAndSave(product); // Send product data to db to save
            } else {
                this.setState({ error: "Some data is not complete for this product. Please review all options and values"});
                return;
            }
        } catch (err) {
            this.setState({ error: "An error occured while saving the product"}); // Saving product failed
        }
    }
    

    /**
     * Formdata upload to upload images and product data at the same time
     * @param {*} product 
     */
    sendProductToServerAndSave = async (product) => {
        try {
            if (product) {
                let newImages = this.resolveNewImages(); // This will be images that have yet to be uploaded for local dummy product
                let owner = this.props.owner; // Owner of the shop to identify the shop
                let username = cookies.get("loggedIn"); // Name of the authenticated employee, by default the shop owner
                let hash = cookies.get("hash"); // Hash for protected route
                let self = this.props.self; // Necessary for route to filter traffic to protected route
                let imgNames = [];
                const formData = new FormData();
                formData.append('product', JSON.stringify(product));
                newImages.forEach(img=>{
                    formData.append("image", img.file); // Will store files for temp upload to server
                    imgNames.push(img.name); // in order stores name for file
                });
                formData.append("imgNames", JSON.stringify(imgNames)); // in order stores name for file
                formData.append('owner', owner);
                formData.append('username', username);
                formData.append('hash', hash);
                formData.append('self', self);
                return await fetch(currentshopurl + "s/savesingleproducttoshop", {
                    method: "POST",
                    credentials: corsdefault,
                    body: formData
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result.error) {
                        this.setState({ error: result.error }); // Saving product failed
                    }
                    console.log(result);
                })
                .catch((err) => {
                    this.setState({ error: "An error occured while uploading the product"}); // Saving product failed
                })
            } else {
                this.setState({ error: "An error occured while saving the product"}); // Saving product failed
            }
        } catch (err) {
            this.setState({ error: "An error occured while saving the product"}); // Saving product failed
        }
    }

    /**
     * This will retrieve upload local images for dummy product
     * 
     * @param {none}
     * @returns {Object[]} Image url and name object {url: String url, name: String name}
     */
    resolveNewImages = () => {
        try {
            let imgArr = [];
            if (this.props.index == "dummy" && this.props.tempImgData) {
                imgArr = this.props.tempImgData; // Get local image data
            }
            return imgArr;
        } catch (err) {
            return [];
        }
    }

    delProduct = (e) => {

    }

    resolveDescriptor(value, type = "option") {
        if (value) {
            return value;
        } 
        if (type == "style") {
            return "style";
        }
        return "*option*";
    }

    /**
     * Will resolve all shipping data uuid references passed as argument and find matching names to present to user
     * 
     * @param {Array} shippingData Array of uuids
     * @returns {Array} shippingData data with uuids {uuid: String, shippingRule, String}
     */
    resolveAppliedShippingNames(shippingData) {
        try {
            let findAndAddTo = (arr, matchUuid) => {
                if (this.props.shippingClasses) {
                    for (let j = 0; j < this.props.shippingClasses.length; j++) {
                        if (this.props.shippingClasses[j].uuid == matchUuid) {
                            arr.push({
                                uuid: this.props.shippingClasses[j].uuid,
                                shippingRule: this.props.shippingClasses[j].shippingRule
                            });
                            return arr;
                        }
                    }
                }
            }
            let newData = [];
            for (let i = 0; i < shippingData.length; i++) {
                newData = findAndAddTo(newData, shippingData[i]);
            }
            return newData;
        } catch (err) {
            return [];
        }
    }

    removeAppliedShippingClass(e, uuid) {
        try {
            this.props.removeShippingClassFromProduct(this.props.index, uuid);
        } catch (err) {
            // Fail silently
        }
    }

    resolveCurrPrice() {
        try {
            if (this.props.styles) {
                if (this.props.styles[this.state.currentStyle]) {
                    if (this.props.styles[this.state.currentStyle].options) {
                        if (this.props.styles[this.state.currentStyle].options[this.state.currentOption]) {
                            if (this.props.styles[this.state.currentStyle].options[this.state.currentOption].hasOwnProperty("price")) {
                                if (typeof this.props.styles[this.state.currentStyle].options[this.state.currentOption].price === "number") {
                                    return parseFloat(this.props.styles[this.state.currentStyle].options[this.state.currentOption].price).toFixed(2);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            return 0.00;
        }
    }

    resolveCurrQuantity() {
        try {
            if (this.props.styles) {
                if (this.props.styles[this.state.currentStyle]) {
                    if (this.props.styles[this.state.currentStyle].options) {
                        if (this.props.styles[this.state.currentStyle].options[this.state.currentOption]) {
                            if (this.props.styles[this.state.currentStyle].options[this.state.currentOption].hasOwnProperty("quantity")) {
                                if (typeof this.props.styles[this.state.currentStyle].options[this.state.currentOption].quantity === "number") {
                                    return Number(this.props.styles[this.state.currentStyle].options[this.state.currentOption].quantity);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            return 0;
        }
    }

    resolveCurrStyle() {
        try {
            if (this.props.styles) {
                if (this.props.styles[this.state.currentStyle]) {
                    if (this.props.styles[this.state.currentStyle].descriptor) {
                        return this.props.styles[this.state.currentStyle].descriptor;
                    }
                }
            }
        } catch (err) {
            return "";
        }
    }

    resolveCurrOption() {
        try {
            if (this.props.styles) {
                if (this.props.styles[this.state.currentStyle]) {
                    if (this.props.styles[this.state.currentStyle].options) {
                        if (this.props.styles[this.state.currentStyle].options[this.state.currentOption]) {
                            if (this.props.styles[this.state.currentStyle].options[this.state.currentOption].descriptor) {
                                return this.props.styles[this.state.currentStyle].options[this.state.currentOption].descriptor;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            return "";
        }
    }

    resolveProductImages() {
        try {
            if (this.props.images) {
                if (this.props.images[0]) {
                    if (this.props.images[0].url) {
                        return this.props.images[0].url;
                    }
                }
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    resolveSecondProductImage() {
        try {
            if (this.props.images) {
                if (this.props.images[1]) {
                    if (this.props.images[1].url) {
                        return this.props.images[1].url;
                    }
                }
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    resolveValidBuyPrice() {
        try {
            if (this.props.styles) {
                if (this.props.styles[0]) {
                    if (this.props.styles[0].options) {
                        if (this.props.styles[0].options[0]) {
                            if (typeof this.props.styles[0].options[0].price == "number") {
                                return this.props.styles[0].options[0].price.toFixed(2);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            return "";
        }
    }

    /**
     * Will determine if there is only one choice for this product, allowing for "Add To Cart" option, else give "See details"
     */
    resolveOnlyOneChoice() {
        try {
            if (this.props.styles) {
                if (this.props.styles.length == 1 && this.props.styles[0]) {
                    if (this.props.styles[0].options) {
                        if (this.props.styles[0].options.length == 1 && this.props.styles[0].options[0]) {
                            if (this.props.styles[0].options.length == 1 && this.props.styles[0].options[0].quantity > 0) {
                                return "Add To Cart";
                            }
                        }
                    }
                }
            }
            return "See Details";
        } catch (err) {
            return "See Details";
        }
    }

    /**
     * Will attempt to add a product to the cart. If this fails, redirect to product page using this.props.id
     * If redirect is true, always redirect after attempt adding to cart (Should be true when user clicks "Buy Now" but should be false when user clicks "Add To Cart")
     * @param {Boolean} redirect 
     */
    addToCart(page = "") {
        // if page is "product" dont add to cart, just go page
        // if product invalid, dont add to cart, always go product page
        // if product valid, add to cart, dont redirect anywhere
    }

    goBuy() {
        // if product valid, go checkout, else go product page
    }


    render() {
        let appliedShippingClassesData = this.resolveAppliedShippingNames(this.props.shipping);
        let currPrice = this.resolveCurrPrice();
        let currQuantity = this.resolveCurrQuantity();
        let currStyle = this.resolveCurrStyle();
        let currOption = this.resolveCurrOption();
        let productImg = this.resolveProductImages();
        let productSecondImg = this.resolveSecondProductImage();
        let validBuyPrice = this.resolveValidBuyPrice();
        let cartChoice = this.resolveOnlyOneChoice();
        return (
            <div className="product-list-single shop-col">
                <div className="product-list-meta-container">
                    <div className="product-list-img-container">
                        <NavLink exact to={"/product?p=" + this.props.id}>
                            <img src={productImg ? this.props.cloud + "/" + productImg : greyproduct}></img>
                        </NavLink>
                        <FontAwesomeIcon className={this.props.editing == this.props.index ? "edit-interact edit-interact-hidden edit-interact-visible" : "edit-interact edit-interact-hidden"} onClick={(e) => {this.props.toggleImagePortal(true)}} icon={faArrowCircleUp} color={ '#919191' } alt="edit" />
                    </div>
                    {
                        this.props.editing == this.props.index ?
                            <div>
                                <div className="product-list-meta-name-edit-container">
                                    <input type='text' id="product-name" className="product-name-input" ref={this.prodNameIn} name="product-name" placeholder="Product Name" autoComplete="off" defaultValue={this.props.name ? this.props.name : null}></input>
                                    {
                                        this.props.self ? 
                                            <Button onClick={(e) => {this.props.enableEditMode(e, this.props.index)}} className="edit-interact-product"><FontAwesomeIcon className="edit-interact" icon={faEdit} color={ '#919191' } alt="edit" /></Button>
                                            : null
                                    }
                                </div>
                                <textarea type='text' id="product-desc" className="product-desc-input" ref={this.prodDescIn} name="product-desc" placeholder="Product Description" defaultValue={this.props.desc ? this.props.desc : null}></textarea>
                                <div className="product-price-input-container">
                                    {
                                        this.props.styles ?
                                            this.props.styles.length > 1 ?
                                                <div className="generic-product-meta-stack-container-flex">
                                                    <select name="product-options-select-container" id="product-options-select-container" ref={this.productStylesSelectContainerRef} onClick={(e) => {this.trackCurrentStyle(e)}} onChange={(e) => {this.trackCurrentStyle(e)}}>
                                                        {
                                                            this.props.styles ?
                                                                this.props.styles.map((style, index) => 
                                                                    <option value={index} key={index}>{this.resolveDescriptor(style.descriptor, "style")}</option>
                                                                )
                                                                : null
                                                        }
                                                    </select>
                                                    <input type='text' id="product-option-descriptor-input" className="product-option-descriptor-input" ref={this.prodStyleDescIn} name="product-option-descriptor-input" placeholder="Style" onChange={(e) => {this.updateCurrStyleName(e)}} autoComplete="off" defaultValue={currStyle}></input>
                                                </div>
                                                : null
                                            : null
                                    }
                                    <div>
                                        <Button onClick={(e) => {this.newStyle(e)}} className="edit-interact-product">
                                            <span>New Style</span>
                                            <FontAwesomeIcon className="edit-interact" icon={faPlus} color={ '#919191' } alt="edit" />
                                        </Button>
                                        {
                                            this.props.styles ?
                                                this.props.styles.length > 1 ?
                                                    <span>
                                                        <Button onClick={(e) => {this.removeCurrStyle(e)}} className="edit-interact-product">
                                                            <span>Remove Style</span>
                                                            <FontAwesomeIcon className="edit-interact" icon={faTrashAlt} color={ '#919191' } alt="edit" />
                                                        </Button>
                                                        <Button onClick={(e) => {this.copyStyleOptionsToAll(e)}} className="edit-interact-product">
                                                            <span>Copy Options To Other Styles</span>
                                                            <FontAwesomeIcon className="edit-interact" icon={faCopy} color={ '#919191' } alt="edit" />
                                                        </Button>
                                                    </span>
                                                    : null
                                                : null
                                        }
                                    </div>
                                    {
                                        this.props.styles ?
                                            this.props.styles[this.state.currentStyle] ?
                                                this.props.styles[this.state.currentStyle].options ?
                                                    this.props.styles[this.state.currentStyle].options.length > 1 ?
                                                        <div className="generic-product-meta-stack-container-flex">
                                                            <select name="product-options-select-container" id="product-options-select-container" ref={this.productOptionsSelectContainerRef} onClick={(e) => {this.trackCurrentOption(e)}} onChange={(e) => {this.trackCurrentOption(e)}}>
                                                                {
                                                                    this.props.styles ?
                                                                        this.props.styles[this.state.currentStyle] ?
                                                                            this.props.styles[this.state.currentStyle].options ?
                                                                                this.props.styles[this.state.currentStyle].options.map((option, index) => 
                                                                                    <option value={index} key={index}>{this.resolveDescriptor(option.descriptor)}</option>
                                                                                )
                                                                                : null
                                                                            : null 
                                                                        : null
                                                                }
                                                            </select>
                                                            <input type='text' id="product-option-descriptor-input-option" className="product-option-descriptor-input" ref={this.prodOptionDescIn} name="product-option-descriptor-input" placeholder="Option" onChange={(e) => {this.updateCurrOptionName(e)}} autoComplete="off" defaultValue={currOption}></input>
                                                        </div>
                                                        : null
                                                    : null
                                                : null
                                            : null
                                    }
                                    <div className="product-price-input-container-holder">
                                        <span>$</span>
                                        <input type='text' id="product-price" className="product-price-input" ref={this.prodPriceIn} name="product-price" placeholder="Price" autoComplete="off" onBlur={(e) => {this.updatePrice(e)}} defaultValue={currPrice}></input>
                                    </div>
                                    <div className="quantity-container-input">
                                        <span>Quantity:</span><input type='number' id="product-quantity" className="product-quantity-input" ref={this.prodQuantityIn} name="product-quantity" placeholder="Quantity" autoComplete="off" min="0" defaultValue={currQuantity} onChange={(e) =>{this.updateQuantity(e)}}></input>
                                    </div>
                                    <div className="options-add-container">
                                        <Button onClick={(e) => {this.newOption(e)}} className="edit-interact-product">
                                            <span>New Option</span>
                                            <FontAwesomeIcon className="edit-interact" icon={faPlus} color={ '#919191' } alt="edit" />
                                        </Button>
                                        {
                                            this.props.styles ?
                                                this.props.styles[this.state.currentStyle] ?
                                                    this.props.styles[this.state.currentStyle].options ?
                                                        this.props.styles[this.state.currentStyle].options.length > 1 ?
                                                            <Button onClick={(e) => {this.removeCurrOption(e)}} className="edit-interact-product">
                                                                <span>Remove Option</span>
                                                                <FontAwesomeIcon className="edit-interact" icon={faTrashAlt} color={ '#919191' } alt="edit" />
                                                            </Button>
                                                            : null
                                                        : null
                                                    : null
                                                : null
                                        }
                                    </div>
                                </div>
                                <div className="shipping-classes-container">
                                    <div className="tags-applied-shipping-classes">
                                        {
                                            appliedShippingClassesData ?
                                                appliedShippingClassesData.map((data, index) => 
                                                    <span className="tag" uuid={data.uuid} key={index}>{data.shippingRule}<span className="tag-close" onClick={(e) => {this.removeAppliedShippingClass(e, data.uuid)}}></span></span>
                                                )
                                                : null
                                        }
                                    </div>
                                    <div className="shipping-classes-container-holder">
                                        <select name="shipping-classes" id="shipping-classes" ref={this.shippingClassDropdownRef} onClick={(e) => {this.trackCurrentShippingClass(e)}} onChange={(e) => {this.trackCurrentShippingClass(e)}}>
                                            {
                                                this.props.shippingClasses ? 
                                                    this.props.shippingClasses.map((shipping, index) => 
                                                        <option value={shipping.shippingRule} key={index} index={index}>{shipping.shippingRule}</option>
                                                    )
                                                    : null
                                            }
                                            <option value="Create Shipping Class">Create Shipping Class</option>
                                        </select>
                                        <Button onClick={(e) => {this.determineShippingClassAction(e)}}>{this.state.shippingClassButton}</Button>
                                    </div>
                                </div>
                                <div className={this.state.error ? this.state.error.length > 0 ? "err-status err-status-product-active err-status-active" : "err-status err-status-product err-status-hidden" : "err-status err-status-product err-status-hidden"}>{this.state.error}</div>
                                <span className="flex publish-selection">
                                    <label for="published" className="info-prompt">Publish</label>
                                    <input type="checkbox" id="published" name="published" value="published" ref={this.publishedRef}></input>
                                </span>
                                <div className="products-buttons-container">
                                    <Button onClick={(e) => {this.saveProduct(e)}} className="edit-interact-product">
                                        <span>Save All Changes</span>
                                        <FontAwesomeIcon className="edit-interact" icon={faSave} color={ '#919191' } alt="edit" />
                                    </Button>
                                    <Button onClick={(e) => {this.delProduct(e)}} className="edit-interact-product">
                                        <span>Delete Product</span>
                                        <FontAwesomeIcon className="edit-interact" icon={faTrashAlt} color={ '#919191' } alt="edit" />
                                    </Button>
                                </div>
                            </div>
                            : 
                            <div>
                                <div className="product-list-meta-name-edit-container">
                                    <div className="product-meta-name-desc-container">
                                        <NavLink exact to={"/product?p=" + this.props.id}>
                                            <h5 className={!this.props.dummy ? "product-name" : "product-name product-name-dummy" }>{!this.props.dummy ? this.props.name : "Add Product"}</h5>
                                        </NavLink>
                                        <p className="product-description-display">{this.props.desc}</p>
                                    </div>
                                    {
                                        this.props.self ? 
                                            <Button onClick={(e) => {this.props.enableEditMode(e, this.props.index)}} className="edit-interact-product edit-interact-product-button"><FontAwesomeIcon className="edit-interact" icon={faEdit} color={ '#919191' } alt="edit" /></Button>
                                            : null
                                    }
                                </div>
                                <div className="product-meta-data-display">
                                    <div className="product-price-display">{ validBuyPrice ? "$" + validBuyPrice : ""}</div>
                                </div>
                                <div className="purchase-cart-container">
                                    <div>
                                        {
                                            cartChoice == "Add To Cart" ?
                                                <Button className="transaction-button transaction-button-add-cart btn-center cart-button-space" onClick={(e)=>{this.addToCart("")}}>{cartChoice}</Button>
                                                : 
                                                <Button className="transaction-button transaction-button-add-cart btn-center cart-button-space" onClick={(e)=>{this.addToCart("product")}}>{cartChoice}</Button>
                                        }
                                    </div>
                                    <div>
                                        <Button className="transaction-button transaction-button-checkout btn-center cart-button-space" onClick={(e)=>{this.goBuy()}}>Buy Now</Button>
                                    </div>
                                </div>
                            </div>
                    }
                </div>
                <p>{this.props.price ? this.props.price : null }</p>
            </div>
        )
    }
}
