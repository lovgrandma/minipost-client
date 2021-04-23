import React, { Component } from 'react';
import {
    Link
} from 'react-router-dom';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Dropdown,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import currentshopurl from '../shopurl.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';
import greyproduct from '../static/greyproduct.jpg';
import { faEdit, faEllipsisH, faPlus, faSave, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

import { cookies } from '../App.js';

export default class Product extends Component {
    constructor(props) {
        super(props);
        this.state = {
            shippingClassButton: "Set", currentStyle: 0, currentOption: 0
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
        if (this.state.shippingClassButton == "Go") {
            this.props.toggleShippingPortal(true);
        } else {
            // set visual change that shipping class has been changed, will only update on post request/publish 
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

    saveProduct = (e) => {

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

    render() {
        return (
            <div className="product-list-single">
                <div className="product-list-meta-container">
                    <div className="product-list-img-container">
                        <img src={this.props.imgurl ? this.props.imgurl : greyproduct}></img>
                    </div>
                    {
                        this.props.editing == this.props.index ?
                            <div>
                                <div className="product-list-meta-name-edit-container">
                                    <input type='text' id="product-name" className="product-name-input" ref={this.prodNameIn} name="product-name" placeholder="Product Name" autoComplete="off"></input>
                                    {
                                        this.props.self ? 
                                            <Button onClick={(e) => {this.props.enableEditMode(e, this.props.index)}} className="edit-interact-product"><FontAwesomeIcon className="edit-interact" icon={faEdit} color={ '#919191' } alt="edit" /></Button>
                                            : null
                                    }
                                </div>
                                <textarea type='text' id="product-desc" className="product-desc-input" ref={this.prodDescIn} name="product-desc" placeholder="Product Description" value={this.props.name ? this.props.name : null}></textarea>
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
                                                    <input type='text' id="product-option-descriptor-input" className="product-option-descriptor-input" ref={this.prodStyleDescIn} name="product-option-descriptor-input" placeholder="Style" onChange={(e) => {this.updateCurrStyleName(e)}} autoComplete="off"></input>
                                                </div>
                                                : null
                                            : null
                                    }
                                    <Button onClick={(e) => {this.newStyle(e)}} className="edit-interact-product">
                                        <span>New Style</span>
                                        <FontAwesomeIcon className="edit-interact" icon={faPlus} color={ '#919191' } alt="edit" />
                                    </Button>
                                    {
                                        this.props.styles ?
                                            this.props.styles.length > 1 ?
                                                <Button onClick={(e) => {this.removeCurrStyle(e)}} className="edit-interact-product">
                                                    <span>Remove Style</span>
                                                    <FontAwesomeIcon className="edit-interact" icon={faTrashAlt} color={ '#919191' } alt="edit" />
                                                </Button>
                                                : null
                                            : null
                                    }
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
                                                            <input type='text' id="product-option-descriptor-input" className="product-option-descriptor-input" ref={this.prodOptionDescIn} name="product-option-descriptor-input" placeholder="Option" onChange={(e) => {this.updateCurrOptionName(e)}} autoComplete="off"></input>
                                                        </div>
                                                        : null
                                                    : null
                                                : null
                                            : null
                                    }
                                    <div className="product-price-input-container-holder">
                                        <span>$</span>
                                        <input type='text' id="product-price" className="product-price-input" ref={this.prodPriceIn} name="product-price" placeholder="Price" autoComplete="off" onChange={(e) => {this.updatePrice(e)}}></input>
                                    </div>
                                    <div className="quantity-container-input">
                                        <span>Quantity:</span><input type='number' id="product-quantity" className="product-quantity-input" ref={this.prodQuantityIn} name="product-quantity" placeholder="Quantity" autoComplete="off" min="0" defaultValue="0" onChange={(e) =>{this.updateQuantity(e)}}></input>
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
                                    <div className="shipping-classes-container-holder">
                                        <select name="shipping-classes" id="shipping-classes" ref={this.shippingClassDropdownRef} onClick={(e) => {this.trackCurrentShippingClass(e)}} onChange={(e) => {this.trackCurrentShippingClass(e)}}>
                                            {
                                                this.props.shippingClasses ? 
                                                    this.props.shippingClasses.map((shipping, index) => 
                                                        <option value={shipping.shippingRule}>{shipping.shippingRule}</option>
                                                    )
                                                    : null
                                            }
                                            <option value="Create Shipping Class">Create Shipping Class</option>
                                        </select>
                                        <Button onClick={(e) => {this.determineShippingClassAction(e)}}>{this.state.shippingClassButton}</Button>
                                    </div>
                                </div>
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
                                    <h5 className={!this.props.dummy ? "product-name" : "product-name product-name-dummy" }>{!this.props.dummy ? this.props.name : "Add Product"}</h5>
                                    {
                                        this.props.self ? 
                                            <Button onClick={(e) => {this.props.enableEditMode(e, this.props.index)}} className="edit-interact-product"><FontAwesomeIcon className="edit-interact" icon={faEdit} color={ '#919191' } alt="edit" /></Button>
                                            : null
                                    }
                                </div>
                                <div>{this.props.price}</div>
                            </div>
                    }
                </div>
                <p>{this.props.price ? this.props.price : null }</p>
            </div>
        )
    }
}
