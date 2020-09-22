/** Dash file dash.js
@version 0.3
@author Jesse Thompson
Appends videos to user dash */

import React, { Component } from 'react';
import Videos from './videos.js';
import currentrooturl from '../url.js';
import utility from '../methods/utility.js';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
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
                if (this) {
                    if (this.state) {
                        this.setState({ fetching: false });
                        this.setState({ fetchingTimeout: "" });
                    }
                }
            }, 2000);
            this.setState({ fetchingTimeout: timeout });
            let user = null;
            if (this.props.username) {
                user = this.props.username;
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
                    if (data.querystatus) {
                        console.log(data.querystatus);
                    } else if (Array.isArray(data.main)) {
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
        try {
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
        } catch (err) {
            // Component may have unmounted
        }
        return [];
    }

    setData(video, type) {
        try {
            if (!video._fields[0].properties[type] || video._fields[0].properties[type].length == 0 || video._fields[0].properties[type] == undefined) {
                return video._fields[0].properties[type] = "";
            }
            return video._fields[0].properties[type]
        } catch (err) {
            // Component may have unmounted
            return "";
        }
    }


    render() {
        return (
            <div className='videodash'>
                <h5 className="videodash-recommended-header">Recommended</h5>
                <div className='flex-grid videogrid'>
                    {
                        this.state.dashVideos ?
                            this.state.dashVideos.length > 0 ?
                                this.state.dashVideos.map((video, index) =>
                                    <Videos mpd={video._fields[0].properties.mpd.toString()}
                                    title={video._fields[0].properties.title.toString()}
                                    description={this.setData(video, "description")}
                                    thumbnailUrl={this.setData(video, "thumbnailUrl")}
                                    author={video._fields[0].properties.author.toString()}
                                    published={video._fields[0].properties.publishDate.toString()}
                                    views={video._fields[0].properties.views}
                                    articles={video._fields[0].properties.articles}
                                    tags={video._fields[0].properties.tags}
                                    cloud={this.props.cloud}
                                    key={index}
                                    index={index}
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
