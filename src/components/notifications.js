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
import currentrooturl from '../url.js';
import { convertDate } from '../methods/utility.js';
import greythumb from '../static/greythumb.jpg';
import corsdefault from '../cors.js';


export default class Notifications extends Component {
    constructor(props) {
        super(props);
        this.state = { notifications: [], detailedNotifications: []

                     }
    }

    componentDidMount() {
        let mediahistory = JSON.parse(window.localStorage.getItem('mediahistory'));
        if (mediahistory) {
            if (mediahistory.subscribed) {
                if (Array.isArray(mediahistory.subscribed)) {
                    this.setState({ notifications: mediahistory.subscribed.reverse() }, () => {
                        this.buildCachedMediaData();
                    });
                }
            }
        }
    }

    // The following method will take a list of notifications and make a request to database for relevant information.
    // This provides the user with an informative view about their new notifications
    buildCachedMediaData() {
        if (this.state) {
            if (this.state.notifications) {
                if (this.state.notifications.length > 0) {
                    let data = [];
                    this.state.notifications.map( channel => {
                        channel.notifications.map( content => {
                            if (content.match(/([A-Za-z0-9-].*);([a-z].*)/)) {
                                data.push(content.match(/([A-Za-z0-9-].*);([a-z].*)/)[1]);
                            }
                        });
                    });
                    console.log(data);
                    if (data.length > 0) {
                        fetch(currentrooturl + 'm/fetchcontentdata', {
                            method: "POST",
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            credentials: corsdefault,
                            body: JSON.stringify({
                                data
                            })
                        })
                            .then((response) => {
                            return response.json(); // Parsed data
                        })
                            .then((data) => {
                            console.log(data);
                            if (data != false) {
                                data = data.reverse();
                                this.setState({ detailedNotifications: data });
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
        }
    }

    returnLink(media) {
        try {
            if (media.id) {
                return { pathname:`/read?${"a=" + media.id}` };
            } else {
                return { pathname:`/watch?${"v=" + media.mpd}` };
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

    markChecked(e, notif) {
        e.preventDefault();
        let id;
        let mediaHistory;
        if (notif.mpd) {
            id = notif.mpd;
        } else {
            id = notif.id;
        }
        if (window.localStorage.getItem('mediahistory') && id) {
            mediaHistory = JSON.parse(window.localStorage.getItem('mediahistory'));
            if (mediaHistory.subscribed) {
                for (let i = 0; i < mediaHistory.subscribed.length; i++) {
                    for (let j = 0; j < mediaHistory.subscribed[i].notifications.length; j++) {
                        if (mediaHistory.subscribed[i].notifications[j].match(/(a|v)-([A-Za-z0-9-].*);([a-z].*)/)) {
                            if (mediaHistory.subscribed[i].notifications[j].match(/(a|v)-([A-Za-z0-9-].*);([a-z].*)/)[2] == id) {
                                mediaHistory.subscribed[i].notifications[j] = mediaHistory.subscribed[i].notifications[j].match(/(a|v)-([A-Za-z0-9-].*);([a-z].*)/)[1] + "-" + mediaHistory.subscribed[i].notifications[j].match(/(a|v)-([A-Za-z0-9-].*);([a-z].*)/)[2] + ";c";
                            }
                        }
                    }
                }
            }
            window.localStorage.setItem('mediahistory', JSON.stringify(mediaHistory));
            if (notif.mpd) {
                window.location.href = currentrooturl + "watch?v=" + id;
            } else {
                window.location.href = currentrooturl + "read?a=" + id;
            }

        }
    }

    render() {
        return (
            <div>
                <div className="upload-video-text">Notifications</div>
                {
                    this.state.detailedNotifications ?
                        this.state.detailedNotifications.length > 0 ?
                            this.state.detailedNotifications.map((notif, index) => (
                                <div className="flex-notif" key={index}>
                                    <Link to={this.returnLink(notif)} onClick={(e)=>{this.markChecked(e, notif)}}>
                                        <div className="notifthumb-holder">
                                            {
                                                notif ?
                                                    notif.thumbnailUrl ?
                                                        notif.thumbnailUrl.length > 0 && this.props.cloud ?
                                                            <img className="notifthumb" src={this.props.cloud + "/" + notif.thumbnailUrl + ".jpeg"}></img>
                                                        : <img className="notifthumb" src={greythumb}></img>
                                                    : <img className="notifthumb" src={greythumb}></img>
                                                : <img className="notifthumb" src={greythumb}></img>
                                            }
                                        </div>
                                    </Link>
                                    <div className="flex-notif-data">
                                        <div className="flex-notif-meta"><Link to={this.returnProfile(notif)}><span className="flex-notif-author">{notif.author}</span></Link>{notif.mpd ? " uploaded a video " : " published an article "}{convertDate(notif.publishDate)}</div>
                                        <Link to={this.returnLink(notif)}><div className="maintitle flex-main-title">{notif.title}</div></Link>
                                        <div>{notif.description}</div>
                                    </div>
                                </div>
                            ))
                        : null
                    : null
                }
            </div>
        )
    }
}
