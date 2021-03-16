import React, {Component} from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import dummyavatar from '../static/greyavatar.jpg';

export default class SocialVideoMeta extends Component { 
    constructor(props) {
        super(props);
        this.state = {
            times: ["just watched this video", "watched this not too long ago", "watched this a few days ago", "watched this some days ago", "watched this some time ago"]
        }
    }   
       
    resolveRelativeTime = (time) => {
        try {
            const now = new Date().getTime();
            if (time < now - 1000*60*60*24*30) {
                return "watched this some time ago";
            } else if (time < now - 1000*60*60*24*8) {
                return "watched this some days ago";
            } else if (time < now - 1000*60*60*24*2) {
                return "watched this a few days ago";
            } else if (time < now - 1000*60*60*1.5) {
                return "watched this not too long ago";
            } else {
                return "just watched this video"
            }
            return "watched this some days ago";
        } catch (err) {
            return "watched this some days ago";
        }
    }
    
    render() {
        let tempArr = [];
        if (this.props.friendsWatched && this.props.cloud) {
            for (let i = 0; i < this.state.times.length; i++) {
                let tempArrSpec = [];
                for (let j = 0; j < this.props.friendsWatched.length;j++) {
                    if (this.resolveRelativeTime(this.props.friendsWatched[j].time) == this.state.times[i]) {
                        tempArrSpec.push(this.props.friendsWatched[j]);
                    }
                }
                tempArr.push(tempArrSpec);
            }
        }
        
        return (
            <div className="friends-engage-video-meta-container">
                <span className="friends-engage-video-meta">
                    {this.props.friendsWatched && this.props.cloud ? 
                        tempArr.length > 0 ? 
                            tempArr.map((arrSpec, index) =>
                                <div key={index} className="friends-watched-meta-engage-set">{
                                    arrSpec.map((acc, index2) => 
                                        arrSpec.length == 1 ?
                                            <span key={index2}>
                                                <NavLink exact to={"/profile?p=" + acc.username} className="to-profile-link-btn"><img className="friendavatar-meta" src={acc.avatarUrl ? this.props.cloud + "/av/" + acc.avatarUrl : dummyavatar}></img><span>{acc.username}</span></NavLink><span>&nbsp;{this.resolveRelativeTime(acc.time)}</span>
                                            </span>
                                            : index2 == arrSpec.length -1 ? 
                                                <span key={index2}>
                                                    <span>and </span><NavLink exact to={"/profile?p=" + acc.username} className="to-profile-link-btn"><img className="friendavatar-meta" src={acc.avatarUrl ? this.props.cloud + "/av/" + acc.avatarUrl : dummyavatar}></img><span>{acc.username}</span></NavLink><span>&nbsp;{this.resolveRelativeTime(acc.time)}</span>
                                                </span> 
                                                : <span key={index2}>
                                                    <NavLink exact to={"/profile?p=" + acc.username} className="to-profile-link-btn"><img className="friendavatar-meta" src={acc.avatarUrl ? this.props.cloud + "/av/" + acc.avatarUrl : dummyavatar}></img><span>{acc.username} </span></NavLink>
                                                </span>
                                    )
                                }</div>
                            )
                        : null
                    : null}
                </span>
            </div>
        )
    }
}