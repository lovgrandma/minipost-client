import React, {Component} from 'react';
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
import currentrooturl from '../url';
import { cookies } from '../App.js';
import { get } from '../methods/utility.js';

export default class Profile extends Component {
    constructor() {
        super();
        this.state = { username: "", videosUploaded: 0, totalVideoViews: 0, following: 0, followers: 0, about: "" }
    }

    componentDidMount = async () => {
        try {
            await this.getPathnameMatch();
        } catch (err) {
            // Component unmounted
        }
    }

    getPathnameMatch = async () => {
        try {
            if (this.props.location.search) {
                if (this.props.location.search.match(/\?p=([a-zA-Z0-9].*)/)) {
                    if (this.props.location.search.match(/\?p=([a-zA-Z0-9].*)/)[1]) {
                        return await this.fetchProfileData(this.props.location.search.match(/\?p=([a-zA-Z0-9].*)/)[1]);
                    }
                }
            }
            return await this.fetchProfileData(cookies.get('loggedIn')); // fetch user data
        } catch (err) {
            // Component unmounted
        }
    }

    // Fetch profile data, always match by user name instead of id. Username more readily available
    fetchProfileData = async (user) => {
        console.log(user);
        if (user) {
            return await fetch(currentrooturl + 'm/fetchprofilepagedata', {
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
                if (result.totalviews) {
                    this.setState({ totalVideoViews: result.totalviews });
                }
                if (result.totalvideos) {
                    this.setState({ videosUploaded: result.totalvideos });
                }
                if (get(result, "user.username")) {
                    this.setState({ username: result.user.username });
                }
                console.log(result);
            })
        }
    }

    render() {
        return (
            <div>
                <div className="page-header-text">Profile</div>
                <div className="flex-profile main-profile-header">
                    <img className="profileavatar" src={require("../static/bobby.jpg")}></img>
                    <div>
                        <div className="flex-profile off-black align-center">
                            <div className="prompt-basic off-black weight500">{this.state.username}</div>
                            <Button className="prompt-basic off-black weight500">follow</Button>
                            <div className="prompt-basic flex"><div className="off-black weight500">following</div>&nbsp;{this.state.following}</div>
                            <div className="prompt-basic flex"><div className="off-black weight500">followers</div>&nbsp;{this.state.followers}</div>
                        </div>
                        <div className="prompt-basic off-black">{this.state.about}</div>
                    </div>
                </div>
                <div className="flex-profile">
                    <div className="prompt-basic-s grey-out">videos uploaded {this.state.videosUploaded}</div>
                    <div className="prompt-basic-s grey-out">total video views {this.state.totalVideoViews}</div>
                </div>
                <div>

                </div>
            </div>
        )
    }
}
