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

import { Elements, CardElement, ElementsConsumer } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe('pk_test_JJ1eMdKN0Hp4UFJ6kWXWO4ix00jtXzq5XG');

export default class Options extends Component {
    constructor() {
        super();
        this.state = { username: "", avatarurl: '', uploadavatarbusy: false, email: '', phone: '###-###-####', cclastfourdigits: "-------------", cctype: '', openportal: '', err: "", client_secret: null }
        this.upload = React.createRef();
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
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        user
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    console.log(result);
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
        try {
            if (cookies.get('loggedIn')) {
                let user = cookies.get('loggedIn');
                return await fetch(currentrooturl + 'm/getclientsecret', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        user
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        this.setState({ client_secret: result });
                    }
                })
            }
        } catch (err) {
            // Component was unmounted
            return false;
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
    
    handleSaveBillingInfo = (e, elements, stripe) => {
        e.preventDefault();
        console.log(elements, stripe);
        if (!stripe || !elements) {
            // Stripe.js has not loaded yet. Make sure to disable
            // form submission until Stripe.js has loaded.
            return;
        }

        console.log('save billing info');
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
                        <div className="grey-out">{this.state.cclastfourdigits}</div><button onClick={(e)=> {this.opencc(e)}} className="btn upload-button">Manage payment info</button>
                    </div>
                    <div className={this.state.openportal == 'cc' ? 'portal portal-open' : 'portal'}>
                        <div className="key-and-value cc-desc-and-input">
                            <div className="prompt-basic cc-desc grey-out"><div className="cc-desc-blurb">This is where you can input billing information for membership subscriptions. Advertisers: your advertisement campaign will also use this information to fulfill payments on the 28th of every month</div><div><img src={amex} className="cc-supported-badge"></img><img src={mastercard} className="cc-supported-badge"></img><img src={visa} className="cc-supported-badge"></img></div></div>
                            <Elements stripe={stripePromise}>
                                <ElementsConsumer>
                                    {({elements, stripe}) => (
                                        <form onSubmit={(e)=>{this.handleSaveBillingInfo(e, elements, stripe)}}>
                                            <div className="input-form-cc">
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
                                                <div className="margin-bottom-5 info-blurb">All payments and billing info are handled securely through © Stripe payment solutions</div>
                                                <div>{this.state.err}</div>
                                                <button className="btn upload-button save-data-button" type="submit">save payment info</button>
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
