import React, { Component } from 'react';
import {
    Link
} from 'react-router-dom';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import currentshopurl from '../shopurl.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';
import greyproduct from '../static/greyproduct.jpg';
import { faEdit, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

import { cookies } from '../App.js';

export default class Product extends Component {
    constructor(props) {
        super(props);
        this.state = {
            
        }
    }

    componentDidMount() {
        
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
                                    <input type='text' id="product-price" className="product-price-input" ref={this.prodPriceIn} name="product-price" placeholder="Price" autoComplete="off"></input>
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
