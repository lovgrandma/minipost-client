import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { cookies, socket } from '../App.js';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import parseBody from '../methods/htmlparser.js';
import greythumb from '../static/greythumb.jpg';
import { convertDate } from '../methods/utility.js';

export default class History extends Component {
    constructor(props) {
        super(props);
        this.state = { history: []
                     }
    }

    componentDidMount() {
        this.getHistory();
    }

    getHistory() {
        try {
            if (cookies.get('mediahistory') && cookies.get('loggedIn')) {
                if (cookies.get('mediahistory').history && cookies.get('mediahistory').user) {
                    if (cookies.get('mediahistory').user == cookies.get('loggedIn')) {
                        this.setState({ history: cookies.get('mediahistory').history.reverse() });
                    }
                }
            }
        } catch (err) {
            // Something went wrong
        }
    }

    returnLink(media) {
        try {
            if (media.id.charAt(0) == "a") {
                return { pathname:`/read?${media.id}` };
            } else {
                return { pathname:`/watch?${media.id}` };
            }
        } catch (err) {
            // Something went wrong
        }
    }

    returnProfile(media) {
        try {
            return { pathname:`/profile?p=${media.author}` };
        } catch (err) {
            // Something went wrong
        }
    }

    render() {
        return (
            <div>
                <div className="upload-video-text">History</div>
                {
                    this.state.history ?
                        this.state.history.length > 0 ?
                            this.state.history.map((media, index) =>
                                <div className="flex-history" key={index}>
                                    <Link to={this.returnLink(media)}>
                                        <div className="videothumb-holder">
                                            {
                                                media ?
                                                    media.thumbnail ?
                                                        media.thumbnail.length > 0 && this.props.cloud ?
                                                            <img className="videothumb" src={this.props.cloud + "/" + media.thumbnail + ".jpeg"}></img>
                                                        : <img className="videothumb" src={greythumb}></img>
                                                    : <img className="videothumb" src={greythumb}></img>
                                                : <img className="videothumb" src={greythumb}></img>
                                            }
                                        </div>
                                    </Link>
                                    <div className="history-media-info">
                                        <Link to={this.returnLink(media)}>
                                            <div className="mainvideotitle">{media.title}</div>
                                            <div className="video-views-result">{ media.hasOwnProperty("views") ? media.views : media.reads } • { convertDate(media.published) }</div>
                                        </Link>
                                        <Link to={this.returnProfile(media)}>
                                            <div className="video-author">{media.author}</div>
                                        </Link>
                                        <Link to={this.returnLink(media)}>
                                            <div className="video-description">{ media.body ? "read here.." : media.description }</div>
                                        </Link>
                                    </div>
                                </div>
                            )
                        : null
                    : null
                }
            </div>
        )
    }
}
