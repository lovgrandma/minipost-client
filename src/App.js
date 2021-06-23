/* global google */
import React, { Component, useState, useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import Helmet from 'react-helmet';
import csshake from 'csshake';
import Video from './components/video.js'; import Navbar from './components/navbar.js'; import Upload from './components/upload.js'; import Dash from './components/dash.js'; import WriteArticle from './components/writearticle.js'; import Article from './components/article.js'; import Profile from './components/profile.js'; import History from './components/history.js'; import Notifications from './components/notifications.js'; import Results from './components/results.js'; import Options from './components/options.js'; import InfoTemplate from './components/info-template.js'; import ResetPass from './components/resetpass.js'; import ProductSinglePage from './components/product-single-page.js'; import Checkout from './components/checkout.js'; import Orders from './components/ecommerce/orders.js'; import Order from './components/ecommerce/order.js'; import ShopOrders from './components/ecommerce/shoporders.js'; import AdminOptions from './components/admin/adminOptions.js';
import {
    Route
} from 'react-router-dom';
import Cookies from 'universal-cookie';
import sidebarcloseimg from './static/sidebarclose.svg';  import sidebaropenimg from './static/sidebaropen.svg'; import angleDoubleLeft from './static/angle-double-left-solid.svg';
import { updateNotif } from './methods/history.js';

import {
    Button
} from 'react-bootstrap';
import $ from 'jquery';
import lzw from './compression/lzw.js';
import TextareaAutosize from 'react-textarea-autosize';
import { hideOptions } from './methods/context.js';
import jwt_decode from 'jwt-decode';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import io from "socket.io-client";
import currentrooturl from './url.js';
import proxyurl from './proxy.js';
import corsdefault from './cors.js';
import { Playlist } from './class/playlist.js';
import { Together } from './class/together.js';
import { updateCachedCart, deleteCachedCart } from './methods/ecommerce.js';

import { debounce, deepEquals, arraysEqual, getPath, get } from './methods/utility.js';

const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');
const bumpEvent = new EventEmitter();
const localEvents = new EventEmitter();
bumpEvent.setMaxListeners(100);
let socket; // Expose socket to entire application once it is created

const cookies = new Cookies();

const typingRegex = /([a-z0-9.]*);([^]*);(.*)/; // regular expression for reading 'typing' emits
const bumpRegex = /([^]*);([^]*);([^]*);(.*)/; // regex for reading 'bump' emits

const Login = lazy(() => import('./components/login.js'));
const Social = lazy(() => import('./components/social.js'));

// Main Application file

// Side Social Bar
class Socialbar extends Component { // Main social entry point sb1
    constructor(props) {
        super(props);
        this.state = { isLoggedIn: (cookies.get('loggedIn')), sidebarximgSrc: sidebarcloseimg, friends: [{}], users: {},
                      conversations: [], convoIds: [], searchuserinput: '', searchusers: [], showingfollows: "hidden",
                      showingpendingrequests: "hidden", pendingfriendrequests: null, following: [],
                      friendchatopen: null, otheruserchatopen: null,
                      loginerror: null, registererror: null, verifyerror: null,
                      friendsopen: true, nonfriendsopen: false, adminCheck: false,
                      response: false, endpoint: proxyurl, googleSignInError: '', usernameChoicePortal: false,
                      typing: [], darkmode: false, verifyinfo: "", useravatar: ""
                     }
        
       // this.getpendingrequests = this.getpendingrequests.bind(this);
        this.fetchusers = this.fetchusers.bind(this);
        this.debouncefetchusers = this.debouncefetchusers.bind(this);
        this.limitedsearch = this.limitedsearch.bind(this);
        this.sidebar = React.createRef();
        this.sidebarx = React.createRef();
        this.sidebarcontainer = React.createRef();
        this.usernameChoiceSelect = React.createRef();
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
        }
        if (this.props.cloud) {
            //this.props.setCloud();
        }
        this.setupGoogleSignIn();
        localEvents.on("openSideBar", () => { this.openSideBar() });
        this.checkAdmin();
    };
        
    componentDidUpdate(e, prevState, prevProps) {
        if (cookies.get('loggedIn')) {
            if (this.state.isloggedIn != cookies.get('loggedIn')) {
                this.setState({ isloggedIn: cookies.get('loggedIn')});
            }
        }
        if (prevState) {
            if (prevState.isloggedIn != cookies.get('loggedIn')) {
                if (this.state.isloggedIn != cookies.get('loggedIn')) {
                    this.setState({ isloggedIn: cookies.get('loggedIn')});
                }
            }
        }
        if (this.props.togetherToken && this.state.conversations) {
            for (let i = 0; i < this.state.conversations.length; i++) {
                if (this.state.conversations[i]) {
                    if (this.state.conversations[i]._id == this.props.togetherToken.room) {
                        if (!this.props.friendConvoMirror) {
                            this.props.updateFriendConvoMirror(this.state.conversations[i]);
                        } else {
                            if (this.props.friendConvoMirror._id && this.props.friendConvoMirror.log && this.state.conversations[i].log) {
                                if (this.props.friendConvoMirror.log.length != this.state.conversations[i].log.length) {
                                    this.props.updateFriendConvoMirror(this.state.conversations[i]);
                                }
                            }
                        }
                    }
                }
            }
        }
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

                socket.on('returnNotif', data => {
                    this.setState({ following: updateNotif(data.subscribed) });
                })
                
                socket.on('promptTogether', data => { // received prompt to watch together, append prompt on respective friends chat bubble. 
                    // The data received here will look like { room: room, friend: this is yourself the new host, user: your friend who asked to watch together }
                    // User can recieve several prompts so its important to keep track of all
                    if (cookies.get('loggedIn')) {
                        this.props.appendWaitingSession(data.user);
                        console.log('prompTogether', data);
                    }
                })
                
                socket.on('confirmTogether', data => { // The friend has agreed to host a together session. props.BeginTogetherSession(room, friend, host(boolean))
                    if (cookies.get('loggedIn')) {
                        if (data.host != cookies.get('loggedIn')) { // Only run confirmTogether if you are not the host, but a participant
                            console.log('confirmTogether', data);
                            this.props.beginTogetherSession(data);
                        }
                    }
                })
                
                socket.on('marco', data => { // Send a response 'polo' if there is a valid togetherToken in props
                    if (data.from != cookies.get('loggedIn') && this.props.togetherToken) {
                        if (data.from == this.props.togetherToken.host || this.props.togetherToken.participants.indexOf(data.from) >= 0) {
                            socket.emit('poloCheck', data);
                        }
                    }
                });
                
                socket.on('polo', data => {
                    if (cookies.get('loggedIn')) {
                        if (data.from == cookies.get('loggedIn')) { // from should be yourself since this client originally sent the request to check live status
                            this.props.updateLastPing(data);
                        }
                    }
                })
                
                socket.on('receiveCloseTogetherSession', data => {
                    console.log(data);
                    if (cookies.get('loggedIn')) {
                        if (data.from != cookies.get('loggedIn') && this.props.togetherToken) {
                            this.props.sendCloseTogetherSession(true);
                        }
                    }
                })
                
                socket.on('receiveWatch', data => {
                    if (cookies.get('loggedIn')) {
                        if (data.host != cookies.get('loggedIn')) {
                            this.props.doWatch(data);
                        }
                    }
                })

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

    checkAdmin() {
        try {
            if (cookies.get('adminCheck')) {
                this.setState({ adminCheck: true });
            }
        } catch (err) {
            // fail silently
        }
    }

    setTyping = (data) => {
        // let typeData = data.match(typingRegex);
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
                            this.props.updateTypingMirror(temp); // Updates typing mirror for full screen video chat
                        }
                    }
                }
                if (!inArr) { // if this chat is not present in typing state array, simply just add it.
                    temp.push(data);
                    this.setState({ typing: temp });
                    this.props.updateTypingMirror(temp);
                }
            }
        } else {
            if (user != this.state.isLoggedIn) { // if the typing data being added != user signed in, it is from someone else. Show the user what they are typing
                let temp = this.state.typing;
                temp.push(data);
                this.setState({ typing: temp });
                this.props.updateTypingMirror(temp);
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
            if (this.state.convoIds && this.state.isLoggedIn) {
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

    /**
    * Retrieves friend conversations from mongoDb
    *
    * @args {none}
    * @return {none}
    */
    getFriendConversations() {
        // This will retrieve all chats within "chats" in the user document.
        let username = this.state.isLoggedIn;
        let hash = cookies.get('hash');
        let self = false;
        if (username) {
            self = true;
        }
        if (!socket) {
            fetch(currentrooturl + 'm/getconversationlogs', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then((data) => {
                let authorized = this.props.checkAndConfirmAuthentication(data);
                if (authorized) {
                    if (!socket) { // Do not run logic for mongo db converstations. Proceed to get redis data via socket instead
                        console.log("Conversations:", data);
                        if (!this.state.pendingfriendrequests) { // Only reload if pendingfriendrequests not true, prevents reload on every chat sent
                            this.getpendingrequests("hidden", null, username); // Updates pending list everytime getFriendConversations runs if socket is null
                        }
                        this.setState({ conversations: data }); // set state for conversations
                        let convoIds = [];
                        for (let i = 0; i < data.length; i++) { // Sets convo ids from conversations object
                            convoIds.push(data[i]._id);
                        }
                        this.setState({ convoIds: convoIds });
                    }
                    return data;
                } else {
                    return false;
                }
            })
            .then((data) => {
                this.rebuildSocketConnection();
            })
        } else {
            this.rebuildSocketConnection();
        }
    }

    rebuildSocketConnection = () => {
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
    }

    /**
    * Asks serve to send text message to user to reset password via link
    *
    * @args {event e, String phone, String email}
    * @returns {String status || Boolean} Will return whether or not submitReset successfully happened or failed or false
    * communicating false non-action.
    */
    submitResetPass = async (e, email) => {
        if (email) {
            return await fetch(currentrooturl + 'm/submitresetpass', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: corsdefault,
                body: JSON.stringify({
                    email
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                let authorized = this.props.checkAndConfirmAuthentication(data);
                if (authorized) {
                    if (data) {
                        return "Success! You'll get an email to reset your password with. Please check your junk folder";
                    }
                }
                return "Reset failed. Please retry";
            });
        } else {
            return false;
        }
    }
    
    /**
    * Logs user in and authenticates them. Provides back hash which is required for all authenticated actions
    *
    * @args {Event e} 
    * @return {none}
    */
    fetchlogin = (e) => {
        try {
            e.preventDefault();
            this.setGoogleSignInErrorState();
            let email = document.getElementById('email').value;
            let password = document.getElementById("pw").value;
            fetch(currentrooturl + 'm/login', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: corsdefault,
                body: JSON.stringify({
                    email, password
                })
            })
            .then((response) => {
                return response.json(); // Parsed data
            })
            .then((data) => {
                console.log(data);
                this.setState({ registererror: null });
                this.setState({ loginerror: null });
                if (data.admin) {
                    cookies.set('adminCheck', true);
                    this.setState({ adminCheck: true });
                }
                if (data.querystatus== "loggedin" && data.username && data.hash) {
                    cookies.set('hash', data.hash); // Set hash first as features do not run without hash
                    cookies.set('loggedIn', data.username);
                }
                if (data.error) {
                    console.log(data.error);
                    console.log(data.type);
                    this.setState({ loginerror: {error: data.error, type: data.type }});
                }
                return data;
            })
            .then((data) => {
                if (cookies.get('loggedIn')) {
                    this.getfriends();
                    this.setState({ isLoggedIn: (cookies.get('loggedIn'))});
                }
                if (data.querystatus == "loggedin") {
                    this.props.updateLogin(data.username);
                }
            })
            .catch(error => { 
                console.log(error);
            })
        } catch (err) {
             // Fail silently
        }
    }

    /**
    * Allows visitor to register a new account in order to become a user
    *
    * @args {Event e, String phone} 
    * @return {none}
    */
    fetchregister = (e) => {
        e.preventDefault();
        try {
            this.setState({ registererror: null });
            this.setState({ loginerror: null });
            this.setGoogleSignInErrorState();
            let username = document.getElementById("username").value;
            let regemail = document.getElementById("regemail").value;
            let self = true;
            let regpassword = document.getElementById("regpw").value;
            let confirmPassword = document.getElementById("regpw2").value;
            fetch(currentrooturl + 'm/register', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, regemail, regpassword, confirmPassword
                })
            })
            .then((response) => {
                    return response.json(); // Parsed data
            })
            .then((data) => {
                if (data.querystatus== "registered" && data.user ) {
                    console.log(data);
                    // cookies.set('loggedIn', data.user);
                    // this.setState({ isLoggedIn: data.user });
                    // this.getfriends();
                    // advise user to check phone to activate
                    this.setState({ verifyinfo: "You signed up! You must verify your account to login. Click the button below when you get your verification code"})
                }
                if (data.error) {
                    this.setState({ registererror: { error: data.error, type: data.type } });
                }
                return data;
            })
            .catch(error => { console.log(error);
            })
        } catch (err) {
            // Fail silently 
        }
    }

    setRegisterErr = (err) => {
        this.setState({ registererror: { error: err, type: "register error" } });
    }
    
    fetchVerify = (e, verif, email, username) => {
        try {
            e.preventDefault(e);
            this.setGoogleSignInErrorState();
            if (verif && email && username) {
                if (verif.current && email.current && username.current) {
                    if (verif.current.value && email.current.value && username.current.value) {
                        const verification = verif.current.value;
                        const emailVal = email.current.value;
                        const usernameVal = username.current.value;
                        fetch(currentrooturl + 'm/verify', {
                            method: "POST",
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            credentials: corsdefault,
                            body: JSON.stringify({
                                verification, emailVal, usernameVal
                            })
                        })
                        .then((response) => {
                            return response.json(); // Parsed data
                        })
                        .then((data) => {
                            if (data.querystatus== "loggedin" && data.username ) {
                                cookies.set('hash', data.hash); // Set hash first as features do not run without hash
                                cookies.set('loggedIn', data.username);
                                this.setState({ isLoggedIn: data.user });
                                this.setState({ verifyerror: null });
                            }
                            if (data.error) {
                                this.setState({ verifyerror: {error: data.error, type: data.type }});
                            }
                            return data;
                        })
                        .then((data) => {
                            if (cookies.get('loggedIn') && data.querystatus) {
                                this.setState({ isLoggedIn: (cookies.get('loggedIn'))});
                                this.props.updateLogin(data.username);
                            }
                            this.getfriends();
                            return data;
                        })
                        .catch(error => { console.log(error); })
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    fetchlogout(e) {
        try {
            cookies.remove('loggedIn', { path: '/' });
            cookies.remove('user', { path: '/' });
            cookies.remove('hash', { path: '/' });
            cookies.remove('adminCheck', { path: '/' });
            deleteCachedCart();
            this.setGoogleSignInErrorState();
            fetch(currentrooturl + 'm/logout', {
                    method: "GET",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault
                })
                .then(function(response) {
                    return response.json(); // You parse the data into a useable format using `.json()`
                })
                .then((data) => { // `data` is the parsed version of the JSON returned from the above endpoint.
                    this.signOutThirdParty(); // Will logout of third party apps
                    this.setState({ isLoggedIn: "",
                                friends: [] });
                    return data;
                })
                .then((data) => {
                    this.props.history.push('/');
                })
                .catch(error => { 
                    console.log(error);
                })
        } catch (err) {
            console.log(err);
            // Fail silently
        }
    }
    
    closeSideBar() {
        this.sidebar.current.classList.remove('sidebar-open');
        this.sidebarx.current.classList.remove('sidebarxopen');
        this.sidebarcontainer.current.classList.remove('sidebar-isopen');
        document.getElementsByClassName('maindash')[0].classList.remove('maindashwide');
        document.getElementsByClassName('sidebarimg')[0].classList.remove('sidebarimg-open');
        this.setState({sidebarximgSrc: sidebaropenimg });
        this.props.updateSidebarStatus('closed');
    }
    
    openSideBar() {
        this.sidebar.current.classList.add('sidebar-open');
        this.sidebarx.current.classList.add('sidebarxopen');
        this.sidebarcontainer.current.classList.add('sidebar-isopen');
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
    
    /**
    * Lets the user search for users to befriend and interact with
    *
    * @args {String username, integer limit, Boolean requery}
    * @return {none}
    */
    limitedsearch(username, limit, requery) { // limit is limited amount of users to return, requery is for if no more users but needs to requery to update state of searched users
        let searchusers = document.getElementById('usersearch').value;
        let hash = cookies.get('hash');
        if (this.state.searchusers[1].moreusers || requery) { // if moreusers state is true or requery necessary to update state
            fetch(currentrooturl + 'm/searchusers', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    searchusers, username, limit, hash
                })
            })
            .then(function(response) {
                return response.json(); // parse the data into a useable format using `.json()`
            })
            .then((data) => {
                let authorized = this.props.checkAndConfirmAuthentication(data);
                if (authorized) {
                    this.setState({ searchusers: data }); // set user data to
                }
            })
            .catch(error => {
                console.log(error);
            })
        }
    }

    /**
    * Fires method to do first search for users which only returns 10
    *
    * @args {none}
    * @return {none}
    */
    searchusers() { // Search method that uses value in user search bar to return 10 searched users
        // debounced fetch users event
        if (this.state && this.state.isLoggedIn) {
            let username = this.state.isLoggedIn;
            let searchusers = document.getElementById('usersearch').value;
            let hash = cookies.get('hash');
            if (searchusers) {
                fetch(currentrooturl + 'm/searchusers', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        searchusers, username, hash
                    })
                })
                .then(function(response) {
                    return response.json(); // parse the data into a useable format using `.json()`
                })
                .then((data) => {
                    let authorized = this.props.checkAndConfirmAuthentication(data);
                    /* Returns array with [0] searched users, [1] moreusers boolean and [2] pending friends */
                    if (authorized) {
                        this.setState({ searchusers: data }); // set user data to
                    } else {
                        return null;
                    }
                    return data;
                })
                .then((data) => {
                    if (data) {
                        document.getElementsByClassName('search-users-results-container')[0].classList.add('search-users-results-container-opened');
                    }
                })
                .catch(error => { console.log(error);
                })
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

    /**
    * Sends friend request to another user 
    *
    * @args {Event e, String friend} 
    * @return {none}
    */
    sendfriendrequest = (e, friend) => {
        console.log("You want to be friends with: " + friend);
        let thetitleofsomeonewewanttobecloseto = friend;
        let username = this.state.isLoggedIn;
        let hash = cookies.get('hash');
        let self = true;
        fetch(currentrooturl + 'm/requestfriendship', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: corsdefault,
            body: JSON.stringify({
                thetitleofsomeonewewanttobecloseto, username, hash, self
            })
        })
        .then(function(response) {
            return response.json(); // You parse the data into a useable format using `.json()`
        })
        .then(function(data) {
            let authorized = this.props.checkAndConfirmAuthentication(data);
            if (authorized) {
                if (data == { querystatus: 'already friends' }) {
                    this.getfriends();
                }
            } else {
                return data;
            }
            return data; // `data` is the parsed version of the JSON returned from the above endpoint.
        })
        .catch(error => {
            console.log(error);
        })
        .then((data) => {
            if (this.state.isLoggedIn && this.state.searchusers) {
                if (this.state.searchusers[0]) {
                    this.limitedsearch(this.state.isLoggedIn, this.state.searchusers[0].length, true); // re update list
                }
            }
        })

        e.preventDefault();
    }
    
    revokefriendrequest = (e, friend, pending, refuse, block, search) => { // Pending if you're waiting for user to accept. Refuse true if user is refusing request
        let thetitleofsomeoneiusedtowanttobecloseto = friend;
        let username = this.state.isLoggedIn;
        let hash = cookies.get('hash');
        let self = true;
        console.log("revokefriendrequest arguments; pending: " + pending + " refuse: " + refuse);
        fetch(currentrooturl + 'm/revokefriendship', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: corsdefault,
            body: JSON.stringify({
                thetitleofsomeoneiusedtowanttobecloseto, username, pending, refuse, block, hash, self
            })
        })
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            let authorized = this.props.checkAndConfirmAuthentication(data);
            if (authorized) {
                if (data.querystatus) {
                    if (data.querystatus == "not on other users pending list" || data.querystatus == "no users on other users pending list") {
                        this.getfriends();
                    } else if (data.querymsg) {
                        this.getfriends();
                    } else {
                        this.getfriends();
                    }
                } else {
                    // will have to add conversation state update when adding remove conversation functionality
                    this.setState({ friends: data });
                }
            } else {
                return;
            }
            return data;
        })
        .catch(error => { console.log(error);
        })
        .then((data) => {
            if (data) {
                if (pending) {
                    if (this.state.searchusers[0]) {
                        this.limitedsearch(this.state.isLoggedIn, this.state.searchusers[0].length, true);
                    } else {
                        this.searchusers();
                    }
                } else if (refuse == "requestslist" || refuse == "nonfriendslist") {
                    this.getpendingrequests(null, true, username); // true arguement to search again after qeuery
                }
            }
        })
        .then((data) => {
            this.initializeLiveChat();
        })
    }
        
    showfollowing = (show) => {
        if (show == "hidden") {
            this.setState({ showingfollows: "show"});
        } else {
            this.setState({ showingfollows: "hidden"});
        }
    }

    /**
    * Get pending requests method that often runs in background to populate pending requests data, other methods
    * rely on this data to get important information 
    *
    * @args {Boolean show, Boolean search, String username}
    * @return {none}
    */
    getpendingrequests = (show, search, username) => {
        // show variable must be null, "hidden" or "show"
        // search must be true to search after query or false to not search (e.g if want to close requests header but do not want to search)
        if (!username) {
            username = this.state.isLoggedIn;
        }
        if (!username) {
            username = cookies.get('loggedIn');
        }
        let self = true;
        let hash = cookies.get('hash');
        if ((search || !this.state.pendingfriendrequests) && username) { // If searching again or pendingfriendrequests is null
            fetch(currentrooturl + 'm/pendingrequests', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then((data) => { // Pending requests will appear as an array in the data member here
                let authorized = this.props.checkAndConfirmAuthentication(data);
                if (authorized) {
                    let pendingfriendrequestquery = data;
                    if (show == "hidden") { // Changes state to show pending requests if argument is passed
                        this.setState({showpendingrequests : "hidden"});
                    } else if (show == "show") {
                        this.setState({showpendingrequests : "show"});
                    }
                    this.setState({ pendingfriendrequests: pendingfriendrequestquery });
                } else {
                    return null;
                }
                return data;
            })
            .catch(error => { 
                console.log(error);
            })
        } else if (this.state.pendingfriendrequests) {
            this.setState({ pendingfriendrequests: null })
        }

    }
    
    acceptfriendrequest = (e, friend, requests) => {
        console.log("You are going become friends with " + friend);
        let username = this.state.isLoggedIn;
        let newfriend = friend;
        let hash = cookies.get('hash');
        let self = true;
        fetch(currentrooturl + 'm/acceptfriendrequest', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: corsdefault,
            body: JSON.stringify({
                newfriend, username, hash, self
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then((data) => {
            let authorized = this.props.checkAndConfirmAuthentication(data);
            if (authorized) {
                this.setState({ friends: data });
                setTimeout(this.getpendingrequests(null, requests, username), 1500); // Reset user search after friend accepted.
            }
            return data;
        })
        .then((data) => {
            this.debouncefetchusers();
        })
        .catch(error => { 
            console.log(error);
        })
    }
    
    /**
    * Fetches both user friends and userconversations from server. Avoids running two fetch requests. Costly
    * 
    * @args {none}
    * @return {none}
    */
    getfriends = () => {
        if (!this.state.isLoggedIn) {
            this.setState({ isLoggedIn: cookies.get('loggedIn')});
        }
        if (this.state.isLoggedIn || cookies.get('loggedIn')) {
            let username = this.state.isLoggedIn || cookies.get('loggedIn');
            let hash = cookies.get('hash');
            let self = true;
            fetch(currentrooturl + 'm/getfriends', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then((data) => {
                let authorized = this.props.checkAndConfirmAuthentication(data);
                if (authorized) {
                    console.log("Friends of", username, ":", data);
                    if (data.hasOwnProperty("shipping")) {
                        this.props.setUserShippingData(data.shipping);
                    }
                    if (data.hasOwnProperty("cart")) {
                        updateCachedCart(data.cart);
                    }
                    if (data.subscribed) {
                        if (Array.isArray(data.subscribed)) {
                            this.setState({ following: updateNotif(data.subscribed) });
                        }
                    }
                    if (!deepEquals(this.state.friends, data.userfriendslist)) { // Check if friends list retrieved from db is the same, if so do nothing, else update.
                        this.setState({ friends: data.userfriendslist });
                    }
                    let convoIds = [];
                    if (!this.state.pendingfriendrequests) { // Only reload if pendingfriendrequests not true, prevents reload on every chat sent
                        this.getpendingrequests("hidden", null, username); // Updates pending list everytime getFriendConversations runs if socket is null
                    }
                    if (!socket) { // Only append conversations from mongodb if socket is not valid. Otherwise application is getting conversations from redis live db
                        this.setState({ conversations: data.conversations }); // set state for conversations
                    }
                    for (let i = 0; i < data.conversations.length; i++) { // Sets convo ids from conversations object
                        convoIds.push(data.conversations[i]._id);
                    }
                    this.setState({ convoIds: convoIds });

                    if (data.hasOwnProperty("useravatar")) {
                        this.setState({ useravatar: data.useravatar });
                    }
                }
                return data;
            })
            .then((data) => {
                this.rebuildSocketConnection();
            })
            .catch(error => {
                console.log(error);
            })
        }
    }

    
    /**
    * Begins chat with another user. Will either send via socket or via mongoDB POST req
    * If convo Id exists (chat already started) it will use socket. Else it will start chat via mongo.
    *
    * @args {Event e, String chatwith, String message, String convoId, Boolean fromSearch}
    * @return {none}
    */
    beginchat = (e, chatwith, message, convoId, fromSearch ) => {
        let username = this.state.isLoggedIn;
        // All beginchat methods ran from searchbar will run as a fetch request.
        // Others will update via socket
        console.log("Socket" + socket, "from search " + fromSearch, "ConvoId " + convoId);
        if (!convoId) { // Determine if chat sent via user search UI exists in current chats
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
        if (socket) {
            if (convoId) { // if there is a convo id found for a conversation between these two users, append via socket
                if (message.length > 0) { // Message must be valid
                    let chatObj = {
                        "user": username,
                        "id": convoId,
                        "message": message,
                        "chatwith": chatwith
                    }
                    socket.emit('sendChat', chatObj);
                }
            } else { // If fromSearch true or no conversation between both users, will use fetch request defaults to fetch request. This will not create a mongo log convo, just a record that the chat exists. Will still force conversation to occur via socket after call
                let hash = cookies.get('hash');
                let self = true;
                if (message.length > 0) { // Message must be valid
                    fetch(currentrooturl + 'm/beginchat', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            username, chatwith, message, hash, self
                        })
                    })
                    .then(function(response) {
                        return response.json();
                    })
                    .then((data) => {
                        let authorized = this.props.checkAndConfirmAuthentication(data);
                        if (authorized) {
                            console.log(data);
                            this.getFriendConversations();
                        }
                        return data;
                    })
                    .then((data) => {
                        setTimeout(() => {
                            this.initializeLiveChat();
                        }, 500);
                    })
                    .catch(error => { 
                        console.log(error);
                    })
                }
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
        try {
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
        } catch (err) {
            console.log(err);
            // Something went wrong
        }
    }

    bump = (e, too, room) => {
        try {
            if (this.state.isLoggedIn && socket && too && room) {
                if (too.length > 0 && room.length > 0 ) {
                    /* Format of socket message is: bump;from;too;room */
                    let data = "bump;" + this.state.isLoggedIn + ";" + too + ";" + room;
                    socket.emit('bump', data);
                }
            }
        } catch (err) {
            // Something went wrong
        }
    }

    // Covers sign out for both google and apple id
    signOutThirdParty = () => {
        try {
            google.accounts.id.disableAutoSelect(); // Will ensure signout with google
        } catch (err) {
            // Fail silently
        }
    }

    setGoogleSignInErrorState(data = null) {
        this.setState({ googleSignInError: data });
    }

    onOneTapSignedInGoogle = async (googleResponse, proposedUsername = null) => {
        try {
            this.setState({ googleSignInError: null });
            if (googleResponse) {
                const decodedToken = jwt_decode(googleResponse.credential);
                // make request to server to check if account has been created with user google email, if no? Ask user to choose username with slide in portal. 
                // Logout (this.signOutThirdParty) everytime error is recieved even if asking to choose new username, as long as user does not have username they are officially not signed in
                // Once they have a good username retain sign in session, do not call this.signOutThirdParty
                return await fetch(currentrooturl + 'm/logingoogle', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        googleResponse, decodedToken, proposedUsername
                    })
                })
                .then(function(response) {
                    return response.json();
                })
                .then((data) => {
                    console.log(data);
                    if (data) {
                        if (data.error || !data.user) {
                            this.signOutThirdParty(); // Not valid sign up yet, signout again until issues resolved
                            cookies.remove('loggedIn', { path: '/' });
                            cookies.remove('user', { path: '/' });
                            cookies.remove('hash', { path: '/' });
                            if (data.error == "Requires unique username" || data.error == "Proposed username not available" || data.error == "Choose a username to continue on Minipost" ) {
                                if (data.data) {
                                    this.setState({ googleData: data.data, usernameChoicePortal: true, googleSignInError: data.error });
                                } else {
                                    this.setState({ googleSignInError: "Failed to sign in with google" });
                                }   
                                // Open new username input portal or Bump once if already open (bad/nonunique username)
                            } else {
                                this.setState({ googleSignInError: "Failed to sign in with google" });
                            }
                        } else {
                            if (data.admin) {
                                cookies.set('adminCheck', true);
                                this.setState({ adminCheck: true });
                            }
                            // if no error then success, log user in with google credentials and assign username as loggedIn cookie
                            this.setState({ googleData: null, usernameChoicePortal: false });
                            cookies.set('hash', data.hash );
                            cookies.set('loggedIn', data.user.username);
                            return data.user.username;
                        }
                    } else {
                        return false;
                    }
                })
                .then((username) => {
                    if (username) {
                        this.getfriends();
                        this.setState({ isLoggedIn: (cookies.get('loggedIn'))});
                        this.props.updateLogin(username);
                    }
                    return false;
                })
                .catch((err) => {
                    this.signOutThirdParty();
                    return false;
                });
            } else {
                this.setState({ googleSignInError: "Failed to sign in with google" });
            }
        } catch (err) {
            this.signOutThirdParty();
            this.setState({ googleSignInError: "Failed to sign in with google" });
        }
    }

    trySelectUsername(e, type = "google") {
        try {
            if (this.usernameChoiceSelect) {
                if (type == "google") {
                    if (this.usernameChoiceSelect.current && this.state.googleData) {
                        if (this.usernameChoiceSelect.current.value) {
                            return this.onOneTapSignedInGoogle(this.state.googleData, this.usernameChoiceSelect.current.value);
                        }
                    }
                }
            } 
            return false;
        } catch (err) {
            return false;
        }
    }

    setupGoogleSignIn = () => {
        this.setGoogleSignInErrorState();
        // Do not make google load script async. It will fail
        function tryLoadGoogle() {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            document.querySelector('body').appendChild(script);
        }

        let buildGoogleSignOn = () => {
            try {
                google.accounts.id.initialize({
                    client_id: '169701902623-9a74mqcbqr38uj87qm8tm3190cicaa7m.apps.googleusercontent.com',
                    callback: this.onOneTapSignedInGoogle
                });
                if (!cookies.get('loggedIn')) { // Prompt user to login only if they are not logged in. If the user is logged in then there is no point in asking them to sign in
                    google.accounts.id.prompt(notification => {
                        console.log('on prompt notification', notification);
                    });
                }
            } catch (err) {
                // Google not defined
            }
        }

        try {
            console.log(google);
            // Average expiry for google sign in seems to be 5 days
            if (!google) {
                tryLoadGoogle();
            } else {
                buildGoogleSignOn();
            }
        } catch (err) {
            // Sometimes google doesn't load immediately
        }
    }
    
    cancelNewThirdPartyUser() {
        try {
            this.setState({ googleData: null, usernameChoicePortal: false });
            this.signOutThirdParty();
        } catch (err) {
            // Fail silently
        }
    }

    setChatOverflowVisible = (show = true, disabled, index = -1) => {
        try {
            if (this.sidebarcontainer) {
                if (this.sidebarcontainer.current) {
                    if (show && !disabled) {
                        this.sidebarcontainer.current.classList.add("chat-overflow");
                    } else {
                        try {
                            let draggingEntities = document.getElementsByClassName("dragging-entity");
                            for (let i = 0; i < draggingEntities.length; i++) {
                                if (draggingEntities[i].classList.contains('opacity-1') && index != i) {
                                    return; // Some friend chats still not reset. Cannot reset overflow views
                                }
                            }
                            this.sidebarcontainer.current.classList.remove("chat-overflow"); 
                        } catch (err) {
                            console.log(err);
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err);
            // Fail silently
        }
    }

    render() {
        let sidebar;
        
        const isLoggedIn = this.state.isLoggedIn;
        if (!isLoggedIn) {
            sidebar = 
            <Suspense fallback={<div className="fallback-loading"></div>}>
                <Login fetchlogin={this.fetchlogin} fetchregister={this.fetchregister} loginerror={this.state.loginerror} verifyinfo={this.state.verifyinfo} registererror={this.state.registererror} setRegisterErr={this.setRegisterErr} fetchVerify={this.fetchVerify} verifyerror={this.state.verifyerror} toggleSideBar={this.toggleSideBar} submitResetPass={this.submitResetPass} resetPassData={this.state.resetPassData} tryLoadGoogle={this.tryLoadGoogle} />
            </Suspense>
        } else {
            sidebar = 
            <Suspense fallback={<div className="fallback-loading"></div>}>
                <Social username={this.state.isLoggedIn} friends={this.state.friends} fetchlogout={this.fetchlogout} conversations={this.state.conversations} pendinghidden={this.state.showpendingrequests} debouncefetchusers={this.debouncefetchusers} fetchusers={this.fetchusers} limitedsearch={this.limitedsearch} searchforminput={this.searchforminput} searchformclear={this.searchformclear} debouncefetchpendingrequests={this.debouncependingrequests} fetchuserpreventsubmit={this.fetchuserpreventsubmit} searchusers={this.state.searchusers} sendfriendrequest={this.sendfriendrequest} revokefriendrequest={this.revokefriendrequest} toggleSideBar={this.toggleSideBar} showfollowing={this.showfollowing} showingfollows={this.state.showingfollows} follow={this.props.follow} following={this.state.following} getpendingrequests={this.getpendingrequests} pendingfriendrequests={this.state.pendingfriendrequests} acceptfriendrequest={this.acceptfriendrequest} beginchat={this.beginchat} friendchatopen={this.state.friendchatopen} otheruserchatopen={this.state.otheruserchatopen} updatefriendchatopen={this.updatefriendchatopen} updateotheruserchatopen={this.updateotheruserchatopen} friendsopen={this.state.friendsopen} friendsSocialToggle={this.friendsSocialToggle} nonfriendsopen={this.state.nonfriendsopen} cloud={this.props.cloud} typing = {this.state.typing} bump={this.bump} requestTogetherSession={this.props.requestTogetherSession} waitingTogetherConfirm={this.props.waitingTogetherConfirm} waitingSessions={this.props.waitingSessions} acceptTogetherSession={this.props.acceptTogetherSession} togetherToken={this.props.togetherToken} setChatOverflowVisible={this.setChatOverflowVisible} dragDisabled={this.props.dragDisabled} cloud={this.props.cloud} />
            </Suspense>
        }
            
        return (
            <div ref={this.sidebarcontainer}>
                <div className={this.state.usernameChoicePortal ? "username-choice grey-out username-choice-visible" : "username-choice grey-out username-choice-hidden"}>
                    <h5>Select a username for your account:</h5>
                    <div className={this.state.googleSignInError ? "err-status err-status-active third-party-margin-username" : "err-status err-status-hidden third-party-margin-username"}>{this.state.googleSignInError}</div>
                    <div className="select-username-container">
                        <input type="text" placeholder="Username" ref={this.usernameChoiceSelect}></input>
                        <Button className="submit-new-username-btn" onClick={(e) => {this.trySelectUsername(e, "google")}}>Choose</Button>
                    </div>
                    <div className="cancel-select-username" onClick={(e) => {this.cancelNewThirdPartyUser()}}>&times;</div>
                </div>
                <Navbar username={this.state.isLoggedIn} sidebarStatus={this.props.sidebarStatus} fetchlogout={this.fetchlogout} togetherToken={this.props.togetherToken} sendCloseTogetherSession={this.props.sendCloseTogetherSession} useravatar={this.state.useravatar} cloud={this.props.cloud} adminCheck={this.state.adminCheck} />
                <div className={this.props.sidebarStatus == 'open' ? "sidebar sidebar-open" : "sidebar"} ref={this.sidebar}>
                    {
                        !isLoggedIn ? 
                            <img className="minimize-dash dash-logged-out" src={angleDoubleLeft} alt="hamburger" onClick={this.toggleSideBar}></img> : <span></span>
                    }
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
        
// friendConvoMirror stores one live friend chat to be displayed in fullscreen video

class App extends Component {
    constructor(props) {
        super(props); 
        this.state = { 
                        watching: "", sidebarStatus: cookies.get('sidebarStatus'),
                        isLoggedIn: cookies.get('loggedIn'), uploadStatus: '', errStatus: '', uploading: null, uploadedMpd: '', cloud: "",
                        moreOptionsVisible: false, waitingTogetherConfirm: '', waitingSessions: [], togetherToken: null, friendConvoMirror: null, typingMirror: [],
                        shipping: {}, dragDisabled: false
                     };
        this.playlist = null;
        this.together = null;
    }
    
    componentDidMount() {
        if (!cookies.get('Minireel')) {
            cookies.set('Minireel', 'minireel_session', { path: '/', sameSite: true, signed: true });
        }
        this.playlist = new Playlist(cookies.get('loggedIn'));
        if (!cookies.get('CloudFrontCookiesSet')) {
            let username = this.state.isLoggedIn;
            let hash = cookies.get('hash');
            fetch(currentrooturl + 'm/setCloudCookies', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username, hash
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then((data) => {
                let authorized = this.checkAndConfirmAuthentication(data);
                if (authorized) {
                    // Do create cloud content play cookies her
                }
                return data;
            })
            .catch(error => {
                console.log(error);
            });
        }
        if (!cookies.get('contentDelivery')) {
            this.fetchCloudUrl();
        } else {
            this.setState({ cloud: cookies.get('contentDelivery') });
        }
        this.buildPlaylist();
        this.createTogetherPingInterval();
        if (!cookies.get('hash')) {
            this.doLogout();
        }
        this.checkDragDisabled();
    }

    checkDragDisabled = () => {
        try {
            let dragDisabled = cookies.get('dragDisabled');
            if (dragDisabled == 'true') {
                this.setState({ dragDisabled: true });
            }  else {
                this.setState({ dragDisabled: false });
            }
        } catch (err) {
            // Fail silently
        }
    }

    /**
    * Determines if user is authenticated or not and logs out, signals to prevent further authenticated operations on client
    *
    * @args {json data} json data object that may or may not contain "action" property
    * @return {Boolean} True for good, false for user has been logged out, disauthenticated, prevent further operations
    */
    checkAndConfirmAuthentication = (data) => {
        try {
            if (data) {
                if (data.action) {
                    if (data.action == "logout") {
                        this.doLogout();
                        google.accounts.id.disableAutoSelect(); // Will ensure signout with google
                        return false;
                    }
                }
            }
            return true;
        } catch (err) {
            return true;
        }
    }
    
    doLogout = () => {
        let refresh = false;
        if (cookies.get('loggedIn')) {
            refresh = true;
        }
        cookies.remove('loggedIn', { path: '/' }); // User logged out
        cookies.remove('hash', { path: '/' });
        if (refresh) {
            window.location.reload(false);
        }
    }
    
    // Will make a request to playlist to ensure that a valid playlist has been provided and is updated
    buildPlaylist = () => {
        this.playlist.buildPlaylist();
    }
    
    /**
    * Fetches cloud url for user (logged in or not) to consume content (necessary for video playback, thumbnails, user icons, etc)
    *
    * @args {none}
    * @return {String} Cloud data
    */
    fetchCloudUrl = async () => {
        return await fetch(currentrooturl + 'm/fetchcloudfronturl', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data) {
                    if (data.querystatus != 'err') {
                        this.setCloud(data.querystatus);
                        return data.querystatus;
                    }
                }
            })
            .catch((err) => {
                // Fail silently  
            });
    }

    updateLogin = (username) => {
        if (username) {
            if (this.state.isLoggedIn != username) {
                this.setState({ isLoggedIn: username });
            }
        } else if (this.state.isLoggedIn != cookies.get('loggedIn')) {
            this.setState({ isLoggedIn: cookies.get('loggedIn')});
        }
    };

    getSocket = async => {
        return socket;
    }

    // Updates upload status for video upload process. Access update parameter for update information
    updateUploadStatus = (update) => {
        if (update.match(/processing;([a-z0-9].*)/)) { // If update matches background video upload update, change uploading state, else just change upload status
            this.setState({ uploading: update.match(/processing;([a-z0-9].*)/)[1] });
        } else {
            if (update.match(/video ready;([a-z0-9].*)/)) {
                this.setState({ uploading: null, uploadedMpd: update.match(/video ready;([a-z0-9].*)/)[1] });
                if (this.state.uploadStatus !== "video ready") {
                    this.setState({ uploadStatus: "video ready" });
                }
                cookies.remove('uplsession'); // Upload complete, delete session cookie
            } else if (update == "video ready") {
                this.setState({ uploading: null });
                this.setState({ uploadStatus: update });
            } else if (update == "remove mpd") {
                this.setState({ uploadedMpd: '' });
            } else {
                this.setState({ uploadStatus: update });
            }
            if (this.state.errStatus != '') {
                this.setState({ errStatus: '' });
            }
        }
    }

    updateErrStatus = (err) => {
        if (err != '') {
            this.setState({ uploadStatus: '' });
        }
        if (this.state.errStatus != err) {
            this.setState({ errStatus: err });
        }
    }

    updateSidebarStatus = (update) => {
        cookies.set('sidebarStatus', update, { path: '/', sameSite: true, signed: true });
        this.setState({sidebarStatus: update });
    }
    
    /**
    * Allows child components to set cloud when they retrieve data from the serve and the cloud is bundled with
    *
    * @args {String cloud} Takes a string of the cloud address
    * @return {none} 
    */
    setCloud = (cloud) => {
        this.setState({ cloud: cloud });
        cookies.set('contentDelivery', cloud, { path: '/', sameSite: true, signed: true });
    }

    setMoreOptionsVisible = () => {
        if (!this.state.moreOptionsVisible) {
            this.setState({ moreOptionsVisible: true });
        } else {
            this.setState({ moreOptionsVisible: false });
        }
    }
    
    updateFriendConvoMirror = (data) => {
        this.setState({ friendConvoMirror: data });
    }
    
    updateTypingMirror = (data) => {
        this.setState({ typingMirror: data });
    }
    
    // Will make a request to the friend to begin a watch together session with them. Friend will be the host
    requestTogetherSession = (room, friend) => {
        if (cookies.get('loggedIn') && !this.state.togetherToken) {
            let data = {
                room: room,
                friend: friend, // Will be made host
                user: cookies.get('loggedIn')
            }
            if (socket && !this.state.waitingTogetherConfirm) {
                socket.emit('requestTogetherSession', data); // Send a request via socket
                this.setState({ waitingTogetherConfirm: friend }); // Set outboundTogetherRequest state
                setTimeout(() => { // If no response in 50 seconds, ignore socket response to start together session
                    if (this.state.waitingTogetherConfirm == friend) {
                        this.setState({ waitingTogetherConfirm: "" }); // Timeout after x time.
                    }
                }, 35000, friend);
            }
        }
    }
    
    appendWaitingSession = (friend, remove = false) => {
        if (!remove) {
            let sessions = this.state.waitingSessions;
            if (sessions.indexOf(friend) < 0 && friend != cookies.get('loggedIn')) {
                sessions.push(friend);
                this.setState({ waitingSessions: sessions });
                setTimeout(() => {
                    if (this.state.waitingSessions) {
                        if (this.state.waitingSessions.indexOf(friend) >= 0) {
                            let newsessions = this.state.waitingSessions;
                            newsessions.splice(newsessions.indexOf(friend), 1);
                            this.setState({ waitingSessions: newsessions });
                        }
                    }
                }, 30000, friend);
            }
        } else {
            let sessions = this.state.waitingSessions;
            if (sessions.indexOf(friend) >= 0 && friend != cookies.get('loggedIn')) {
                sessions.splice(sessions.indexOf(friend), 1);
                this.setState({ waitingSessions: sessions });
            }
        }
    }
    
    acceptTogetherSession = (room, friend) => { // Accept means to accept request as host and start an exclusive together session
        if (cookies.get('loggedIn') && !this.togetherToken) {
            console.log("Accept together session", room, friend);
            let togetherData = {
                host: cookies.get('loggedIn'),
                participants: [ friend ],
                room: room,
                lastping: new Date().getTime()
            }
            this.appendWaitingSession(friend, true);
            this.setState({ waitingTogetherConfirm: '' });
            this.setState({ togetherToken: togetherData });
            // Build playlist here and send as together data
            let together = new Together(cookies.get('loggedIn'), [ friend ], room);
            together.buildPlaylist();
            this.setState({ together: together });
            cookies.set('togetherToken', togetherData, { path: '/', sameSite: true, signed: true }); 
            this.createTogetherPingInterval(together);
            socket.emit('sendConfirmTogether', togetherData);
        }
    }
    
    // Will start an exclusive together session with the friend as host
    beginTogetherSession = (data) => {
        if (this.state.waitingTogetherConfirm == data.host) { // Only begin a session if you were waiting for this person to accept
            this.setState({ waitingTogetherConfirm: '' });
            this.setState({ togetherToken: data });
            cookies.set('togetherToken', data, { path: '/', sameSite: true, signed: true }); 
            this.createTogetherPingInterval(data);
            // set recieved together data as together data
        }
        // Either begin this as host and advise other user to begin or recieve update from host and begin as guest
    }
    
    // Will recover together session from refresh and create ping interval check
    createTogetherPingInterval = (togetherToken = null) => {
        try {
            if (cookies.get('loggedIn')) {
                if (cookies.get('togetherToken') || togetherToken) {
                    if (cookies.get('togetherToken')) {
                        togetherToken = cookies.get('togetherToken');
                    }
                    this.setState({ togetherToken: togetherToken });
                    let intervalTogetherToken = togetherToken;
                    if (togetherToken.lastping > new Date().getTime() - 1000*60 ) {
                        let interval = setInterval(() => {
                            if (this.state.togetherToken.lastping) {
                                if (this.state.togetherToken.lastping > new Date().getTime() - 1000*60 && socket) {
                                    intervalTogetherToken.from = cookies.get('loggedIn');
                                    try {
                                        socket.emit('marcoCheck', intervalTogetherToken);
                                    } catch (err) {
                                        // Socket was undefined
                                    }
                                } else {
                                    cookies.remove('togetherToken');
                                    if (this.state.togetherInterval) {
                                        clearInterval(this.state.togetherInterval);
                                    }
                                    this.setState({ togetherToken: null });
                                }
                            } else {
                                cookies.remove('togetherToken');
                                if (this.state.togetherInterval) {
                                    clearInterval(this.state.togetherInterval);
                                }
                                this.setState({ togetherToken: null });
                            }
                        }, 10000, intervalTogetherToken, socket);
                        this.setState({ togetherInterval: interval });
                    } else {
                        cookies.remove('togetherToken');
                        if (this.state.togetherInterval) {
                            clearInterval(this.state.togetherInterval);
                        }
                        this.setState({ togetherToken: null });
                    }
                }
            }
        } catch (err) {
            return; // Fail silently
        }  
    }
    
    updateLastPing = (data) => {
        if (this.state.togetherToken) {
            let togetherToken = this.state.togetherToken;
            if (data.room == togetherToken.room) {
                togetherToken.lastping = new Date().getTime();
                this.setState({ togetherToken: togetherToken });
                cookies.set('togetherToken', togetherToken);
            }
        }
    }
    
    // Justclose argument will simply close session and not send request to close to socket. 
    sendCloseTogetherSession = (justClose = false) => {
        let togetherToken;
        if (justClose) {
            this.setState({ togetherToken: null });
            cookies.remove('togetherToken');
            if (this.state.togetherInterval) {
                clearInterval(this.state.togetherInterval);
            }
            this.setState({ togetherInterval: null });
            window.localStorage.removeItem('togetherdata');
        } else {
            if (this.state.togetherToken) {
                togetherToken = this.state.togetherToken;
            }
            if (cookies.get('togetherToken')) {
                togetherToken = cookies.get('togetherToken');
            }
            if (togetherToken) {                
                if (cookies.get('loggedIn')) {
                    togetherToken.from = cookies.get('loggedIn');
                    socket.emit('sendCloseTogetherSession', togetherToken);
                }
                this.setState({ togetherToken: null });
                if (this.state.togetherInterval) {
                    clearInterval(this.state.togetherInterval);
                }
                this.setState({ togetherInterval: null });
                cookies.remove('togetherToken');
                window.localStorage.removeItem('togetherdata');
            }
        }
    }
    
    // Sends id, nextad, time of content if video and if user should be playing ad
    // The user must load a video page first and then play ad if playad is true. This is why nextad is always passed to participant
    sendWatch = (id, nextad, time, playad = false) => {
        if (this.state.togetherToken && cookies.get('loggedIn') && socket) {
            if (this.state.togetherToken.host == cookies.get('loggedIn')) {
                let data = {
                    id: id,
                    nextad: nextad,
                    time: time,
                    playad: playad,
                    room: this.state.togetherToken.room,
                    host: cookies.get('loggedIn')
                }
                console.log(id, nextad, time, playad, socket);
                socket.emit('sendWatch', data);
            }
        }
    }
    
    doWatch = (data) => {
        if (this.state.togetherToken && cookies.get('loggedIn')) {
            if (this.state.togetherToken.participants.indexOf(cookies.get('loggedIn') >= 0)) {
                if (data.playad && data.nextad) {
                    this.props.history.push({ pathname: '/watch', search: '?v=' + data.id + "&watch?va=" + data.nextad });
                } else {
                    this.props.history.push({ pathname: '/watch', search: '?v=' + data.id});
                }
            }
        }
        console.log(data);
    }

    /* Send request to socket to subscribe to channel. Format of data is: user;channel;subscribe? */
    follow = (channel, subscribe = true) => {
        try {
            if (cookies.get('loggedIn') && socket && channel) {
                const user = cookies.get('loggedIn');
                if (user.length > 0 && channel.length > 0 && user !== channel) { // User and channel must be valid and user cannot follow themself
                    socket.emit('follow', user + ";" + channel + ";" + subscribe);
                }
            }
        } catch (err) {
            // Something went wrong
        }
    }
    
    sendImpression = (data) => {
        if (socket) {
            socket.emit('sendImpression', data);
        }
    }

    resolveIsShopPage() {
        try {
            if (window.location.href.match(/(shop\?s|product\?p)/)) {
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    resolveIsCheckoutPage() {
        try {
            if (window.location.href.match(/(checkout)/)) {
                return true;
            }
        } catch (err) {
            return false;
        }
    }

    setUserShippingData = (shippingData) => {
        this.setState({ userShippingData: shippingData });
    }

    render() {     
        let isShopPage = this.resolveIsShopPage();
        let isCheckoutPage = this.resolveIsCheckoutPage();
        return (
            <div className={isCheckoutPage ? "App checkout-page" : "App"} onClick={(e)=>{hideOptions.call(this, e)}}>
                <Helmet>
                    <meta charSet="utf-8" />
                    <title>Minipost</title>
                </Helmet>
                <Socialbar watching={this.state.watching} sidebarStatus={this.state.sidebarStatus} updateSidebarStatus={this.updateSidebarStatus} updateUploadStatus={this.updateUploadStatus} updateErrStatus={this.updateErrStatus} updateLogin={this.updateLogin} setCloud={this.setCloud} cloud={this.state.cloud} follow={this.follow} playlist={this.playlist} requestTogetherSession={this.requestTogetherSession} beginTogetherSession={this.beginTogetherSession} waitingTogetherConfirm={this.state.waitingTogetherConfirm} appendWaitingSession={this.appendWaitingSession} waitingSessions={this.state.waitingSessions} acceptTogetherSession={this.acceptTogetherSession} beginTogetherSession={this.beginTogetherSession} togetherToken={this.state.togetherToken} togetherInterval={this.state.togetherInterval} updateLastPing={this.updateLastPing} sendCloseTogetherSession={this.sendCloseTogetherSession} doWatch={this.doWatch} friendConvoMirror={this.state.friendConvoMirror} updateFriendConvoMirror={this.updateFriendConvoMirror} typingMirror={this.state.typingMirror} updateTypingMirror={this.updateTypingMirror} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} doLogout={this.doLogout} setUserShippingData={this.setUserShippingData} dragDisabled={this.state.dragDisabled} />
                <div className={isShopPage ? 'maindashcontainer white-page' : 'maindashcontainer'}>
                    <div className='main maindash'>
                        <Route exact path='/' render={(props) => (
                            <Dash {...props} key={getPath()} username={this.state.isLoggedIn} cloud={this.state.cloud} setCloud={this.setCloud} togetherToken={this.state.togetherToken} sendWatch={this.sendWatch} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/search' render={(props) => (
                            <Results {...props} key={getPath()} username={this.state.isLoggedIn} cloud={this.state.cloud} setCloud={this.setCloud} togetherToken={this.state.togetherToken} sendWatch={this.sendWatch} />
                        )}/>
                        <Route path='/watch?v=:videoId' render={(props) => (
                            <Video {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} follow={this.follow} playlist={this.playlist} togetherToken={this.state.togetherToken} sendWatch={this.sendWatch} sendImpression={this.sendImpression} friendConvoMirror={this.state.friendConvoMirror} typingMirror={this.state.typingMirror} friendConvoMirror={this.state.friendConvoMirror} username={this.state.isLoggedIn} beginChat={Socialbar.beginChat} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                        )}/>
                        <Route path='/watch?va=:videoId' render={(props) => (
                            <Suspense fallback={<div className="fallback-loading"></div>}>
                                <Video {...props} key={getPath()} ad={true} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} follow={this.follow} playlist={this.playlist} togetherToken={this.state.togetherToken} sendWatch={this.sendWatch} sendImpression={this.sendImpression} typingMirror={this.state.typingMirror} friendConvoMirror={this.state.friendConvoMirror} username={this.state.isLoggedIn} beginChat={Socialbar.beginChat} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                            </Suspense>
                        )}/>
                        <Route path='/read?a=:articleId' render={(props) => (
                            <Article {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} togetherToken={this.state.togetherToken} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/watch' render={(props) => (
                            <Suspense fallback={<div className="fallback-loading"></div>}>
                                <Video {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} follow={this.follow} playlist={this.playlist} togetherToken={this.state.togetherToken} sendWatch={this.sendWatch} sendImpression={this.sendImpression} typingMirror={this.state.typingMirror} friendConvoMirror={this.state.friendConvoMirror} username={this.state.isLoggedIn} beginChat={Socialbar.beginChat} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} cloud={this.state.cloud} setCloud={this.setCloud} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                            </Suspense>
                        )}/>
                        <Route path='/read' render={(props) => (
                            <Article {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} togetherToken={this.state.togetherToken} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/shop?s=:username' render={(props) => (
                            <Profile {...props} key={getPath()} page="shop" cloud={this.state.cloud} setCloud={this.setCloud} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                        )}/>
                        <Route path='/shop' render={(props) => (
                            <Profile {...props} key={getPath()} page="shop" cloud={this.state.cloud} setCloud={this.setCloud} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                        )}/>
                        <Route path='/product' render={(props) => (
                            <ProductSinglePage {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                        )}/>
                        <Route path='/product?p=:product' render={(props) => (
                            <ProductSinglePage {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                        )}/>
                        <Route path='/options' render={(props) => (
                            <Options {...props} key={getPath()} cloud={this.state.cloud} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} getfriends={this.getfriends} dragDisabled={this.state.dragDisabled} checkDragDisabled={this.checkDragDisabled} username={this.state.isLoggedIn} />
                        )}/>
                        <Route path='/upload' render={(props) => (
                            <Upload {...props} sidebarStatus={this.state.sidebarStatus} isLoggedIn={this.state.isLoggedIn} socket={socket} uploadStatus={this.state.uploadStatus} updateUploadStatus={this.updateUploadStatus} getSocket={this.getSocket} updateErrStatus={this.updateErrStatus} errStatus={this.state.errStatus} uploading={this.state.uploading} mpd={this.state.uploadedMpd} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} cloud={this.state.cloud} />
                        )}/>
                        <Route path='/writearticle' render={(props) => (
                            <WriteArticle {...props} sidebarStatus={this.state.sidebarStatus} isLoggedIn={this.state.isLoggedIn} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/upload?r=:replyId' render={(props) => (
                            <Upload {...props} sidebarStatus={this.state.sidebarStatus} isLoggedIn={this.state.isLoggedIn} socket={socket} uploadStatus={this.state.uploadStatus} updateUploadStatus={this.updateUploadStatus} getSocket={this.getSocket} updateErrStatus={this.updateErrStatus} errStatus={this.state.errStatus} uploading={this.state.uploading} mpd={this.state.uploadedMpd} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} cloud={this.state.cloud} />
                        )}/>
                        <Route path='/writearticle?r=:replyId' render={(props) => (
                            <WriteArticle {...props} sidebarStatus={this.state.sidebarStatus} isLoggedIn={this.state.isLoggedIn} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/profile?p=:username' render={(props) => (
                            <Profile {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                        )}/>
                        <Route path='/profile' render={(props) => (
                            <Profile {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} fetchCloudUrl={this.fetchCloudUrl} userShippingData={this.state.userShippingData} />
                        )}/>
                        <Route path='/edit?v=:videoId' render={(props) => (
                            <Upload {...props} key={getPath()} edit={true} cloud={this.state.cloud} isLoggedIn={this.state.isLoggedIn} updateUploadStatus={this.updateUploadStatus} uploadStatus={this.state.uploadStatus} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/edit?va=:videoId' render={(props) => (
                            <Upload {...props} key={getPath()} edit={true} cloud={this.state.cloud} isLoggedIn={this.state.isLoggedIn} ad={true} updateUploadStatus={this.updateUploadStatus} uploadStatus={this.state.uploadStatus} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/edit?a=:articleId' render={(props) => (
                            <WriteArticle {...props} key={getPath()} edit={true} isLoggedIn={this.state.isLoggedIn} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/history' render={(props) => (
                            <History {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} />
                        )}/>
                        <Route path='/notifications' render={(props) => (
                            <Notifications {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} />
                        )}/>
                        <Route path='/about' render={(props) => (
                          <InfoTemplate {...props} />
                        )}/>
                        <Route path='/resetpass' render={(props) => (
                           <ResetPass {...props} />                             
                        )}/>
                        <Route path='/resetpass?a=:secret' render={(props) => (
                           <ResetPass {...props} />                              
                        )}/>
                        <Route path='/checkout' render={(props) => (
                            <Checkout {...props} fullCheckout={true} cloud={this.state.cloud} setCloud={this.setCloud} fetchCloudUrl={this.fetchCloudUrl} />
                        )}/>
                        <Route path='/orders' render={(props) => (
                            <Orders {...props} isLoggedIn={this.state.isLoggedIn} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/order' render={(props) => (
                            <Order {...props} key={getPath()} isLoggedIn={this.state.isLoggedIn} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/order?o=:orderId' render={(props) => (
                            <Order {...props} key={getPath()} isLoggedIn={this.state.isLoggedIn} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/manageorders' render={(props) => (
                            <ShopOrders {...props} key={getPath()} isLoggedIn={this.state.isLoggedIn} checkAndConfirmAuthentication={this.checkAndConfirmAuthentication} />
                        )}/>
                        <Route path='/adminoptions' render={(props) => (
                            <AdminOptions {...props} key={getPath()} />
                        )}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
export { cookies, socket, bumpEvent, localEvents, EventEmitter };
