import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import 'shaka-player/dist/controls.css';
import axios from 'axios';
import csshake from 'csshake';
import Login from './components/login.js'; import Sidebarfooter from './components/sidebarfooter.js'; import SearchForm from './components/searchform.js'; import Navbar from './components/navbar.js'; import Upload from './components/upload.js'; import SearchedUserResults from './components/searcheduserresults.js'; import NonFriendConversation from './components/nonfriendconversation.js'; import Request from './components/request.js'; import Dash from './components/dash.js'; import Videos from './components/videos.js'; import Video from './components/video.js'; import WriteArticle from './components/writearticle.js'; import Article from './components/article.js'; import Friend from './components/friend.js'; import Profile from './components/profile.js'; import History from './components/history.js'; import Notifications from './components/notifications.js'; import Social from './components/social.js';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import { instanceOf } from 'prop-types';
import Cookies from 'universal-cookie';
import sidebarcloseimg from './static/sidebarclose.svg';  import sidebaropenimg from './static/sidebaropen.svg'; import close from './static/close.svg';
import { updateNotif } from './methods/history.js';
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
import { hideOptions } from './methods/context.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import io from "socket.io-client";
import currentrooturl from './url.js';

import { debounce, deepEquals, getPath } from './methods/utility.js';

const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');
const bumpEvent = new EventEmitter();
bumpEvent.setMaxListeners(100);
let socket; // Expose socket to entire application once it is created

const cookies = new Cookies();

const typingRegex = /([a-z0-9.]*);([^]*);(.*)/; // regular expression for reading 'typing' emits
const bumpRegex = /([^]*);([^]*);([^]*);(.*)/; // regex for reading 'bump' emits

// Side Social Bar
class Socialbar extends Component { // Main social entry point sb1
    constructor(props) {
        super(props);
        this.state = { isLoggedIn: (cookies.get('loggedIn')), sidebarximgSrc: sidebarcloseimg, friends: [{}], users: {},
                      conversations: [], convoIds: [], searchuserinput: '', searchusers: [], showingfollows: "hidden",
                      showingpendingrequests: "hidden", pendingfriendrequests: null, following: [],
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
        }
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
        if (!socket) {
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
            })
            .then(() => {
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

    // Entry point method after login.
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
            mode: 'same-origin',
            credentials: 'include',
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
            console.log(cookies.get('loggedIn'));
            if (data.querystatus== "loggedin") {
                this.props.updateLogin();
                if (cookies.get('loggedIn')) {
                    this.setState({ isLoggedIn: (cookies.get('loggedIn'))});
                }
                this.getfriends();
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
        this.setState({ registererror: null });
        this.setState({ loginerror: null });
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
            if (data.querystatus== "loggedin" && data.user ) {
                this.setState({ isLoggedIn: data.user });
                this.getfriends();
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
                this.props.history.push('/');
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
                } else if (data.querymsg) {
                    this.getfriends();
                } else {
                    this.getfriends();
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
        
    showfollowing = (show) => {
        if (show == "hidden") {
            this.setState({ showingfollows: "show"});
        } else {
            this.setState({ showingfollows: "hidden"});
        }
    }

    /* Get pending requests method that often runs in background to populate pending requests data, other methods
    rely on this data to get important information */
    getpendingrequests = (show, search, username) => {
        // show variable must be null, "hidden" or "show"
        // search must be true to search after query or false to not search (e.g if want to close requests header but do not want to search)
        if (!username) {
            username = this.state.isLoggedIn;
        }
        if (!username) {
            username = cookies.get('loggedIn');
        }

        if ((search || !this.state.pendingfriendrequests) && username) { // If searching again or pendingfriendrequests is null
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
            .then((data) => { // Pending requests will appear as an array in the data member here
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
    
    // Fetches both user friends and userconversations from server. Avoids running two fetch requests. Costly
    getfriends = () => {
        if (!this.state.isLoggedIn) {
            this.setState({ isLoggedIn: cookies.get('isLoggedIn')});
        }
        if (this.state.isLoggedIn) {
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

    render() {
        let sidebar;
        
        const isLoggedIn = this.state.isLoggedIn;
        if (!isLoggedIn) {
            sidebar = <Login fetchlogin={this.fetchlogin} fetchregister={this.fetchregister} loginerror={this.state.loginerror} registererror={this.state.registererror} />
        } else {
            sidebar = <Social username={this.state.isLoggedIn} friends={this.state.friends} fetchlogout={this.fetchlogout} conversations={this.state.conversations} pendinghidden={this.state.showpendingrequests} debouncefetchusers={this.debouncefetchusers} fetchusers={this.fetchusers} limitedsearch={this.limitedsearch} searchforminput={this.searchforminput} searchformclear={this.searchformclear} debouncefetchpendingrequests={this.debouncependingrequests} fetchuserpreventsubmit={this.fetchuserpreventsubmit} searchusers={this.state.searchusers} sendfriendrequest={this.sendfriendrequest} revokefriendrequest={this.revokefriendrequest} toggleSideBar={this.toggleSideBar} showfollowing={this.showfollowing} showingfollows={this.state.showingfollows} follow={this.props.follow} following={this.state.following} getpendingrequests={this.getpendingrequests} pendingfriendrequests={this.state.pendingfriendrequests} acceptfriendrequest={this.acceptfriendrequest} beginchat={this.beginchat} friendchatopen={this.state.friendchatopen} otheruserchatopen={this.state.otheruserchatopen} updatefriendchatopen={this.updatefriendchatopen} updateotheruserchatopen={this.updateotheruserchatopen} friendsopen={this.state.friendsopen} friendsSocialToggle={this.friendsSocialToggle} nonfriendsopen={this.state.nonfriendsopen}
            typing = {this.state.typing} bump = {this.bump} />
        }
            
        return (
            <div>
                <Navbar username={this.state.isLoggedIn} sidebarStatus={this.props.sidebarStatus} fetchlogout={this.fetchlogout} />
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
                        watching: "", sidebarStatus: cookies.get('sidebarStatus'),
                        isLoggedIn: cookies.get('loggedIn'), uploadStatus: '', errStatus: '', uploading: null, uploadedMpd: '', cloud: "",
                        moreOptionsVisible: false
                     };
    }
    

    componentDidMount() {
        if (!cookies.get('Minireel')) {
            cookies.set('Minireel', 'minireel_session', { path: '/', sameSite: true, signed: true });
        }

        if (!cookies.get('CloudFrontCookiesSet')) {
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
            .catch(error => {
                console.log(error);
            });
        }
    }

    updateLogin = () => {
        if (this.state.isLoggedIn != cookies.get('loggedIn')) {
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

    setCloud = (cloud) => {
        this.setState({ cloud: cloud });
    }

    setMoreOptionsVisible = () => {
        if (!this.state.moreOptionsVisible) {
            this.setState({ moreOptionsVisible: true });
        } else {
            this.setState({ moreOptionsVisible: false });
        }
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

    render() {                    
        return (
            <BrowserRouter>
                <div className="App" onClick={(e)=>{hideOptions.call(this, e)}}>
                    <Socialbar watching={this.state.watching} sidebarStatus={this.state.sidebarStatus} updateSidebarStatus={this.updateSidebarStatus} updateUploadStatus={this.updateUploadStatus} updateErrStatus={this.updateErrStatus} updateLogin={this.updateLogin} setCloud={this.setCloud} follow={this.follow} />
                    <div className='maindashcontainer'>
                        <div className='main maindash'>
                            <Route exact path='/' render={(props) => (
                                <Dash {...props} username={this.state.isLoggedIn} cloud={this.state.cloud} setCloud={this.setCloud} />
                            )}/>
                            <Route path='/search' render={(props) => (
                                <Dash {...props} username={this.state.isLoggedIn} cloud={this.state.cloud} setCloud={this.setCloud} />
                            )}/>
                            <Route path='/watch?v=:videoId' render={(props) => (
                                <Video {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} follow={this.follow} />
                            )}/>
                            <Route path='/read?a=:articleId' render={(props) => (
                                <Article {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} />
                            )}/>
                            <Route path='/watch' render={(props) => (
                                <Video {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} follow={this.follow} />
                            )}/>
                            <Route path='/read' render={(props) => (
                                <Article {...props} key={getPath()} moreOptionsVisible={this.state.moreOptionsVisible} setMoreOptionsVisible={this.setMoreOptionsVisible} />
                            )}/>
                            <Route path='/upload' render={(props) => (
                                <Upload {...props} sidebarStatus={this.state.sidebarStatus} isLoggedIn={this.state.isLoggedIn} socket={socket} uploadStatus={this.state.uploadStatus} updateUploadStatus={this.updateUploadStatus} getSocket={this.getSocket} updateErrStatus={this.updateErrStatus} errStatus={this.state.errStatus} uploading={this.state.uploading} mpd={this.state.uploadedMpd} />
                            )}/>
                            <Route path='/writearticle' render={(props) => (
                                <WriteArticle {...props} sidebarStatus={this.state.sidebarStatus} isLoggedIn={this.state.isLoggedIn} />
                            )}/>
                            <Route path='/profile?p=:username' render={(props) => (
                                <Profile {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud}/>
                            )}/>
                            <Route path='/profile' render={(props) => (
                                <Profile {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud}/>
                            )}/>
                            <Route path='/edit?v=:videoId' render={(props) => (
                                <Upload {...props} key={getPath()} edit={true} cloud={this.state.cloud} isLoggedIn={this.state.isLoggedIn} updateUploadStatus={this.updateUploadStatus} uploadStatus={this.state.uploadStatus} />
                            )}/>
                            <Route path='/edit?a=:articleId' render={(props) => (
                                <WriteArticle {...props} key={getPath()} edit={true} isLoggedIn={this.state.isLoggedIn} />
                            )}/>
                            <Route path='/history' render={(props) => (
                                <History {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} />
                            )}/>
                            <Route path='/notifications' render={(props) => (
                                <Notifications {...props} key={getPath()} cloud={this.state.cloud} setCloud={this.setCloud} />
                            )}/>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;
export { cookies, socket, bumpEvent, EventEmitter };
