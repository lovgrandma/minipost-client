import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import Sidebarfooter from './sidebarfooter.js';
import minipostLogo from '../static/minipostLogoText.svg'; import minipostLogoNoText from '../static/minipostLogoNoText.svg';
import minipostAppLogoNoText from '../static/minipostAppLogo2NoText.svg';
const reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const rePass = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,56}$/;
const reUsername = /^[a-z0-9.]{5,22}$/;
const cookies = new Cookies();
// Login & register if { user: logged out }
export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = { welcome: 'Welcome to minireel', message: "Watch videos with friends Speak your mind Enjoy original content",
                     username: "", password: "" }
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

        let username = this.refs.username.value;
        let email = this.refs.regemail.value;
        let password = this.refs.regpw.value;
        let confirmpassword = this.refs.regpw2.value;
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
                <form className="registerform" onSubmit={this.props.fetchregister} noValidate="novalidate">
                    <div className="form-group">
                        <input className="form-control" ref='username' id="username" type="text" name="username" placeholder="username"></input>
                        <div id='registerusernameerrorcontainer'><div className='form-error faulty-username' style={{display: 'none'}}>username must be between 5 and 22 characters. may contain periods</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='regemail' id="regemail" type="email" name="regemail" placeholder="email"></input>
                        <div id='registeremailerrorcontainer'><div className='form-error faulty-email-register' style={{display: 'none'}}>please enter a valid email</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='regpw' id="regpw" type="password" name="regpassword" placeholder="password"></input>
                        <div id='registerpwerrorcontainer'><div className='form-error faulty-pass-register' style={{display: 'none'}}>password must be between 8-56 characters, have 1 uppercase, 1 lowercase and a number</div></div>
                    </div>
                    <div className="form-group">
                        <input className="form-control" ref='regpw2' id="regpw2" type="password" name="confirmPassword" placeholder="password"></input>
                        <div id='registerconfirmpwerrorcontainer'><div className='form-error faulty-confirmpass-register' style={{display: 'none'}}>passwords are not the same</div></div>
                    </div>
                    <button className="btn btn-primary registerbtn" type="submit" onClick={this.submitRegister}>sign up</button>
                    { this.props.registererror ?
                        this.props.registererror.type == "register error" ? <div className="loginerror">{this.props.registererror.error}</div>
                        : <div></div>
                    : <div></div>
                    }
                </form>
                <Sidebarfooter />
            </div>
        );
    };
};
