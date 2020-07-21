import React, { Component } from 'react';
import heart from '../static/heart.svg'; import profile from '../static/profile.svg'; import close from '../static/close.svg'; import chatblack from '../static/chat-black.svg';

function Request(props) {
    return (
        <div className='user-request-container'>
            <div className='user-request-div'>{props.userrequest}</div>
            <div className='user-request-actions'>
                <div className='user-request-befriend' onClick={(e) => {props.acceptfriendrequest(e, props.userrequest, true)}}>befriend<img className="searched-user-icon" src={heart} alt="friend request"></img></div>
                <div className='user-request-block' onClick={(e) => {props.revokefriendrequest(e, props.userrequest, false, "requestslist")}}>ignore<img className="searched-user-icon-block" src={close} alt="chat"></img></div>
                <div className='user-request-profile'>profile<img className="searched-user-icon" src={profile} alt="chat"></img></div>
                <div className='user-request-message'>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
            </div>
        </div>
    )
}

export default Request;
