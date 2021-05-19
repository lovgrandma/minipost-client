import React, { Component } from 'react';
import { cookies } from '../App.js';
import {
    Link
} from 'react-router-dom';
import currentrooturl from '../url.js';
import { roundTime, returnLink, returnProfile } from '../methods/utility.js';
import greythumb from '../static/greythumb.jpg';
import corsdefault from '../cors.js';

export default class Results extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            content: [], query: "", loaded: false
        }
    }

    componentDidMount() {
        this.setQuery().then((query) => {
            this.getResults(query);
        })
    }

    // Replace all instances of + with a space
    replaceWith(query) {
        for (let i = 0; i < query.length; i++) {
            if (query.charAt(i) == '+') {
                query = query.replace("+", " ");
            }
        }
        return query;
    }

    // Sets query value as to be easily reference programmatically
    setQuery = async () => {
        try {
            if (window.location.href.match(/(search[?])s=([a-zA-Z0-9].*)/)) {
                if (window.location.href.match(/(search[?])s=([a-zA-Z0-9].*)/)[2]) {
                    let query = this.replaceWith(window.location.href.match(/(search[?])s=([a-zA-Z0-9].*)/)[2])
                    this.setState({ query: query });
                    return query;
                }
            }
        } catch (err) {
            // Something went wrong
        }
    }

    getResults(query) {
        if (query) {
            if (query.length > 0) {
                fetch(currentrooturl + 'm/search?s=' + query, {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault
                })
                .then((response) => {
                    return response.json(); // Parsed data
                })
                .then((data) => {
                    if (data) {
                        if (data.content) {
                            if (data.content.length > 0) {
                                this.setState({ content: data.content, loaded: true });
                            }
                        }
                    }
                    console.log(data);
                    return data;
                })
                .catch(error => {
                    console.log(error);
                })
            }
        }
    }

    render() {
        return (
                this.state.loaded && this.state.content ?
                    <div>
                        <div className="results-showing">Showing results for: {this.state.query}</div>
                        {
                            this.state.content ?
                                this.state.content.length > 0 ?
                                    this.state.content.map((media, index) =>
                                        <div className="flex-history" key={index}>
                                            <Link to={returnLink(media, "results")}>
                                                <div className="videothumb-holder">
                                                    {
                                                        media ?
                                                            media.thumbnailUrl ?
                                                                media.thumbnailUrl.length > 0 && cookies.get('contentDelivery') ?
                                                                    <img className="videothumb" src={cookies.get('contentDelivery') + "/" + media.thumbnailUrl + ".jpeg"}></img>
                                                                : <img className="videothumb" src={greythumb}></img>
                                                            : <img className="videothumb" src={greythumb}></img>
                                                        : <img className="videothumb" src={greythumb}></img>
                                                    }
                                                </div>
                                            </Link>
                                            <div className="history-media-info">
                                                <Link to={returnLink(media, "results")}>
                                                    <div className="mainvideotitle">{media.title}</div>
                                                </Link>
                                                <div className="flex flex-start">
                                                    <Link to={returnProfile(media)}>
                                                        <div className="video-author">{media.author} •&nbsp;</div>
                                                    </Link>
                                                    <div className="video-views-result">{ media.hasOwnProperty("views") ? media.views + " views" : media.reads + " reads" } • { roundTime(media.publishDate) }</div>
                                                </div>
                                                <Link to={returnLink(media, "results")}>
                                                    <div className="video-description">{ media.body ? "read here.." : media.description }</div>
                                                </Link>
                                            </div>
                                        </div>
                                    )
                                : null
                            : null
                        }
                    </div>
                : <div></div>
        )
    }
}
