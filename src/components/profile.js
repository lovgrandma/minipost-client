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
import Videos from './videos.js';
import ArticlePreview from './articlepreview.js';
import currentrooturl from '../url';
import { cookies } from '../App.js';
import { get, setData } from '../methods/utility.js';

export default class Profile extends Component {
    constructor() {
        super();
        this.state = { username: "", content: [], videosUploaded: 0, totalVideoViews: 0, totalReads: 0, following: 0, followers: 0, about: "" }
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
                if (this.props.location.search.length > 0) {
                    if (this.props.location.search.match(/\?p=([a-zA-Z0-9].*)/)) {
                        if (this.props.location.search.match(/\?p=([a-zA-Z0-9].*)/)[1]) {
                            return await this.fetchProfileData(this.props.location.search.match(/\?p=([a-zA-Z0-9].*)/)[1]);
                        }
                    }
                }
            }
            if (this.props.location.pathname) {
                if (this.props.location.pathname.length > 0) {
                    if (this.props.location.pathname.match(/\?p=([a-zA-Z0-9].*)/)) {
                        if (this.props.location.pathname.match(/\?p=([a-zA-Z0-9].*)/)[1]) {
                            return await this.fetchProfileData(this.props.location.pathname.match(/\?p=([a-zA-Z0-9].*)/)[1]);
                        }
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
        try {
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
                    if (result.totalreads) {
                        this.setState({ totalReads: result.totalreads });
                    }
                    if (get(result, "user.username")) {
                        this.setState({ username: result.user.username });
                    }
                    if (result.content) {
                        if (result.content.length > 0) {
                            this.setState({ content: result.content });
                        }
                    }
                    if (result.cloud) {
                        this.props.setCloud(result.cloud);
                    }
                    console.log(result);
                })
            }
        } catch (err) {
            // Component was unmounted
            return false;
        }
        return true;
    }

    editable() {
        if (cookies.get('loggedIn')) {
            if (cookies.get('loggedIn') == this.state.username) {
                return true;
            }
        }
        return false;
    }

    render() {
        return (
            <div>
                <div className="flex-profile main-profile-header">
                    <img className="profileavatar" src={require("../static/bobby.jpg")}></img>
                    <div>
                        <div className="flex-profile off-black align-center">
                            <div className="prompt-basic off-black weight500">{this.state.username}</div>
                            <Button className="prompt-basic off-black weight500">follow</Button>
                            <div className="prompt-basic flex"><div className="off-black">following</div>&nbsp;{this.state.following}</div>
                            <div className="prompt-basic flex"><div className="off-black">followers</div>&nbsp;{this.state.followers}</div>
                        </div>
                        <div className="prompt-basic off-black">{this.state.about}</div>
                    </div>
                </div>
                <div className="flex-profile profile-stats">
                    <div className="prompt-basic-s grey-out">total reads {this.state.totalReads}</div>
                    <div className="prompt-basic-s grey-out">total video views {this.state.totalVideoViews}</div>
                    <div className="prompt-basic-s grey-out">videos uploaded {this.state.videosUploaded}</div>
                </div>
                <div className="profile-content flex-grid videogrid">
                    { this.state.content ?
                        this.state.content.length > 0 ?
                            this.state.content.map((record, index) =>
                                record.mpd ? <Videos mpd={record.mpd}
                                    title={record.title}
                                    description={record.description}
                                    thumbnailUrl={record.thumbnailUrl}
                                    author={record.author}
                                    published={record.publishDate}
                                    views={record.views}
                                    articles={record.articles}
                                    tags={record.tags}
                                    cloud={this.props.cloud}
                                    key={index}
                                    index={index}
                                    edit={this.editable()}
                                    />
                                : <ArticlePreview title={record.title}
                                    author={record.author}
                                    body={record.body}
                                    id={record.id}
                                    likes={record.likes}
                                    dislikes={record.dislikes}
                                    reads={record.reads}
                                    published={record.publishDate}
                                    key={index}
                                    edit={this.editable()}
                                    viewProfile={true}
                                />
                            )
                        : null
                    : null }
                </div>
            </div>
        )
    }
}
