import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import Sidebarfooter from './sidebarfooter.js';
import minipostLogo from '../static/minipostLogoText.svg'; import minipostLogoNoText from '../static/minipostLogoNoText.svg';
import minipostAppLogoNoText from '../static/minipostAppLogo2NoText.svg';
import IntlTelInput from 'react-intl-tel-input';
import 'react-intl-tel-input/dist/main.css';

const reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const rePass = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z\-~`!@#$%^&*()\+_=|\]\[{}:;'"\/><,.*]{8,56}$/; // More accepting 0-9a-zA-Z\-~`!@#$%^&*()\+_=|\]\[{}:;'"\/><,.*
// Old pass regex /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,56}$/;
const reUsername = /^[a-z0-9.]{5,22}$/;
const cookies = new Cookies();
// Login & register if { user: logged out }
export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = { welcome: 'Welcome to minireel', message: "Watch videos with friends Speak your mind Enjoy original content", username: "", password: "", verificationIn: false }
        this.phone = React.createRef();
        this.verify = React.createRef();
        this.phoneVerify = React.createRef();
        this.emailVerify = React.createRef();
        this.countryCodePrompt = React.createRef();
    }

    componentDidMount() {
        if (!cookies.get('welcome')) { // Welcome on first website load
            document.querySelector(".register-text").classList.add("register-text-invis");
            setTimeout(() => {
                document.querySelector(".register-text").classList.add("register-text-transition", "text-fadein");
                cookies.set('welcome', 'true', { path: '/', sameSite: true, signed: true });
            }, 200);
        } else {
            document.querySelector(".register-text").classList.add("register-text-stale", "text-fadein");
        }
    }

    hide() {
        return false;
    }

    submitLogin = (e) => {
        function emailvalidation(email) {
            let emailworks = false;
            //check for proper email
            if (reEmail.test(email) === true) {
                emailworks = true;
            } else {
                emailworks = false;
            }
            return emailworks;
        }

        function passwordvalidation(password) {
            let passwordworks = false;
            //check for password over 8 character and less than 56. a-z, A-Z, One uppercase, one number.
            if(rePass.test(password) === true) {
               passwordworks = true;
            } else {
               passwordworks = false;
            }
            return passwordworks;
        }

        let email = this.refs.email.value;
        let password = this.refs.pass.value;
        let goodemail = emailvalidation(email);
        let goodpass = passwordvalidation(password);

        if (!goodemail) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-email')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-email')[0]).style.display = 'none';
        }

        if (!goodpass) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-pass')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-pass')[0]).style.display = 'none';
        }
        // this.props.fetchlogin();
    }

    submitRegister = (e) => {

        function emailvalidation(email) {
            let emailworks = false;
            //check for proper email
            if (reEmail.test(email) === true) {
                emailworks = true;
            } else {
                emailworks = false;
            }
            return emailworks;
        }

        function usernamevalidation(username) {
            let usernameworks = false;
            //check for proper username
            if(reUsername.test(username) === true) {
               usernameworks = true;
            } else {
               usernameworks = false;
            }
            return usernameworks;
        }

        function passwordvalidation(password) {
            let passwordworks = false;
            //check for password over 8 character and less than 56. a-z, A-Z, One uppercase, one number.
            if(rePass.test(password) === true) {
               passwordworks = true;
            } else {
               passwordworks = false;
            }
            return passwordworks;
        }

        function passwordconfirm(password, confirmpassword) {
            let passwordequality = false;
            //check if passwords are the same
            if(password === confirmpassword) {
                passwordequality = true;
            } else {
                passwordequality = false;
            }
            return passwordequality;
        }
        
        const phoneconfirm = () => {
            if (this.phone && document.getElementById('phonein')) {
                if (this.phone.current && document.getElementById('phonein').value) {
                    let number = this.phone.current.getNumber(document.getElementById('phonein').value,intlTelInputUtils.numberFormat.E164);
                    if (number.charAt(0) != '+') {
                        return false;
                    }
                    return true;
                }
            }
            return false;
        }

        let username = this.refs.username.value;
        let email = this.refs.regemail.value;
        let password = this.refs.regpw.value;
        let confirmpassword = this.refs.regpw2.value;
        let gooduser = usernamevalidation(username);
        let goodemail = emailvalidation(email);
        let goodpassreg = passwordvalidation(password);
        let goodpassconfirm = passwordconfirm(password, confirmpassword);
        let goodphone = phoneconfirm();

        if (!gooduser) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-username')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-username')[0]).style.display = 'none';
        }

        if (!goodemail) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-email-register')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-email-register')[0]).style.display = 'none';
        }

        if (!goodpassreg) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-pass-register')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-pass-register')[0]).style.display = 'none';
        }

        if (!goodpassconfirm) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-confirmpass-register')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-confirmpass-register')[0]).style.display = 'none';
        }
        
        if (!goodphone) {
            e.preventDefault();
            (document.getElementsByClassName('faulty-phone-register')[0]).style.display = 'block';
        } else {
            (document.getElementsByClassName('faulty-phone-register')[0]).style.display = 'none';
        }
    }
    
    openVerification = (e) => {
        if (!this.state.verificationIn) {
            this.setState({ verificationIn: true });
        } else {
            this.setState({ verificationIn: false });
        }
    }
    
    submitVerify = (e) => {
        let goodVerify = false;
        let goodPhoneVerify = false;
        let goodEmailVerify = false;
        if (this.verify) {
            if (this.verify.current) {
                if (this.verify.current.value) {
                    goodVerify = true;
                }
            }
        }
        
        if (this.phoneVerify && document.getElementById('phoneverify')) {
            if (this.phoneVerify.current && document.getElementById('phoneverify').value) {
                let number = this.phoneVerify.current.getNumber(document.getElementById('phoneverify').value,intlTelInputUtils.numberFormat.E164);
                if (number.charAt(0) != '+') {
                    return false;
                }
                return true;
            }
        }
        if (this.phoneVerify) {
            if (this.phoneVerify.current) {
                if (this.phoneVerify.current.value) {
                    goodPhoneVerify = true;
                }
            }
        }
        
        if (this.emailVerify) {
            if (this.emailVerify.current) {
                if (this.emailVerify.current.value) {
                    goodEmailVerify = true;
                }
            }
        }
        
        if (!goodEmailVerify) {
            e.preventDefault();
            document.getElementsByClassName('faulty-email-verification')[0].style.display = 'block';
        } else {
            document.getElementsByClassName('faulty-email-verification')[0].style.display = 'none';
        }
        
        if (!goodPhoneVerify) {
            e.preventDefault();
            document.getElementsByClassName('faulty-phone-verification')[0].style.display = 'block';
        } else {
            document.getElementsByClassName('faulty-phone-verification')[0].style.display = 'none';
        }
        
        if (!goodVerify) {
            e.preventDefault();
            document.getElementsByClassName('faulty-verification')[0].style.display = 'block';
        } else {
            document.getElementsByClassName('faulty-verification')[0].style.display = 'none';
        }
    }
   
    render() {
        return (
            <div>
                <div className="minireel-logo-center">
                    <img className="minipost-register-logo-notext" src={minipostAppLogoNoText} alt="Minireel" draggable="false"></img>
                    <div className="millerbolditalic logo-nav-font-dash">minipost</div>
                    <p className="register-text">Watch together</p>
                </div>
                <form className="loginform" refs='loginform' onSubmit={this.props.fetchlogin} noValidate="novalidate">
                    <div className="form-group">
                        <input className="form-control" ref='email' id="email" type="email" name="email" placeholder="email"></input>
                        <div id='loginerrorcontainer'><div className='form-error faulty-email' style={{display: 'none'}}>please enter a valid email</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='pass' id="pw" type="password" name="password" placeholder="password"></input>
                        <div id='passerrorcontainer'><div className='form-error faulty-pass' style={{display: 'none'}}>password must be between 8-56 characters, have 1 uppercase, 1 lowercase and a number</div></div>
                    </div>
                    <button className="btn btn-primary loginbtn" type="submit" onClick={this.submitLogin}>login</button>
                    { this.props.loginerror ?
                        this.props.loginerror.type == "login error" ? <div className="loginerror">{this.props.loginerror.error}</div>
                        : <div></div>
                    : <div></div>
                    }
                </form>
                <form className="registerform" onSubmit={(e) => {this.props.fetchregister(e, this.phone)}} noValidate="novalidate">
                    <div className="form-group">
                        <input className="form-control" ref='username' id="username" type="text" name="username" placeholder="username"></input>
                        <div id='registerusernameerrorcontainer'><div className='form-error faulty-username' style={{display: 'none'}}>username must be between 5 and 22 characters. may contain periods</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='regemail' id="regemail" type="email" name="regemail" placeholder="email"></input>
                        <div id='registeremailerrorcontainer'><div className='form-error faulty-email-register' style={{display: 'none'}}>please enter a valid email</div></div>
                    </div>
                    <div className="form-group">
                        <IntlTelInput
                        containerClassName="intl-tel-input"
                        inputClassName="form-control"
                        fieldName="intl-input"
                        ref={this.phone} fieldId="phonein" name="phonein" placeholder="phone #"
                        />
                        <div id='registerconfirmpwerrorcontainer'><div className='form-error faulty-phone-register' style={{display: 'none'}}>registration requires a valid phone number. Please make sure to select your country</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='regpw' id="regpw" type="password" name="regpassword" placeholder="password"></input>
                        <div id='registerpwerrorcontainer'><div className='form-error faulty-pass-register' style={{display: 'none'}}>password must be between 8-56 characters, have 1 uppercase, 1 lowercase and a number</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='regpw2' id="regpw2" type="password" name="confirmPassword" placeholder="confirm password"></input>
                        <div id='registerconfirmpwerrorcontainer'><div className='form-error faulty-confirmpass-register' style={{display: 'none'}}>passwords are not the same</div></div>
                    </div>
                    <button className="btn btn-primary registerbtn" type="submit" onClick={this.submitRegister}>sign up</button>
                    { 
                        this.props.registererror ?
                            this.props.registererror.type == "register error" ? 
                                <div className="loginerror">{this.props.registererror.error}</div>
                            : <div></div>
                        : <div></div>
                    }
                    {
                        this.props.verifyinfo ? 
                            <div className="info-blurb-3">{this.props.verifyinfo}</div> : null
                    }
                </form>
                <div className="info-blurb-2 verifyform select" onClick={(e) => {this.openVerification(e)}}>I already registered. I need to verify my account</div>
                <form className={this.state.verificationIn ? "registerform verification-height" : "registerform verification-height verification-height-zero"} onSubmit={(e) => {this.props.fetchVerify(e, this.verify, this.phoneVerify, this.emailVerify)}} noValidate="novalidate">
                    <div className="form-group">
                        <input className="form-control" ref={this.emailVerify} id="emailverify" type="text" name="emailverify" placeholder="email"></input>
                        <div id='registerusernameerrorcontainer'><div className='form-error faulty-email-verification' style={{display: 'none'}}>you must enter your email. We do this so that even if someone maliciously uses your phone number you can still activate your account with your email</div></div>
                    </div>
                    <div className="form-group">
                        <IntlTelInput
                        containerClassName="intl-tel-input"
                        inputClassName="form-control"
                        fieldName="intl-input-verify"
                        ref={this.phoneVerify} fieldId="phoneverify" name="phoneinverify" placeholder="phone #"
                        />
                        <div id='registerusernameerrorcontainer'>
                            <div className='form-error faulty-phone-verification' style={{display: 'none'}}>you need to input your phone number</div>
                        </div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref={this.verify} id="verify" type="text" name="verify" placeholder="verification #"></input>
                        <div id='registerusernameerrorcontainer'>
                            <div className='form-error faulty-verification' style={{display: 'none'}}>you need to input a verification code</div>
                        </div>
                    </div>
                    <button className="btn btn-primary registerbtn" type="submit" onClick={this.submitVerify}>verify</button>
                    { 
                        this.props.verifyerror ?
                            <div className="loginerror">{this.props.verifyerror.error}</div>
                        : <div></div>
                    }
                </form>
                <Sidebarfooter />
            </div>
        );
    };
};
