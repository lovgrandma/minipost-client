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
            shippingClassButton: "Set", currentOption: 0
        }
        this.shippingClassDropdownRef = new React.createRef();
        this.productOptionsSelectContainerRef = new React.createRef();
        this.prodNameIn = new React.createRef();
        this.prodDescIn = new React.createRef();
        this.prodPriceIn = new React.createRef();
        this.prodQuantityIn = new React.createRef();
        this.prodOptionDescIn = new React.createRef();
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
                        if (this.state.shippingClassButton != "Set") {
                            this.setState({ shippingClassButton: "Set" });
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
                    if (this.productOptionsSelectContainerRef.current.value) {
                        if (this.productOptionsSelectContainerRef.current.value != this.state.currentOption && Number.isInteger(parseInt(this.productOptionsSelectContainerRef.current.value))) {
                            this.setState({ currentOption: parseInt(this.productOptionsSelectContainerRef.current.value) });
                        }
                    }
                }
            }
        } catch (err) {
            // fail silently
    }
    }

    determineShippingClassAction(e) {
        if (this.state.shippingClassButton == "Go") {
            this.props.toggleShippingPortal(true);
        } else {
            // set visual change that shipping class has been changed, will only update on post request/publish 
        }
    }

    newOption = (e) => {
        let currentOptions = this.props.options;
        currentOptions.push({descriptor: "", price: null, quantity: 0});
        this.props.updateLocalProducts(this.props.index, currentOptions);
    }

    removeCurrOption = (e) => {
        // Don't allow user to delete if only single option left. Makes no sense, would result in a non product
        // A product should always have 1 option internally even though it doesnt appear that way on the front end
        if (this.props.options.length > 1) {
            let currentOptions = this.props.options;
            currentOptions.splice(this.state.currentOption, 1);
            this.setState({ currentOption: 0 });
            this.props.updateLocalProducts(this.props.index, currentOptions);
        }
    }

    saveProduct = (e) => {

    }

    delProduct = (e) => {

    }

    resolveDescriptor(value) {
        if (value) {
            return value;
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
                                        this.props.options ?
                                            this.props.options.length > 1 ?
                                                <div className="generic-product-meta-stack-container-flex">
                                                    <select name="product-options-select-container" id="product-options-select-container" ref={this.productOptionsSelectContainerRef} onClick={(e) => {this.trackCurrentOption(e)}} onChange={(e) => {this.trackCurrentOption(e)}}>
                                                        {
                                                            this.props.options ?
                                                                this.props.options.map((option, index) => 
                                                                    <option value={index} key={index}>{this.resolveDescriptor(option.descriptor)}</option>
                                                                )
                                                                : null
                                                        }
                                                    </select>
                                                    <input type='text' id="product-option-descriptor-input" className="product-option-descriptor-input" ref={this.prodOptionDescIn} name="product-option-descriptor-input" placeholder="Option" autoComplete="off"></input>
                                                </div>
                                                : null
                                            : null
                                    }
                                    <div className="product-price-input-container-holder">
                                        <span>$</span>
                                        <input type='text' id="product-price" className="product-price-input" ref={this.prodPriceIn} name="product-price" placeholder="Price" autoComplete="off"></input>
                                    </div>
                                    <div className="quantity-container-input">
                                        <span>Quantity:</span><input type='number' id="product-quantity" className="product-quantity-input" ref={this.prodQuantityIn} name="product-quantity" placeholder="Quantity" autoComplete="off" min="0" defaultValue="0"></input>
                                    </div>
                                    <div className="options-add-container">
                                        <Button onClick={(e) => {this.newOption(e)}} className="edit-interact-product">
                                            <span>New Option</span>
                                            <FontAwesomeIcon className="edit-interact" icon={faPlus} color={ '#919191' } alt="edit" />
                                        </Button>
                                        {
                                            this.props.options ?
                                                this.props.options.length > 1 ?
                                                    <Button onClick={(e) => {this.removeCurrOption(e)}} className="edit-interact-product">
                                                        <span>Remove Option</span>
                                                        <FontAwesomeIcon className="edit-interact" icon={faTrashAlt} color={ '#919191' } alt="edit" />
                                                    </Button>
                                                    : null
                                                : null
                                        }
                                    </div>
                                </div>
                                <div className="shipping-classes-container">
                                    <div className="shipping-classes-container-holder">
                                        <select name="shipping-classes" id="shipping-classes" ref={this.shippingClassDropdownRef} onClick={(e) => {this.trackCurrentShippingClass(e)}} onChange={(e) => {this.trackCurrentShippingClass(e)}}>
                                            {
                                                this.props.shippingclasses ? 
                                                    this.props.shippingclasses.map((shipping, index) => 
                                                        <option value={shipping.name}>{shipping.name}</option>
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
