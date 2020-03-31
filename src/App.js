'use strict';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import csshake from 'csshake';
import Login from './components/login.js'; import Sidebarfooter from './components/sidebarfooter.js'; import SearchForm from './components/searchform.js'; import Navbar from './components/navbar.js';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import { instanceOf } from 'prop-types';
import Cookies from 'universal-cookie';
import logo from './static/minireel-dot-com-3.svg'; import mango from './static/minireel-mangologo.svg'; import heart from './static/heart.svg'; import whiteheart from './static/heart-white.svg'; import history from './static/history.svg'; import search from './static/search-white.svg'; import notifications from './static/notifications.svg'; import profile from './static/profile.svg'; import upload from './static/upload.svg'; import thumbsup from './static/thumbsup.svg'; import thumbsdown from './static/thumbsdown.svg'; import share from './static/share.svg'; import sidebarcloseimg from './static/sidebarclose.svg';  import sidebaropenimg from './static/sidebaropen.svg'; import dummythumbnail from './static/warrenbuffetthumb.jpg'; import chatblack from './static/chat-black.svg'; import close from './static/close.svg'; import hamburger from './static/hamburger.svg'; import pointingfinger from './static/pointingfinger.svg'; import circlemenu from './static/circlemenu.svg'; import newspaperblack from './static/newspaper.svg'; import play from './static/play.svg'; import television from './static/tv.svg'; import sendarrow from './static/sendarrow.svg'; import subscribe from './static/subscribe.svg'; import friendswhite from './static/friendsWhite.svg'; import nonFriendsWhite from './static/nonFriendsWhite.svg'; import circlemenulight from './static/circlemenulight.svg'; import minimize from'./static/minimize.svg'; import maximize from './static/maximize.svg'; import angleDoubleLeft from './static/angle-double-left-solid.svg'; import settings from './static/settings.svg';
import './style/app.css';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import './videoplayer.css';
import $ from 'jquery';
import lzw from './compression/lzw.js';
import TextareaAutosize from 'react-textarea-autosize';

import AwesomeDebouncePromise from 'awesome-debounce-promise';
import videofeedvar from './videofeedplaceholder';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {  } from '@fortawesome/free-solid-svg-icons';
import io from "socket.io-client";
const EventEmitter = require('events');
const bumpEvent = new EventEmitter();
let socket; // Expose socket to entire application once it is created

library.add();
const cookies = new Cookies();

let devurl = 'http://localhost:3000/';
let productionurl = 'https://www.minireel.net/';
let currentrooturl =  devurl;

const typingRegex = /([a-z0-9.]*);([^]*);(.*)/; // regular expression for reading 'typing' emits
const bumpRegex = /([^]*);([^]*);([^]*);(.*)/; // regex for reading 'bump' emits

// placeholder import video info
let videofeed = videofeedvar;

// output friend
// if prop is defined then output quick chats, else do not.
// {props.conversations[props.index].log.slice(-1)[0].content}
// make load entire conversation log for now, but slice at 50 messages.
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

class SearchedUserResults extends Component { // search user component sup1
    constructor(props) {
        super(props);
        this.searchChatFormRef = React.createRef();
        this.searchChatSubmitRef = React.createRef();
        this.inputRef = React.createRef();
        this.spinnerRef = React.createRef();
        this.state = { removeprompt: false,
            blockprompt: false,
            reportprompt: false,
            waitingfetch: false }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps != this.props) {
            this.unsetSpinner();
        }
    }

    promptremovefriend = (e) => {
        this.setState({ removeprompt: true });
        console.log('remove friend prompt');
    }
    promptexitremovefriend = (e) => {
        this.setState({ removeprompt: false });
    }
    promptblockuser = (e) => {
        this.setState({ blockprompt: true });
    }
    promptexitblockuser = (e) => {
        this.setState({ blockprompt: false });
    }
    
    openchatinput = (e) => {
        // console.log(this.props.index);
        console.log(this.props.searchtotal);
        for (let i = 0; i < this.props.searchtotal; i++) { // Check other chatforms and remove
            if (document.getElementsByClassName('search-chat-form')[i]) {
                document.getElementsByClassName('search-chat-form')[i].classList.remove('search-chat-form-open');
                document.getElementsByClassName('search-textarea-chat-autosize')[i].classList.add('search-textarea-chat-autosize-closed');
                document.getElementsByClassName('search-chat-submit')[i].classList.remove('search-chat-submit-open');
            }
        }
        this.searchChatFormRef.classList.add('search-chat-form-open'); // open chat form
        this.inputRef._ref.classList.remove('search-textarea-chat-autosize-closed');
        this.searchChatSubmitRef.classList.add('search-chat-submit-open');
    }

    handleKeyPress = (e, otheruser) => {
        if(e.key === 'Enter'){
            e.preventDefault();
            let sendchat = (e) => {
                this.props.beginchat(e, otheruser, this.inputRef._ref.value, null, true), this.resetchat(e);
                this.inputRef._ref.placeholder = "message was sent";
            }
            sendchat(e);
        }
    }

    setSpinner = (e) => {
        this.spinnerRef.current.classList.add("spinner-search-holder-visible");
        this.setState({ waitingfetch: true });
    }

    unsetSpinner = (e) => {
        if (this.state.waitingfetch == true) {
            this.setState({ waitingfetch: false });
            this.spinnerRef.current.classList.remove("spinner-search-holder-visible");
        }
    }

    resetchat = (e) => {
        this.inputRef._ref.value = ""; // Clear chat message
    }


    render() {
        return (
            this.props.yourself() ?
            <div className='searched-user-div'>
                <div className='searched-user-username-container'>
                    <img className="searched-user-avatar" src={require("./static/bobby.jpg")}></img>
                    <div className='searched-user-username'>{this.props.searcheduser}</div>
                    <div className="search-chat-form"></div>
                    <div className="search-textarea-chat-autosize"></div>
                    <div className="search-chat-submit"></div>
                </div>
            </div>
            :
            <div className="search-users-relative-div">
                <div ref={this.spinnerRef} className="spinner-search-holder">
                    <div className="loadingio-spinner-dual-ball loadingio-spinner-dual-ball-m6fvn6j93c"><div className="ldio-oo3b7d4nmnr">
                    <div></div><div></div><div></div>
                    </div></div>
                    <div className="cover-search"></div>
                </div>
                <div className='searched-user-div'>
                    <div className='searched-user-username-container'>
                        <img className="searched-user-avatar" src={require("./static/bobby.jpg")}></img>
                        <div className='searched-user-username'>{this.props.searcheduser}</div>
                        <div className='search-user-dropdown search-user-dropdown-search'>
                            <img className="circle-menu-icon" src={circlemenulight} alt="circlemenu"></img>
                            <div className="dropdown-content dropdown-content-search searchdropdownfix">
                                <button className='dropdown-content-option'>share profile</button>
                                <button className='dropdown-content-option'>watch</button>
                                <div className='dropdown-content-divider'>&nbsp;</div>
                                {
                                    this.props.alreadyfriends() ? // Redundant unfriend option, default location is in friends component. Shows in both
                                            this.state.removeprompt == false ? // Prompt functionality to ask to unfriend
                                                <button type="button" className='dropdown-content-option' onClick={this.promptremovefriend}>unfriend</button>
                                                :
                                                <div className='prompt-spacing prompt-background'>
                                                    <span className='opensans-thin'>Sure you want to unfriend <span className="friendname-small">{this.props.searcheduser}</span>?</span>
                                                    <div className='prompt-yesno-spacing'><span><button className ="button-yes" onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser); this.promptexitremovefriend()}}>Yes</button></span><span><button className ="button-no" type="button" onClick={this.promptexitremovefriend}>No</button></span></div>
                                                </div>
                                        :
                                        <div></div>
                                }
                                {
                                    this.state.blockprompt == false ? // Prompt functionality to block
                                        <button className='dropdown-content-option block-option-dropdown' onClick={this.promptblockuser}>block</button>
                                        :
                                        <div className='prompt-spacing prompt-background'>
                                            <span className='opensans-thin'>Sure you want to block <span className="friendname-small">{this.props.searcheduser}</span>?</span>
                                            <span><button className ="button-yes" onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser); this.promptexitblockuser()}}>Yes</button></span><span><button className="button-no" type="button" onClick={this.promptexitblockuser}>No</button></span>
                                        </div>
                                }
                                <button className='dropdown-content-option report-option-dropdown'>report</button>
                            </div>
                        </div>

                    </div>
                    <div className='request-and-block-container'>
                        <span className='search-user-profile'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></span>
                        {
                            this.props.alreadyfriends() ?
                                <span className='search-profile-bump-container'><span className='search-user-watch'>watch<img className="searched-user-icon" src={play} alt="play"></img></span><span className='search-user-bump'>bump<img className="searched-user-icon" src={pointingfinger} alt="pointingfinger"></img></span></span>
                                : this.props.requestwaiting() ?
                                    <span className='search-profile-bump-container'>
                                        <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                        <div className='search-user-accept-friend-request' onClick={(e) => {this.props.acceptfriendrequest(e, this.props.searcheduser, true); this.setSpinner();}}>accept<img className="searched-user-icon" src={heart} alt="heart"></img></div>
                                    </span>
                                    : this.props.alreadypending() ?
                                        <span className='search-profile-bump-container'>
                                            <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                            <div className='search-user-pending-friend-request' onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser, true); this.setSpinner();}}>pending</div>
                                        </span>
                                        :
                                        <span className='search-profile-bump-container'>
                                            <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                            <div className='searched-user-send-friend-request' onClick={(e) => {this.props.sendfriendrequest(e, this.props.searcheduser); this.setSpinner();}}>invite<img className="searched-user-icon" src={heart} alt="friend request"></img></div>
                                        </span>
                        }
                        <div className='searched-user-message' onClick={this.openchatinput}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                    </div>
                    <form className='search-chat-form search-chat-form-closed' method="PUT" action="/chat" ref={tag => (this.searchChatFormRef = tag)}>
                        <span>
                        <TextareaAutosize className='search-textarea-chat-autosize search-textarea-chat-autosize-closed' ref={tag => (this.inputRef = tag)} onKeyPress={(e) => {this.handleKeyPress(e, this.props.searcheduser)}} />
                        <button className='search-chat-submit' onClick={(e) => {this.props.beginchat(e, this.props.searcheduser, this.inputRef._ref.value, null, true), this.resetchat(e)}} type='submit' value='submit' ref={tag => (this.searchChatSubmitRef = tag)}><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
                        </span>
                    </form>
                </div>
            </div>
        )
    }
}

class NonFriendConversation extends Component { // non friend conversation nfc1
    constructor(props) {
        super(props);
        this.inputRef = React.createRef();
        this.scrollRef = React.createRef();
        this.userRef = React.createRef();
        this.state = { blockprompt: false, reportprompt: false, chatinput: false, chatlength: null

        }
    }

    componentDidMount() {
        if (this.props.conversation) {
            this.setState({ chatlength: this.props.conversation.log.length });
        }
    }
    
    componentDidUpdate(prevProps, prevState) {
        let currentchatlength;
        let scrollChat = (i, speed) => { // Recursive scroll function, runs 3 times to definitively get length of scroll
            if (i != 0) {
                setTimeout(() => {
                    if (getHeight() > tempHeight) {
                        tempHeight = getHeight();
                        this.scrollRef.current.scrollBy({
                            top: getHeight(),
                            behavior: "smooth"
                        });
                        i++; // If scroll ran, increment once
                    }
                    // console.log(i);
                    if (i>0) { i--; }
                    scrollChat(i, speed += 20); // Increase timeout time to ensure scroll
                }, speed);
            }
        }
        let getHeight = function() {
            if (document.getElementById('openotheruserchat')) {
                let height = document.getElementById('openotheruserchat').scrollHeight;
                return height;
            }
        }

        let tempHeight = getHeight();
        
        if (prevProps) {
            if (prevState.chatinput == false) { // If chat was just closed, scroll chat down now that it is open. Does not fire when chat is already open
                if (this.state.chatinput == true) {
                    if (this.scrollRef.current) { // Prevents crash when no friends
                        scrollChat(4, 10); // Run recursive scrollChat func
                    }
                }
            }

            currentchatlength = this.props.conversation.log.length;

            if (currentchatlength) { // Autoscrolls on new chat
                if (this.state.chatlength == null) { // Chat length was null, set new
                    this.setState({ chatlength: currentchatlength });
                } else if (this.state.chatlength < currentchatlength) { // NEW CHAT, Chat length has been updated. Run scroll anim
                    this.setState({ chatlength: currentchatlength });
                    let newlogheight = 0;
                    newlogheight += this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1].getBoundingClientRect().height;
                    if ((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= 480) { // the difference between total height of chat, distance from top and the height of the last chat log. If less than or equal to 480 than bring scroll down when chat updated
                        if (document.getElementsByClassName("otheruserchat-chat-container-open")[0]) {
                            if (document.getElementsByClassName("otheruserchat-chat-container-open")[0].scrollHeight) {
                                let height = document.getElementsByClassName("otheruserchat-chat-container-open")[0].scrollHeight;
                                document.getElementsByClassName("otheruserchat-chat-container-open")[0].scrollBy({
                                    top: height,
                                    behavior: "smooth"
                                });
                            }
                        }
                    }
                }
            }
        }
        
        if (prevState) { // Changes chat input from true to false. Demonstrating if chat is open or not. If there was a previous state
            if (!prevState.chatinput) { // If previous chat input was false
                if (this.props.otheruserchatopen == this.userRef.innerHTML) { // If this friend is the current open chat
                    if (this.state.chatinput == false) { // and if this chatinput is still false
                        this.setState({ chatinput: true }); // change to true
                    }
                }
            } else {
                if (this.props.otheruserchatopen !== this.userRef.innerHTML) {
                    if (this.state.chatinput == true) {
                        this.setState({ chatinput: false });
                    }
                }
            }
        }
    }

    promptblockuser = (e) => {
        this.setState({ blockprompt: true });
    }
    promptexitblockuser = (e) => {
        this.setState({ blockprompt: false });
    }

    openchatinput = (e, otheruser) => {
        // console.log(e.target.classList);
        let room;
        if (this.props.conversation) {
            room = this.props.conversation._id;
        }
        // If user clicks on profile, do not open chat submit
        if (e.target.classList.contains("minimize-icon")) {
            this.props.updateotheruserchatopen(e, null);
        } else {
            this.props.updateotheruserchatopen(e, otheruser, room);
        }
        if (e.target.classList.contains("searched-user-message")) { // When user clicks on message, scroll down chat
            this.scrollRef.current.scrollBy({
                top: this.scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }

    handleKeyPress = (e, otheruser) => {
        if(e.key === 'Enter'){
            e.preventDefault();
            let sendchat = (e) => {
                this.props.beginchat(e, otheruser, this.inputRef._ref.value, this.props.conversation._id), this.resetchat(e);
            }
            sendchat(e);
        }
    }

    resetchat = (e) => {
        this.inputRef._ref.value = ""; // Clear chat message
    }

    searchandbefriend = (e, otheruser) => { // Queries for user and automatically sends invite for friendship.
        document.getElementsByClassName("user-search")[0].value = otheruser; // Set otheruser value to search
        this.props.searchforminput(); // Run searchform css styling functions.
        let userelement;
        let getuserelement = () => {
            // Check to ensure that the searched username only matches the name of non friend to invite to be friends
            if (document.getElementsByClassName("searched-user-div")[0]) {
                for (let i = 0; i < document.getElementsByClassName("search-users-results-container")[0].firstElementChild.childElementCount; i++) { // For each user in search view
                    if (document.getElementsByClassName("searched-user-div")[i]) { // if iterated child search user div exists
                        let userelement = document.getElementsByClassName("searched-user-div")[i]; // Assign current div to element variable
                        if (userelement.getElementsByClassName("searched-user-username")[0].innerHTML == otheruser) { // if innerhtml of this elements username element == otheruser
                            return userelement; // confirm appropriate element
                        } else {
                            return false;
                        }
                    }
                }
            }
        }
        let fetchusers = new Promise((resolve, reject) => { // Promise to fetch new users
            resolve(this.props.fetchusers());
            document.getElementsByClassName("user-search")[0].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"}); // Scroll up search into view
        });
        fetchusers.then((e) => {
            // Actual functionality to click and invite user to be friends
            let invReq = function() {
                let element = getuserelement();
                if (element) {
                    if (element.getElementsByClassName("searched-user-send-friend-request")[0]) {
                        element.getElementsByClassName("searched-user-send-friend-request")[0].click();
                        //console.log("click!");
                        return true;
                    }
                }
                return false;
            }

            let k = 0;
            let interval = setInterval(function() { // Run send invite method every x seconds until method has ran successfully and sent invite
                console.log(k+=1);
                let invDone = invReq(); // Check if invite ran successfully.
                let element = getuserelement();
                // If invite done or element invite to be friend option doesnt exist or if search user results container is not open
                if (invDone || (element && (!element.getElementsByClassName("search-user-send-friend-request")[0] || element.getElementsByClassName("spinner-search-holder-visible"))) || !document.getElementsByClassName("search-users-results-container-opened")[0]) {
                    clearInterval(interval);
                    console.log("interval clear: invite nonfriendcomponent");
                }
            }, 100);
        })
    }

    render() {
        // basic functionality, if pending add option to add friend, show if pending, block option, send messages, chat.
        let otheruser = "";
        for (const [index, user] of this.props.conversation.users.entries()) { // Iterate between users to find out which one is not you, this is the user that is not your friend that this chat belongs to.
            if (user != this.props.username) { otheruser = user; }
        }
        
        let pending = (e) => { // Determines if a friend request from this user is waiting
            for (let i = 0; i < this.props.pendingfriendrequests.length; i++) {
                if (this.props.pendingfriendrequests[i].username == otheruser) {
                    return true;
                }
            }
        }


        return (

            <div>
            {
                this.props.conversation ?
                    <div className="otheruser" onClick={!this.state.chatinput ? (e) => {this.openchatinput(e, otheruser)} : null }>
                        <div className='searched-user-username-container'>
                            <img className="otheruseravatar" src={require("./static/bobby.jpg")}></img>
                            <div ref={tag => (this.userRef = tag)} className="otherusername">{otheruser}</div>
                            <div className="min-menu">
                                <img className={this.state.chatinput ? "minimize-icon" : "minimize-icon invisible"} src={minimize} onClick={(e) => {this.openchatinput(e)}} alt="circlemenu"></img>
                                <div className="search-user-dropdown">
                                    <img className="circle-menu-icon" src={circlemenulight} alt="circlemenu"></img>
                                    <div className="dropdown-content searchdropdownfix prevent-open-toggle">
                                        <button className='dropdown-content-option prevent-open-toggle'>share profile</button>
                                        {
                                            this.props.pendingfriendrequests ? !pending() ?
                                                    <button className='dropdown-content-option prevent-open-toggle' onClick={e => {this.searchandbefriend(e, otheruser)}}>invite</button>
                                                    :
                                                    <div></div>
                                                : <div></div>
                                        }
                                        {
                                            this.state.blockprompt == false ? // Prompt functionality to block
                                                <button className='dropdown-content-option block-option-dropdown prevent-open-toggle' onClick={this.promptblockuser}>block</button>
                                                :
                                                <div className='prompt-spacing prompt-background prevent-open-toggle'>
                                                    <span className='opensans-thin prevent-open-toggle'>Sure you want to block <span className="otherusername-small prevent-open-toggle">{otheruser}</span>?</span>
                                                    <span className="prevent-open-toggle"><button className ="button-yes prevent-open-toggle" onClick={(e) => {this.props.revokefriendrequest(e, otheruser, false, "nonfriendslist")}}>Yes</button></span><span className="prevent-open-toggle"><button className ="button-no prevent-open-toggle" type="button" onClick={this.promptexitblockuser}>No</button></span>
                                                </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                            {
                                this.props.pendingfriendrequests ? pending() ?
                                    <div className="request-and-block-container">
                                        <div className='searched-user-befriend prevent-open-toggle' onClick={(e) => {this.props.acceptfriendrequest(e, otheruser, true)}}>befriend<img className="searched-user-icon prevent-open-toggle" src={heart} alt="chat"></img></div><div className='searched-user-unfriend prevent-open-toggle' onClick={(e) => {this.props.revokefriendrequest(e, otheruser, false, "nonfriendslist")}}>ignore<img className="searched-user-icon-block prevent-open-toggle" src={close} alt="chat"></img></div>
                                        <div className='search-user-profile prevent-open-toggle'>profile<img className="searched-user-icon prevent-open-toggle" src={profile} alt="profile"></img></div>
                                        <div className='searched-user-message' onClick={(e) => {this.openchatinput(e, otheruser)}}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                                    </div>
                                : <div className="request-and-block-container request-and-block-nonfriend">
                                    <div className='search-user-profile'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></div>
                                    <div className='searched-user-message' onClick={(e) => {this.openchatinput(e, otheruser)}}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                                </div> : <div></div>
                            }
                        <div className="otheruserchat otheruserchat-container">
                        <div ref={this.scrollRef} id={this.props.otheruserchatopen === otheruser ? 'openotheruserchat' : 'closedotheruserchat'} className={
                            !this.state.chatlength ? "otheruserchat-chat-container otheruserchat-chat-container-empty" // If length of chat is null
                            : this.props.otheruserchatopen == otheruser ? "otheruserchat-chat-container otheruserchat-chat-container-open"  // If otheruserchatopen == this current user
                            : "otheruserchat-chat-container otheruserchat-chat-container-closed"
                        }>
                        {
                            this.props.conversation.users.length == 2 ?
                                this.props.conversation.log.map((log, index) => {
                                    if (this.props.otheruserchatopen === otheruser) { // if the open other user chat is this chat
                                        if (log.author == this.props.username) { // if this log is your chat
                                            return (
                                                <div className='chat-log chat-log-user chat-log-open'>
                                                    <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                    <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                        <div>{log.content}</div>
                                                    </div>
                                                </div>
                                            )
                                        } else { // log belongs to other user
                                            return (
                                                <div className='chat-log chat-log-other chat-log-open'>
                                                    <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                    <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                        <div>{log.content}</div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                    } else { // if the open other user chat is not this chat
                                        if (log.author == this.props.username) {
                                            if (index == this.props.conversation.log.length-1) {
                                                return (
                                                    <div className='chat-log chat-log-user'>
                                                        <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className='chat-log chat-log-user chat-log-closed'>
                                                        <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            }

                                        } else {
                                            if (index == this.props.conversation.log.length-1) {
                                                return (
                                                    <div className='chat-log chat-log-other'>
                                                        <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className='chat-log chat-log-other chat-log-closed'>
                                                        <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        }
                                    }
                                })
                            :
                            <div></div>
                        }
                        </div>
                    </div>
                    <form className={ this.props.otheruserchatopen == otheruser ? "friend-chat-form friend-chat-form-closed friend-chat-form-open"
                                    : "friend-chat-form friend-chat-form-closed"}
                        >
                        <span>
                        <TextareaAutosize className ={this.props.otheruserchatopen == otheruser ? "textarea-chat-autosize"
                                                     : "textarea-chat-autosize textarea-chat-autosize-closed"}
                        ref={tag => (this.inputRef = tag)} onKeyPress={(e) => {this.handleKeyPress(e, otheruser)}} />
                        <button className={this.props.otheruserchatopen == otheruser ? "friend-chat-submit friend-chat-submit-open"
                                          : "friend-chat-submit"}
                        onClick={(e) => {this.props.beginchat(e, otheruser, this.inputRef._ref.value, this.props.conversation._id), this.resetchat(e)}} type='submit' value='submit'><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
                        </span>
                    </form>
                </div>
                
                :
                <div></div>
            }
            <div>
                <div className='content-divider-thin'>&nbsp;</div>
            </div>
            </div>
        )
    }
}

let bumpRunning = 0;
let shakeRunning = 0;
// Individual friend
class Friend extends Component { // friend component fc1
    constructor(props) {
            super(props);
            this.inputRef = React.createRef();
            this.scrollRef = React.createRef();
            this.typingRef = React.createRef();
            this.shakeRef = React.createRef();
            this.bumpBtnRef = React.createRef();
            this.state = { removeprompt: false, blockprompt: false,  reportprompt: false, chatinput: false,
                chatlength: 0, typingOld: null }
            this.handleChange = this.handleChange.bind(this);
        }

    componentDidMount() {
        let currentchatlength = 0;
        //console.log(this.props.friend);
        if (this.props.conversation) {
            currentchatlength = this.props.conversation.log.length;
        }
        
        if (currentchatlength) {
            this.setState({ chatlength: currentchatlength }); // Sets length of chat when it is equal to null at componentDidMount
        }

        bumpEvent.on('bump', (data) => { // bump functionality. Bumps friend via socket room.
            let user = data.match(bumpRegex)[2];
            if (user == this.props.friend) {
                if (this.shakeRef.current) {
                    this.shakeRef.current.classList.add("shake", "shake-constant", "shake-bump");
                    shakeRunning +=1;
                    setTimeout(() => { // turn off rumble after short time
                        shakeRunning--;
                        if (shakeRunning == 0) {
                            this.shakeRef.current.classList.remove("shake", "shake-constant", "shake-bump");
                        }
                    }, 200);
                }
            } else if (user == this.props.username) { // application recieved the bump it sent out and is filtering to provide feedback that it was sent
                if (data.match(bumpRegex)[3] == this.props.friend) {
                    if (this.bumpBtnRef.current) {
                        this.bumpBtnRef.current.classList.add("shake", "shake-constant", "shake-bump");
                        bumpRunning +=1;
                        setTimeout(() => { // turn off rumble after short time
                            bumpRunning--;
                            if (bumpRunning == 0) {
                                this.bumpBtnRef.current.classList.remove("shake", "shake-constant", "shake-bump");
                            }
                        }, 200);
                    }
                }
            }
        })
    }

    componentWillUpdate() {
        
    }

    componentDidUpdate(prevProps, prevState) {
        // reset shake if error and still rumbling
        if (this.shakeRef.current) {
            this.shakeRef.current.classList.remove("shake", "shake-constant", "shake-bump");
        }

        if (this.bumpBtnRef.current) {
            this.bumpBtnRef.current.classList.remove("shake", "shake-constant", "shake-bump");
        }
        // On update, scroll chat down to most recent chat if user is not actively scrolling through
        if (prevProps) { // if previous props
            let currentchatlength;
            if (prevState.chatinput == false) { // If chat was closed in previous state, scroll chat down now that it is open. Does not fire when chat is already open
                if (this.state.chatinput == true ) {
                    let getHeight = function() { // get height of chat
                        if (document.getElementById('openfriendchat')) {
                            let height = document.getElementById('openfriendchat').scrollHeight;
                            return height;
                        }
                    }

                    if (getHeight() > 4000) {
                        this.scrollRef.current.scrollBy({
                            top: getHeight()-3000,
                            behavior: "auto"
                        });
                    }
                    let tempHeight = getHeight();
                    let scrollChat = (i, speed) => { // Recursive scroll function, runs 3 times to definitively get length of scroll
                        if (i != 0) {
                            setTimeout(() => {
                                if (getHeight() > tempHeight) {
                                    // console.log(getHeight(), tempHeight);
                                    tempHeight = getHeight();
                                    this.scrollRef.current.scrollBy({
                                        top: getHeight()*2,
                                        behavior: "smooth"
                                    });
                                    i++; // If scroll ran, increment once
                                }
                                if (i>0) { i--; }
                                scrollChat(i, speed += 20); // Increase timeout time to ensure scroll
                            }, speed);
                        }
                    }
                    if (this.scrollRef.current) { // Prevents crash when no friends
                        scrollChat(4, 10);
                    }
                }
            }

            let getChatLength = () => {
                if (this.props.conversation) {
                    currentchatlength = this.props.conversation.log.length;
                }
            }

            let detectNearBottom = () => {
                if (this.state.chatinput) {
                    // This determines if scroll position is near bottom of chat. If scrollheight - scrolltop position - newlog height is less than ... then scroll to bottom for new chat. Value scrollheight - scrolltop usually gets is 362.
                    // This occurs so that when user is near bottom of chat they do not have to scroll down to see new chat. It will automatically update, but if user is NOT near bottom, do not interrupt their reading of previous chat logs by scrolling.

                    // console.log(this.scrollRef.current.scrollHeight, this.scrollRef.current.scrollTop);
                    let newlogheight = 0;
                    if (this.scrollRef) { // Gets height of new log
                        if (this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1]) {
                            newlogheight += this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1].getBoundingClientRect().height;
                        }

                        let scrollHeight = this.scrollRef.current.scrollHeight;
                        // console.log("current scroll top: " + this.scrollRef.current.scrollTop);
                        if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
                            // console.log("current scroll height: " + document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight);
                        }
                        if ((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= scrollHeight*0.20 ||
                            (this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= 362) {
                            // console.log("Scroll height: " + scrollHeight);
                            // console.log("new log height: " + newlogheight);
                            // console.log((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) + " less than? " + scrollHeight*0.07 + " or 362");
                            if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
                                if (document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight) {
                                    console.log("detectNearBottom() method running");
                                    let height = document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight;
                                    document.getElementsByClassName("friendchat-chat-container-open")[0].scrollBy({
                                        top: height,
                                        behavior: "smooth"
                                    });
                                }
                            }
                        }
                        if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
                            if (document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight <= 1500) {
                                // console.log("If height less than 1500 scroll" + document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight);
                                this.scrollRef.current.scrollBy({
                                    top: 1000,
                                    behavior: "smooth"
                                });
                            }
                        }
                    }
                }
            }

            let detectVeryCloseBottom = () => { // runs as typing is updated
                if (this.state.chatinput) {
                    let newlogheight = 0;
                    let scrollHeight = this.scrollRef.current.scrollHeight;

                    if (this.props.typing) {
                        if (this.scrollRef) {
                            if (this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1]) {
                                if (this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1]) {
                                    newlogheight += this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1].getBoundingClientRect().height;
                                }
                            }
                        }
                        // console.log("Scroll height: " + this.scrollRef.current.scrollHeight);
                        // console.log("Scroll top: " + this.scrollRef.current.scrollTop);
                        // console.log(this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight + " less than? vv");
                        // console.log(scrollHeight*0.05 + " or 363");
                        if ((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= scrollHeight*0.05 ||
                            (this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= 363) {
                            if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
                                // console.log("detectVeryCloseBottom() method running");
                                document.getElementsByClassName("friendchat-chat-container-open")[0].scrollBy({
                                    top: 10000000000,
                                    behavior: "smooth"
                                });
                            }
                        }
                    }
                }
            }
            detectVeryCloseBottom();

            let setStateScrollChat = () => {
                if (this.props.typing) {
                    if (!prevProps.typing && this.props.typing.match(typingRegex)[2].length > 0) {
                        detectNearBottom();
                    }
                }
                if (prevProps.typing && this.props.typing) {
                    if(prevProps.typing.match(typingRegex)[2].length == 0 && this.props.typing.match(typingRegex)[2].length > 0) {
                        detectNearBottom();
                    }
                }

                if (currentchatlength) {
                    if (this.state.chatlength < currentchatlength) { // NEW CHAT, Chat length has been updated. Run scroll anim
                        // This will only fire when there is a valid current chat length and its value is greater than the recorded state chat length.
                        if (this.scrollRef.current.hasChildNodes()) { // A check to ensure that this scroll ref has chats belonging to it in the DOM.
                            this.setState({ chatlength: currentchatlength });
                        }

                        detectNearBottom();

                    }
                } else if (!currentchatlength && this.state.chatlength != 0 ) {
                    // If data curruption or chat wrongly assigned chatlength, this will return it to 0 if there is an undefined chatlength.
                    // This will be useful when a chat conversation is cleared or deleted some how
                    this.setState({ chatlength: 0 });
                }
            }

            let changeChatLengthState = new Promise((resolve, reject) => {
                resolve(getChatLength());
            })

            if (this.props.friend) {
                changeChatLengthState.then((e) => {
                    setStateScrollChat();
                })
            }
        }
        
        if (prevState) { // Changes chat input from true to false. Demonstrating if chat is open or not. If there was a previous state
            if (!prevState.chatinput) { // If previous chat input was false
                if (this.props.friendchatopen == this.props.friend) { // If this friend is the current open chat
                    if (this.state.chatinput == false) { // and if this chatinput is still false
                        this.setState({ chatinput: true }); // change to true
                    }
                }
            } else {
                if (this.props.friendchatopen !== this.props.friend) {
                    if (this.state.chatinput == true) {
                        this.setState({ chatinput: false });
                    }
                }
            }
        }
    }

    promptremovefriend = (e) => {
        this.setState({ removeprompt: true });
        console.log('remove friend prompt');
    }
    promptexitremovefriend = (e) => {
        this.setState({ removeprompt: false });
    }
    promptblockuser = (e) => {
        this.setState({ blockprompt: true });
    }
    promptexitblockuser = (e) => {
        this.setState({ blockprompt: false });
    }

    openchatinput = (e, minimize) => {
        // Runs method in social component. If user clicks on bump or profile, do not open chat submit
        let room;
        if (this.props.conversation) {
            room = this.props.conversation._id;
        }
        if (e.target.classList.contains("minimize-icon")) {
            this.props.updatefriendchatopen(e, null);
        } else {
            this.props.updatefriendchatopen(e, this.props.friend, room );
        }
        if (e.target.classList.contains("searched-user-message")) { // When user clicks on message, scroll down chat
            this.scrollRef.current.scrollBy({
                top: this.scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }

    handleKeyPress = (e) => { // Emit cleared message when message is sent
        if(e.key === 'Enter'){
            e.preventDefault();
            let sendchat = (e) => {
                this.props.beginchat(e, this.props.friend, this.inputRef._ref.value, this.props.conversation ? this.props.conversation._id : null); this.resetchat(e);
            }
            sendchat(e);

            let roomId = this.props.conversation ? this.props.conversation._id : null;
            let leanString = this.props.username + ";" + "" + ";" + roomId;
            let ba = lzw.compress(leanString); // compress data as binary array before sending to socket
            setTimeout(() => {
                socket.emit('typing', ba);
            }, 30);

        }
    }

    handleChange = (e) => { // Emit typing to users in chat via socket
        if (this.props.conversation) {
            let leanString = this.props.username + ";" + this.inputRef._ref.value + ";" + this.props.conversation._id;
            let ba = lzw.compress(leanString); // compress data as binary array before sending to socket
            socket.emit('typing', ba);
        }
    }
    
    resetchat = (e) => {
        this.inputRef._ref.value = ""; // Clear chat message
    }

    render() {
        let conversationid;
        if (this.props.conversation) {
            conversationid = this.props.conversation._id;
        }
        return (
            <div className="friend-container" ref={this.shakeRef}>
                <div className={this.props.friendstotal == 1 ? "friend-single" : "friend"} onClick={!this.state.chatinput ? (e) => {this.openchatinput(e)} : null }>
                    <div className='searched-user-username-container'>
                        <img className="friendavatar" src={require("./static/bobby.jpg")}></img>
                        <div className="friendname">{this.props.friend}</div>
                        <div className="min-menu">
                            <img className={this.state.chatinput ? "minimize-icon" : "minimize-icon invisible"} src={minimize} onClick={(e) => {this.openchatinput(e, true)}} alt="circlemenu"></img>
                            <div className='search-user-dropdown'>
                                <img className="circle-menu-icon prevent-open-toggle" src={circlemenulight} alt="circlemenu"></img>
                                <div className="dropdown-content searchdropdownfix prevent-open-toggle">
                                    <button className='dropdown-content-option prevent-open-toggle'>share profile</button>

                                    {
                                        this.state.removeprompt == false ? // Prompt functionality to ask to unfriend
                                            <button type="button" className='dropdown-content-option prevent-open-toggle' onClick={this.promptremovefriend}>unfriend</button>
                                            :
                                            <div className='prompt-spacing prompt-background prevent-open-toggle'>
                                                <span className='opensans-thin prevent-open-toggle'>unfriend <span className="friendname-small prevent-open-toggle">{this.props.friend}</span>?</span>
                                                <div className='prompt-yesno-spacing prevent-open-toggle'><span className="prevent-open-toggle"><button className="button-yes prevent-open-toggle" type="button" onClick={(e) => {this.props.revokefriendrequest(e, this.props.friend); this.promptexitremovefriend()}}>Yes</button></span><span className="prevent-open-toggle"><button className ="button-no prevent-open-toggle" type="button" onClick={this.promptexitremovefriend}>No</button></span></div>
                                            </div>
                                    }
                                    {
                                        this.state.blockprompt == false ? // Prompt functionality to block
                                            <button className='dropdown-content-option block-option-dropdown prevent-open-toggle' onClick={this.promptblockuser}>block</button>
                                            :
                                            <div className='prompt-spacing prompt-background prevent-open-toggle'>
                                                <span className='opensans-thin prevent-open-toggle'>block <span className="friendname-small prevent-open-toggle">{this.props.friend}</span>?</span>
                                                <div className="prompt-yesno-spacing prevent-open-toggle"><span className="prevent-open-toggle"><button className ="button-yes prevent-open-toggle" type="button" onClick={(e) => {this.props.revokefriendrequest(e, this.props.friend); this.promptexitblockuser()}}>Yes</button></span><span className="prevent-open-toggle"><button className ="button-no prevent-open-toggle" type="button" onClick={this.promptexitblockuser}>No</button></span></div>
                                            </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    {
                        this.props.watching ?
                            <span className="iswatchingtitle"> is watching <strong>{this.props.watching}</strong></span>
                            :
                            <span></span>
                    }
                    <div className='request-and-block-container'>
                        <span className='search-user-profile prevent-open-toggle'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></span>
                        <span className='search-user-watch-friend'>watch<img className="searched-user-icon" src={play} alt="play"></img></span>
                        <span className='search-user-bump-friend prevent-open-toggle' ref={this.bumpBtnRef} onClick={(e) => {this.props.bump(e, this.props.friend, conversationid )}}>bump<img className="searched-user-icon bump-icon" src={pointingfinger} alt="pointingfinger"></img></span>
                        <div className='searched-user-message' onClick={(e) => {this.openchatinput(e)}}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                    </div>
                    <div className="friendchat friendchat-container">
                        <div ref={this.scrollRef} id={this.props.friendchatopen === this.props.friend ? 'openfriendchat' : 'closedfriendchat'} className={
                            this.state.chatlength == 0 ? "friendchat-chat-container friendchat-chat-container-empty" // If length of chat is 0
                            : !this.props.friend ? "friendchat-chat-container friendchat-chat-container-closed" // If this is not the friend of this loaded component
                            : this.props.friendchatopen == this.props.friend ? "friendchat-chat-container friendchat-chat-container-open"  // If friendchatopen == this current friend
                            : "friendchat-chat-container friendchat-chat-container-closed"
                        }>
                        {
                            this.props.conversation ?
                                this.props.conversation.log.map((log, index) => {
                                    // console.log(log.author, log.content);
                                    if (this.props.friendchatopen === this.props.friend) { // if the open chat is this friend, set open classes
                                        if (log.author == this.props.username) { // if the author is the user logged in
                                            return (
                                                <div className='chat-log chat-log-user chat-log-open'>
                                                    <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                    <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                        <div>{log.content}</div></div>
                                                </div>
                                            )
                                        } else {
                                            return (
                                                <div className='chat-log chat-log-other chat-log-open'>
                                                    <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                    <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}><div>{log.content}</div></div>
                                                </div>

                                            )
                                        }
                                    } else { // if open chat != this friend, set closed classes
                                        if (log.author == this.props.username) {
                                            if (index == this.props.conversation.log.length-1) {
                                                return (
                                                    <div className={this.props.typing ? this.props.typing.match(typingRegex)[2].length > 0 ? "chat-log chat-log-user chat-log-closed" : "chat-log chat-log-user" : "chat-log chat-log-user"}>
                                                        <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div></div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className='chat-log chat-log-user chat-log-closed'>
                                                        <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div></div>
                                                    </div>
                                                )
                                            }
                                        } else {
                                            if (index == this.props.conversation.log.length-1) {
                                                return (
                                                    <div className={this.props.typing ? this.props.typing.match(typingRegex)[2].length > 0 ? "chat-log chat-log-other chat-log-closed" : "chat-log chat-log-other" : "chat-log chat-log-other"}>
                                                        <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}><div>{log.content}</div></div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className='chat-log chat-log-other chat-log-closed'>
                                                        <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}><div>{log.content}</div></div>
                                                    </div>
                                                )
                                            }
                                        }
                                    }
                                })
                               :<div></div>
                        }
                        <div className={this.props.typing ? this.props.typing.match(typingRegex)[2].length > 0 ? "chat-log chat-log-other typing-cell typing-cell-visible" : "chat-log chat-log-other typing-cell typing-cell" : "chat-log chat-log-other typing-cell"}
                        ref={tag => (this.typingRef = tag)}>
                            <div className='author-of-chat author-of-chat-other'>{ this.props.typing ? this.props.typing.match(typingRegex)[1] : null }</div>
                            <div className={ this.props.typing ? this.props.typing.match(typingRegex)[2].length < 35 ? 'content-of-chat' : 'content-of-chat typing-content-of-chat-long' : 'content-of-chat' }><div>{this.props.typing ? this.props.typing.match(typingRegex)[2] : null}</div></div>
                        </div>
                        </div>
                    </div>
                    <form className={ !this.props.friend ? "friend-chat-form friend-chat-form-closed" // if not friend
                             : this.props.friendchatopen == this.props.friend ? "friend-chat-form friend-chat-form-closed friend-chat-form-open" // if open chat == this friend
                             : "friend-chat-form friend-chat-form-closed"}
                        >
                        <span>
                        <TextareaAutosize className ={!this.props.friend ? "textarea-chat-autosize textarea-chat-autosize-closed" // if not friend
                            : this.props.friendchatopen == this.props.friend ? "textarea-chat-autosize" // if open chat == this friend
                            : "textarea-chat-autosize textarea-chat-autosize-closed"}
                        ref={tag => (this.inputRef = tag)} onKeyPress={this.handleKeyPress} onChange={this.handleChange} />
                        <button className={!this.props.friend ? "friend-chat-submit prevent-open-toggle" // if not friend
                            : this.props.friendchatopen == this.props.friend ? "friend-chat-submit friend-chat-submit-open prevent-open-toggle" // if open chat == friend
                            : "friend-chat-submit prevent-open-toggle"}
                        onClick={(e) => {this.props.beginchat(e, this.props.friend, this.inputRef._ref.value, this.props.conversation ? this.props.conversation._id : null), this.resetchat(e)}} type='submit' value='submit'><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
                        </span>
                    </form>
                </div>
                <div>
                    <div className='content-divider-thin'>&nbsp;</div>
                </div>
            </div>
        )
    }
}

function Social(props) { // social prop sp1
    let limit;
    let setlimit = (e) => {
        if (props.searchusers[0] && props.searchusers[1].moreusers) {
            console.log(props.searchusers[0].length);
            console.log(props.searchusers);
            limit = Math.ceil(props.searchusers[0].length / 10) * 10;
            props.limitedsearch(props.username, limit+10); // Does limited search for more users in search bar
        }
    }

    let pendingsetvalue = false;
    if (props.pendinghidden == "hidden") {
        pendingsetvalue = "show";
    } else {
        pendingsetvalue = "hidden";
    }

    let childCounter = 0;
    return (
        <div id="socialContainer">
            <div className="userquickdash row">
                <div className="friend-requests-view">
                    <button className="following-view">following</button>
                    <button className="requests-view" onClick={(e) => {props.getpendingrequests(pendingsetvalue, true, props.username)}}>requests</button>
                </div>
                <div>
                    <img className="minimize-dash" src={angleDoubleLeft} alt="hamburger" onClick={props.toggleSideBar}></img>
                </div>
            </div>
            <div className={props.pendinghidden == "hidden" ? 'friend-requests-list-hidden' : 'friend-requests-list'}>
                <div>
                    {props.pendingfriendrequests ?
                        props.pendingfriendrequests.map ?
                            props.pendingfriendrequests.map(function(request, index) {
                            return (
                                <Request
                                userrequest={request.username}
                                acceptfriendrequest={props.acceptfriendrequest}
                                revokefriendrequest={props.revokefriendrequest}
                                key={childCounter}
                                index={childCounter++}
                                />
                            )
                        })
                    : <div></div> : <div></div>
                    }
                </div>
            </div>
            <div>
                <form className="search-form-flex" onInput={props.debouncefetchusers} onChange={props.searchforminput} onSubmit={props.fetchuserpreventsubmit} noValidate='noValidate' autoComplete='off'>
                    <span className="text-input-wrapper searchusers-text-input">
                        <input className="user-search" id="usersearch" type="search" placeholder="Search users.." name="usersearch"></input>
                        <span className="clear" onClick={props.searchformclear} title="Clear">&times;</span>
                    </span>
                </form>
            </div>
            <div className='search-users-results-container'>
                <div>
                    {
                    props.searchusers ?
                        props.searchusers[0] ?
                            props.searchusers[0].map(function(searcheduser, index) {

                                let alreadypending = function() {  // Determine if the user is on searched users pending list. Waiting for accept.
                                    for (var i = 0; i < searcheduser.friends[1].pending.length; i++) {
                                        if (searcheduser.friends[1].pending[i]) {
                                            if (searcheduser.friends[1].pending[i].username === props.username) {
                                                // console.log('Searchuser func: ' + props.username + ' on ' + searcheduser.username + ' pending list!');
                                                return true;
                                            }
                                        }
                                    }
                                }

                                let requestwaiting = function() { // Determine if searched user is waiting for user to accept friend request
                                    for (var i = 0; i < props.searchusers[0].length; i++) { // Iterate through the searched users
                                        if (props.searchusers[0] && props.pendingfriendrequests) {
                                            for (let j = 0; j < props.pendingfriendrequests.length; j++) {
                                                if (props.pendingfriendrequests[j].username === searcheduser.username) { // if the searched user is listed in pending requests, then a request from this user is waiting from you
                                                    // console.log(props.pendingfriendrequests[j].username);
                                                    return true;
                                                }
                                            }
                                        }
                                    }
                                }

                                let alreadyfriends = function() { // function to determine if already friends with this searched user
                                    for (var i = 0; i < props.friends.length; i++) {
                                        if (props.friends[0]) {
                                            if(props.friends[i].username === searcheduser.username) {
                                                return true;
                                            }
                                        }
                                    }
                                }

                                let yourself = function() { // function to determine if searched user is self
                                    if(props.username === searcheduser.username) {
                                        return true;
                                    }
                                }

                                return (
                                    <SearchedUserResults searcheduser={searcheduser.username}
                                    searchtotal={props.searchusers[0].length}
                                    key={childCounter}
                                    index={childCounter++}
                                    sendfriendrequest={props.sendfriendrequest}
                                    acceptfriendrequest={props.acceptfriendrequest}
                                    revokefriendrequest={props.revokefriendrequest}
                                    alreadypending={alreadypending}
                                    requestwaiting={requestwaiting}
                                    alreadyfriends={alreadyfriends}
                                    yourself={yourself}
                                    beginchat={props.beginchat}
                                    />
                                )

                            })
                        : <div></div>
                    : <div></div>
                    } 
                <div className="load-more-users-wrapper"><button className="load-more-users" onClick={setlimit}>{ props.searchusers ? props.searchusers[1] ? props.searchusers[1].moreusers ? "load more users" : "no more users" : "load more users" : "load more users"}</button></div> {/* Loads more users if more users present */}
                </div>
            </div>
            <div className="search-friend-border noselect" onClick={e => props.friendsSocialToggle("friend")}><img className="general-icon" src={friendswhite} alt="friends"></img><div className="friends-header">friends</div></div>
            <div className={props.friendsopen ?
                                "friendchatcontainer friendchatcontainer-open"
                            : "friendchatcontainer friendchatcontainer-closed"
                           } refs='friendchatcontainer'>

                {/* Append friends from social bar state (props.friends). For each friend return appropriate object info to build Friends div using Friends(props) function above. */}
                {
                    props.friends ?
                        props.friends.length === 0 ? <div className="nofriends">Right now you have no friends :( , but you can add one :) . Use the search bar above to send friend requests or ask friends to add you</div>
                        :
                        props.friends.map(function(friend, index) {
                            let convo;
                            for (let i = 0; i < props.conversations.length; i++) {
                                if (props.conversations[i].users) {
                                    if (props.conversations[i].users.length == 2) {
                                        for (let j = 0; j < props.conversations[i].users.length; j++) {
                                            if (props.conversations[i].users[j] === friend.username) {
                                                convo = props.conversations[i];
                                            }
                                        }
                                    }
                                }
                            }
                            let typing;
                            if (convo) {
                                for (let i = 0; i < props.typing.length; i++) {
                                    if (props.typing[i].match(typingRegex)[3] == convo._id) {
                                        typing = props.typing[i];
                                    }
                                }
                            }

                            return (
                                <Friend username={props.username}
                                friend={friend.username}
                                friendstotal={props.friends.length}
                                key={childCounter}
                                index={childCounter++}
                                conversation = {convo}
                                beginchat={props.beginchat}
                                revokefriendrequest={props.revokefriendrequest}
                                friendchatopen={props.friendchatopen}
                                updatefriendchatopen={props.updatefriendchatopen}
                                typing={typing}
                                bump={props.bump}
                                />
                            )
                        })
                    : <div></div>
                }

            </div>
            <div className="search-nonfriend-border noselect" onClick={e => props.friendsSocialToggle("nonFriend")}><img className="general-icon" src={nonFriendsWhite} alt="friends"></img><div className="nonfriends-header">other conversations</div></div>
            <div className={props.nonfriendsopen ? "nonfriendchatcontainer nonfriendchatcontainer-open" : "nonfriendchatcontainer nonfriendchatcontainer-closed"} refs='nonfriendchatcontainer'>
                {props.conversations ?
                    props.conversations.length > 0 ?
                        props.conversations.map(function(conversation, index) {
                            let person = "";
                            let conversationOfFriends = function() { // determine if a conversation between friends
                                for (let i = 0; i < props.friends.length; i++) { // iterate thr each friend
                                    // console.log(conversation.users.length);
                                    if (conversation.users.length == 2) { // valid 2 user chat
                                        for (let k = 0; k < conversation.users.length; k++) { // iterate thr each user in conversation
                                            if (props.friends[i].username == conversation.users[k]) { // if iterated friend == iterated user in chat
                                                // console.log(props.friends[i].username, conversation.users[k]);
                                                return true; // Then this is a friend chat, return true to not show in extra chats
                                            }
                                        }
                                    } else {
                                        return true; // else invalid return true (Doesnt confirm that this is a conversation w a friend, but confirms it should not show in other chats)
                                    }
                                }
                                return false;
                            }

                            if (!conversationOfFriends()) { // if this conversation has a user that is not listed in friends list
                                 return (
                                    <NonFriendConversation username={props.username}
                                     otheruserchatopen={props.otheruserchatopen}
                                     key={childCounter}
                                     index={childCounter++}
                                     conversation={conversation}
                                     updateotheruserchatopen={props.updateotheruserchatopen}
                                     beginchat={props.beginchat}
                                     pendingfriendrequests={props.pendingfriendrequests}
                                     acceptfriendrequest={props.acceptfriendrequest}
                                     revokefriendrequest={props.revokefriendrequest}
                                     fetchusers={props.fetchusers}
                                     searchforminput={props.searchforminput}
                                     />
                                 )
                            }
                        }) : <div></div>
                    :<div></div>
                }
            </div>
            <Sidebarfooter username={props.username}
            logout={props.fetchlogout}
            />
        </div>
    )
}

// Map conversations with people who are not friends.
// Map through all conversations. If conversation does not contain a friend then map it to closeable messages area.
// These chats will have sockets as well but will be hidden and user will not open socket until they open this message area.

// Video Dash PAGE
// Request to Api algorithm to append relevant videos. 
// For now build map function that appends VIDEO object array with appropriate
// video.title, video.thumbnail, video.author, video.length, video.url


function Videos(props) {
    return (
        <div className="col">
            <div className='videocontainer'>
                <p className='mainvideotitle'>{props.title}</p>
                <NavLink to='/watch/'><img className='videothumb' src={dummythumbnail}></img></NavLink>
                <p className='videodesc'>{props.description}</p>
            </div>
        </div>
    )
}

function Video(props) {
     // TODO integrate videojs
    return (
        <div id='videocontainer'>
          <Player
              playsInline
              poster="/assets/poster.png"
              src="//vjs.zencdn.net/v/oceans.mp4"
            />
            <h2 className='watchpage-title'>Space X Falcon 9 launches TESS & Falcon 9 first stage landing</h2>
            <div className='publisher-bar'>
                <div className='publisher-info'>
                    <img className="publisher-avatar" src={require("./static/spacexavatar.jpg")}></img>
                    <span className='publisher-userandjoindate'>
                        <span>
                            <span className='publisher-username'>Space X</span>
                            <span className='publisher-followbutton'>follow</span>
                        </span>

                    </span>
                </div>
                
                <div className='publisher-video-interact'>
                    <img className="favorites-interact" src={heart} alt="favorites"></img>
                    <div className='publisher-video-interact-block'>
                        <img className="thumbsup-interact" src={thumbsup} alt="thumbsup"></img>
                        <span>432K</span>
                    </div>
                    <div className='publisher-video-interact-block'>
                        <img className="thumbsdown-interact" src={thumbsdown} alt="thumbsdown"></img>
                        <span>12K</span>
                    </div>
                    <img className="share-interact" src={share} alt="share"></img>
                    <div className='video-interact-border'></div>
                    <span>32,392,329 views</span>
                    <div className='more-options-ellipsis'>...</div>
                </div>
            </div>
            <div className='video-description-info'>
                Following its first test launch, Falcon Heavy is now the most powerful operational rocket in the world by a factor of two. With the ability to lift into orbit nearly 64 metric tons (141,000 lb)---a mass greater than a 737 jetliner loaded with passengers, crew, luggage and fuel--Falcon Heavy can lift more than twice the payload of the next closest operational vehicle, the Delta IV Heavy, at one-third the cost. Falcon Heavy draws upon the proven heritage and reliability of Falcon 9. 

                #falcon9 #spacex #earth #iridium #satellite #weregoingtospace #tesla #flyingtesla
            </div>
            <div className='video-description-upload-date'>uploaded <span className='upload-date-append'>april 23, 2008</span> at <span class='upload-time-append'>3:20pm eastern</span></div>
        </div>
        
    )
}

class Upload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            progress: 0,
        }
        this.upload = React.createRef();
        this.progressBar = React.createRef();
        this.progress = new EventEmitter();

    }

    componentDidMount() {
        this.progress.on('progress', (data) => {
            this.setState({progress: data});
            if (this.progressBar.current) {
                this.progressBar.current.style.width = Math.round(data) + "%";
            }
        });
    }

    uploadFileS3 = async () => {
        if (this.upload.current.files[0]) {
            let file = this.upload.current.files[0];
            let data = new FormData();
            let loaded;
            let total;
            let uploadPercentage;
            console.log(data.getAll('video'));
            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1]; // match last set of strings after period
            data.append('extension', extension);
            data.append('video', file);
            console.log(data.getAll('extension'));
            const config = {
                onUploadProgress: progressEvent => { // upload status logic
                    // console.log((Math.round((progressEvent.loaded / 1024 /1024)*10)/10) + "mbs uploaded");
                    // console.log((Math.round((file.size / 1024 /1024)*10)/10) + "mbs file size");
                    loaded = progressEvent.loaded / 1000000;
                    total = file.size / 1000000;
                    uploadPercentage = (loaded/total) * 100;
                    this.progress.emit('progress', uploadPercentage);
                },
                headers: {
                    'content-type': 'multipart/form-data'
                }
            };
            // Use axios to make post request and update user on gradual progress of upload
            axios.post(currentrooturl + 'm/videoupload', data, config)
                .then((response) => {
                    return { response };
                }).then((response) => {
                    console.log(response.response.data);
                })
                .catch((error) => {
                    error => console.log(error);
                });
        }
    }

    render() {
        return (
            <div>
                <div className="upload-video-txt">Upload video</div>
                <div className={this.props.sidebarStatus ? this.props.sidebarStatus == 'open' ? "progress-bar-container-sidebaropen" : "progress-bar-container" : "progress-bar-container"}>
                    <div className="progress-num">{this.state.progress == 0 ? "" : Math.round(this.state.progress) + "%"}</div>
                    <div className="progress-bar" ref={this.progressBar} >&nbsp;</div>
                </div>
                <div>
                    <input className="choose-file" ref={this.upload} type="file" name="fileToUpload" id="fileToUpload" size="1" />
                    <Button className="upload-button" onClick={this.uploadFileS3}>Upload</Button>
                </div>
            </div>
        )
    }
}
// Appends videos to dash
// TODO 
// Description shortener function
// publisher
// publish date.

function Dash(props) {  
        
    return (        
        <div className='videodash'>
            <div className='flex-grid videogrid'>
                {props.mainfeed.map(function(video, index) {
                    return (
                        <Videos title={props.mainfeed[index].title}
                        description={props.mainfeed[index].description}
                        publisher={props.mainfeed[index].publisher}
                        publish={props.mainfeed[index].publish}
                        key={[index]}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// Friends. Use array for now. Socket io. Add friend state to interact with backend api and update following info of friends (user in this case being that friend)
// user.status
// user.watching
// user.watching.url === video.url
// me.chats.host.user.log.mostrecent
// user.url

// Side Social Bar
// Socket for chat functionality. Will create method for creating sockets for each friend and appending to array

class Socialbar extends Component { // Main social entry point sb1
    constructor(props) {
        super(props);
        this.state = { isLoggedIn: (cookies.get('loggedIn')), username: cookies.get('loggedIn'),
                      sidebarximgSrc: sidebarcloseimg, friends: [{}], users: {}, conversations: [],
                      convoIds: [], searchuserinput: '', searchusers: [],
                      showingpendingrequests: "hidden", pendingfriendrequests: null,
                      friendchatopen: null, otheruserchatopen: null,
                      loginerror: null, registererror: null,
                      friendsopen: true, nonfriendsopen: true,
                      response: false, endpoint: "http://127.0.0.1:5000",
                      typing: [], darkmode: false
                     }
        
       // this.getpendingrequests = this.getpendingrequests.bind(this);
        this.fetchusers = this.fetchusers.bind(this);
        this.debouncefetchusers = this.debouncefetchusers.bind(this);
        this.limitedsearch = this.limitedsearch.bind(this);
        this.sidebar = React.createRef();
        this.sidebarx = React.createRef();
    }
    // function to run when mongodb gets information that state has changed.
    // test if the current state is equal to new object array.
    // then do something.
    appendFriends() {
        
    }
    
    componentWillMount(e) {

    }
    
    componentDidMount(e) {

       if (this.props.sidebarStatus === 'open') {
           document.getElementsByClassName('maindash')[0].classList.add('maindashwide');
           this.openSideBar();
       } else {
           document.getElementsByClassName('maindash')[0].classList.remove('maindashwide');
           this.closeSideBar();
       }
        
        if (this.state.isLoggedIn) { // check for user logged in cookie, if true fetch users.
            this.getfriends();
            this.getFriendConversations();
        }
    };
        
    componentDidUpdate(e, prevState, prevProps) {

    }
    
    openSocket = async () => {
        // Socket entry point. Creates connection with server in order to respond to connections.
        // Creates event listeners and updates to initial current data
        if (this.state.isLoggedIn && !socket) { // If logged in and socket null
            let opensocket = new Promise((resolve, reject) => {
                socket = io(this.state.endpoint);

                // Event listeners
                socket.on('connect', () => {
                    console.log("Connected to socket ∞¦∞");
                    setTimeout(() => {
                        this.initializeLiveChat();
                    }, 300);
                });
                socket.on("disconnect", () => {
                    console.log("Disconnected from socket");
                });
                socket.on("returnConvos", data => { // Gets conversations from either redis or mongo
                    console.log("Socket conversations: vvv");
                    console.log(data);
                    this.setState({ conversations : data });
                    if (data.length != this.state.convoIds.length) { // re-initialize chat until length of chat is the same
                        if (this.state.conversations.length > 0 && data.length == 0) {
                            setTimeout(() => {
                                this.initializeLiveChat();
                            }, 300);
                        }
                    }
                });

                socket.on('typing', data => {
                    console.log("compressed byte size: " + data.length);
                    data = lzw.decompress(data); // decompress data before processing
                    console.log("decompressed byte size: " + data.length);
                    this.setTyping(data);
                })

                socket.on('chat', data => {  // on new chat, match id and append
                    // console.log(data); // log new chat data
                    this.appendChat(data);
                });

                socket.on('bump', data => {
                    bumpEvent.emit('bump', (data));
                });
                resolve();
            });

            opensocket.then(() => {

            });
        }
    }

    setTyping = (data) => {
        // let typeData = data.match(typingRegex);
        console.log(data);
        let user = data.match(typingRegex)[1]; // user
        let content = data.match(typingRegex)[2]; // content
        // console.log(data.match(typingRegex));
        let room = data.match(typingRegex)[3]; // room
        if (this.state.typing.length > 0) { // if typing state array has more than 1 room in it
            if (user != this.state.isLoggedIn) {
                let temp = this.state.typing;
                let inArr = false;
                for (let i = 0; i < this.state.typing.length; i++) { // iterate through typing state array. Includes typing data of all conversations
                    if (room == this.state.typing[i].match(typingRegex)[3]) {
                        inArr = true;
                        if (this.state.typing[i].match(typingRegex)[2] != content) {
                            temp.splice(i, 1, data); // replace typing data with new one
                            this.setState({ typing: temp });
                        }
                    }
                }
                if (!inArr) { // if this chat is not present in typing state array, simply just add it.
                    temp.push(data);
                    this.setState({ typing: temp });
                }
            }
        } else {
            if (user != this.state.isLoggedIn) { // if the typing data being added != user signed in, it is from someone else. Show the user what they are typing
                let temp = this.state.typing;
                temp.push(data);
                this.setState({ typing: temp });
            }
        }
    }

    appendChat = (data) => {
        if (this.state.conversations) {
            for (let i = 0; i < this.state.conversations.length; i++) {
                if (data.id == this.state.conversations[i]._id) {
                    delete data.id;
                    let temp = this.state.conversations;
                    temp[i].log.push(data);
                    // console.log(temp); // logs all current conversations
                    if (data.author != this.state.isLoggedIn) {
                        let leanString = data.author + ";" + "" + ";" + this.state.conversations[i]._id; // reset typing data
                        this.setTyping(leanString);
                    }
                    this.setState({ conversations: temp });
                }
            }
        }
    }

    initializeLiveChat = () => { // Sends request to server to join user to room
        if (this.state.conversations && this.state.isLoggedIn) {
            let obj = {
                "ids": this.state.convoIds,
                "user": this.state.isLoggedIn
            }
            socket.emit('joinConvos', obj); // Joins user into convo rooms
        } else {
            setTimeout(() => {
                this.initializeLiveChat();
            }, 1500);
        }
    }

    // for increased functionality when user has clicked on a chat
    // If other user has started chat already but doesnt show, this will update and connect user to the chat
    focusLiveChat(room) {
        console.log("focus live chat " + room);
        if (!room) {
            let obj = {
                "ids": this.state.convoIds,
                "user": this.state.isLoggedIn
            }
            if (socket) {
                socket.emit('joinConvos', obj); // Joins user into convo rooms
            }
        }
    }

    getFriendConversations() {
        // This will retrieve all chats within "chats" in the user document.
        let username = this.state.isLoggedIn;

        fetch(currentrooturl + 'm/getconversationlogs', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                username
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
            console.log("Conversations:", data);
            if (!this.state.pendingfriendrequests) { // Only reload if pendingfriendrequests not true, prevents reload on every chat sent
                this.getpendingrequests("hidden", null, username); // Updates pending list everytime getFriendConversations
            }
            this.setState({ conversations: data }); // set state for conversations
            let convoIds = [];
            for (let i = 0; i < data.length; i++) { // Sets convo ids from conversations object
                convoIds.push(data[i]._id);
            }
            this.setState({ convoIds: convoIds });
            return data;
        })
        .then(() => {
            setTimeout(() => {
                this.openSocket(); // open socket after friend conversations ran
            }, 200);
        });
    }

    // Entry point method after login
    fetchlogin = (e) => {
        e.preventDefault();
        let email = document.getElementById('email').value;
        let password = document.getElementById("pw").value;
        console.log(email);
        console.log('fetch login func');
        fetch(currentrooturl + 'm/login', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                email, password
            })
        })
        .then((response) => {
            return response.json(); // Parsed data
        })
        .then((data) => {
            this.setState({ registererror: null });
            this.setState({ loginerror: null });
            if (data.querystatus== "loggedin") {
                this.setState({ isLoggedIn: (cookies.get('loggedIn'))});
                this.getfriends()
                this.getFriendConversations();
            }
            if (data.error) {
                console.log(data.error);
                console.log(data.type);
                this.setState({ loginerror: {error: data.error, type: data.type }});
            }
            return data;
        })
        .catch(error => { console.log(error);
        })
    }

    fetchregister = (e) => {
        e.preventDefault();
        let username = document.getElementById("username").value;
        let regemail = document.getElementById("regemail").value;
        let regpassword = document.getElementById("regpw").value;
        let confirmPassword = document.getElementById("regpw2").value;
        console.log(regemail);
        fetch(currentrooturl + 'm/register', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                username, regemail, regpassword, confirmPassword
            })
        })
        .then((response) => {
                return response.json(); // Parsed data
        })
        .then((data) => {
            console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
            this.setState({ registererror: null });
            this.setState({ loginerror: null });
            if (data.querystatus== "loggedin") {
                this.setState({ isLoggedIn: (cookies.get('loggedIn'))});
                this.getfriends()
                this.getFriendConversations();
            }
            if (data.error) {
                console.log(data.error);
                console.log(data.type);
                this.setState({ registererror: {error: data.error, type: data.type }});
            }
            return data;
        })
        .catch(error => { console.log(error);
        })
    }

    fetchlogout(e) {
        console.log('fetchlogout');
         cookies.remove('loggedIn');
         cookies.remove('user');
        //  puts users taken from server script into state.
        // fetch('/m/logout');
        fetch(currentrooturl + 'm/logout', {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            })
            .then(function(response) {
                return response.json(); // You parse the data into a useable format using `.json()`
            })
            .then(function(data) { // `data` is the parsed version of the JSON returned from the above endpoint.
                console.log(data);
                this.setState({ isLoggedIn: "",
                              friends: [] });
                return data;
            })
            .catch(error => { console.log(error);
            })
    }
    
    closeSideBar() {
        this.sidebar.current.classList.remove('sidebar-open');
        this.sidebarx.current.classList.remove('sidebarxopen');
        document.getElementsByClassName('maindash')[0].classList.remove('maindashwide');
        document.getElementsByClassName('sidebarimg')[0].classList.remove('sidebarimg-open');
        this.setState({sidebarximgSrc: sidebaropenimg });
        this.props.updateSidebarStatus('closed');
    }
    
    openSideBar() {
        this.sidebar.current.classList.add('sidebar-open');
        this.sidebarx.current.classList.add('sidebarxopen');
        document.getElementsByClassName('maindash')[0].classList.add('maindashwide');
        document.getElementsByClassName('sidebarimg')[0].classList.add('sidebarimg-open');
        this.setState({sidebarximgSrc: sidebarcloseimg });
        this.props.updateSidebarStatus('open');
    }

    checkemptychat = () => {
        for (let i = 0; i < document.getElementsByClassName('friendchat-chat-container').length; i++) { // Will update and widen chat area if chat log is started
            if (document.getElementsByClassName('friendchat-chat-container')[i].firstChild) {
                document.getElementsByClassName('friendchat-chat-container')[i].classList.remove('friendchat-chat-container-empty'); // chat not empty
            } else {
                document.getElementsByClassName('friendchat-chat-container')[i].classList.add('friendchat-chat-container-empty'); // Chat empty
            }
        }
    }
    
    updatefriendchatopen = (e, friend, socketRoom ) => {
        if (!(e.target.classList.contains("prevent-open-toggle")) && !(e.target.parentElement.classList.contains("prevent-open-toggle")) ) {
            this.focusLiveChat(socketRoom);
            this.setState({ friendchatopen: friend });
        }
    }

    updateotheruserchatopen = (e, otheruser, socketRoom ) => {
        this.focusLiveChat(socketRoom);
        if (!(e.target.classList.contains("prevent-open-toggle")) && !(e.target.parentElement.classList.contains("prevent-open-toggle"))) { // Open chat of clicked user if not clicking buttons profile, unfriend or befriend
            this.setState({ otheruserchatopen: otheruser });
        }
    }
    
    limitedsearch(username, limit, requery) { // limit is limited amount of users to return, requery is for if no more users but needs to requery to update state of searched users
        let searchusers = document.getElementById('usersearch').value;
        if (this.state.searchusers[1].moreusers || requery) { // if moreusers state is true or requery necessary to update state
            console.log("limitedsearch");
            fetch(currentrooturl + 'm/searchusers', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    searchusers, username, limit
                })
            })
            .then(function(response) {
                return response.json(); // parse the data into a useable format using `.json()`
            })
            .then((data) => {
                console.log(data);
                this.setState({ searchusers: data }); // set user data to
            })
            .catch(error => {
                console.log(error);
            })
        }
    }

    searchusers() { // Search method that uses value in user search bar to return 10 searched users
        // debounced fetch users event
        console.log ('searching users');
        if (this.state && this.state.isLoggedIn) {
            let username = this.state.isLoggedIn;
            let searchusers = document.getElementById('usersearch').value;
            if (searchusers) {
                console.log("base search");
                fetch(currentrooturl + 'm/searchusers', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        searchusers, username
                    })
                })
                .then(function(response) {
                    return response.json(); // parse the data into a useable format using `.json()`
                })
                .then((data) => {
                    console.log(data);
                    this.setState({ searchusers: data }); // set user data to
                })
                .catch(error => { console.log(error);
                })
                document.getElementsByClassName('search-users-results-container')[0].classList.add('search-users-results-container-opened');
            } else if (!searchusers) {
                this.setState({ searchusers: [] });
                if (document.getElementsByClassName('search-users-results-container')[0]) {
                    document.getElementsByClassName('search-users-results-container')[0].classList.remove('search-users-results-container-opened');
                }
                // double check for input
                setTimeout(function() {
                    if (!document.getElementById('usersearch').value) {
                        this.setState({ searchusers: [] });
                    }
                }.bind(this), 500)
            }
        }
    }
    
    fetchusers = this.searchusers;
    debouncefetchusers = debounce(this.searchusers, 1000);
        
    fetchuserpreventsubmit = (e) => {
        // prevent submit on user search. Auto function with debounce using debouncefetchusers.
        e.preventDefault();
    }

    sendfriendrequest = (e, friend) => {
        console.log("You want to be friends with: " + friend);
        let thetitleofsomeonewewanttobecloseto = friend;
        let username = this.state.isLoggedIn;
        let self = this;
        fetch(currentrooturl + 'm/requestfriendship', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    thetitleofsomeonewewanttobecloseto, username
                })
            })
            .then(function(response) {
                return response.json(); // You parse the data into a useable format using `.json()`
            })
            .then(function(data) {
                console.log(data);
                if (data == { querystatus: 'already friends' }) {
                    this.getfriends();
                    this.getFriendConversations();
                }
                return data; // `data` is the parsed version of the JSON returned from the above endpoint.
            })
            .catch(error => { console.log(error);
            })
            .then(function(data) {
                self.limitedsearch(self.state.isLoggedIn, self.state.searchusers[0].length, true); // re update list
                self = null;
            })

        e.preventDefault();
    }
    
    revokefriendrequest = (e, friend, pending, refuse, block, search) => { // Pending if you're waiting for user to accept. Refuse true if user is refusing request
        let thetitleofsomeoneiusedtowanttobecloseto = friend;
        let username = this.state.isLoggedIn;
        console.log("revokefriendrequest arguments; pending: " + pending + " refuse: " + refuse);
        fetch(currentrooturl + 'm/revokefriendship', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                thetitleofsomeoneiusedtowanttobecloseto, username, pending, refuse, block
            })
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            console.log(data);
            if (data.querystatus) {
                console.log('bad query');
                if (data.querystatus == "not on other users pending list" || data.querystatus == "no users on other users pending list") {
                    this.getfriends();
                    this.getFriendConversations();
                } else if (data.querymsg) {
                    if (data.querymsg == 'not friends') {
                        this.getfriends();
                        this.getFriendConversations();
                    }
                }
            } else {
                // will have to add conversation state update when adding remove conversation functionality
                this.setState({ friends: data });
            }
            return data;
        })
        .catch(error => { console.log(error);
        })
        .then((data) => {
            if (pending) {
                if (this.state.searchusers[0]) {
                    this.limitedsearch(this.state.isLoggedIn, this.state.searchusers[0].length, true);
                } else {
                    this.searchusers();
                }
            } else if (refuse == "requestslist" || refuse == "nonfriendslist") {
                this.getpendingrequests(null, true, username); // true arguement to search again after qeuery
            }
        }).
        then((data) => {
            if (socket) {
                socket.disconnect();
            }
        }).
        then((data) => {
            socket.connect();
        })
    }
        
    getpendingrequests = (show, search, username) => {
        // show variable must be null, "hidden" or "show"
        // search must be true to search after query or false to not search (e.g if want to close requests header but do not want to search)
        if (!username) {
            username = this.state.username;
        }
        
        console.log("Set state for showpendingrequests:", show, ", Search after query?:", search, ", Searching for requests of:", username);
        if (search || !this.state.pendingfriendrequests) { // If searching again or pendingfriendrequests is null
            fetch(currentrooturl + 'm/pendingrequests', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then((data) => {
                console.log("Pending requests:", data);
                let pendingfriendrequestquery = data;
                if (show == "hidden") { // Changes state to show pending requests if argument is passed
                    this.setState({showpendingrequests : "hidden"});
                } else if (show == "show") {
                    this.setState({showpendingrequests : "show"});
                }
                this.setState({ pendingfriendrequests: pendingfriendrequestquery });
                return data;
            })
            .catch(error => { console.log(error);
            })
        } else if (this.state.pendingfriendrequests) {
            this.setState({ pendingfriendrequests: null })
        }

        // console.log('get pending requests');
    }
    
    acceptfriendrequest = (e, friend, requests) => {
        console.log("You are going become friends with " + friend);
        let username = this.state.isLoggedIn;
        let newfriend = friend;
        
        fetch(currentrooturl + 'm/acceptfriendrequest', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                newfriend, username
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
            console.log(data);
            this.setState({ friends: data });
            setTimeout(this.getpendingrequests(null, requests, username), 1500); // Reset user search after friend accepted.
            return data;
        })
        .catch(error => { console.log(error);
        })
        
        console.log('accept friend request finished');
        this.debouncefetchusers();
    }
    
    getfriends = () => {
        let username = this.state.isLoggedIn;
        fetch(currentrooturl + 'm/getfriends', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                username
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
            console.log("Friends of", username, ":", data);
            this.setState({ friends: data });
            return data;
        })
        .catch(error => {
            console.log(error);
        })
        
    }

    beginchat = (e, chatwith, message, convoId, fromSearch ) => {
        let username = this.state.isLoggedIn;
        // All beginchat methods ran from searchbar will run as a fetch request.
        // Others will update via socket
        console.log("Socket" + socket, "from search " + fromSearch, "ConvoId " + convoId);
        if (socket && !fromSearch && convoId) { // If socket is online, use socket to redis first functionality
            if (message.length > 0) {
                let chatObj = {
                    "user": username,
                    "id": convoId,
                    "message": message,
                    "chatwith": chatwith
                }
                console.log(chatObj);
                socket.emit('sendChat', chatObj);
            }
        } else { // If socket untrue or fromSearch true, defaults to fetch request
            if (message.length > 0) {
                fetch(currentrooturl + 'm/beginchat', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        username, chatwith, message
                    })
                })
                .then(function(response) {
                    return response.json();
                })
                .then((data) => {
                    console.log(data);
                    this.getFriendConversations();
                    return data;
                })
                .then((data) => {
                    let obj = {
                        "ids": this.state.convoIds,
                        "user": this.state.isLoggedIn
                    }
                    socket.emit('joinConvos', obj);
                })
                .catch(error => { console.log(error);
                })
            }
        }
        
        e.preventDefault(console.log('begin new chat'));  
    }
    
    toggleSideBar = () => {
        if (this.sidebar.current.classList.contains('sidebar-open')) {
            this.closeSideBar();
            this.searchformclear();
        } else {
            this.openSideBar();
        }
    }
    
    searchforminput = () => {
        if (document.getElementsByClassName("user-search")[0].value.length > 0) {
            document.getElementsByClassName('clear')[0].classList.add('clear-visible');
        } else {
            document.getElementsByClassName('clear')[0].classList.remove('clear-visible');
            this.setState({ searchusers: [] });
            document.getElementsByClassName('search-users-results-container')[0].classList.remove('search-users-results-container-opened');
        }
    }

    searchformclear = () => {
        document.getElementsByClassName("user-search")[0].value = "";
        this.setState({ searchusers: [] });
        document.getElementsByClassName('search-users-results-container')[0].classList.remove('search-users-results-container-opened');
        document.getElementsByClassName('clear')[0].classList.remove('clear-visible');
    }

    friendsSocialToggle = (friend) => { // Minimizes and maximizes components visually
        let query;
        let friendsopen;
        let nonfriendsopen;
        if (friend == "friend") {
            query = "friend";
            this.state.friendsopen == false ? friendsopen = false : friendsopen = true;
        } else {
            query = "nonfriend";
            this.state.nonfriendsopen == false ? nonfriendsopen = false : nonfriendsopen = true;
        }

        if (document.getElementsByClassName(query + "chatcontainer")[0]) {
            // Assign element and its height variables.
            let element = document.getElementsByClassName(query + "chatcontainer")[0];
            let sectionHeight = element.scrollHeight;
            element.style.transition = "200ms";
            element.style.height = sectionHeight-15 + "px"; // Set to section height by default
            // If component is already open, sets to real current height as opposed to 'auto' to animate the transition to 0.
            // Component must default back to auto on open as the component height may change due to children.

            // Choose appropriate query, if open state is false, then open, else close.
            if (query == "friend" && friendsopen == false || query == "nonfriend" && nonfriendsopen == false) { // Open
                element.classList.remove(query + "chatcontainer-closed"); // Add and remove appropriate css in DOM
                element.classList.add(query + "chatcontainer-open");
                setTimeout(() => { // Set element height to auto after 200ms animation is finished. Why? Because child components may change in height
                    if (query == "friend") {
                        if (this.state.friendsopen == true) {
                            element.style.height = "auto";
                        }
                    } else if (query == "nonfriend") {
                        if (this.state.nonfriendsopen == true) {
                            element.style.height = "auto";
                        }
                    }
                }, 200);
                if (query == "friend") { // If component open state is still false, set state to true (Fixes non responsiveness)
                    if (this.state.friendsopen == false) {
                        this.setState({friendsopen : true })
                    }
                } else if (query == "nonfriend") {
                    if (this.state.nonfriendsopen == false) {
                        this.setState({nonfriendsopen : true })
                    }
                }
            } else if (query == "friend" || query == "nonfriend") { // Close
                element.classList.remove(query + "chatcontainer-open");
                element.classList.add(query + "chatcontainer-closed");

                element.style.height = element.scrollHeight + "px"; // Change height from auto to actual scroll height
                element.style.height = 0 + "px"; // Animate height transition to 0

                if (query == "friend") {
                    if (this.state.friendsopen == true && element.classList.contains("friendchatcontainer-closed")) {
                        this.setState({friendsopen : false, friendchatopen: null });
                    }
                } else if (query == "nonfriend") {
                    if (this.state.nonfriendsopen == true && element.classList.contains("nonfriendchatcontainer-closed")) {
                        this.setState({nonfriendsopen : false, otheruserchatopen: null });
                    }
                }
            }
        }
    }

    bump = (e, too, room) => {
        if (this.state.isLoggedIn && socket) {
            // bump;from;too;room
            let data = "bump;" + this.state.isLoggedIn + ";" + too + ";" + room;
            socket.emit('bump', data);
        }
    }

    render() {
        let sidebar;
        
        const isLoggedIn = this.state.isLoggedIn;
        if (!isLoggedIn) {
            sidebar = <Login fetchlogin={this.fetchlogin} fetchregister={this.fetchregister} loginerror={this.state.loginerror} registererror={this.state.registererror} />
        } else {
            sidebar = <Social username={this.state.isLoggedIn} friends={this.state.friends} fetchlogout={this.fetchlogout} conversations={this.state.conversations} pendinghidden={this.state.showpendingrequests} debouncefetchusers={this.debouncefetchusers} fetchusers={this.fetchusers} limitedsearch={this.limitedsearch} searchforminput={this.searchforminput} searchformclear={this.searchformclear} debouncefetchpendingrequests={this.debouncependingrequests}fetchuserpreventsubmit={this.fetchuserpreventsubmit} searchusers={this.state.searchusers} sendfriendrequest={this.sendfriendrequest} revokefriendrequest={this.revokefriendrequest} toggleSideBar={this.toggleSideBar} getpendingrequests={this.getpendingrequests} pendingfriendrequests={this.state.pendingfriendrequests} acceptfriendrequest={this.acceptfriendrequest} beginchat={this.beginchat} friendchatopen={this.state.friendchatopen} otheruserchatopen={this.state.otheruserchatopen} updatefriendchatopen={this.updatefriendchatopen} updateotheruserchatopen={this.updateotheruserchatopen} friendsopen={this.state.friendsopen} friendsSocialToggle={this.friendsSocialToggle} nonfriendsopen={this.state.nonfriendsopen}
            typing = {this.state.typing} bump = {this.bump} />
        }
            
        return (
            <div>
                <Navbar username={this.state.isLoggedIn} />
                <div className="sidebar sidebar-open" ref={this.sidebar}>
                    <div className="sidebarcontainer">
                        {sidebar}
                    </div>
                </div>
                <div className="sidebarx sidebarxopen" ref={this.sidebarx} onClick={this.toggleSideBar}>
                    <img className="sidebarimg" src={this.state.sidebarximgSrc} ref='sidebarximg'></img>
                </div>
            </div>
        );
    } 
};

// test debounce function 
function debounce(a,b,c){var d,e;return function(){function h(){d=null,c||(e=a.apply(f,g))}var f=this,g=arguments;return clearTimeout(d),d=setTimeout(h,b),c&&!d&&(e=a.apply(f,g)),e}}

// Watching video/Chat PAGE
// Video playing from server.
// video.title, video.description, video.thumnail, video.author, video.length, video.url, video.lastplayedat, video.thumbsup, video.thumbsdown, video.views, video.author.following.
// me.emitting, me.chats, me.chats.host.video, me.chats.host.user (user can contain 2 or more. Up to 16 for now.) me.chats.log
// Database tidbit. The chat is represented by an id. The host belongs to the chat id. The users involved belong to the host which sets up their privileges. The log belongs to chat id. When the host clicks a video & is emitting he changes the video, other users follow along if they are IN the chat currently watching the same video. You can be in the chat in social bar but you can JOIN the video emitting session aswell which changes the currently watched video.
// API request relevant videos using video.title & me.history

class App extends Component {
    constructor(props) {
        super(props); 

        this.state = { 
                        mainfeed: videofeed[0].main, watching: "", sidebarStatus: 'open',
                     };
    }
    

    componentDidMount() {
        if (!cookies.get('Minireel')) {
            cookies.set('Minireel', 'minireel_session', { path: '/', sameSite: true, signed: true });
        }
    }
        
    updateSidebarStatus = (update) => {
        this.setState({sidebarStatus: update });
    }
    
    render() {                    
        return (
            <BrowserRouter>
                <div className="App">
                    <Socialbar watching={this.state.watching} sidebarStatus={this.state.sidebarStatus} updateSidebarStatus={this.updateSidebarStatus} />
                    <div className='maindashcontainer'>
                        <div className='main maindash'>
                            <Route exact path='/' render={(props) => (
                                <Dash {...props} mainfeed={this.state.mainfeed} />
                            )}/>
                            <Route path='/watch' render={(props) => (
                                <Video {...props} />
                            )}/>
                            <Route path='/upload' render={(props) => (
                                <Upload {...props} sidebarStatus={this.state.sidebarStatus} />
                            )}/>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;
