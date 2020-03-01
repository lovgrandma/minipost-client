'use strict';

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Login from './components/login.js'; import Sidebarfooter from './components/sidebarfooter.js';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import { instanceOf } from 'prop-types';
import Cookies from 'universal-cookie';
import logo from './static/minireel-dot-com-3.svg'; import mango from './static/minireel-mangologo.svg'; import heart from './static/heart.svg'; import whiteheart from './static/heart-white.svg'; import history from './static/history.svg'; import search from './static/search-white.svg'; import notifications from './static/notifications.svg'; import profile from './static/profile.svg'; import upload from './static/upload.svg'; import thumbsup from './static/thumbsup.svg'; import thumbsdown from './static/thumbsdown.svg'; import share from './static/share.svg'; import sidebarcloseimg from './static/sidebarclose.svg';  import sidebaropenimg from './static/sidebaropen.svg'; import dummythumbnail from './static/warrenbuffetthumb.jpg'; import chatblack from './static/chat-black.svg'; import close from './static/close.svg'; import hamburger from './static/hamburger.svg'; import pointingfinger from './static/pointingfinger.svg'; import circlemenu from './static/circlemenu.svg'; import newspaperblack from './static/newspaper.svg'; import play from './static/play.svg'; import television from './static/tv.svg'; import sendarrow from './static/sendarrow.svg'; import subscribe from './static/subscribe.svg'; import friendswhite from './static/friendsWhite.svg'; import nonFriendsWhite from './static/nonFriendsWhite.svg'; import circlemenulight from './static/circlemenulight.svg';
import './App.css';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import './videoplayer.css';
import $ from 'jquery';
import TextareaAutosize from 'react-textarea-autosize';


import AwesomeDebouncePromise from 'awesome-debounce-promise';

import videofeedvar from './videofeedplaceholder';

const cookies = new Cookies();

let devurl = 'http://localhost:3000/';
let productionurl = 'https://www.minireel.org/';
let currentrooturl =  devurl;

// How a full friend array of objects might look. Array will come from json request from mongodb.
// Could add 'RecentMSG to show.

//let friends = [
//    {
//        username: 'ricardo.benson',
//        status: 'online',
//        emitting: true,
//        watching: 'Space X Falcon 9 launches TESS & Falcon 9 first stage landing',
//        watchingurl: 'www.yahoo.ca',
//    },
//    {
//        username: 'carla.tisci',
//        status: 'offline',
//        emitting: true,
//        watching: 'Charlie Rose interviews David Foster Wallace, clip 2/4 series',
//        watchingurl: 'www.yahoo.ca',
//    },
//];
    
// placeholder import video info
let videofeed = videofeedvar;

// Search bar componenet
class SearchForm extends Component {
    render() {
        let getInnerSearchText = 'Search film..';
        
        return (
        <form className="search-form-flex" method="GET" action="/search">
                            <input className="search-field" id="search" type="search" placeholder={getInnerSearchText} name="search"></input>
                            <button className="searchbox" type="submit" value="submit">
                                <img className="search" src={search} alt="search"></img>
                            </button>
                        </form>
        );
    }
};

// Nav bar with appropriate links to likes, history, minireel home, search film bar, notifications, friends & upload.

function Navbar(props) {
    return (
        <nav className="navbar navbar-default border-navigation">
            <row className="nowrap">
                <ul className="nav flex-grow2 nowrapbuttons">
                    <a href="favorites"><img className="favorites" src={heart} alt="favorites"></img></a>
                    <a href='history'><img className="history" src={history} alt="history"></img></a>
                </ul>
                <div className="brand flex-grow1">
                    <NavLink exact to="/"><img className="minireel-nav d-inline" src={logo} alt="minireel"></img></NavLink>
                    <SearchForm />
                </div>
                <ul className="nav flex-grow2 flex-end nowrapbuttons">
                    <a href="/notifications"><img className="notifications" src={notifications} alt="notifications"></img></a>
                    <a href="/profile"><img className="profile" src={profile} alt="profile"></img></a>
                    <a href="/upload"><img className="upload" src={upload} alt="upload"></img></a>
                </ul>
            </row>
        </nav>
    )
}

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

class SearchedUserResults extends Component { // Individual searched user
    constructor(props) {
        super(props);
        this.state = { removeprompt: false,
            blockprompt: false,
            reportprompt: false,
            waitingfetch: false }
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
                this.props.beginchat(e, otheruser, this.inputRef._ref.value), this.resetchat(e);
                this.inputRef._ref.placeholder = "message was sent";
            }
            sendchat(e);
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
            <div class="search-users-relative-div">
                <div class="spinner-search-holder spinner-search-holder-visible">
                    <div class="loadingio-spinner-dual-ball loadingio-spinner-dual-ball-m6fvn6j93c"><div class="ldio-oo3b7d4nmnr">
                    <div></div><div></div><div></div>
                    </div></div>
                    <div class="cover-search"></div>
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
                                            <span><button className ="button-yes" onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser); this.promptexitblockuser()}}>Yes</button></span><span><button className ="button-no" type="button" onClick={this.promptexitblockuser}>No</button></span>
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
                                        <div className='search-user-accept-friend-request' onClick={(e) => {this.props.acceptfriendrequest(e, this.props.searcheduser, true)}}>accept<img className="searched-user-icon" src={heart} alt="heart"></img></div>
                                    </span>
                                    : this.props.alreadypending() ?
                                        <span className='search-profile-bump-container'>
                                            <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                            <div className='search-user-pending-friend-request' onClick={(e) => {this.props.revokefriendrequest(e, this.props.searcheduser, true)}}>pending</div>
                                        </span>
                                        :
                                        <span className='search-profile-bump-container'>
                                            <div className='searched-user-follow-request'>follow<img className="searched-user-icon" src={subscribe} alt="subscribe"></img></div>
                                            <div className='searched-user-send-friend-request' onClick={(e) => {this.props.sendfriendrequest(e, this.props.searcheduser)}}>invite<img className="searched-user-icon" src={heart} alt="friend request"></img></div>
                                        </span>
                        }
                        <div className='searched-user-message' onClick={this.openchatinput}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                    </div>
                    <form className='search-chat-form search-chat-form-closed' method="PUT" action="/chat" ref={tag => (this.searchChatFormRef = tag)}>
                        <span>
                        <TextareaAutosize className='search-textarea-chat-autosize search-textarea-chat-autosize-closed' ref={tag => (this.inputRef = tag)} onKeyPress={(e) => {this.handleKeyPress(e, this.props.searcheduser)}} />
                        <button className='search-chat-submit' onClick={(e) => {this.props.beginchat(e, this.props.searcheduser, this.inputRef._ref.value), this.resetchat(e)}} type='submit' value='submit' ref={tag => (this.searchChatSubmitRef = tag)}><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
                        </span>
                    </form>
                </div>
            </div>
        )
    }
}

// Conversation
class NonFriendConversation extends Component {
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
        // If user clicks on profile, do not open chat submit
        this.props.updateotheruserchatopen(e, otheruser);
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
                this.props.beginchat(e, otheruser, this.inputRef._ref.value), this.resetchat(e);
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
        let fetchusers = new Promise((resolve, reject) => { // Promise to fetch new users
            resolve(this.props.fetchusers());
            document.getElementsByClassName("user-search")[0].scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        });
        fetchusers.then((e) => {
            setTimeout((e) => {
                if (document.getElementsByClassName("searched-user-div")[0]) {
                    for (let i = 0; i < document.getElementsByClassName("search-users-results-container")[0].firstElementChild.childElementCount; i++) {
                        if (document.getElementsByClassName("searched-user-div")[i]) { // if iterated child search user div exists
                            let element = document.getElementsByClassName("searched-user-div")[i]; // Assign current div to element variable
                            if (element.getElementsByClassName("searched-user-send-friend-request")[0]) { // If valid DOM elements for invite request
                                if (element.getElementsByClassName("searched-user-username")[0].innerHTML == otheruser) { // if this user == otheruser
                                    element.getElementsByClassName("searched-user-send-friend-request")[0]
                                        .click(); // Make invite request
                                }
                            }
                        }
                    }
                }
            }, 750);
        })
    }

    // basic functionality, if pending add option to add friend, show if pending, block option, send messages, chat.
    render() {
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
                    <div className="otheruser" onClick={(e) => {this.openchatinput(e, otheruser)}}>
                        <div className='searched-user-username-container'>
                            <img className="otheruseravatar" src={require("./static/bobby.jpg")}></img>
                            <div ref={tag => (this.userRef = tag)} className="otherusername">{otheruser}</div>
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
                        onClick={(e) => {this.props.beginchat(e, otheruser, this.inputRef._ref.value), this.resetchat(e)}} type='submit' value='submit'><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
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

// Individual friend
class Friend extends Component {
    constructor(props) {
            super(props);
            this.inputRef = React.createRef();
            this.scrollRef = React.createRef();
            this.state = { removeprompt: false, blockprompt: false,  reportprompt: false, chatinput: false,
                chatlength: 0 }
        }

    componentDidMount() {
        let currentchatlength = 0;
        //console.log(this.props.friend);
        if (this.props.friend) {
            for (let i = 0; i < this.props.conversations.length; i++) { // Determines the length of this friend chat and returns chat length
                if (this.props.conversations[i].users.length == 2) {
                    for (let j = 0; j < this.props.conversations[i].users.length; j++) {
                        if (this.props.conversations[i].users[j] === this.props.friend) {
                            currentchatlength = this.props.conversations[i].log.length;
                            //console.log(this.props.conversations[i].log.length, this.props.friend);
                        }
                    }
                }
            }
        }
        
        if (currentchatlength) {
            this.setState({ chatlength: currentchatlength }); // Sets length of chat when it is equal to null at componentDidMount
        }
    }

    componentWillUpdate() {
        
    }

    componentDidUpdate(prevProps, prevState) {
        // On update, scroll chat down to most recent chat if user is not actively scrolling through
        if (prevProps) { // if previous props
            let currentchatlength;
            if (prevState.chatinput == false) { // If chat was just closed, scroll chat down now that it is open. Does not fire when chat is already open
                if (this.state.chatinput == true ) {
                    let getHeight = function() {
                        if (document.getElementById('openfriendchat')) {
                            let height = document.getElementById('openfriendchat').scrollHeight;
                            return height;
                        }
                    }

                    // console.log(getHeight());
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
                                        top: getHeight(),
                                        behavior: "smooth"
                                    });
                                    i++; // If scroll ran, increment once
                                }
                                // console.log(getHeight(),i);
                                if (i>0) { i--; }
                                scrollChat(i, speed += 20); // Increase timeout time to ensure scroll
                            }, speed);
                        }
                    }
                    // console.log(getHeight());
                    if (this.scrollRef.current) { // Prevents crash when no friends
                        scrollChat(4, 10);
                    }
                }
            }

            let getChatLength = () => {
                //console.log(this.props.friend, this.scrollRef.current.hasChildNodes());
                for (let i = 0; i < this.props.conversations.length; i++) { // Determines the length of this friend chat and returns chat length
                    if (this.props.conversations[i].users.length == 2) {
                        for (let j = 0; j < this.props.conversations[i].users.length; j++) {
                            if (this.props.conversations[i].users[j] === this.props.friend) {
                                if (this.props.conversations[i].log.length == this.scrollRef.current.childElementCount) {
                                    currentchatlength = this.props.conversations[i].log.length;
                                }
                                //console.log(this.scrollRef.current, this.props.friend);
                                //console.log(this.props.conversations[i].users[j], this.props.friend, currentchatlength);
                                return currentchatlength;
                            }
                        }
                    }
                }
            }

            let setStateScrollChat = () => {
                // console.log(this.props.friend, currentchatlength);
                if (currentchatlength) {
                    if (this.state.chatlength < currentchatlength) { // NEW CHAT, Chat length has been updated. Run scroll anim
                        // This will only fire when there is a valid current chat length and its value is greater than the recorded state chat length.
                        if (this.scrollRef.current.hasChildNodes()) { // A check to ensure that this scroll ref has chats belonging to it in the DOM.
                            if (this.scrollRef.current.childElementCount == currentchatlength) { // Check to ensure childelement count equals currentchatlength value.
                                this.setState({ chatlength: currentchatlength });
                            }
                        }

                        // This determines if scroll position is near bottom of chat. If scrollheight - scrolltop position - newlog height is less than ... then scroll to bottom for new chat. Value scrollheight - scrolltop usually gets is 362.
                        // This occurs so that when user is near bottom of chat they do not have to scroll down to see new chat. It will automatically update, but if user is NOT near bottom, do not interrupt their reading of previous chat logs by scrolling.

                        // console.log(this.scrollRef.current.scrollHeight, this.scrollRef.current.scrollTop);
                        let newlogheight = 0;
                        if (this.scrollRef) {
                            newlogheight += this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1].getBoundingClientRect().height;
                            if ((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= 480) {
                                if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
                                    if (document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight) {
                                        let height = document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight;
                                        document.getElementsByClassName("friendchat-chat-container-open")[0].scrollBy({
                                            top: height,
                                            behavior: "smooth"
                                        });
                                    }
                                }
                            }
                        }
                    }
                } else if (!currentchatlength && this.state.chatlength != 0 ) {
                    // If any chat is accidentally given a chatlength value from another chat, this will return it to 0 if there is an undefined chatlength.
                    // This will only run once if chatlength is undefined and is not already equal to 0.
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

    openchatinput = (e) => {
        // console.log(e.target.classList);
        // If user clicks on bump or profile, do not open chat submit
        this.props.updatefriendchatopen(e, this.props.friend);
        if (e.target.classList.contains("searched-user-message")) { // When user clicks on message, scroll down chat
            this.scrollRef.current.scrollBy({
                top: this.scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }

    handleKeyPress = (e) => {
        if(e.key === 'Enter'){
            e.preventDefault();
            let sendchat = (e) => {
                this.props.beginchat(e, this.props.friend, this.inputRef._ref.value), this.resetchat(e);
            }
            sendchat(e);
        }
    }
    
    resetchat = (e) => {
        this.inputRef._ref.value = ""; // Clear chat message
    }

    render() {
        return (
            <div>
                <div className={this.props.friendstotal == 1 ? "friend-single" : "friend"} onClick={(e) => {this.openchatinput(e)}}>
                    <div className='searched-user-username-container'>
                        <img className="friendavatar" src={require("./static/bobby.jpg")}></img>
                        <div className="friendname">{this.props.friend}</div>
                        <div className='search-user-dropdown prevent-open-toggle'>
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
                    {
                        this.props.watching ?
                            <span className="iswatchingtitle"> is watching <strong>{this.props.watching}</strong></span>
                            :
                            <span></span>
                    }
                    <div className='request-and-block-container'>
                        <span className='search-user-profile prevent-open-toggle'>profile<img className="searched-user-icon" src={profile} alt="profile"></img></span>
                        <span className='search-user-watch-friend'>watch<img className="searched-user-icon" src={play} alt="play"></img></span>
                        <span className='search-user-bump-friend prevent-open-toggle'>bump<img className="searched-user-icon" src={pointingfinger} alt="pointingfinger"></img></span>
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
                            this.props.conversations[0] ? // Is conversations length greater than 0?
                                this.props.conversations.map((conv, index) => {
                                    if (conv.users.length == 2) { // If total users in chat is 2
                                        for (let j = 0; j < conv.users.length; j++) { // Loop through conversations
                                            if (conv.users[j] == this.props.friend) { // If username of friend is located in chat users list then return true.
                                                // console.log(conv);

                                                return (
                                                    conv.log.map((log, index) => {
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
                                                                if (index == conv.log.length-1) {
                                                                    return (
                                                                        <div className='chat-log chat-log-user'>
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
                                                                if (index == conv.log.length-1) {
                                                                    return (
                                                                        <div className='chat-log chat-log-other'>
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
                                                )
                                            }
                                        }
                                    }
                                })
                                :<div></div>
                            }
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
                        ref={tag => (this.inputRef = tag)} onKeyPress={this.handleKeyPress} />
                        <button className={!this.props.friend ? "friend-chat-submit prevent-open-toggle" // if not friend
                            : this.props.friendchatopen == this.props.friend ? "friend-chat-submit friend-chat-submit-open prevent-open-toggle" // if open chat == friend
                            : "friend-chat-submit prevent-open-toggle"}
                        onClick={(e) => {this.props.beginchat(e, this.props.friend, this.inputRef._ref.value), this.resetchat(e)}} type='submit' value='submit'><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
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

function Social(props) {
    let limit;
    let setlimit = (e) => {
        if (props.searchusers[0]) {
            console.log(props.searchusers[0].length);
            console.log(props.searchusers);
            limit = Math.ceil(props.searchusers[0].length / 10) * 10;
            props.limitedsearch(props.username, limit+10);
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
                <div className="usernamedash">{props.username}</div>
                <div>
                    <div className="logout"><a href="/" onClick={props.fetchlogout}>logout</a>
                        <img className="minimize-dash" src={hamburger} alt="hamburger" onClick={props.toggleSideBar}></img>
                    </div>
                </div>
            </div>
            <div className="friend-requests-view">
                <button className="following-view">following</button>
                <button className="requests-view" onClick={(e) => {props.getpendingrequests(pendingsetvalue, true, props.username)}}>requests</button>
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
                        <input className="user-search" id="usersearch" type="search" placeholder="Search users..." name="usersearch"></input>
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
                <div className="load-more-users-wrapper"><button className="load-more-users" onClick={setlimit}>load more users</button></div>
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
                            return (
                                <Friend username={props.username}
                                friend={friend.username}
                                friendstotal={props.friends.length}
                                key={childCounter}
                                index={childCounter++}
                                conversations={props.conversations}
                                beginchat={props.beginchat}
                                revokefriendrequest={props.revokefriendrequest}
                                friendchatopen={props.friendchatopen}
                                updatefriendchatopen={props.updatefriendchatopen}
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
            <Sidebarfooter username={props.username} />
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

// Appends videos to dash
// TODO 
// Description shortener function
// publisher
// publish date.
// begin backend mongodb API and HDFS FS.

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

class Socialbar extends Component {
    constructor(props) {
        super(props);
        this.state = { isLoggedIn: (cookies.get('loggedIn')), username: cookies.get('loggedIn'),
                      sidebarximgSrc: sidebarcloseimg, sidebarStatus: 'open',
                      friends: [{}], users: {}, conversations: [],
                      searchuserinput: '', searchusers: [],
                      showingpendingrequests: "hidden", pendingfriendrequests: null,
                      friendchatopen: null, otheruserchatopen: null,
                      loginerror: null, registererror: null,
                      friendsopen: true, nonfriendsopen: true
                     }
        
       // this.getpendingrequests = this.getpendingrequests.bind(this);
        this.fetchusers = this.fetchusers.bind(this);
        this.debouncefetchusers = this.debouncefetchusers.bind(this);
        this.limitedsearch = this.limitedsearch.bind(this);
    }
    
    // function to run when mongodb gets information that state has changed.
    // test if the current state is equal to new object array.
    // then do something.
    appendFriends() {
        
    }
    
    componentWillMount(e) {

    }
    
    componentDidMount(e) {
       if (this.state.sidebarStatus === 'open') {
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
    
    getFriendConversations() {
        // This will retrieve all chats within "chats" in the user document.
        // The serverside function will:
        // 1. Make a query to mongo for the user object.
        // 2. Loop through each chat in confirmed for the length of confirmed array, make query for each chat under "chats" database
        // 3. Loop through each chat in pending, push into same conversations object of arrays.
        // 4. return all conversations in an object of arrays

        // 1. On the client side, for each friend, if chat users is 2 users long & contains a friends name, map each log in conversation into friend message log
        // 2. If statement, if log author is user then set class to "user-chat-log" else set to "friend-chat-log"

        // 3. All convos that do not have a listed friend in them will be rendered beneath friends group as "other chats"
        let username = this.state.isLoggedIn;

        fetch(currentrooturl + 'users/getconversationlogs', {
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
            return data;
        })

    }

    fetchlogin = (e) => {
        e.preventDefault();
        let email = document.getElementById('email').value;
        let password = document.getElementById("pw").value;
        console.log(email);
        console.log('fetch login func');
        fetch(currentrooturl + 'users/login', {
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
        fetch(currentrooturl + 'users/register', {
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
        // fetch('/users/logout');
        fetch(currentrooturl + 'users/logout', {
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
        this.refs.sidebar.classList.remove('sidebar-open');
        this.refs.sidebarx.classList.remove('sidebarxopen');
        document.getElementsByClassName('maindash')[0].classList.remove('maindashwide');
        document.getElementsByClassName('sidebarimg')[0].classList.remove('sidebarimg-open');
        this.setState({ sidebarStatus: 'closed', sidebarximgSrc: sidebaropenimg });
    }
    
    openSideBar() {
        this.refs.sidebar.classList.add('sidebar-open');
        this.refs.sidebarx.classList.add('sidebarxopen');
        document.getElementsByClassName('maindash')[0].classList.add('maindashwide');
        document.getElementsByClassName('sidebarimg')[0].classList.add('sidebarimg-open');
        this.setState({sidebarStatus: 'open', sidebarximgSrc: sidebarcloseimg });
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
    
    updatefriendchatopen = (e, friend) => {
        if (!(e.target.classList.contains("prevent-open-toggle")) && !(e.target.parentElement.classList.contains("prevent-open-toggle")) ) {
            console.log("Open chat");
            this.setState({ friendchatopen: friend });
        }
    }

    updateotheruserchatopen = (e, otheruser) => {
        if (!(e.target.classList.contains("prevent-open-toggle")) && !(e.target.parentElement.classList.contains("prevent-open-toggle"))) { // Open chat of clicked user if not clicking buttons profile, unfriend or befriend
            this.setState({ otheruserchatopen: otheruser });
        }
    }
    
    limitedsearch(username, limit) {
        console.log("limitedsearch");
        let searchusers = document.getElementById('usersearch').value;
        fetch(currentrooturl + 'users/searchusers', {
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
                // You parse the data into a useable format using `.json()`
                // console.log(JSON.parse(response));
                return response.json();
            })
            .then((data) => {
                console.log(data);
                this.setState({ searchusers: data }); // set user data to
            })
            .catch(error => { console.log(error);
            })
    }

    searchusers() {
        // debounced fetch users event
        console.log ('searching users');
        if (this.state && this.state.isLoggedIn) {
            let username = this.state.isLoggedIn;
            let searchusers = document.getElementById('usersearch').value;
            if (searchusers) {
                console.log("base search");
                fetch(currentrooturl + 'users/searchusers', {
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
                    // You parse the data into a useable format using `.json()`
                    return response.json();
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
        fetch(currentrooturl + 'users/requestfriendship', {
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
                return data; // `data` is the parsed version of the JSON returned from the above endpoint.
            })
            .catch(error => { console.log(error);
            })
            .then(function(data) {
                self.limitedsearch(self.state.isLoggedIn, self.state.searchusers[0].length); // re update list
                self = null;
            })

        e.preventDefault(console.log(thetitleofsomeonewewanttobecloseto));
    }
    
    revokefriendrequest = (e, friend, pending, refuse, block, search) => { // Pending if you're waiting for user to accept. Refuse true if user is refusing request
        let thetitleofsomeoneiusedtowanttobecloseto = friend;
        let username = this.state.isLoggedIn;
        let self = this;
        console.log("revokefriendrequest arguments; pending: " + pending + " refuse: " + refuse);
        fetch(currentrooturl + 'users/revokefriendship', {
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
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
            console.log(data);
            if (data.querystatus) {
                console.log('bad query');
            } else {
                this.setState({ friends: data });
            }
            return data;
        })
        .catch(error => { console.log(error);
        })
        .then(function(data) {
            if (pending) {
                self.limitedsearch(self.state.isLoggedIn, self.state.searchusers[0].length);
            } else if (refuse == "requestslist" || refuse == "nonfriendslist") {
                self.getpendingrequests(null, true, username); // true arguement to search again after qeuery
            }
            self = null;
        });
    }
        
    getpendingrequests = (show, search, username) => {
        // show variable must be null, "hidden" or "show"
        // search must be true to search after query or false to not search (e.g if want to close requests header but do not want to search)
        if (!username) {
            username = this.state.username;
        }
        
        console.log("Set state for showpendingrequests:", show, ", Search after query?:", search, ", Searching for requests of:", username);
        if (search || !this.state.pendingfriendrequests) { // If searching again or pendingfriendrequests is null
            fetch(currentrooturl + 'users/pendingrequests', {
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
        
        fetch(currentrooturl + 'users/acceptfriendrequest', {
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
        fetch(currentrooturl + 'users/getfriends', {
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

    beginchat = (e, chatwith, message) => {
        let username = this.state.isLoggedIn;
        // if target is undefined, avoid crash.
        console.log(username, chatwith, message);

        if (message.length > 0) {
            fetch(currentrooturl + 'users/beginchat', {
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
            .catch(error => { console.log(error);
            })
        }
        
        e.preventDefault(console.log('begin new chat'));  
    }
    
    toggleSideBar = () => {
        if (this.refs.sidebar.classList.contains('sidebar-open')) {
            this.closeSideBar();
            if (this.friends) {
                console.log(this.friends);
            }
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
            element.style.height = sectionHeight + "px"; // Set to section height by default
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

    render() {
        let sidebar;
        
        const isLoggedIn = this.state.isLoggedIn;
        if (!isLoggedIn) {
            sidebar = <Login fetchlogin={this.fetchlogin} fetchregister={this.fetchregister} loginerror={this.state.loginerror} registererror={this.state.registererror} />
        } else {
            sidebar = <Social username={this.state.isLoggedIn} friends={this.state.friends} fetchlogout={this.fetchlogout} conversations={this.state.conversations} pendinghidden={this.state.showpendingrequests} debouncefetchusers={this.debouncefetchusers} fetchusers={this.fetchusers} limitedsearch={this.limitedsearch} searchforminput={this.searchforminput} searchformclear={this.searchformclear} debouncefetchpendingrequests={this.debouncependingrequests}fetchuserpreventsubmit={this.fetchuserpreventsubmit} searchusers={this.state.searchusers} sendfriendrequest={this.sendfriendrequest} revokefriendrequest={this.revokefriendrequest} toggleSideBar={this.toggleSideBar} getpendingrequests={this.getpendingrequests} pendingfriendrequests={this.state.pendingfriendrequests} acceptfriendrequest={this.acceptfriendrequest} beginchat={this.beginchat} friendchatopen={this.state.friendchatopen} otheruserchatopen={this.state.otheruserchatopen} updatefriendchatopen={this.updatefriendchatopen} updateotheruserchatopen={this.updateotheruserchatopen} friendsopen={this.state.friendsopen} friendsSocialToggle={this.friendsSocialToggle} nonfriendsopen={this.state.nonfriendsopen} />
        }
            
        return (
            <div>
                <div className="sidebar sidebar-open" ref="sidebar">
                    <div className="sidebarcontainer">
                        {sidebar}
                    </div>
                </div>
                <div className="sidebarx sidebarxopen" ref="sidebarx" onClick={this.toggleSideBar}>
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
                        mainfeed: videofeed[0].main,
                     };
    }
    
    componentDidMount() {
        if (!cookies.get('Minireel')) {
            cookies.set('Minireel', 'minireel_sessionthistab', { path: '/', sameSite: true, signed: true }); 
        }
    }
        
    fetchData() {

    }
    
    render() {                    
        return (
            <BrowserRouter>
                <div className="App">
                    <Navbar />
                    <Socialbar />
                    <div className='maindashcontainer'>
                        <div className='main maindash'>
                            <Route exact path='/' render={(props) => (
                                <Dash {...props} mainfeed={this.state.mainfeed} />
                            )}/>
                            <Route path='/watch' render={(props) => (
                                <Video {...props} />
                            )}/>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;
