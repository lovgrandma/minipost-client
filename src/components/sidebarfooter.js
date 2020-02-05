import React, { Component } from 'react';

// Login & register if { user: logged out }
export default class sidebarfooter extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    render() {
        return (
                <div className={this.props.username ? "sidebarfooter-loggedin" : "sidebarfooter"}>
                    <div className="sidebarfooter-list">
                        <div className="footeritem sidebarfooter"><a href="#">About</a></div>
                        <div className="footeritem sidebarfooter-advertise"><a href="#">Advertise</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Copyright</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Privacy</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Guidelines</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Feedback</a></div>
                        <div className="footeritem sidebarfooter"><a href="#">Survey</a></div>
                    </div>
                    <div className="copyright-minireel">©2020 minireel</div>
                </div>
        )
    }
}
