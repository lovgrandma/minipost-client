/** Dash file dash.js
@version 0.3
@author Jesse Thompson
Appends videos to user dash */

import React, { Component } from 'react';
import Videos from './videos.js';
import currentrooturl from '../url.js';
import utility from '../methods/utility.js';

export default class Dash extends Component {
    constructor(props) {
        super(props);
        this.state = { dashVideos: this.tempData() };
    }

    componentDidMount() {
        this.fetchRecommendations();
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

    fetchRecommendations = () => {
        if (this.props.username) {
            let user = this.props.username;
            fetch(currentrooturl + 'm/serveVideos', {
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
                .then((data) => {
                    if (data.querystatus) {
                        console.log(data.querystatus);
                    } else if (Array.isArray(data)) {
                        this.setState({ dashVideos: utility.shuffleArray(data) });
                    }
                });
        } else {
            fetch(currentrooturl + 'm/serveVideos', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({

                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                console.log(data);
                    if (data.querystatus) {
                        console.log(data.querystatus);
                    } else if (Array.isArray(data)) {
                        this.setState({ dashVideos: utility.shuffleArray(data) });
                    }
                });
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
            </div>
        )
    }
}
