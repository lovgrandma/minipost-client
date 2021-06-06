import React, { Component } from 'react';
import currentrooturl from '../url';
import { cookies } from '../App.js';
import { get } from '../methods/utility.js';
import countryList from 'react-select-country-list';
import Select from 'react-select';
import keys from '../keys/stripecred.js';
import amex from '../static/cc/amex.svg'; import mastercard from '../static/cc/mastercard.svg'; import visa from '../static/cc/visa.svg'; 
import corsdefault from '../cors.js';
import { redirectManageShopOrders } from '../methods/ecommerce.js';

import IntlTelInput from 'react-intl-tel-input';
import 'react-intl-tel-input/dist/main.css';

import { Elements, CardElement, ElementsConsumer } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import currentshopurl from '../shopurl';
const stripePromise = loadStripe(keys.livekey);

export default class Options extends Component {
    constructor() {
        super();
        this.state = { username: "", avatarurl: '', uploadavatarbusy: false, ccbusy: false, shippingData: null, email: '', phone: '###-###-####', cclastfourdigits: "-------------", cctype: '', openportal: '', err: "", client_secret: null, countries: [], shippingError: "", shippingSuccess: "", dragDisabledOption: false }
        this.upload = React.createRef();
        this.cc_name = React.createRef();
        this.countryDestinationShippingSelectRef = React.createRef();
        this.shippingFullNameRef = React.createRef();
        this.shippingEmailRef = React.createRef();
        this.shippingAddressRef = React.createRef();
        this.shippingCityRef = React.createRef();
        this.shippingStateRef = React.createRef();
        this.shippingZipRef = React.createRef();
        this.phoneVerify = React.createRef();
        this.dragDisabledOptionRef = React.createRef();
    }

    componentDidMount = async () => {
        try {
            this.fetchProfileOptionsData();
            this.fetchShippingData();
            this.setState({ uploadavatarbusy: false });
            this.buildCountriesOptions();
        } catch (err) {
            // Component unmounted
        }
    }

    componentDidUpdate(prevProps) {
        this.props.username != prevProps.username ? this.setState({ username: this.props.username }) : null;
    }

    getDraggable() {
        if (this.props.hasOwnProperty("dragDisabled")) {
            this.setState({ dragDisabled: this.props.dragDisabled });
        }
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
    
    // Fetch profile data, always match by user name instead of id. Username more readily available
    fetchProfileOptionsData = async () => {
        try {
            if (cookies.get('loggedIn')) {
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                return await fetch(currentrooturl + 'm/fetchprofileoptionsdata', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        username, hash, self
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        console.log(result);
                        let authenticated = this.props.checkAndConfirmAuthentication(result);
                        if (authenticated) {
                            if (result.avatarurl) {
                                this.setState({ avatarurl: result.avatarurl });
                            }
                            if (result.email) {
                                this.setState({ email: result.email });
                            }
                            if (result.shop) {
                                this.setState({ shopId: result.shop });
                            }
                            if (result.expressLink) {
                                if (result.expressLink.url) {
                                    this.setState({ expressLink: result.expressLink.url });
                                }
                            }
                        }
                    }
                })
            }
        } catch (err) {
            // Component was unmounted
            return false;
        }
        return true;
    }
    
    getClientSecret = async () => {
        if (!this.state.client_secret) {
            try {
                if (cookies.get('loggedIn')) {
                    let username = cookies.get('loggedIn');
                    let hash = cookies.get('hash');
                    let self = true;
                    return await fetch(currentrooturl + 'm/getclientsecret', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            username, hash, self
                        })
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((result) => {
                        if (result) {
                            let authenticated = this.props.checkAndConfirmAuthentication(result);
                            if (authenticated) {
                                this.setState({ payment_customer: result.user });
                                this.setState({ client_secret: result.client_secret });
                                if (result.advertiser) {
                                    this.setState({ advertiser: result.advertiser });
                                }
                                console.log(result);
                                if (get(result, 'card.data')) {
                                    if (result.card.data[0]) {
                                        if (result.card.data[0].card) {
                                            if (result.card.data[0].card.last4 && result.card.data[0].card.networks) {
                                                if (result.card.data[0].card.networks.available) {
                                                    if (result.card.data[0].card.networks.available[0]) {
                                                        this.setState({ network: result.card.data[0].card.networks.available[0] });
                                                    }
                                                }
                                                this.setState({ last4: result.card.data[0].card.last4 });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    })
                }
            } catch (err) {
                // Component was unmounted
                return false;
            }
        }
    }

    phoneconfirm = () => {
        if (this.phone && document.getElementById('phonein')) {
            if (this.phone.current && document.getElementById('phonein').value) {
                let number = this.phone.current.getNumber(document.getElementById('phonein').value,intlTelInputUtils.numberFormat.E164);
                if (number.charAt(0) != '+') {
                    // number is value
                    return false;
                }
                return true;
            }
        }
        
        return false;
    }
    
    uploadThumbnailS3 = async () => {
        if (this.state.uploadavatarbusy == false) {
            try {
                this.setState({ uploadavatarbusy: true });
                if (this.upload.current.files[0]) {
                    let file = this.upload.current.files[0];
                    if ((file.type == "image/png" || file.type == "image/jpeg" || file.type == "image/jpg") && cookies.get('loggedIn')) {
                        if (file.name.match(/\.([a-zA-Z0-9]*)$/)) {
                            let formData = new FormData();
                            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1];
                            let username = cookies.get('loggedIn');
                            formData.append('extension', extension);
                            formData.append('thumbnail', file);
                            formData.append('username', username);
                            formData.append('hash', cookies.get('hash'));
                            formData.append('self', true);
                            return await fetch(currentrooturl + 'm/uploadthumbnail', {
                                method: "POST",
                                credentials: corsdefault,
                                body: formData
                            })
                            .then((response) => {
                                return response.json();
                            })
                            .then((result) => {
                                console.log(result);
                                let authenticated = this.props.checkAndConfirmAuthentication(result);
                                if (authenticated) {
                                    if (result.avatarurl) {
                                        this.setState({ avatarurl: result.avatarurl });
                                    }
                                }
                                this.setState({ uploadavatarbusy: false });
                            })
                            .catch((err) => {
                                this.setState({ uploadavatarbusy: false });
                            })
                        } else {
                            this.setState({ uploadavatarbusy: false });
                        }
                    } else {
                        this.setState({ uploadavatarbusy: false });
                    }
                } else {
                    this.setState({ uploadavatarbusy: false });
                }
            } catch (err) {
                this.setState({ uploadavatarbusy: true });
            }
        }
    }
    
    opencc = (e) => {
        if (this.state.client_secret == null) {
            this.getClientSecret();
        }
        if (this.state.openportal != "cc") {
            this.setState({ openportal: "cc" });
        } else {
            this.setState({ openportal: "" });
        }
    }

    openShipping = (e) => {
        if (this.state.openportal != "shipping") {
            this.setState({ openportal: "shipping" });
        } else {
            this.setState({ openportal: "" });
        }
    }

    openShopPayment = (e) => {
        if (this.state.openportal != "shop") {
            this.setState({ openportal: "shop" });
        } else {
            this.setState({ openportal: "" });
        }
    }
    
    handleSaveBillingInfo = async (e, elements, stripe) => {
        e.preventDefault();
        try {
            if (!this.state.ccbusy && this.state.client_secret) {
                this.setState({ ccbusy: true });
                if (!stripe || !elements || !get(this, 'cc_name.current.value')) {
                    // Stripe.js has not loaded yet. Make sure to disable
                    // form submission until Stripe.js has loaded.
                    this.setState({ ccbusy: false });
                    return;
                }
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                const fullname = this.cc_name.current.value;
                const result = await stripe.confirmCardSetup(this.state.client_secret, {
                    payment_method: {
                        card: elements.getElement(CardElement),
                        billing_details: {
                            name: fullname
                        }
                    }
                });
                if (result.error) {
                    this.setState({ ccbusy: false });
                } else {
                    let payment_id = result.setupIntent.payment_method;
                    let cus_id = this.state.payment_customer;
                    return await fetch(currentrooturl + 'm/associatecardwithcustomer', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            username, hash, self, payment_id, cus_id
                        })                        
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((result) => {
                        this.setState({ last4: 'Card has been updated' });
                        this.setState({ ccbusy: false });
                    })
                    .catch((err) => {
                        console.log(err);
                        this.setState({ ccbusy: false });
                    })
                }
            } else {
                this.setState({ ccbusy: false });
            }
        } catch (err) {
            this.setState({ ccbusy: false });
        }
    };

    resolveCard = () => {
        if (this.state.network == 'amex') {
            return amex;
        } else if (this.state.network == 'mastercard') {
            return mastercard;
        } else {
            return visa;
        }
    }

    /**
     * Iterate through shipping data on page to ensure valid shipping info
     * @param {*} e 
     */
    saveShippingAddressPre = (e) => {
        try {
            this.setState({ shippingError: "", shippingSuccess: ""  });
            let shippingData = {
                country: "",
                fullName: "",
                email: "",
                address: "",
                city: "",
                state: "",
                zip: ""
            }
            // Validates a reference for a property in shipping data
            let resolveGeneric = (ref, type = "") => {
                try {
                    if (!type) {
                        if (this[ref].current) {
                            if (this[ref].current.value) {
                                if (this[ref].current.value.length > 0) {
                                    return this[ref].current.value;
                                }
                            }
                        }
                    } else {
                        if (this[ref].current.select.getValue()[0].label) { // For countries
                            return this[ref].current.select.getValue()[0].label;
                        }
                    }
                    return false;
                } catch (err) {
                    return false;
                }
            }
            let updateData = (key, ref, error, type = "") => {
                if (resolveGeneric(ref, type)) {
                    shippingData[key] = resolveGeneric(ref, type);
                    return true;
                } else {
                    this.setState({ shippingError: error });
                    return false;
                }
            }
            updateData("country", "countryDestinationShippingSelectRef", "Please select a country", "country");
            updateData("zip", "shippingZipRef", "Please enter a valid ZIP/Postal Code");
            updateData("state", "shippingStateRef", "Please enter a state/province to ship to");
            updateData("city", "shippingCityRef", "Please enter a valid city for shipping");
            updateData("address", "shippingAddressRef", "Please enter valid shipping address");
            updateData("email", "shippingEmailRef", "Please enter valid email address for shipping");
            updateData("fullName", "shippingFullNameRef", "Please enter a full name for shipping");
            // Check all data members to see if they exist
            for (const [key, value] of Object.entries(shippingData)) {
                if (!`${value}`) {
                    return false;
                }
            }
            this.saveShippingAddress(shippingData);
        } catch (err) {
            return false;
        }
    }

    /**
     * Will save single shipping data info object to user record
     * @param {Object} shippingData 
     */
    saveShippingAddress(shippingData) {
        let username = cookies.get('loggedIn');
        let hash = cookies.get('hash');
        let self = true;
        if (username && hash && shippingData) {
            fetch(currentshopurl + "s/saveshippingdataonuser", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self, shippingData
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                if (result.data && result.querystatus) {
                    this.setState({ shippingSuccess: result.querystatus });
                    this.props.getfriends(); // Refresh and get new shipping data
                } else if (result.error) {
                    this.setState({ shippingError: result.error });
                }
            })
            .catch((err) => {
                return false;
            })
        }
    }

    fetchShippingData() {
        try {
            let username = cookies.get('loggedIn');
            let hash = cookies.get('hash');
            let self = true;
            if (username && hash) {
                fetch(currentshopurl + "s/fetchusershippingdata", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        username, hash, self
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    console.log(result);
                    if (result.data) {
                        let checkPropertyAndAppend = (ref, key, data) => {
                            if (data.hasOwnProperty(key)) {
                                this[ref].current.value = data[key];
                            }
                        }
                        checkPropertyAndAppend("shippingFullNameRef", "fullName", result.data);
                        checkPropertyAndAppend("shippingEmailRef", "email", result.data);
                        checkPropertyAndAppend("shippingAddressRef", "address", result.data);
                        checkPropertyAndAppend("shippingCityRef", "city", result.data);
                        checkPropertyAndAppend("shippingStateRef", "state", result.data);
                        checkPropertyAndAppend("shippingZipRef", "zip", result.data);
                        let matchCountrySelect = this.countryDestinationShippingSelectRef.current.select.props.options.filter(option => option.label == result.data.country);
                        this.countryDestinationShippingSelectRef.current.select.setValue(matchCountrySelect);
                    }
                })
            }
        } catch (err) {
            console.log(err);
            // Fail silently
        }
    }

    updateDraggableConvo = (e) => {
        if (e.target.checked) {
            cookies.set('dragDisabled', true);
            this.dragDisabledOptionRef.current.checked = true;
        } else {
            cookies.set('dragDisabled', false);
            this.dragDisabledOptionRef.current.checked = false;
        }
        this.props.checkDragDisabled();
    }
    
    render() {
        return (
            <div>
                <div className="page-header-text">Options</div>
                <div className="options-thumbnail-form">
                    <h3 className="prompt-basic background-color-header">Profile Photo</h3>
                    <div className="options-avatar-container">
                        <img className="avatar" src={this.props.cloud + "/av/" + this.state.avatarurl}></img>
                    </div>
                    <input className="thumbnail-upload-choose-file" ref={this.upload} type="file" name="thumbnailToUpload" id="thumbnailToUpload" size="1" />
                    <div className={this.state.uploadavatarbusy ? "thumbnail-upload-container thumbnail-upload-busy" : "thumbnail-upload-container"}>
                        <button className="btn upload-button thumbnail-upload-button" onClick={(e) => {this.uploadThumbnailS3(e)}}>Change Profile Picture</button>
                    </div>
                </div>
                <div className="options-payment-gateway">
                    <h3 className="prompt-basic background-color-header">Membership &amp; Billing</h3>
                    <div className="key-and-value">
                        <div className="grey-out"><input type="checkbox" checked={this.props.dragDisabled} ref={this.dragDisabledOptionRef} onChange={(e) => {this.updateDraggableConvo(e)}}></input></div><div className="weight500 prompt-basic">Disable Draggable Conversations</div>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out">{this.state.email}</div><div className="weight500 prompt-basic">email</div>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out">********</div><button className="btn upload-button">Change password</button>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out">
                            <IntlTelInput
                            containerClassName="intl-tel-input"
                            inputClassName="form-control"
                            fieldName="intl-input"
                            ref={this.phone} fieldId="phonein" name="phonein" placeholder="phone #"
                            />
                        </div><button className="btn upload-button">Change phone number</button>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out">{this.state.shippingData}</div><button className="btn upload-button" onClick={(e) => {this.openShipping(e)}}>{this.state.openportal == 'shipping' ? "Minimize shipping info" : "Manage shipping info"}</button>
                    </div>
                    <div className={this.state.openportal == 'shipping' ? 'portal portal-open' : 'portal' }>
                        <div className="shipping-destination-options-container">
                            <div className="shipping-destination-options-half">
                                <h3>Shipping</h3>
                                <div className="shipping-key-value">
                                    <label for="fname"><i class="fa fa-user"></i>Full Name:</label>
                                    <input type="text" id="fname" name="firstname" placeholder="John M. Doe" ref={this.shippingFullNameRef}></input>
                                </div>
                                <div className="shipping-key-value">
                                    <label for="email"><i class="fa fa-envelope"></i>Email:</label>
                                    <input type="text" id="email" name="email" placeholder="john@example.com" ref={this.shippingEmailRef}></input>
                                </div>
                                <div className="shipping-key-value">
                                    <label for="adr"><i class="fa fa-address-card-o"></i>Address:</label>
                                    <input type="text" id="adr" name="address" placeholder="542 W. 15th Street" ref={this.shippingAddressRef}></input>
                                </div>
                                <div className="prompt-basic grey-out max-width-350">The shipping information you put here will be used for all orders processed on © minipost</div>
                            </div>
                            <div className="shipping-destination-options-half">
                                <div className="react-select-add-country-container shipping-key-value">
                                    <label for="country">Country:</label>
                                    <Select className="react-select-container" classNamePrefix="react-select" options={this.state.countries} ref={this.countryDestinationShippingSelectRef}/>
                                </div>
                                <div className="shipping-key-value">
                                    <label for="city"><i class="fa fa-institution"></i>City:</label>
                                    <input type="text" id="city" name="city" placeholder="New York" ref={this.shippingCityRef}></input>
                                </div>
                                <div className="shipping-key-value">
                                    <label for="state">State:</label>
                                    <input type="text" id="state" name="state" placeholder="NY" ref={this.shippingStateRef}></input>
                                </div>
                                <div className="shipping-key-value">
                                    <label for="zip">Zip:</label>
                                    <input type="text" id="zip" name="zip" placeholder="10001" ref={this.shippingZipRef}></input>
                                </div>
                                <div>
                                    <button className="btn upload-button save-data-button red-btn" onClick={(e) => {this.saveShippingAddressPre(e)}}>Save Shipping Address</button>
                                </div>
                            </div>
                        </div>
                        <div className={this.state.shippingError ? "shipping-error shipping-error-active" : "shipping-error shipping-error-hidden"}>{this.state.shippingError}</div>
                        <div className={this.state.shippingSuccess ? "shipping-success shipping-success-active" : "shipping-success shipping-success-hidden"}>{this.state.shippingSuccess}</div>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out">{this.state.cclastfourdigits}</div><button onClick={(e)=> {this.opencc(e)}} className="btn upload-button">{this.state.openportal == 'cc' ? 'Minimize payment info' : 'Manage payment info'}</button>
                    </div>
                    <div className={this.state.openportal == 'cc' ? 'portal portal-open' : 'portal'}>
                        <div className="key-and-value cc-desc-and-input">
                            <div className="cc-desc grey-out"><div className="cc-desc-blurb prompt-basic">This is where you can input billing information for membership subscriptions and other © minipost services.</div><div className="margin-bottom-5 info-blurb">{ this.state.advertiser ? "Advertisers: your advertisement campaign will also use this information to fulfill payments on the 28th of every month" : "" }</div><div><img src={amex} className="cc-supported-badge"></img><img src={mastercard} className="cc-supported-badge"></img><img src={visa} className="cc-supported-badge"></img></div></div>
                            <Elements stripe={stripePromise}>
                                <ElementsConsumer>
                                    {({elements, stripe}) => (
                                        <form onSubmit={(e)=>{this.handleSaveBillingInfo(e, elements, stripe)}}>
                                            <div className="input-form-cc">
                                                <div className={this.state.last4 ? "current-cc current-cc-show grey-out" : "current-cc grey-out"}><span>{this.state.last4 ? "Card On File: " : ""}</span><img src={this.resolveCard()} className="cc-supported-badge"></img>{ this.state.last4 ? this.state.last4 == "Card has been updated" ? "" : "•••• •••• •••• " : ""}{this.state.last4}</div>
                                                <div className={this.state.last4 ? "current-cc current-cc-show info-blurb" : "current-cc info-blurb"}>{this.state.last4 ? "Update new payment info below if necessary: " : ""}</div>
                                                <CardElement
                                                    options={{
                                                        iconStyle: 'solid',
                                                        style: {
                                                            base: {
                                                                fontSize: '16px',
                                                                color: 'black',
                                                                fontWeight: 500,
                                                                '::placeholder': {
                                                                    color: 'grey',
                                                                },
                                                                fontSmoothing: 'antialiased'
                                                            },
                                                            invalid: {
                                                                color: '#9e2146',
                                                            },
                                                        },
                                                    }}
                                                />
                                                <input type="text" id="cc-name-input" ref={this.cc_name} className="fixfocuscolor cc-input-field" name="cc-name-input" placeholder={this.state.client_secret ? "Full name on card" : "Getting server data please wait.."} autocomplete="name" disabled={this.state.client_secret ? "" : "disabled"} required></input>
                                                <div className="margin-bottom-5 info-blurb">All payments and billing info are handled securely through © Stripe payment solutions</div>
                                                <div>{this.state.err}</div>
                                                <button className={ this.state.ccbusy ? "btn upload-button save-data-button save-data-button-hidden" : "btn upload-button save-data-button red-btn" } type="submit">save payment info</button>
                                            </div>
                                        </form>
                                    )}
                                </ElementsConsumer>
                            </Elements>
                        </div>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out"></div>
                        <button className="prompt-basic btn upload-button">See order history</button>
                    </div>
                    {
                        this.state.shopId ?
                            <div>
                                <div className="key-and-value margin-bottom-5">
                                    <div className="grey-out"></div>
                                    <button className="prompt-basic btn upload-button" onClick={(e)=> {this.openShopPayment(e)}}>Shop payment details</button>
                                </div>
                                <div className={this.state.openportal == 'shop' ? 'portal portal-open' : 'portal'}>
                                    <h3 className="prompt-basic background-color-header">You'll want to update the banking information for your business in order to get paid. Click the button below to set up your payment information with Stripe</h3>
                                    <a href={this.state.expressLink} class="stripe-connect"><span>Connect with</span></a>
                                </div>
                                <div className="key-and-value">
                                    <div className="grey-out"></div>
                                    <button className="prompt-basic btn upload-button" onClick={(e)=> {redirectManageShopOrders.call(this)}}>Manage shop customer orders</button>
                                </div>
                            </div>
                            : null
                    }
                </div>
            </div>
        )
    }

}
