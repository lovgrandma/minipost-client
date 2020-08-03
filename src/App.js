'use strict';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import 'shaka-player/dist/controls.css';
import axios from 'axios';
import csshake from 'csshake';
import Login from './components/login.js'; import Sidebarfooter from './components/sidebarfooter.js'; import SearchForm from './components/searchform.js'; import Navbar from './components/navbar.js'; import Upload from './components/upload.js'; import SearchedUserResults from './components/searcheduserresults.js'; import NonFriendConversation from './components/nonfriendconversation.js'; import Request from './components/request.js'; import Dash from './components/dash.js'; import Videos from './components/videos.js'; import Video from './components/video.js';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import { instanceOf } from 'prop-types';
import Cookies from 'universal-cookie';
import logo from './static/minireel-dot-com-3.svg'; import mango from './static/minireel-mangologo.svg'; import heart from './static/heart.svg'; import whiteheart from './static/heart-white.svg'; import history from './static/history.svg'; import searchwhite from './static/search-white.svg'; import search from './static/search.svg'; import notifications from './static/notifications.svg'; import profile from './static/profile.svg'; import upload from './static/upload.svg'; import thumbsup from './static/thumbsup.svg'; import thumbsdown from './static/thumbsdown.svg'; import share from './static/share.svg'; import sidebarcloseimg from './static/sidebarclose.svg';  import sidebaropenimg from './static/sidebaropen.svg'; import dummythumbnail from './static/warrenbuffetthumb.jpg'; import chatblack from './static/chat-black.svg'; import close from './static/close.svg'; import hamburger from './static/hamburger.svg'; import pointingfinger from './static/pointingfinger.svg'; import circlemenu from './static/circlemenu.svg'; import newspaperblack from './static/newspaper.svg'; import play from './static/play.svg'; import television from './static/tv.svg'; import sendarrow from './static/sendarrow.svg'; import subscribe from './static/subscribe.svg'; import friendswhite from './static/friendsWhite.svg'; import nonFriendsWhite from './static/nonFriendsWhite.svg'; import circlemenulight from './static/circlemenulight.svg'; import minimize from'./static/minimize.svg'; import maximize from './static/maximize.svg'; import angleDoubleLeft from './static/angle-double-left-solid.svg'; import settings from './static/settings.svg';
import './style/sass.scss';
import './style/app.css';
import './style/player.css';
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

import videofeedvar from './videofeedplaceholder';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import io from "socket.io-client";
import currentrooturl from './url.js';

import { debounce }from './methods/util.js';

const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');
const bumpEvent = new EventEmitter();
bumpEvent.setMaxListeners(100);
let socket; // Expose socket to entire application once it is created

library.add();
const cookies = new Cookies();

const typingRegex = /([a-z0-9.]*);([^]*);(.*)/; // regular expression for reading 'typing' emits
const bumpRegex = /([^]*);([^]*);([^]*);(.*)/; // regex for reading 'bump' emits

// placeholder import video info
let videofeed = videofeedvar;

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
            this.handleChange = this.handleChange.bind(this);
            this.state = { removeprompt: false, blockprompt: false,  reportprompt: false, chatinput: false,
                chatlength: 0, typingOld: null, morechats: false, chatlimit: 100 }
        }

    componentDidMount() {
        let currentchatlength = 0;
        if (this.props.conversation) {
            currentchatlength = this.props.conversation.log.length;
        }
        
        if (currentchatlength) {
            this.setState({ chatlength: currentchatlength }); // Sets length of chat when it is equal to null at componentDidMount
        }

        bumpEvent.on('bump', (data) => { // Bump functionality. Bumps friend via socket room.
            /* Shake, shakes a friend node to denote you are recieving a bump from that friend */
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
            } else if (user == this.props.username) { // User recieved the bump that was sent out and is filtering through buttons to provide feedback that it was sent (It will rumble the button of the friend that you bumped)
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

    componentWillUnmount() {

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
        if (prevProps && prevState) { // if previous props
            let currentchatlength;
            if (prevState.chatinput == false && this.state.chatinput == true) { // If chat was closed in previous state, scroll chat down now that it is open. Does not fire when chat is already open
                let getHeight = function() { // get height of chat
                    if (document.getElementById('openfriendchat')) {
                        let height = document.getElementById('openfriendchat').scrollHeight;
                        return height;
                    }
                }

                if (getHeight() > 4000) {
                    if (this.scrollRef) {
                        if (this.scrollRef.current) {
                            if (this.scrollRef.current.classList.contains("friendchat-chat-container")) {
                                this.scrollRef.current.scrollBy({
                                    top: getHeight()-3000,
                                    behavior: "auto"
                                });
                            }
                        }
                    }
                }
                let tempHeight = getHeight();
                let scrollChat = (i, speed) => { // Recursive scroll function, runs 3 times to definitively get length of scroll
                    if (this.scrollRef.current) {
                        if (i != 0) {
                            setTimeout(() => {
                                if (getHeight() > tempHeight) {
                                    tempHeight = getHeight();
                                    if (this.scrollRef) {
                                        if (this.scrollRef.current) {
                                            if (this.scrollRef.current.classList.contains("friendchat-chat-container")) {
                                                this.scrollRef.current.scrollBy({
                                                    top: getHeight()*2,
                                                    behavior: "smooth"
                                                });
                                            }
                                        }
                                    }
                                    i++; // If scroll ran, increment once
                                }
                                if (i>0) { i--; }
                                scrollChat(i, speed += 20); // Increase timeout time to ensure scroll
                            }, speed);
                        }
                    }
                }
                scrollChat(4, 10);
            }

            let getChatLength = () => {
                if (this.props.conversation) {
                    currentchatlength = this.props.conversation.log.length;
                }
            }

            /* This determines if scroll position is near bottom of chat. If scrollheight - scrolltop position - newlog height is less than ... then scroll to bottom for new chat. Value scrollheight - scrolltop usually gets is 362.
            This occurs so that when user is near bottom of chat they do not have to scroll down to see new chat. It will automatically update, but if user is NOT near bottom, do not interrupt their reading of previous chat logs by scrolling. */

            let detectNearBottom = () => {
                if (this.state.chatinput) {
                    let newlogheight = 0;
                    if (this.scrollRef) { // Gets height of new log
                        if (this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1]) {
                            newlogheight += this.scrollRef.current.getElementsByClassName('chat-log')[this.scrollRef.current.childElementCount-1].getBoundingClientRect().height;
                        }

                        let scrollHeight = this.scrollRef.current.scrollHeight;
                        if ((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= scrollHeight*0.20 ||
                            (this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= 362) {
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
                        if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
                            if (document.getElementsByClassName("friendchat-chat-container-open")[0].scrollHeight <= 1500) {
                                if (this.scrollRef.current.classList.contains("friendchat-chat-container")) {
                                    if (this.scrollRef) {
                                        if (this.scrollRef.current) {
                                            this.scrollRef.current.scrollBy({
                                                top: 1000,
                                                behavior: "smooth"
                                            });
                                        }
                                    }
                                }
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
                        if ((this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= scrollHeight*0.05 ||
                            (this.scrollRef.current.scrollHeight - this.scrollRef.current.scrollTop - newlogheight) <= 363) {
                            if (document.getElementsByClassName("friendchat-chat-container-open")[0]) {
                                document.getElementsByClassName("friendchat-chat-container-open")[0].scrollBy({
                                    top: this.scrollRef.current.scrollHeight,
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

            if (prevState.chatinput && this.state.chatinput == false) {
                this.setState({ chatlimit: 50 });
            }
        }
    }

    /* Increases the amount of messages to display in specific chat and hides "see previous chats" button if showing max */
    raiseChatLimit(e) {
        if (this.props.conversation.log.length <= this.state.chatlimit) {
            this.setState({ morechats: false });
        } else {
            let newLimit = this.state.chatlimit + 100;
            this.setState({ chatlimit: newLimit });
            if (this.props.conversation.log.length <= newLimit) {
                this.setState({ morechats: false });
            }
        }
    }

    promptremovefriend = (e) => {
        this.setState({ removeprompt: true });
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
            if (this.props.conversation._id) {
                conversationid = this.props.conversation._id;
            }
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
                        <span className={socket ? 'search-user-bump-friend prevent-open-toggle' : 'search-user-bump-friend prevent-open-toggle bump-btn-offline'} ref={this.bumpBtnRef} onClick={(e) => {this.props.bump(e, this.props.friend, conversationid )}}>bump<img className="searched-user-icon bump-icon" src={pointingfinger} alt="pointingfinger"></img></span>
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
                                this.props.conversation.log.length > this.state.chatlimit && this.state.morechats == false ?
                                        this.setState({ morechats: true }) : null : null
                        }
                        {this.state.chatlength > 0 && this.state.morechats && this.props.friendchatopen == this.props.friend ?
                            <button className="load-more-chat" onClick={(e) => {this.raiseChatLimit(e)}}>See previous chats</button>
                            :
                            <div className="hidden-overflow"></div>
                        }
                        {
                            this.props.conversation ?
                                this.props.conversation.log.map((log, index) => {
                                    if (index >= this.props.conversation.log.length - this.state.chatlimit) {
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
                        <TextareaAutosize className ={!this.props.friend ? "textarea-chat-autosize fixfocuscolor textarea-chat-autosize-closed" // if not friend
                            : this.props.friendchatopen == this.props.friend ? "textarea-chat-autosize fixfocuscolor" // if open chat == this friend
                            : "textarea-chat-autosize fixfocuscolor textarea-chat-autosize-closed"}
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
            /* Runs search query to return current search user length plus 10 more users */
            props.limitedsearch(props.username, props.searchusers[0].length+10); // Does limited search for more users in search bar
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
                <form className="search-form-flex-users" onInput={props.debouncefetchusers} onChange={props.searchforminput} onSubmit={props.fetchuserpreventsubmit} noValidate='noValidate' autoComplete='off'>
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

                                let alreadypending = function() {  // Determine if the user is on searched users pending list. Waiting for them to accept
                                    for (var i = 0; i < searcheduser.friends[1].pending.length; i++) {
                                        if (searcheduser.friends[1].pending[i]) {
                                            if (searcheduser.friends[1].pending[i].username === props.username) {
                                                return true;
                                            }
                                        }
                                    }
                                }

                                let requestwaiting = function() { // Determine if searched user is waiting for user to accept friend request.
                                    for (var i = 0; i < props.searchusers[0].length; i++) { // Iterate through the searched users
                                        if (props.searchusers[0] && props.pendingfriendrequests) {
                                            for (let j = 0; j < props.pendingfriendrequests.length; j++) {
                                                if (props.pendingfriendrequests[j].username === searcheduser.username) {
                                                    return true;
                                                }
                                            }
                                        }
                                    }
                                }

                                let alreadyfriends = function() { // Determine if already friends with this searched user
                                    for (var i = 0; i < props.friends.length; i++) {
                                        if (props.friends[0]) {
                                            if(props.friends[i].username === searcheduser.username) {
                                                return true;
                                            }
                                        }
                                    }
                                }

                                let yourself = function() { // Determine if searched user is self
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
                                if (props.conversations[i]) {
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
                                    if (conversation) {
                                        if (conversation.users.length == 2) { // valid 2 user chat
                                            for (let k = 0; k < conversation.users.length; k++) { // iterate thr each user in conversation
                                                if (props.friends[i].username == conversation.users[k]) { // if iterated friend == iterated user in chat
                                                    return true; // Then this is a friend chat, return true to not show in extra chats
                                                }
                                            }
                                        } else {
                                            return true; // else invalid return true (Doesnt confirm that this is a conversation w a friend, but confirms it should not show in other chats)
                                        }
                                    } else {
                                        return false;
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
                      friendsopen: true, nonfriendsopen: false,
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
                    data = lzw.decompress(data); // decompress data before processing
                    this.setTyping(data);
                })

                socket.on('chat', data => {  // on new chat, match id and append
                    this.appendChat(data);
                });

                socket.on('bump', data => {
                    bumpEvent.emit('bump', (data));
                });

                socket.on('uploadUpdate', data => {
                    this.props.updateUploadStatus(data);
                });

                socket.on('uploadErr', data => {
                    console.log("upload err:" + data);
                    this.props.updateErrStatus(data);
                    cookies.remove('uplsession'); // Upload complete, delete session cookie
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
                if (this.state.conversations[i]) {
                    if (data.id == this.state.conversations[i]._id) {
                        delete data.id;
                        let temp = this.state.conversations;
                        temp[i].log.push(data);
                        if (data.author != this.state.isLoggedIn) {
                            let leanString = data.author + ";" + "" + ";" + this.state.conversations[i]._id; // reset typing data
                            this.setTyping(leanString);
                        }
                        this.setState({ conversations: temp });
                    }
                }
            }
        }
    }

    initializeLiveChat = (delay = 500) => { // Sends request to server to join user to room
        if (socket) {
            if (this.state.conversations && this.state.isLoggedIn) {
                let obj = {
                    "ids": this.state.convoIds,
                    "user": this.state.isLoggedIn
                }
                socket.emit('joinConvos', obj); // Joins user into convo rooms
                this.joinUploadSession(); // Joins upload session if true
            } else {
                setTimeout(() => {
                    this.initializeLiveChat(delay*3);
                }, delay);
            }
        }
    }

    joinUploadSession = () => {
        if (cookies.get('uplsession')) {
            socket.emit('joinUploadSession', cookies.get('uplsession'));
        }
    }

    // for increased live functionality when user has clicked on a chat
    // If other user has started chat already but doesnt show, this will update and connect user to the chat
    focusLiveChat(room) {
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
            if (!socket) { // Do not run logic for mongo db
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
            }
            return data;
        })
        .then(() => {
            setTimeout(() => {
                let delay = 0;
                if (!socket) {
                    this.openSocket(); // open socket after friend conversations ran
                    delay = 500;
                }
                setTimeout(() => {
                    this.initializeLiveChat();
                }, delay);
            }, 200);
        })
    }

    // Entry point method after login
    fetchlogin = (e) => {
        e.preventDefault();
        let email = document.getElementById('email').value;
        let password = document.getElementById("pw").value;
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
                this.setState({ registererror: {error: data.error, type: data.type }});
            }
            return data;
        })
        .catch(error => { console.log(error);
        })
    }

    fetchlogout(e) {
         cookies.remove('loggedIn', { path: '/' });
         cookies.remove('user', { path: '/' });
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
                this.setState({ searchusers: data }); // set user data to
            })
            .catch(error => {
                console.log(error);
            })
        }
    }

    searchusers() { // Search method that uses value in user search bar to return 10 searched users
        // debounced fetch users event
        if (this.state && this.state.isLoggedIn) {
            let username = this.state.isLoggedIn;
            let searchusers = document.getElementById('usersearch').value;
            if (searchusers) {
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
                    /* Returns array with [0] searched users, [1] moreusers boolean and [2] pending friends */
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
            if (data == { querystatus: 'already friends' }) {
                this.getfriends();
                this.getFriendConversations();
            }
            return data; // `data` is the parsed version of the JSON returned from the above endpoint.
        })
        .catch(error => {
            console.log(error);
        })
        .then((data) => {
            this.limitedsearch(this.state.isLoggedIn, this.state.searchusers[0].length, true); // re update list
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
        })
        .then((data) => {
            this.initializeLiveChat();
        })
    }
        
    /* Get pending requests method that often runs in background to populate pending requests data, other methods
    rely on this data to get important information */
    getpendingrequests = (show, search, username) => {
        // show variable must be null, "hidden" or "show"
        // search must be true to search after query or false to not search (e.g if want to close requests header but do not want to search)
        if (!username) {
            username = this.state.username;
        }
        if (!username) {
            username = cookies.get('loggedIn');
        }

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
            this.setState({ friends: data });
            setTimeout(this.getpendingrequests(null, requests, username), 1500); // Reset user search after friend accepted.
            return data;
        })
        .then((data) => {
            this.debouncefetchusers();
        })
        .catch(error => { console.log(error);
        })
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
        if (!convoId) { // Determine if chat sent from search exists in current chats
            if (this.state.conversations) {
                for (let i = 0; i < this.state.conversations.length; i++) {
                    if (this.state.conversations[i]) {
                        if (this.state.conversations[i].users) {
                            if (this.state.conversations[i].users.length == 2) {
                                for (let j = 0; j < this.state.conversations[i].users.length; j++) {
                                    if (this.state.conversations[i].users[j] == chatwith) {
                                        convoId = this.state.conversations[i]._id;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (socket && convoId) { // If socket is online, use socket to redis first functionality
            if (message.length > 0) {
                let chatObj = {
                    "user": username,
                    "id": convoId,
                    "message": message,
                    "chatwith": chatwith
                }
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
                    setTimeout(() => {
                        this.initializeLiveChat();
                    }, 500);
                })
                .catch(error => { console.log(error);
                })
            }
        }
        
        e.preventDefault();
    }
    
    toggleSideBar = () => {
        if (this.sidebar.current.classList.contains('sidebar-open')) {
            this.closeSideBar();
            // this.searchformclear();
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
        if (document.getElementsByClassName("user-search")[0]) {
            document.getElementsByClassName("user-search")[0].value = "";
        }
        this.setState({ searchusers: [] });
        if (document.getElementsByClassName('search-users-results-container')[0]) {
            document.getElementsByClassName('search-users-results-container')[0].classList.remove('search-users-results-container-opened');
        }
        if (document.getElementsByClassName('clear')[0]) {
            document.getElementsByClassName('clear')[0].classList.remove('clear-visible');
        }
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
        if (this.state.isLoggedIn && socket && too && room) {
            if (too.length > 0 && room.length > 0 ) {
                /* Format of socket message is: bump;from;too;room */
                let data = "bump;" + this.state.isLoggedIn + ";" + too + ";" + room;
                socket.emit('bump', data);
            }
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
                <Navbar username={this.state.isLoggedIn} sidebarStatus={this.props.sidebarStatus} />
                <div className={this.props.sidebarStatus == 'open' ? "sidebar sidebar-open" : "sidebar"} ref={this.sidebar}>
                    <div className="sidebarcontainer">
                        {sidebar}
                    </div>
                </div>
                <div className={this.props.sidebarStatus == 'open' ? "sidebarx sidebarxopen" : "sidebarx"} ref={this.sidebarx} onClick={this.toggleSideBar}>
                    <img className="sidebarimg" src={this.state.sidebarximgSrc} ref='sidebarximg'></img>
                </div>
            </div>
        );
    } 
};

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
                        mainfeed: videofeed[0].main, watching: "", sidebarStatus: cookies.get('sidebarStatus'),
                        isLoggedIn: cookies.get('loggedIn'), uploadStatus: '', errStatus: '', uploading: null, uploadedMpd: ''
                     };
    }
    

    componentDidMount() {
        if (!cookies.get('Minireel')) {
            cookies.set('Minireel', 'minireel_session', { path: '/', sameSite: true, signed: true });
        }

        if (this.state.isLoggedIn) {
            let username = this.state.isLoggedIn;
            fetch(currentrooturl + 'm/setCloudCookies', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username
                })
            })
                .then(function(response) {
                return response.json();
            })
                .then((data) => {
                return data;
            })
                .catch(error => { console.log(error);
            });
        }
    }

    getSocket = async => {
        return socket;
    }

    updateUploadStatus = (update) => {
        if (update.match(/processing;([a-z0-9].*)/)) { // If update matches background video upload update, change uploading state, else just change upload status
            this.setState({ uploading: update.match(/processing;([a-z0-9].*)/)[1] });
        } else {
            console.log(update);
            if (update.match(/video ready;([a-z0-9].*)/)) {
                this.setState({ uploading: null, uploadedMpd: update.match(/video ready;([a-z0-9].*)/)[1] });
                this.setState({ uploadStatus: "video ready" });
                cookies.remove('uplsession'); // Upload complete, delete session cookie
            } else if (update == "video ready") {
                this.setState({ uploading: null });
                this.setState({ uploadStatus: update });
            } else if (update == "remove mpd") {
                this.setState({ uploadedMpd: '' });
            } else {
                this.setState({ uploadStatus: update });
            }
            this.setState({ errStatus: '' });
        }
    }

    updateErrStatus = (err) => {
        if (err != '') {
            this.setState({ uploadStatus: '' });
        }
        this.setState({ errStatus: err });
    }

    updateSidebarStatus = (update) => {
        cookies.set('sidebarStatus', update, { path: '/', sameSite: true, signed: true });
        this.setState({sidebarStatus: update });
    }

    render() {                    
        return (
            <BrowserRouter>
                <div className="App">
                    <Socialbar watching={this.state.watching} sidebarStatus={this.state.sidebarStatus} updateSidebarStatus={this.updateSidebarStatus} updateUploadStatus={this.updateUploadStatus} updateErrStatus={this.updateErrStatus} />
                    <div className='maindashcontainer'>
                        <div className='main maindash'>
                            <Route exact path='/' render={(props) => (
                                <Dash {...props} username={this.state.isLoggedIn} mainfeed={this.state.mainfeed} />
                            )}/>
                            <Route path='/search' render={(props) => (
                                <Dash {...props} username={this.state.isLoggedIn} mainfeed={this.state.mainfeed} />
                            )}/>
                            <Route path='/watch' render={(props) => (
                                <Video {...props} />
                            )}/>
                            <Route path='/upload' render={(props) => (
                                <Upload {...props} sidebarStatus={this.state.sidebarStatus} isLoggedIn={this.state.isLoggedIn} socket={socket} uploadStatus={this.state.uploadStatus} updateUploadStatus={this.updateUploadStatus} getSocket={this.getSocket} updateErrStatus={this.updateErrStatus} errStatus={this.state.errStatus} uploading={this.state.uploading} mpd={this.state.uploadedMpd} />
                            )}/>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;
