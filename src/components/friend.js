import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import { cookies, socket, bumpEvent, EventEmitter } from '../App.js';
import { get } from '../methods/utility.js';
import dummyavatar from '../static/greyavatar.jpg';

import profile from '../static/profile.svg'; import chatblack from '../static/chat-black.svg'; import minimize from '../static/minimize.svg'; import play from '../static/play.svg'; import pointingfinger from '../static/pointingfinger.svg'; import sendarrow from '../static/sendarrow.svg'; import circlemenulight from '../static/circlemenulight.svg';

import lzw from '../compression/lzw.js';
import TextareaAutosize from 'react-textarea-autosize';

const typingRegex = /([a-z0-9.]*);([^]*);(.*)/; // regular expression for reading 'typing' emits
const bumpRegex = /([^]*);([^]*);([^]*);(.*)/; // regex for reading 'bump' emits

let bumpRunning = 0;
let shakeRunning = 0;

// Individual friend
export default class Friend extends Component { // friend component fc1
    constructor(props) {
            super(props);
            this.inputRef = React.createRef();
            this.scrollRef = React.createRef();
            this.typingRef = React.createRef();
            this.shakeRef = React.createRef();
            this.bumpBtnRef = React.createRef();
            this.watchBtnRef = React.createRef();
            this.handleChange = this.handleChange.bind(this);
            this.state = { removeprompt: false, blockprompt: false,  reportprompt: false, chatinput: false,
                chatlength: 0, typingOld: null, morechats: false, chatlimit: 100, socketOn: true }
        }

    componentDidMount() {
        let currentchatlength = 0;
        if (this.props.conversation) {
            currentchatlength = this.props.conversation.log.length;
        }

        if (currentchatlength) {
            this.setState({ chatlength: currentchatlength }); // Sets length of chat when it is equal to null at componentDidMount
        }

        if (socket) {
            this.setState({ socketOn: true });
        }

        bumpEvent.on('bump', (data) => { // Bump functionality. Bumps friend via socket room.
            /* Shake, shakes a friend node to denote you are recieving a bump from that friend */
            let user = data.match(bumpRegex)[2];
            if (user === this.props.friend) {
                if (this.shakeRef.current) {
                    this.shakeRef.current.classList.add("shake", "shake-constant", "shake-bump");
                    shakeRunning +=1;
                    setTimeout(() => { // turn off rumble after short time
                        shakeRunning--;
                        if (shakeRunning === 0) {
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
        try {
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
                    if (this.state.chatinput && this.scrollRef.current) {
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
                setTimeout(() => {
                    detectVeryCloseBottom();
                }, 150);

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

            if (this.props.conversation) {
                if (this.props.conversation.log.length > this.state.chatlimit && this.state.morechats == false) {
                    this.setState({ morechats: true });
                }
            }
        } catch (err) {
            // Component may have unmounted during update
        }
    }

    /* Increases the amount of messages to display in specific chat and hides "see previous chats" button if showing max */
    raiseChatLimit(e) {
        try {
            if (this.props.conversation.log.length <= this.state.chatlimit) {
                this.setState({ morechats: false });
            } else {
                let newLimit = this.state.chatlimit + 100;
                this.setState({ chatlimit: newLimit });
                if (this.props.conversation.log.length <= newLimit) {
                    this.setState({ morechats: false });
                }
            }
        } catch (err) {

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
        try {
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
        } catch (err) {

        }
    }

    handleKeyPress = (e) => { // Emit cleared message when message is sent
        try {
            if(e.key === 'Enter'){
                e.preventDefault();
                let sendchat = (e) => {
                    this.props.beginchat(e, this.props.friend, this.inputRef._ref.value, this.props.conversation ? this.props.conversation._id : null); this.resetchat(e);
                }
                sendchat(e);

                if (socket) {
                    let roomId = this.props.conversation ? this.props.conversation._id : null;
                    let leanString = this.props.username + ";" + "" + ";" + roomId;
                    let ba = lzw.compress(leanString); // compress data as binary array before sending to socket
                    setTimeout(() => {
                        socket.emit('typing', ba);
                    }, 30);
                }
            }
        } catch (err) {
            // Componenet may have unmounted
        }
    }

    handleChange = (e) => { // Emit typing to users in chat via socket
        try {
            if (socket) {
                if (this.props.conversation) {
                    let leanString = this.props.username + ";" + this.inputRef._ref.value + ";" + this.props.conversation._id;
                    let ba = lzw.compress(leanString); // compress data as binary array before sending to socket
                    socket.emit('typing', ba);
                }
            }
        } catch (err) {
            // Component may have unmounted
        }
    }

    resetchat = (e) => {
        if (get(this, 'inputRef._ref.value')) {
            this.inputRef._ref.value = ""; // Clear chat message
        }

    }

    checkSocket = (e) => {
        try {
            if (socket) {
                if (!this.state.socketOn) {
                    this.setState({ socketOn: true });
                }
            } else if (this.state.socketOn) {
                this.setState({ socketOn: false });
            }
        } catch (err) {
            // Component may have unmounted
        }
    }
    
    returnAvatar = () => {
        if (this.props.avatarurl && this.props.cloud) {
            if (this.props.avatarurl.length > 0 && this.props.cloud.length > 0) {
                return this.props.cloud + "/av/" + this.props.avatarurl;
            }
        }
        return dummyavatar;
    }
    
    resolveWatchRequest = (e) => {
        if (this.props.waitingSessions.indexOf(this.props.friend) < 0) {
            this.props.requestTogetherSession(this.props.conversation._id, this.props.friend);
        } else {
            this.props.acceptTogetherSession(this.props.conversation._id, this.props.friend);
        }
    }
    
    checkTogetherToken = () => {
        if (this.props.togetherToken && this.props.conversation) {
            if (this.props.conversation._id) {
                if (this.props.togetherToken.room == this.props.conversation._id) {
                    return true;
                }
            }
        }
        return false;
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
                    <div className={this.props.friendchatopen === this.props.friend ? 'searched-user-username-container username-container-open' : 'searched-user-username-container'}>
                        <NavLink exact to={"/profile?p=" + this.props.friend} className="to-profile-link-btn">
                            <img className="friendavatar" src={this.returnAvatar()}></img>
                        </NavLink>
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
                        <span className='search-user-profile prevent-open-toggle'>
                            <NavLink exact to={"/profile?p=" + this.props.friend} className="to-profile-link-btn">profile</NavLink><img className="searched-user-icon" src={profile} alt="profile"></img>
                        </span>
                        <span className={this.checkTogetherToken() ? 'search-user-watch-friend prevent-open-toggle live-session-friend' : 'search-user-watch-friend prevent-open-toggle'} ref={this.watchBtnRef} onClick={(e) => {this.resolveWatchRequest(e)}}>{this.checkTogetherToken() ? "live" : this.props.waitingSessions.indexOf(this.props.friend) >= 0 ? "accept" : this.props.waitingTogetherConfirm && this.props.waitingTogetherConfirm == this.props.friend ? "wait.." : "watch"}<img className="searched-user-icon" src={play} alt="play"></img></span>
                        <span className={this.state.socketOn ? 'search-user-bump-friend prevent-open-toggle' : 'search-user-bump-friend prevent-open-toggle bump-btn-offline'} ref={this.bumpBtnRef} onClick={(e) => {this.props.bump(e, this.props.friend, conversationid ), this.checkSocket(e)}}>bump<img className="searched-user-icon bump-icon" src={pointingfinger} alt="pointingfinger"></img></span>
                        <div className='searched-user-message' onClick={(e) => {this.openchatinput(e)}}>message<img className="searched-user-icon" src={chatblack} alt="chat"></img></div>
                    </div>
                    <div className="friendchat friendchat-container">
                        <div ref={this.scrollRef} id={this.props.friendchatopen === this.props.friend ? 'openfriendchat' : 'closedfriendchat'} className={
                            this.state.chatlength == 0 ? "friendchat-chat-container friendchat-chat-container-empty" // If length of chat is 0
                            : !this.props.friend ? "friendchat-chat-container friendchat-chat-container-closed" // If this is not the friend of this loaded component
                            : this.props.friendchatopen == this.props.friend ? "friendchat-chat-container friendchat-chat-container-open"  // If friendchatopen == this current friend
                            : "friendchat-chat-container friendchat-chat-container-closed"
                        }>
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
                                                    <div className='chat-log chat-log-user chat-log-open' key={index}>
                                                        <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                            <div>{log.content}</div></div>
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className='chat-log chat-log-other chat-log-open' key={index}>
                                                        <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                        <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}><div>{log.content}</div></div>
                                                    </div>

                                                )
                                            }
                                        } else { // if open chat != this friend, set closed classes
                                            if (log.author == this.props.username) {
                                                if (index == this.props.conversation.log.length-1) {
                                                    return (
                                                        <div className={this.props.typing ? this.props.typing.match(typingRegex)[2].length > 0 ? "chat-log chat-log-user chat-log-closed" : "chat-log chat-log-user" : "chat-log chat-log-user"} key={index}>
                                                            <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                            <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                                <div>{log.content}</div></div>
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <div className='chat-log chat-log-user chat-log-closed' key={index}>
                                                            <div className='author-of-chat author-of-chat-user'>{log.author}</div>
                                                            <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}>
                                                                <div>{log.content}</div></div>
                                                        </div>
                                                    )
                                                }
                                            } else {
                                                if (index == this.props.conversation.log.length-1) {
                                                    return (
                                                        <div className={this.props.typing ? this.props.typing.match(typingRegex)[2].length > 0 ? "chat-log chat-log-other chat-log-closed" : "chat-log chat-log-other" : "chat-log chat-log-other"} key={index}>
                                                            <div className='author-of-chat author-of-chat-other'>{log.author}</div>
                                                            <div className={log.content.length < 35 ? 'content-of-chat' : 'content-of-chat content-of-chat-long'}><div>{log.content}</div></div>
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <div className='chat-log chat-log-other chat-log-closed' key={index}>
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
