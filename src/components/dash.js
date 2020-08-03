/** Dash file dash.js
@version 0.3
@author Jesse Thompson
Appends videos to user dash */

import React, { Component } from 'react';
import Videos from './videos.js';
import currentrooturl from '../url.js';

export default class Dash extends Component {
    constructor(props) {
        super(props);
        this.state = { dashVideos: [] };
    }

    componentDidMount() {
        this.fetchRecommendations();
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
                        this.setState({ dashVideos: data });
                    }
                });
        }
    }

    render() {
        return (
            <div className='videodash'>
                <div className='flex-grid videogrid'>
                    {
                        this.state.dashVideos.length > 0 ?
                            this.state.dashVideos.map((video, index) =>
                                <Videos mpd={video._fields[0].properties.mpd.toString()}
                                title={video._fields[0].properties.title.toString()}
                                description={video._fields[0].properties.description.toString()}
                                publisher={video._fields[0].properties.author.toString()}
                                published={video._fields[0].properties.publishDate.toString()}
                                views={video._fields[0].properties.views}
                                key={index}
                                />
                            )
                        : null
                    }
                </div>
            </div>
        )
    }
}
