import React, {Component} from 'react';
import ReactDom from 'react-dom';
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
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import Videos from './videos.js';
import ArticlePreview from './articlepreview.js';
import currentrooturl from '../url';
import dummythumbnail from '../static/greythumb.jpg';
import { cookies } from '../App.js';
import { get, setData } from '../methods/utility.js';
import keys from '../keys/stripecred.js';
import amex from '../static/cc/amex.svg'; import mastercard from '../static/cc/mastercard.svg'; import visa from '../static/cc/visa.svg'; 
import corsdefault from '../cors.js';

import { Elements, CardElement, ElementsConsumer } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(keys.livekey);

export default class Options extends Component {
    constructor() {
        super();
        this.state = { username: "", avatarurl: '', uploadavatarbusy: false, ccbusy: false, email: '', phone: '###-###-####', cclastfourdigits: "-------------", cctype: '', openportal: '', err: "", client_secret: null }
        this.upload = React.createRef();
        this.cc_name = React.createRef();
    }

    componentDidMount = async () => {
        try {
            this.fetchProfileOptionsData();
            this.setState({ uploadavatarbusy: false });
        } catch (err) {
            // Component unmounted
        }
    }
    
    // Fetch profile data, always match by user name instead of id. Username more readily available
    fetchProfileOptionsData = async () => {
        try {
            if (cookies.get('loggedIn')) {
                let user = cookies.get('loggedIn');
                return await fetch(currentrooturl + 'm/fetchprofileoptionsdata', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        user
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        if (result.avatarurl) {
                            this.setState({ avatarurl: result.avatarurl });
                        }
                        if (result.email) {
                            this.setState({ email: result.email });
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
                    let user = cookies.get('loggedIn');
                    return await fetch(currentrooturl + 'm/getclientsecret', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            user
                        })
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((result) => {
                        if (result) {
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
                    })
                }
            } catch (err) {
                // Component was unmounted
                return false;
            }
        }
    }
    
    uploadThumbnailS3 = async () => {
        if (this.state.uploadavatarbusy == false) {
            try {
                this.setState({ uploadavatarbusy: true });
                if (this.upload.current.files[0]) {
                    let file = this.upload.current.files[0];
                    if (file.type == "image/png" || file.type == "image/jpeg" || file.type == "image/jpg" && cookies.get('loggedIn')) {
                        if (file.name.match(/\.([a-zA-Z0-9]*)$/)) {
                            let formData = new FormData();
                            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1];
                            let user = cookies.get('loggedIn');
                            formData.append('extension', extension);
                            formData.append('thumbnail', file);
                            formData.append('user', user);
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
                                if (result.avatarurl) {
                                    this.setState({ avatarurl: result.avatarurl });
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
    
    opencc = () => {
        if (this.state.client_secret == null) {
            this.getClientSecret();
        }
        if (this.state.openportal != "cc") {
            this.setState({ openportal: "cc" });
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

                const fullname = this.cc_name.current.value
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
                    console.log(result);
                } else {
                    console.log(result);
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
                                payment_id, cus_id
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
                    <h3 className="prompt-basic background-color-header">Membership & Billing</h3>
                    <div className="key-and-value">
                        <div className="grey-out">{this.state.email}</div><div>email</div>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out">********</div><button className="btn upload-button">Change password</button>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out">{this.state.phone}</div><button className="btn upload-button">Change phone number</button>
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
                                                <button className={ this.state.ccbusy ? "btn upload-button save-data-button save-data-button-hidden" : "btn upload-button save-data-button" } type="submit">save payment info</button>
                                            </div>
                                        </form>
                                    )}
                                </ElementsConsumer>
                            </Elements>
                        </div>
                    </div>
                    <div className="key-and-value">
                        <div className="grey-out"></div><a href="#" className="prompt-basic">See payment history</a>
                    </div>
                </div>
            </div>
        )
    }

}
