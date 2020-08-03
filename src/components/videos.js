import React, {Component} from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import dummythumbnail from '../static/warrenbuffetthumb.jpg';

export default class Videos extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    roundHour(hour) {
        if (Math.round(hour/3600) == 1) {
            return "1 hour ago";
        } else {
            return Math.round(hour/3600) + " hours ago";
        }
        return Math.round(hour/3600) + "hours ago";
    }

    /* Converts static document date into relevant publish time from now */
    convertDate(date) {
        let timeFromNow = (Date.now() - new Date(date).getTime())/1000;
        if (timeFromNow <= 60) {
            return "1 minute ago";
        } else if (timeFromNow <= 120) {
            return "2 minutes ago";
        } else if (timeFromNow <= 180) {
            return "3 minutes ago";
        } else if (timeFromNow <= 300) {
            return "5 minutes ago";
        } else if (timeFromNow <= 600) {
            return "10 minutes ago";
        } else if (timeFromNow <= 900) {
            return "15 minutes ago";
        } else if (timeFromNow <= 1200) {
            return "20 minutes ago";
        } else if (timeFromNow <= 1800) {
            return "Half an hour ago";
        } else if (timeFromNow <= 3600) {
            return "1 hour ago";
        } else if (timeFromNow < 86400) {
            return this.roundHour(timeFromNow); // Rounds hour for hours uploaded from now
        } else if (timeFromNow => 86400 && timeFromNow < 172800) {
            return "yesterday";
        } else {
            return date.split(' ')[0]; // Returns date minus time
        }
        return date.split(' ')[0];
    }

    cutTitle(title) {
        if (title.length > 80) {
            return title.slice(0, 80) + "...";
        }
        return title;
    }
    render () {
        return (
            <div className="col">
                <div className='videocontainer'>
                    <Link to={{
                        pathname:`/watch?v=${this.props.mpd}`,
                        props:{
                            title: `${this.props.title}`,
                            author: `${this.props.author}`
                        }
                    }}>
                        <img className='videothumb' src={dummythumbnail}></img>
                        <div className="dash-video-details-container">
                            <img className="publisheravatar-dash" src={require("../static/bobby.jpg")}></img>
                            <div>
                                <p className='mainvideotitle'>{this.cutTitle(this.props.title)}</p>
                                <div className="dash-video-details-col">
                                    <span className="dash-video-bar"><p className='video-author'>{this.props.author}</p>&nbsp;•&nbsp;<p className='video-views'>{this.props.views} views</p>&nbsp;•&nbsp;<p className="video-article-responses">0 articles</p>&nbsp;•&nbsp;<p className="video-publish-date">{this.convertDate(this.props.published)}</p></span>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        )
    }
}
