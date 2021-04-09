import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
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
import Product from './product.js'; import ShippingClassSetup from './shippingclasssetup.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';

import { cookies, socket } from '../App.js';

export default class Shop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            shippingSetupContext: false, rules: []
        }
        this.shippingClassDropdownEditorRef = new React.createRef();
    }

    componentDidMount() {
        
    }

    toggleShippingSetupContextState(e) {
        if (this.state.shippingSetupContext) {
            this.setState({ shippingSetupContext: false });
        } else {
            this.setState({ shippingSetupContext: true });
        }
    }

    updateShippingClassInfoVisually(e) {

    }


    render() {
        return (
            <div className="shipping-class-setup-container">
                <div className="shipping-class-setup-lead">
                    <h5>In order to ship products you need to have shipping classes. <br></br></h5>
                    <div className="shipping-classes-container shipping-classes-container-editor">
                        <div className="shipping-classes-container-holder">
                            <select name="shipping-classes" id="shipping-classes" ref={this.shippingClassDropdownEditorRef} onClick={(e) => {this.updateShippingClassInfoVisually(e)}} onChange={(e) => {this.updateShippingClassInfoVisually(e)}}>
                                {
                                    this.props.shippingclasses ? 
                                        this.props.shippingclasses.map((shipping, index) => 
                                            <option value={shipping.name}>{shipping.name}</option>
                                        )
                                        : null
                                }
                                <option value="New Shipping Class">New Shipping Class</option>
                            </select>
                        </div>
                    </div>
                    <p className={this.state.shippingSetupContext ? "shipping-class-setup-info shipping-class-setup-info-open" : "shipping-class-setup-info"} onClick={(e) => {this.toggleShippingSetupContextState(e)}}>
                    Shipping classes determine: <span>{this.state.shippingSetupContext ? "" : "Click for more info"}</span><br></br><br></br>
                        <ul>
                            <li>Where in the world your product ships to</li>
                            <li>How much customers pay depending on their location</li>
                            <li>What quality of shipping service they're paying for</li>
                            <li>And if to apply it on a per product basis or only once/none if another shipping class is applied</li>
                        </ul>
                    </p>
                </div>
                <div className="shipping-class-setup-rates-info">
                    <p>Generally you can set lower shipping prices for some countries (say your own or closer ones) and the international option will cover the rest.<br></br>
                    Make sure to get quotes on what shipping should cost for you. Once the customer has made that purchase you fulfill it with the money you've received</p>
                </div>
                <div className="shipping-class-setup-countries-info">
                    <p>Add countries you do not ship to on your "exclude" list or choose "only ship to" instead</p>
                </div>
                <div className="shipping-class-interact-button-container">
                    <Button>Save</Button><Button onClick={(e) => {this.props.toggleShippingPortal(false)}}>Close</Button>
                </div>
            </div> 
        )
    }
}
