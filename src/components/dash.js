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
        this.state = { dashVideos: this.tempData(), bottom: false, fetching: false };
    }

    componentDidMount() {
        this.fetchRecommendations();
        window.addEventListener('scroll', this.handleMouseDown.bind(this), true);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps && this.props.username) {
            if ((prevProps.username !== this.props.username) || (!prevProps.username && this.props.username)) {
                this.fetchRecommendations();
            }
        }
    }

    componentDidCatchError(error, errorInfo) {
        console.log(error);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleMouseDown.bind(this), true);
    }

    handleMouseDown() {
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
    }

    fetchRecommendations = () => {
        try {
            this.setState({ fetching: true });
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
                        this.setState({ dashVideos: data.main });
                    }
                    if (data.cloud) {
                        this.props.setCloud(data.cloud);
                    }
                });
            this.setState({ fetching: false });
        } catch (err) {
            this.setState({ fetching: false });
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

    setData(video, type) {
        if (!video._fields[0].properties[type] || video._fields[0].properties[type].length == 0 || video._fields[0].properties[type] == undefined) {
            return video._fields[0].properties[type] = "";
        }
        return video._fields[0].properties[type]
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
                    <Button className="flex-button-center-btn" onClick={(e)=>{this.fetchRecommendations()}}>More videos</Button>
                </div>
            </div>
        )
    }
}
