import React, { Component } from 'react';
import SearchForm from './searchform.js';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import logo from '../static/minireel-dot-com-3.svg'; import heart from '../static/heart.svg'; import history from '../static/history.svg'; import notifications from '../static/notifications.svg'; import profile from '../static/profile.svg'; import upload from '../static/upload.svg';
import { showMoreOptions, hideOptions, resetOpenMenus } from '../methods/context.js';

// Nav bar with appropriate links to likes, history, minireel home, search film bar, notifications, friends & upload.
export default class Navbar extends Component {
    constructor(props) {
        super(props);
        this.navBtnsLeft = React.createRef();
        this.uploadOptions = React.createRef();
        this.userOptions = React.createRef();
    }

    ComponentDidMount() {
        this.checkSidebar();
    }

    ComponentDidUpdate() {
        this.checkSidebar();
    }

    checkSidebar() {
        if (this.props.sidebarStatus == "open") {
            this.navBtnsLeft.classList.add("navbtnsleft-opened");
        }
        if (this.props.sidebarStatus == "closed") {
            this.navBtnsLeft.classList.remove("navbtnsleft-opened");
        }
    }

    hoverShow = (e, name, enterexit) => {
        if (name == "upload") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-upl").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-upl").classList.remove("visible");
            }
        } else if (name == "profile") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-yourpro").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-yourpro").classList.remove("visible");
            }
        } else if (name == "notifications") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-notif").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-notif").classList.remove("visible");
            }
        } else if (name == "history") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-hist").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-hist").classList.remove("visible");
            }
        } else if (name == "saved") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-saved").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-saved").classList.remove("visible");
            }
        } else if (name == "config") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-conf").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-conf").classList.remove("visible");
            }
        } else if (name == "home") {
            if (enterexit == "enter") {
                document.querySelector(".btn-desc-home").classList.add("visible");
            } else if (enterexit == "exit") {
                document.querySelector(".btn-desc-home").classList.remove("visible");
            }
        }
    }

    render() {
        return (
            <nav className="navbar navbar-default border-navigation">
                <row className="nowrap">
                <ul className={this.props.sidebarStatus == "open" ? "nav flex-grow2 nowrapbuttons navbtnsleft navbtnsleft-opened" : "nav flex-grow2 nowrapbuttons navbtnsleft"} ref={tag => (this.navBtnsLeft = tag)}>
                    <div className="nav-icon favorites material-icons" onMouseOver={(e) => {this.hoverShow(e, "saved", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "saved", "exit")}}>favorite</div>
                    <div className="btn-desc btn-desc-saved">view videos you've saved</div>
                    <div className="nav-icon history material-icons" onMouseOver={(e) => {this.hoverShow(e, "history", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "history", "exit")}}>history</div>
                    <div className="btn-desc btn-desc-hist">view your video history</div>
                </ul>
                <div className="brand flex-grow1">
                    <NavLink exact to="/" className="logo-nav-container" onMouseOver={(e) => {this.hoverShow(e, "home", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "home", "exit")}}><div className="minireel-nav millerbolditalic logo-nav-font difference-text">minipost</div><div className="minireel-nav-small millerbolditalic logo-nav-font difference-text">m</div></NavLink>
                    <SearchForm />
                    <div className="btn-desc btn-desc-home">front page</div>
                </div>
                {this.props.username ?
                    <ul className="nav flex-grow2 flex-end navbtnsright nowrapbuttons">
                        <div className="nav-icon notifications material-icons" onMouseOver={(e) => {this.hoverShow(e, "notifications", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "notifications", "exit")}}>notifications</div>
                        <div className="btn-desc btn-desc-notif">notifications</div>
                        <div className="nav-icon profile material-icons" onMouseOver={(e) => {this.hoverShow(e, "profile", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "profile", "exit")}}>person</div>
                        <div className="btn-desc btn-desc-yourpro">your profile</div>
                        <div className="nav-icon upload material-icons" onClick={(e)=>{showMoreOptions.call(this, e, "upload")}}>publish</div>
                        <div className="btn-desc btn-desc-upl" ref={tag => (this.uploadOptions = tag)}>
                            <NavLink exact to="/upload" className="hyperlink" onClick={(e)=> {resetOpenMenus.call(this)}}>upload videos</NavLink>
                            &nbsp;or&nbsp;
                            <NavLink exact to="/writearticle" className="hyperlink" onClick={(e)=> {resetOpenMenus.call(this)}}>write an article</NavLink>
                        </div>
                        <div className="nav-loggedin-config nav-icon" onClick={(e)=>{showMoreOptions.call(this, e, "profile")}} onMouseOver={(e) => {this.hoverShow(e, "config", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "config", "exit")}}>{this.props.username}</div>
                        <div className="btn-desc btn-desc-conf" onMouseOver={(e) => {this.hoverShow(e, "config", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "config", "exit")}}>change various user settings and preferences</div>
                        <div className="btn-desc btn-desc-conf-menu" ref={tag => (this.userOptions = tag)}>
                            <NavLink exact to="/profile" className="hyperlink" onClick={(e)=> {resetOpenMenus.call(this)}}>profile</NavLink>
                            <NavLink exact to="/profile" className="hyperlink">options</NavLink>
                            <a href="/" onClick={(e)=> {resetOpenMenus.call(this); this.props.fetchlogout()}} className="hyperlink">logout</a>
                        </div>
                    </ul>
                    :<ul className="nav flex-grow2 flex-end nowrapbuttons offline-nav">
                        <div className="nav-icon profile material-icons" onMouseOver={(e) => {this.hoverShow(e, "profile", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "profile", "exit")}}>person</div>
                        <div className="btn-desc btn-desc-yourpro">learn more about what it's like to be a user on minireel</div>
                    </ul>
                }
                </row>
            </nav>
        )
    }
}
