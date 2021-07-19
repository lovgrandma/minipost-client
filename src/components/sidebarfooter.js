import React, { Component } from 'react';
import minipostLogoNoText9a9a9a from '../static/minipostAppLogoNoText-Plain9a9a9a-thinBorder.svg';
import {
    Link
} from 'react-router-dom';

// Login & register if { user: logged out }
export default class sidebarfooter extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render() {
        let logoutDiv;
        if (this.props.username) {
            logoutDiv = <div className="footeritem sidebarfooter"><a href="/" onClick={this.props.logout}>Logout</a></div>
        } else {
            logoutDiv = null
        }
        return (
                <div className={this.props.username ? "sidebarfooter-loggedin" : "sidebarfooter"}>
                    <div className="sidebarfooter-list">
                        <div className="footeritem sidebarfooter"><Link to={{ pathname: `about`}}>About</Link></div>
                        <div className="footeritem sidebarfooter-advertise"><a href="#">Advertise</a></div>
                        <div className="footeritem sidebar-footer"><Link to={{ pathname: `vendorapplication` }}>Vendor</Link></div>
                        <div className="footeritem sidebarfooter"><a href="#">Copyright</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Privacy</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Guidelines</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Feedback</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Survey</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Help</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Contact us</a></div>
                        {logoutDiv}
                    </div>
                    <div className="minipost-footer-brand"><div className="copyright-minipost">©2020 minipost</div><img className="minipost-footer-logo" src={minipostLogoNoText9a9a9a} alt="Minireel" draggable="false"></img></div>
                </div>
        )
    }
}
