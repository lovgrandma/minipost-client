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
        this.state = { dashvideos: [] };
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
                    console.log(data);
                });
        }
    }

    render() {
        return (
            <div className='videodash'>
                <div className='flex-grid videogrid'>
                    {
                        this.props.mainfeed.map((video, index) =>
                            <Videos title={video.title}
                            description={video.description}
                            publisher={video.publisher}
                            publish={video.publish}
                            key={index}
                            />
                        )
                    }
                </div>
            </div>
        )
    }
}
