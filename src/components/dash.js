/** Dash file dash.js
@version 0.3
@author Jesse Thompson
Appends videos to user dash */

import React, { Component } from 'react';
import Videos from './videos.js';
import ArticlePreview from './articlepreview.js';
import currentrooturl from '../url.js';
import utility from '../methods/utility.js';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import { cookies } from '../App.js';
const EventEmitter = require('events');

export default class Dash extends Component {
    constructor(props) {
        super(props);
        this.state = { dashVideos: this.tempData(), bottom: false, fetching: false, fetchingTimeout: "", loaded: false };
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
                    if (utility.checkAtBottom()) {
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
            let user = null;
            if (cookies.get('loggedIn')) {
                user = cookies.get('loggedIn');
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
            fetch(currentrooturl + 'm/serveVideos', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        user, append
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    console.log(data);
                    if (!data.querystatus && Array.isArray(data.main)) {
                        if (data.main.length > 0 && !this.state.loaded) {
                            this.setState({ loaded: true });
                        }
                        let appendDash = append.concat(data.main); // Response will only return added videos, append new dash videos to old view and set state
                        this.setState({ dashVideos: appendDash });
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

    render() {
        return (
            <div className='videodash'>
                <h5 className="videodash-recommended-header">Recommended</h5>
                <div className='flex-grid videogrid'>
                    {
                        this.state.dashVideos ?
                            this.state.dashVideos.length > 0 ?
                                this.state.dashVideos.map((content, index) =>
                                    content._fields[0].properties.mpd ?
                                        <Videos mpd={content._fields[0].properties.mpd.toString()}
                                        title={content._fields[0].properties.title.toString()}
                                        description={utility.setData(content, "description")}
                                        thumbnailUrl={utility.setData(content, "thumbnailUrl")}
                                        author={content._fields[0].properties.author.toString()}
                                        published={content._fields[0].properties.publishDate}
                                        views={utility.getNumber(content._fields[0].properties.views)}
                                        responses={content._fields[0].properties.responses}
                                        tags={content._fields[0].properties.tags}
                                        avatarUrl={content._fields[3]}
                                        cloud={this.props.cloud}
                                        key={index}
                                        index={index}
                                        />
                                    :   <ArticlePreview id={content._fields[0].properties.id}
                                        title={content._fields[0].properties.title}
                                        author={content._fields[0].properties.author.toString()}
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
