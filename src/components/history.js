import React, { Component } from 'react';
import { cookies } from '../App.js';
import {
    Link
} from 'react-router-dom';
import greythumb from '../static/greythumb.jpg';
import { convertDate, returnLink, returnProfile } from '../methods/utility.js';

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
            let temp = JSON.parse(window.localStorage.getItem('mediahistory'));
            if (temp && cookies.get('loggedIn')) {
                if (temp.history && temp.user) {
                    if (temp.user == cookies.get('loggedIn')) {
                        this.setState({ history: temp.history.reverse() });
                    }
                }
            }
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
                                    <Link to={returnLink(media)}>
                                        <div className="videothumb-holder">
                                            {
                                                media ?
                                                    media.thumbnail ?
                                                        media.thumbnail.length > 0 && this.props.cloud ?
                                                            <img className="videothumb" src={cookies.get('contentDelivery') + "/" + media.thumbnail + ".jpeg"}></img>
                                                        : <img className="videothumb" src={greythumb}></img>
                                                    : <img className="videothumb" src={greythumb}></img>
                                                : <img className="videothumb" src={greythumb}></img>
                                            }
                                        </div>
                                    </Link>
                                    <div className="history-media-info">
                                        <Link to={returnLink(media)}>
                                            <div className="mainvideotitle">{media.title}</div>
                                        </Link>
                                        <div className="flex flex-start">
                                            <Link to={returnProfile(media)}>
                                                <div className="video-author">{media.author} •&nbsp;</div>
                                            </Link>
                                            <div className="video-views-result">{ media.hasOwnProperty("views") ? media.views + " views" : media.reads + " reads" } • { convertDate(media.published) }</div>
                                        </div>
                                        <Link to={returnLink(media)}>
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
