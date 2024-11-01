import React, { Component } from 'react';
import currentrooturl from '../url';
import corsdefault from '../cors.js';
const rePass = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z\-~`!@#$%^&*()\+_=|\]\[{}:;'"\/><,.*]{8,56}$/; // More accepting 

export default class ResetPass extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: ""
        }
        this.pass = React.createRef();
        this.passConfirm = React.createRef();
        this.email = React.createRef();
    }
    
    submitConfirmPassReset = (e) => {
        e.preventDefault();
        let checkPass = false;
        let checkPassConfirm = false;
        let checkPassMatch = false;
        let goodPass = false;
        let goodEmail = false;
        
        if (this.pass) {
            if (this.pass.current) {
                if (this.pass.current.value) {
                    checkPass = true;
                } else {
                    this.setState({ err: "Please enter your password"});
                    return;
                }
            }
        }
        
        if (this.passConfirm) {
            if (this.passConfirm.current) {
                if (this.passConfirm.current.value) {
                    checkPassConfirm = true;
                    if (rePass.test(this.passConfirm.current.value)) {
                        goodPass = true;
                    } else {
                        this.setState({ err: "Please enter a stronger password"});
                        return;
                    }
                    if (this.pass.current.value == this.passConfirm.current.value) {
                        checkPassMatch = this.pass.current.value;
                    } else {
                        this.setState({ err: "Passwords must match"});
                        return;
                    }
                } else {
                    this.setState({ err: "Please enter your password again"});
                    return;
                }
            }
        }
        if (this.email) {
            if (this.email.current) {
                if (this.email.current.value) {
                    goodEmail = true;
                }
            }
        }
        if (checkPass && checkPassConfirm && checkPassMatch && goodPass && goodEmail) {
            let newPass = this.pass.current.value;
            let data = window.location.href;
            let email = this.email.current.value;
            fetch(currentrooturl + 'm/submitconfirmpassreset', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    newPass, email, data
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then((data) => {
                if (data) {
                    this.setState({ status: "Your password should be reset. Sign in on the social portal" });
                } else {
                    this.setState({ status: "We're sorry but password reset was unsuccessful. Please retry" });
                }
            })
        }
    }
    
    render() {
        return (
            <div>
                <div className="page-header-text">Reset password</div>
                <div className="form-group reset-password-container">
                    <form className="reset-password-center" novalidate>
                        <div className="form-group">
                            <input className="form-control" ref={this.email} id="pw" type="email" name="email" placeholder="email"></input>
                        </div>
                        <p className="prompt-basic">Type in your new password below.</p>
                        <div className="form-group">
                            <input className="form-control" ref={this.pass} id="pw" type="password" name="password" placeholder="password"></input>
                        </div>
                        <div className="form-group">
                            <input className="form-control" ref={this.passConfirm} id="pw" type="password" name="password" placeholder="confirm password"></input>
                        </div>
                        <button className="btn loginbtn resetpass" type="submit" onClick={(e) => {this.submitConfirmPassReset(e)}}>reset password</button>
                        { 
                            this.state.status ? 
                                <div className="resetpassstatus">{this.state.status}</div>
                                : <div></div>
                        }
                    </form>
                </div>
            </div>
        )
    }
}