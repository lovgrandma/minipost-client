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


export default class Notifications extends Component {
    constructor(props) {
        super(props);
        this.state = { notifications: [], detailedNotifications: []

                     }
    }

    componentDidMount() {
        let mediahistory = cookies.get('mediahistory');
        if (mediahistory) {
            this.setState({ notifications: mediahistory.subscribed }, () => {
                this.buildCachedMediaData();
            });
        }
    }

    // The following method will take a list of notifications and make a request to database for relevant information.
    // This provides the user with an informative view about their new notifications
    buildCachedMediaData() {
        if (this.state.notifications.length > 0) {
            let data = [];
            this.state.notifications.map( channel => {
                channel.notifications.map( content => {
                    if (content.match(/([A-Za-z0-9-].*);([a-z].*)/)) {
                        data.push(content.match(/([A-Za-z0-9-].*);([a-z].*)/)[1]);
                    }
                });
            });
            if (data.length > 0) {
                fetch(currentrooturl + 'm/fetchcontentdata', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'same-origin',
                    credentials: 'include',
                    body: JSON.stringify({
                        data
                    })
                })
                .then((response) => {
                    return response.json(); // Parsed data
                })
                .then((data) => {
                    if (data != false) {
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

    render() {
        return (
            <div>
                <div className="upload-video-text">Notifications</div>
                {
                    this.state.detailedNotifications ?
                        this.state.detailedNotifications.length > 0 ?
                            this.state.detailedNotifications.reverse().map((notif, index) => (
                                <div className="flex-notif">
                                    <Link to={this.returnLink(notif)}>
                                        <div className="notifthumb-holder">
                                            {
                                                notif ?
                                                    notif.thumbnailUrl ?
                                                        notif.thumbnailUrl.length > 0 ?
                                                            <img className="notifthumb" src={this.props.cloud + "/" + notif.thumbnailUrl + ".jpeg"}></img>
                                                        : <div className="notifthumb"></div>
                                                    : <div className="notifthumb"></div>
                                                : <div className="notifthumb"></div>
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
