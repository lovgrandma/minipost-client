import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import Sidebarfooter from './sidebarfooter.js';
import minipostAppLogoNoText from '../static/MinipostLogo2021-Q1-smaller.svg';

const reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const rePass = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z\-~`!@#$%^&*()\+_=|\]\[{}:;'"\/><,.*]{8,56}$/; // More accepting 0-9a-zA-Z\-~`!@#$%^&*()\+_=|\]\[{}:;'"\/><,.*
// Old pass regex /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,56}$/;
const reUsername = /^[a-z0-9.]{5,22}$/;
const cookies = new Cookies();
// Login & register if { user: logged out }
export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = { welcome: 'Welcome to minireel', message: "Watch videos with friends Speak your mind Enjoy original content", username: "", password: "", verificationIn: false, overlay: false }
        this.verify = React.createRef();
        this.emailVerify = React.createRef();
        this.usernameVerify = React.createRef();
        this.resetPassEmail = React.createRef();
        this.resetPassUsername = React.createRef();
        this.username = React.createRef();
        this.regemail = React.createRef();
        this.regpw = React.createRef();
        this.regpw2 = React.createRef();
        this.googleSignIn = React.createRef();
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
        this.attemptGoogleSignInBtnLoad();
    }

    attemptGoogleSignInBtnLoad() {
        try {
            if (this.googleSignIn.current) {
                google.accounts.id.renderButton(this.googleSignIn.current, {
                    theme: 'outline',
                    size: 'medium',
                    logo_alignment: 'center'
                });
            }
        } catch (err) {
            // Fail silently
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
        try {
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

            let username = this.username.current.value;
            let email = this.regemail.current.value;
            let password = this.regpw.current.value;
            let confirmpassword = this.regpw2.current.value;
            let gooduser = usernamevalidation(username);
            let goodemail = emailvalidation(email);
            let goodpassreg = passwordvalidation(password);
            let goodpassconfirm = passwordconfirm(password, confirmpassword);

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
        } catch (err) {
            this.props.setRegisterErr("The register form failed to retrieve registration inputs");
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
        let goodEmailVerify = false;
        let goodUsernameVerify = false;
        if (this.verify) {
            if (this.verify.current) {
                if (this.verify.current.value) {
                    goodVerify = true;
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

        if (this.usernameVerify) {
            if (this.usernameVerify.current) {
                if (this.usernameVerify.current.value) {
                    goodUsernameVerify = true;
                }
            }
        }
        
        if (!goodEmailVerify) {
            e.preventDefault();
            document.getElementsByClassName('faulty-email-verification')[0].style.display = 'block';
        } else {
            document.getElementsByClassName('faulty-email-verification')[0].style.display = 'none';
        }

        if (!goodUsernameVerify) {
            e.preventDefault();
            document.getElementsByClassName('faulty-username-verification')[0].style.display = 'block';
        } else {
            document.getElementsByClassName('faulty-username-verification')[0].style.display = 'none';
        }
        
        if (!goodVerify) {
            e.preventDefault();
            document.getElementsByClassName('faulty-verification')[0].style.display = 'block';
        } else {
            document.getElementsByClassName('faulty-verification')[0].style.display = 'none';
        }
    }
    
    submitResetPass = async (e) => { 
        let validEmail = false;
        let validUsername = false;
        if (this.resetPassEmail) {
            if (this.resetPassEmail.current) {
                if (this.resetPassEmail.current.value) {
                    validEmail = this.resetPassEmail.current.value;
                }
            }
        }
        if (this.resetPassUsername) {
            if (this.resetPassUsername.current) {
                if (this.resetPassUsername.current.value) {
                    validUsername = this.resetPassUsername.current.value;
                }
            }
        }
        if (validEmail && validUsername) {
            let data = await this.props.submitResetPass(e, validEmail, validUsername);
            this.setState({ resetPassUpdate: data });
        }
    }
    
    /**
    * Sets overlay for reset password and verify account functions
    *
    * @return {none} Changes state. Does not return value
    */
    setOverlay = (e) => {
        e.preventDefault();
        if (this.state.overlay) {
            this.setState({ overlay: false });
        } else {
            this.setState({ overlay: true });
        }
    }
   
    render() {
        return (
            <div>
                <div className="minipost-logo-center">
                    <img className="minipost-register-logo-notext" src={minipostAppLogoNoText} alt="Minireel" draggable="false"></img>
                    <p className="register-text">Watch together</p>
                </div>
                <div className={this.state.overlay ? "overlay resetform" : "overlay overlay-hidden resetform"}>
                    <div className="info-blurb-3-thick dark-grey">Reset your password using the form below</div>
                    <div className="form-group">
                        <input className="form-control" ref={this.resetPassEmail} id="resetpass-email" type="email" name="resetpass-email" placeholder="email"></input>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref={this.resetPassUsername} id="resetpass-username" type="text" name="resetpass-username" placeholder="reset username"></input>
                    </div>
                    {
                        this.state.resetPassUpdate ? <div className="resetpassstatus">{this.state.resetPassUpdate}</div> : <div></div>
                    }
                    {
                        this.state.resetPassUpdate != "Success! You'll get a email if you have an account with us" ? <button className="btn btn-primary reset-passbtn red-btn" type="submit" onClick={(e) => {this.submitResetPass(e)}}>reset password</button> : <div></div>
                    }
                </div>
                <form className="loginform" refs='loginform' onSubmit={this.props.fetchlogin} noValidate="novalidate">
                    <p className="weight600">Login</p>
                    <div className="form-group">
                        <input className="form-control" ref='email' id="email" type="email" name="email" placeholder="email"></input>
                        <div id='loginerrorcontainer'><div className='form-error faulty-email' style={{display: 'none'}}>please enter a valid email</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='pass' id="pw" type="password" name="password" placeholder="password"></input>
                        <div id='passerrorcontainer'><div className='form-error faulty-pass' style={{display: 'none'}}>password must be between 8-56 characters, have 1 uppercase, 1 lowercase and a number</div></div>
                        <a onClick={(e)=>{this.setOverlay(e)}} href="#" className="info-blurb-3">{this.state.overlay ? "Remembered your password?" : "Forgot your password?" }</a>
                    </div>
                    <button className="btn btn-primary loginbtn red-btn" type="submit" onClick={this.submitLogin}>login</button>
                    { this.props.loginerror ?
                        this.props.loginerror.type == "login error" ? <div className="loginerror">{this.props.loginerror.error}</div>
                        : <div></div>
                    : <div></div>
                    }
                </form>
                <div className="third-party-sign-in bottom-thin-dotted">
                    <div className="google-sign-in-btn-container">
                        <div className="g_id_signin google-sign-in-btn" ref={this.googleSignIn} data-size="medium" data-logo_alignment="center" data-theme="outline"></div>
                    </div>
                </div>
                <form className="registerform" onSubmit={(e) => {this.props.fetchregister(e)}} noValidate="novalidate">
                    <p className="weight600">Register</p>
                    <div className="form-group">
                        <input className="form-control" ref={this.username} id="username" type="text" name="username" placeholder="username"></input>
                        <div id='registerusernameerrorcontainer'><div className='form-error faulty-username' style={{display: 'none'}}>username must be between 5 and 22 characters. may contain periods</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref={this.regemail} id="regemail" type="email" name="regemail" placeholder="email"></input>
                        <div id='registeremailerrorcontainer'><div className='form-error faulty-email-register' style={{display: 'none'}}>please enter a valid email</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref={this.regpw} id="regpw" type="password" name="regpassword" placeholder="password"></input>
                        <div id='registerpwerrorcontainer'><div className='form-error faulty-pass-register' style={{display: 'none'}}>password must be between 8-56 characters, have 1 uppercase, 1 lowercase and a number</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref={this.regpw2} id="regpw2" type="password" name="confirmPassword" placeholder="confirm password"></input>
                        <div id='registerconfirmpwerrorcontainer'><div className='form-error faulty-confirmpass-register' style={{display: 'none'}}>passwords are not the same</div></div>
                    </div>
                    <button className="btn btn-primary registerbtn red-btn" type="submit" onClick={this.submitRegister}>sign up</button>
                    { 
                        this.props.registererror ?
                            this.props.registererror.type == "register error" ? 
                                <div className="loginerror">{this.props.registererror.error}</div>
                            : <div></div>
                        : <div></div>
                    }
                    {
                        this.props.verifyinfo ? 
                            <div className="info-blurb-3-thick">{this.props.verifyinfo}</div> : null
                    }
                </form>
                <div className="info-blurb-2 verifyform select" onClick={(e) => {this.openVerification(e)}}>I already registered. I need to verify my account</div>
                <form className={this.state.verificationIn ? "registerform verification-height" : "registerform verification-height verification-height-zero"} onSubmit={(e) => {this.props.fetchVerify(e, this.verify, this.emailVerify, this.usernameVerify)}} noValidate="novalidate">
                    <div className="form-group">
                        <input className="form-control" ref={this.emailVerify} id="emailverify" type="text" name="emailverify" placeholder="email"></input>
                        <div id='registerusernameerrorcontainer'>
                            <div className='form-error faulty-email-verification' style={{display: 'none'}}>you must enter your email.</div>
                        </div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref={this.usernameVerify} id="usernameverify" type="text" name="usernameverify" placeholder="username"></input>
                        <div id='registerusernameerrorcontainer'>
                            <div className='form-error faulty-username-verification' style={{display: 'none'}}>you must enter your username.</div>
                        </div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref={this.verify} id="verify" type="text" name="verify" placeholder="verification #"></input>
                        <div id='registerusernameerrorcontainer'>
                            <div className='form-error faulty-verification' style={{display: 'none'}}>you need to input a verification code</div>
                        </div>
                    </div>
                    <button className="btn btn-primary registerbtn red-btn" type="submit" onClick={this.submitVerify}>verify</button>
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
