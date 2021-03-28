/** Dash file dash.js
@version 0.3
@author Jesse Thompson
Appends videos to user dash */

import React, { Component } from 'react';
import Videos from './videos.js';
import ArticlePreview from './articlepreview.js';
import currentrooturl from '../url.js';
import { checkAtBottom, setData, getNumber, checkToString } from '../methods/utility.js';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import { cookies } from '../App.js';
import corsdefault from '../cors.js';
const EventEmitter = require('events');

export default class Dash extends Component {
    constructor(props) {
        super(props);
        this.state = { dashVideos: this.tempData(), bottom: false, fetching: false, fetchingTimeout: "", loaded: false, closeSocialPrompt: false };
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    componentDidMount() {
        try {
            this.fetchRecommendations();
            window.addEventListener('scroll', this.handleMouseDown, true);
        } catch (err) {
            // Component may have unmounted
        }
    }

    componentDidUpdate(prevProps, prevState) {
        try {
            if (prevProps && this.props.username) {
                if ((prevProps.username !== this.props.username) || (!prevProps.username && this.props.username)) {
                    this.fetchRecommendations();
                }
            }
        } catch (err) {
            // Component may have unmounted
        }
    }

    componentDidCatchError(error, errorInfo) {
        console.log(error);
    }

    componentWillUnmount() {
        try {
            if (this.state.fetchingTimeout) {
                clearTimeout(this.state.fetchingTimeout);
            }
            window.removeEventListener('scroll', this.handleMouseDown, true);
        } catch (err) {
            // Component may have unmounted
        }
    }

    handleMouseDown() {
        try {
            if (this) {
                if (this.state) {
                    if (checkAtBottom()) {
                        if (!this.state.bottom) {
                            this.setState({ bottom: true });
                            if (this.state.dashVideos && !this.state.fetching) {
                                this.fetchRecommendations();
                            }
                        }
                    } else {
                        if (this.state.bottom) {
                            this.setState({ bottom: false });
                        }
                    }
                }
            }
        } catch (err) {
            // Component unmounted. No-op
        }
    }

    fetchRecommendations = () => {
        try {
            this.setState({ fetching: true });
            // Ensures that fetch videos does not run excessively in short periods of time
            let timeout = setTimeout(() => {
                try {
                    if (this) {
                        if (this.state) {
                            this.setState({ fetching: false });
                            this.setState({ fetchingTimeout: "" });
                        }
                    }
                } catch (err) {
                    // something went wrong
                }
            }, 2000);
            this.setState({ fetchingTimeout: timeout });
            let username = null;
            if (cookies.get('loggedIn')) {
                username = cookies.get('loggedIn');
            }
            let append = [];
            if (this.state) {
                if (this.state.dashVideos && this.state.dashVideos[0]) {
                    if (this.state.dashVideos[0]._fields) {
                        if (this.state.dashVideos[0]._fields[0]) {
                            if (this.state.dashVideos[0]._fields[0].properties) {
                                if (this.state.dashVideos[0]._fields[0].properties.author) {
                                    append = this.state.dashVideos;
                                }
                            }
                        }
                    }
                }
            }
            let hash = cookies.get('hash');
            console.log(username, hash);
            fetch(currentrooturl + 'm/serveVideos', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, append, hash
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log("serve videos data" + data)
                console.log(data);
                let authentication = this.props.checkAndConfirmAuthentication(data);
                if (authentication) {
                    if (!data.querystatus && Array.isArray(data.main)) {
                        if (data.main.length > 0 && !this.state.loaded) {
                            this.setState({ loaded: true });
                        }
                        let appendDash = append.concat(data.main); // Response will only return added videos, append new dash videos to old view and set state
                        this.setState({ dashVideos: appendDash });
                    }
                }
                if (data.cloud) {
                    this.props.setCloud(data.cloud);
                }
                this.setState({ fetching: false });
            })
            .catch((err) => {
                // Error occured while making fetch request
            });
        } catch (err) {
            if (this) {
                if (this.state) {
                    this.setState({ fetching: false });
                }
            }
        }
    }

    tempData() {
        let data = [];
        for (let i = 0; i < 12; i++) {
            data.push({
                _fields: [{
                    properties: {
                        articles: [],
                        author: "",
                        description: "",
                        publishDate: "",
                        views: "",
                        tags: [],
                        title: "",
                        mpd: "",
                        thumbnailUrl: ""
                    }
                }]
            });
        }
        return data;
    }

    setCloseSocialPrompt(e) {
        this.setState({ closeSocialPrompt: true });
    }

    render() {
        return (
            <div className='videodash'>
                {
                    !this.props.username && !this.state.closeSocialPrompt ? <div className="flex flex-start social-portal-login-prompt"><div className="material-icons arrow-back-login">arrow_back</div><div className="info-blurb">You're not logged in, to log in click on the bar on the left to open the social portal</div><div className="social-portal-times" onClick={(e)=>{this.setCloseSocialPrompt(e)}}>&times;</div></div>
                    : null
                }
                <h5 className="videodash-recommended-header">Recommended</h5>
                <div className='flex-grid videogrid'>
                    {
                        this.state.dashVideos ?
                            this.state.dashVideos.length > 0 ?
                                this.state.dashVideos.map((content, index) =>
                                    content._fields[0].properties.mpd ?
                                        <Videos mpd={checkToString(content._fields[0].properties.mpd)}
                                        title={checkToString(content._fields[0].properties.title)}
                                        description={setData(content, "description")}
                                        thumbnailUrl={setData(content, "thumbnailUrl")}
                                        author={checkToString(content._fields[0].properties.author)}
                                        published={content._fields[0].properties.publishDate}
                                        views={getNumber(content._fields[0].properties.views)}
                                        responses={content._fields[0].properties.responses}
                                        tags={content._fields[0].properties.tags}
                                        avatarUrl={content._fields[3]}
                                        cloud={this.props.cloud}
                                        sendWatch={this.props.sendWatch}
                                        key={index}
                                        index={index}
                                        />
                                    :   <ArticlePreview id={content._fields[0].properties.id}
                                        title={content._fields[0].properties.title}
                                        author={checkToString(content._fields[0].properties.author)}
                                        body={content._fields[0].properties.body}
                                        likes={content._fields[0].properties.likes}
                                        dislikes={content._fields[0].properties.dislikes}
                                        reads={content._fields[0].properties.reads}
                                        published={content._fields[0].properties.publishDate}
                                        responses={content._fields[0].properties.responses}
                                        avatarUrl={content._fields[3]}
                                        cloud={this.props.cloud}
                                        dash={true}
                                        key={index}
                                        />
                                )
                            : null
                        : null
                    }
                </div>
                <div className="flex-button-center">
                    {this.state.loaded && !this.state.fetching ?
                    <Button className="flex-button-center-btn" onClick={(e)=>{this.fetchRecommendations()}}>More videos</Button> : <div ref={this.spinnerRef} className="spinner-search-holder-visible spinner-video-dash">
                    <div className="loadingio-spinner-dual-ball-m6fvn6j93c loadingio-spinner-dual-ball-m6fvn6j93c-dash"><div className="ldio-oo3b7d4nmnr ldio-oo3b7d4nmnr-dash">
                    <div></div><div></div><div></div>
                    </div></div>
                </div>
                    }
                </div>
            </div>
        )
    }
}
