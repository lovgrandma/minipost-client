import React, { Component } from 'react';
import Select from 'react-select';
import {
    Button
} from 'react-bootstrap';
import countryList from 'react-select-country-list';
import currentshopurl from '../shopurl.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import corsdefault from '../cors.js';

import { cookies, socket } from '../App.js';

export default class Shop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            shippingSetupContextInfo: false, classes: [], countries: [], currClassIndex: -1, selectedCountriesRuleDisplay: [], currentShippingClass: "New Shipping Class", classUuid: null, error: ""
        }
        this.shippingClassDropdownEditorRef = new React.createRef();
        this.shippingClassCountriesIn = new React.createRef();
        this.shippingClassRuleIn = new React.createRef();
        this.countrySelect = new React.createRef();
        this.shippingClassPriceIn = new React.createRef();
        this.perProduct = new React.createRef();
        this.onlyOnce = new React.createRef();
        this.errorStatus = new React.createRef();
    }

    componentDidMount() {
        this.buildCountriesOptions();
        this.updateShippingClassInfoVisually();
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
        if (this.state.shippingSetupContextInfo) {
            this.setState({ shippingSetupContextInfo: false });
        } else {
            this.setState({ shippingSetupContextInfo: true });
        }
    }

    updateShippingClassInfoVisually = (e) => {
        try {
            if (this.shippingClassDropdownEditorRef) {
                if (this.shippingClassDropdownEditorRef.current) {
                    if (this.shippingClassDropdownEditorRef.current.value) {
                        if (this.shippingClassDropdownEditorRef.current.value != this.state.currentShippingClass || !this.state.currentShippingClass) {
                            if (this.shippingClassDropdownEditorRef.current.value == "New Shipping Class") {
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
                                this.perProduct.current.checked = false;
                                this.onlyOnce.current.checked = true;
                                this.setState({ selectedCountriesRuleDisplay: [], currentShippingClass: "New Shipping Class", currClassIndex: -1 });
                            } else if (this.shippingClassDropdownEditorRef.current.value == "Set International Rule") {
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
                                let internationalIndex = -1;
                                let internationalCountries = [];
                                let perProduct = false;
                                for (let i = 0; i < this.props.shippingClasses.length; i++) {
                                    if (this.props.shippingClasses[i].international)  {
                                        internationalIndex = i;
                                        internationalCountries = this.props.shippingClasses[i].selectedCountries;
                                        if (this.props.shippingClasses[i].perProduct) {
                                            perProduct = true;
                                        }
                                        if (this.props.shippingClasses[i].shippingPrice) {
                                            this.shippingClassPriceIn.current.value = this.props.shippingClasses[i].shippingPrice;
                                        }
                                        break;
                                    }
                                }
                                if (internationalIndex == -1) {
                                    this.setState({ selectedCountriesRuleDisplay: [], currentShippingClass: "Set International Rule", currClassIndex: -1 });
                                } else {
                                    if (perProduct) {
                                        this.perProduct.current.checked = true;
                                    } else {
                                        this.onlyOnce.current.checked = true;
                                    }
                                    this.setState({ selectedCountriesRuleDisplay: internationalCountries, currentShippingClass: "Set International Rule", currClassIndex: internationalIndex });
                                }
                            } else {
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
                                let name = "";
                                for (let i = 0; i < this.props.shippingClasses.length; i++) {
                                    if (this.props.shippingClasses[i].shippingRule.toLowerCase() == this.shippingClassDropdownEditorRef.current.value.toLowerCase()) {
                                        name = this.props.shippingClasses[i].shippingRule;
                                        if (this.shippingClassRuleIn) {
                                            if (this.shippingClassRuleIn.current) {
                                                this.shippingClassRuleIn.current.value = this.props.shippingClasses[i].shippingRule;
                                            }
                                        }
                                        countries = this.props.shippingClasses[i].selectedCountries;
                                        if (this.props.shippingClasses[i].perProduct) {
                                            if (this.perProduct.current) {
                                                this.perProduct.current.checked = true;
                                            }
                                        } else {
                                            if (this.onlyOnce.current) {
                                                this.onlyOnce.current.checked = true;
                                            }
                                        }
                                        if (this.props.shippingClasses[i].shippingPrice) {
                                            this.shippingClassPriceIn.current.value = this.props.shippingClasses[i].shippingPrice;
                                        }
                                        this.setState({ selectedCountriesRuleDisplay: countries, currentShippingClass: name, currClassIndex: i });
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


    /**
     * Will send the data of 1 single proposed shipping class to the database and save on shop record
     * 
     * @param {event} e 
     * @param {Boolean} exit Determines if exits at end of POST fetch
     */
    saveShippingClassData (e, exit = false) {
        try {
            let goodData = this.checkClassData();
            if (goodData) {
                let uuid = this.state.classUuid; // unique identifier for class. Only unique across individual shop, not database. If null, new class or international new class
                let owner = this.props.owner;
                let username = cookies.get("loggedIn");
                let hash = cookies.get("hash");
                let self = this.props.self;
                fetch(currentshopurl + "s/saveshippingclass", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        owner, username, hash, goodData, uuid, self
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result.data) {
                        if (result.data.shippingClasses) {
                            this.props.updateShippingClasses(result.data.shippingClasses);
                        }
                    }
                    return result;
                })
                .catch((err) => {
                    console.log(err);
                })
                .then((result) => {
                    if (exit && result) { 
                        this.props.toggleShippingPortal(false);
                    }
                })
                // save class fetch req
            }
        } catch (err) {
            console.error(err);
        }
    }


    /**
     * Should return whether or not all class data is valid and ready to save to db. Will return the object to send to the db if info is valid
     * 
     * @returns {False || ShippingClassObject 
     *              {String uuid,
     *              String shippingRule,
     *              String[] selectedCountries,
     *              float shippingClassPrice,
     *              Boolean international,
     *              Boolean perProduct}
     *          } The object that will be sent to the db with all necessary information to update
     */
    checkClassData() {
        try {
            this.setState({ error: ""});
            this.errorStatus.current.classList.remove("err-status-active");
            let shippingClassRule; // Current name input of shipping class
            let selectedCountries = []; // Selected countries for class stored in array
            let shippingClassPrice; // Current price input of shipping class
            let perProduct = false; // Per product or only once Boolean
            if (this.shippingClassRuleIn) {
                if (this.shippingClassRuleIn.current) {
                    shippingClassRule = this.shippingClassRuleIn.current.value;
                }
            }
            if (this.state.selectedCountriesRuleDisplay) {
                selectedCountries = this.state.selectedCountriesRuleDisplay;
            }
            if (this.shippingClassPriceIn) {
                if (this.shippingClassPriceIn.current) {
                    try {
                        if (typeof parseFloat(this.shippingClassPriceIn.current.value) == "number") { // Allows for user to input 0 (free) as price
                            try {
                                shippingClassPrice = parseFloat(this.shippingClassPriceIn.current.value).toFixed(2);
                            } catch (err) {
                                shippingClassPrice = false;
                            }
                        }
                    } catch (err) {
                        shippingClassPrice = false;
                    }
                }
            }
            if (this.perProduct.current.checked) {
                perProduct = true;
            }
            let goodShippingClassRule = false;
            let goodSelectedCountries = false;
            let goodShippingPrice = false;
            if (shippingClassRule.length > 0) {
                goodShippingClassRule = true;
            }
            if (selectedCountries.length > 0) {
                goodSelectedCountries = true;
            }
            if (shippingClassPrice) {
                goodShippingPrice = true;
            }
            if (!goodShippingClassRule) {
                this.setState({ error: "Your shipping class needs to have a name"});
                this.errorStatus.current.classList.add("err-status-active");
                return false;
            }
            if (!goodSelectedCountries) {
                this.setState({ error: "Your shipping class needs to ship to somewhere"});
                this.errorStatus.current.classList.add("err-status-active");
                return false;
            }
            if (!goodShippingPrice) {
                this.setState({ error: "There's a problem with your shipping fee. Please enter a number"});
                this.errorStatus.current.classList.add("err-status-active");
                return false;
            }
            let international = false;
            if (this.state.currentShippingClass == "Set International Rule") {
                international = true;
            }
            return {
                uuid: this.state.uuid,
                shippingRule: shippingClassRule,
                selectedCountries: selectedCountries,
                shippingPrice: shippingClassPrice,
                international: international,
                perProduct: perProduct
            };
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    render() {
        return (
            <div className="shipping-class-setup-container">
                <div className="err-status err-status-hidden" ref={this.errorStatus}>{this.state.error}</div>
                <div className="shipping-class-setup-lead">
                    <h5>In order to ship products you need to have shipping classes. <br></br></h5>
                    <div className="shipping-classes-container shipping-classes-container-editor">
                        <div className="shipping-classes-container-holder">
                            <select name="shipping-classes" id="shipping-classes" ref={this.shippingClassDropdownEditorRef} onClick={(e) => {this.updateShippingClassInfoVisually(e)}} onChange={(e) => {this.updateShippingClassInfoVisually(e)}}>
                                {
                                    this.props.shippingClasses ? 
                                        this.props.shippingClasses.map((shipping, index) => 
                                            shipping.shippingRule != "International" ?
                                                <option value={shipping.shippingRule}>{shipping.shippingRule}</option>
                                                : null
                                        )
                                        : null
                                }
                                <option value="New Shipping Class">New Shipping Class</option>
                                <option value="Set International Rule">Set International Rule</option>
                            </select>
                        </div>
                    </div>
                    <p className={this.state.shippingSetupContextInfo ? "shipping-class-setup-info shipping-class-setup-info-open" : "shipping-class-setup-info"} onClick={(e) => {this.toggleShippingSetupContextState(e)}}>
                    Shipping classes determine: <span>{this.state.shippingSetupContextInfo ? "" : "..Click for more info"}</span><br></br><br></br>
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
                <div className="react-add-all-remove-all-countries">
                    <Button onClick={(e) => {this.addAllCountries(e)}}>Add All</Button>
                    <Button onClick={(e) => {this.removeAllCountries(e)}}>Remove All</Button>
                </div>
                <div className="product-price-input-container-holder">
                    <span>$</span>
                    <input type='text' id="product-price" className="product-price-input" ref={this.shippingClassPriceIn} name="product-price" placeholder="Shipping Fee" autoComplete="off"></input>
                </div>
                <div className="shipping-class-setup-rates-info">
                    <p>Generally you can set lower shipping prices for some countries (say your own or closer ones) and the international option should cover the rest. Click "Add All" when updating the international option and remove countries you cannot/do not ship to.<br></br><br></br>
                    Make sure to get quotes on what shipping should cost for you. Once the customer has made that purchase you fulfill it with the money you've received</p>
                </div>
                <div className="info-blurb little-space-container">
                    <span>
                        <input type="radio" id="per-product" name="policy" value="Per product" ref={this.perProduct}></input>
                        <label for="per-product">Per Product</label>
                    </span>
                    <span>
                        <input type="radio" id="only-once" name="policy" value="Only once" defaultChecked={true} ref={this.onlyOnce}></input>
                        <label for="only-once">Only Once</label>
                    </span>
                </div>
                <div className="save-current-class-container">
                    <Button onClick={(e) => {this.saveShippingClassData(e)}}>Save class</Button><span>Make sure you save this class before you select another one</span>
                </div>
                <div className="shipping-class-interact-button-container">
                    <Button onClick={(e) => {this.saveShippingClassData(e, true)}}> Save &amp; quit</Button><Button onClick={(e) => {this.props.toggleShippingPortal(false)}}>Close</Button>
                </div>
            </div> 
        )
    }
}
