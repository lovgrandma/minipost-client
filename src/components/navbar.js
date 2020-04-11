import React, { Component } from 'react';
import SearchForm from './searchform.js';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import logo from '../static/minireel-dot-com-3.svg'; import heart from '../static/heart.svg'; import history from '../static/history.svg'; import notifications from '../static/notifications.svg'; import profile from '../static/profile.svg'; import upload from '../static/upload.svg';

// Nav bar with appropriate links to likes, history, minireel home, search film bar, notifications, friends & upload.
export default class Navbar extends Component {
    constructor(props) {
        super(props);
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
                <ul className="nav flex-grow2 nowrapbuttons">
                    <img className="nav-icon favorites" src={heart} onMouseOver={(e) => {this.hoverShow(e, "saved", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "saved", "exit")}} alt="favorites"></img>
                    <div className="btn-desc btn-desc-saved">view videos you've saved</div>
                    <img className="nav-icon history" src={history} onMouseOver={(e) => {this.hoverShow(e, "history", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "history", "exit")}} alt="history"></img>
                    <div className="btn-desc btn-desc-hist">view your video history</div>
                </ul>
                <div className="brand flex-grow1">
                    <NavLink exact to="/" onMouseOver={(e) => {this.hoverShow(e, "home", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "home", "exit")}}><img className="minireel-nav d-inline" src={logo} alt="minireel"></img></NavLink>
                    <SearchForm />
                    <div className="btn-desc btn-desc-home">front page</div>
                </div>
                {this.props.username ?
                    <ul className="nav flex-grow2 flex-end nowrapbuttons">
                        <img className="nav-icon notifications" src={notifications} onMouseOver={(e) => {this.hoverShow(e, "notifications", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "notifications", "exit")}} alt="notifications"></img>
                        <div className="btn-desc btn-desc-notif">notifications</div>
                        <img className="nav-icon profile" src={profile} onMouseOver={(e) => {this.hoverShow(e, "profile", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "profile", "exit")}} alt="profile"></img>
                        <div className="btn-desc btn-desc-yourpro">your profile</div>
                        <NavLink to='/upload/'><img className="nav-icon upload" src={upload} onMouseOver={(e) => {this.hoverShow(e, "upload", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "upload", "exit")}} alt="upload"/></NavLink>
                        <div className="btn-desc btn-desc-upl">upload videos or make a thread</div>
                        <div className="nav-loggedin-config" onMouseOver={(e) => {this.hoverShow(e, "config", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "config", "exit")}}>{this.props.username}</div>
                        <div className="btn-desc btn-desc-conf">change various user settings and preferences</div>
                    </ul>
                    :<ul className="nav flex-grow2 flex-end nowrapbuttons offline-nav">
                        <img className="nav-icon profile" src={profile} onMouseOver={(e) => {this.hoverShow(e, "profile", "enter")}} onMouseOut={(e) => {this.hoverShow(e, "profile", "exit")}} alt="profile"></img>
                        <div className="btn-desc btn-desc-yourpro">learn more about what it's like to be a user on minireel</div>
                    </ul>
                }
                </row>
            </nav>
        )
    }
}
