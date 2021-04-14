import React, { Component, useMemo } from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import Select from 'react-select';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Dropdown,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import countryList from 'react-select-country-list';
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
            shippingSetupContext: false, classes: [], countries: [], selectedCountriesRuleDisplay: [], currentShippingClass: "", allowAppendAll: false
        }
        this.shippingClassDropdownEditorRef = new React.createRef();
        this.shippingClassCountriesIn = new React.createRef();
        this.shippingClassRuleIn = new React.createRef();
        this.countrySelect = new React.createRef();
        this.shippingClassPriceIn = new React.createRef();
    }

    componentDidMount() {
        this.buildCountriesOptions();
    }

    buildCountriesOptions() {
        if (!this.state.countries) {
            this.setState({ countries: [] });
        }
        if (this.state.countries.length < 1) {
            const countries = countryList().getData();
            this.setState({ countries: countries });
        }
    }

    toggleShippingSetupContextState(e) {
        if (this.state.shippingSetupContext) {
            this.setState({ shippingSetupContext: false });
        } else {
            this.setState({ shippingSetupContext: true });
        }
    }

    updateShippingClassInfoVisually = (e) => {
        try {
            if (this.shippingClassDropdownEditorRef) {
                if (this.shippingClassDropdownEditorRef.current) {
                    if (this.shippingClassDropdownEditorRef.current.value) {
                        if (this.shippingClassDropdownEditorRef.current.value != this.state.currentShippingClass || !this.state.currentShippingClass) {
                            if (this.shippingClassDropdownEditorRef.current.value == "New Shipping Class") {
                                this.setState({ allowAppendAll: false });
                                if (this.shippingClassRuleIn) {
                                    if (this.shippingClassRuleIn.current) {
                                        this.shippingClassRuleIn.current.value = "";
                                        this.shippingClassRuleIn.current.disabled = false;
                                    }
                                }
                                if (this.shippingClassPriceIn) {
                                    if (this.shippingClassPriceIn.current) {
                                        this.shippingClassPriceIn.current.value = "";
                                    }
                                }
                                this.setState({ selectedCountriesRuleDisplay: [], currentShippingClass: "New Shipping Class" });
                            } else if (this.shippingClassDropdownEditorRef.current.value == "Set International Rule") {
                                console.log("international")
                                this.setState({ allowAppendAll: true });
                                if (this.shippingClassRuleIn) {
                                    if (this.shippingClassRuleIn.current) {
                                        this.shippingClassRuleIn.current.value = "International";
                                        this.shippingClassRuleIn.current.disabled = true;
                                    }
                                }
                                if (this.shippingClassPriceIn) {
                                    if (this.shippingClassPriceIn.current) {
                                        this.shippingClassPriceIn.current.value = "";
                                    }
                                }
                                if (!this.state.classes.international) {
                                    this.setState({ selectedCountriesRuleDisplay: [], currentShippingClass: "Set International Rule" });
                                } else {
                                    this.setState({ selectedCountriesRuleDisplay: this.state.classes.international.countries, currentShippingClass: "Set International Rule" });
                                }
                            } else {
                                this.setState({ allowAppendAll: false });
                                if (this.shippingClassRuleIn) {
                                    if (this.shippingClassRuleIn.current) {
                                        this.shippingClassRuleIn.current.value = "";
                                        this.shippingClassRuleIn.current.disabled = false;
                                    }
                                }
                                if (this.shippingClassPriceIn) {
                                    if (this.shippingClassPriceIn.current) {
                                        this.shippingClassPriceIn.current.value = "";
                                    }
                                }
                                let countries = [];
                                for (let i = 0; i < this.state.classes.classes.length; i++) {
                                    if (this.state.classes.classes[i].name == this.shippingClassDropdownEditorRef.current.value) {
                                        if (this.shippingClassRuleIn) {
                                            if (this.shippingClassRuleIn.current) {
                                                this.shippingClassRuleIn.current.value = this.state.classes.classes[i].name;
                                            }
                                        }
                                        countries = this.state.classes.classes[i].countries;
                                        this.setState({ selectedCountriesRuleDisplay: countries, currentShippingClass: "New Shipping Class" });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err);
            // Fail silently
        }
    }

    trackCountryChange(e) {

    }

    getThisShippingData() {

    }

    addCountry(e) {
        if (this.countrySelect) {
            if (this.countrySelect.current) {
                if (this.countrySelect.current.select) {
                    if (this.countrySelect.current.select.getValue()) {
                        if (this.countrySelect.current.select.getValue()[0]) {
                            if (this.countrySelect.current.select.getValue()[0].label) {
                                let tempCountry = this.countrySelect.current.select.getValue()[0].label;
                                if (this.state.selectedCountriesRuleDisplay.indexOf(tempCountry) < 0) {
                                    let selectedCountriesRuleDisplay = this.state.selectedCountriesRuleDisplay;
                                    selectedCountriesRuleDisplay.push(tempCountry);
                                    this.setState({ selectedCountriesRuleDisplay: selectedCountriesRuleDisplay });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    removeCountry(e) {
        if (this.countrySelect) {
            if (this.countrySelect.current) {
                if (this.countrySelect.current.select) {
                    if (this.countrySelect.current.select.getValue()) {
                        if (this.countrySelect.current.select.getValue()[0]) {
                            if (this.countrySelect.current.select.getValue()[0].label) {
                                let tempCountry = this.countrySelect.current.select.getValue()[0].label;
                                if (this.state.selectedCountriesRuleDisplay.indexOf(tempCountry) > -1) {
                                    let selectedCountriesRuleDisplay = this.state.selectedCountriesRuleDisplay;
                                    selectedCountriesRuleDisplay.splice(selectedCountriesRuleDisplay.indexOf(tempCountry), 1);
                                    this.setState({ selectedCountriesRuleDisplay: selectedCountriesRuleDisplay });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    addAllCountries(e) {
        let countries = [];
        for (let i = 0; i < this.state.countries.length; i++) {
            countries.push(this.state.countries[i].label);
        }
        this.setState({ selectedCountriesRuleDisplay: countries });
    }

    removeAllCountries(e) {
        this.setState({ selectedCountriesRuleDisplay: [] });
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
                                <option value="Set International Rule">Set International Rule</option>
                            </select>
                        </div>
                    </div>
                    <p className={this.state.shippingSetupContext ? "shipping-class-setup-info shipping-class-setup-info-open" : "shipping-class-setup-info"} onClick={(e) => {this.toggleShippingSetupContextState(e)}}>
                    Shipping classes determine: <span>{this.state.shippingSetupContext ? "" : "..Click for more info"}</span><br></br><br></br>
                        <ul>
                            <li>Where in the world your product ships to</li>
                            <li>How much customers pay depending on their location</li>
                            <li>What quality of shipping service they're paying for</li>
                            <li>And if to apply it on a per product basis or only once/none if another shipping class is applied</li>
                        </ul>
                    </p>
                </div>
                <div>
                    <input type='text' id="shipping-rule-name" className="product-name-input shipping-rule-input" ref={this.shippingClassRuleIn} name="shipping-rule" placeholder="Shipping Rule Name" autoComplete="off"></input>
                    <div className="info-blurb">This class covers shipping to: </div>
                    <div className="product-desc-input shipping-rule-countries" ref={this.shippingClassCountriesIn} name="shipping-rule-countries" placeholder="Included countries">
                        {
                            this.state.selectedCountriesRuleDisplay ?
                                this.state.selectedCountriesRuleDisplay.map((country, index) => 
                                    index != this.state.selectedCountriesRuleDisplay.length -1 ?
                                        <span>{country}, </span>
                                        : <span>{country}</span>
                                )
                                : null
                        }
                    </div>
                    <div className="react-select-add-country-container">
                        <Select className="react-select-container" classNamePrefix="react-select" options={this.state.countries} ref={this.countrySelect} onChange={(e) => {this.trackCountryChange(e)}} />
                        <Button onClick={(e) => {this.addCountry(e)}}>Add</Button>
                        <Button onClick={(e) => {this.removeCountry(e)}}>Remove</Button>
                    </div>
                </div>
                {
                    this.state.allowAppendAll ?
                        <div className="react-add-all-remove-all-countries">
                            <Button onClick={(e) => {this.addAllCountries(e)}}>Add All</Button>
                            <Button onClick={(e) => {this.removeAllCountries(e)}}>Remove All</Button>
                        </div>
                        : null
                }
                <div className="product-price-input-container-holder">
                    <span>$</span>
                    <input type='text' id="product-price" className="product-price-input" ref={this.shippingClassPriceIn} name="product-price" placeholder="Shipping Fee" autoComplete="off"></input>
                </div>
                <div className="shipping-class-setup-rates-info">
                    <p>Generally you can set lower shipping prices for some countries (say your own or closer ones) and the international option should cover the rest. Click "Add All" when updating the international option and remove countries you cannot/do not ship to.<br></br><br></br>
                    Make sure to get quotes on what shipping should cost for you. Once the customer has made that purchase you fulfill it with the money you've received</p>
                </div>
                <div className="shipping-class-interact-button-container">
                    <Button>Save</Button><Button onClick={(e) => {this.props.toggleShippingPortal(false)}}>Close</Button>
                </div>
            </div> 
        )
    }
}
