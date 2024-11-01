import React, { Component, Suspense, lazy } from 'react';
import {
    NavLink,
    Link
} from 'react-router-dom';
import {
    Button
} from 'react-bootstrap';
import currentrooturl from '../url';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faHeart, faShare, faBookOpen, faEye } from '@fortawesome/free-solid-svg-icons';
import minipostpreviewbanner from '../static/minipostbannerblacksmaller5.png'; import '../static/expand-video.png'; import '../static/minimize-video.png'; import sendarrow from '../static/sendarrow.svg';
import encryptionSchemePolyfills from 'eme-encryption-scheme-polyfill';
import { roundTime, setStateDynamic, roundNumber, shortenTitle, convertDate, opposite, get, resolveSurvey, resolveInputName } from '../methods/utility.js';
import { setResponseToParentPath, incrementLike, incrementDislike, showMoreOptions, resolveMeta, submitSurvey, updateA, checkCompletedSurvey } from '../methods/context.js';
import { updateHistory } from '../methods/history.js';
import parseBody from '../methods/htmlparser.js';
import dummythumbnail from '../static/greythumb.jpg';
import dummyavatar from '../static/greyavatar.jpg';
import dummyproduct from '../static/greyproduct.jpg';
import { setResponseUrl } from '../methods/responses.js';
import lzw from '../compression/lzw.js';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';
import { addOneProductToCart, formatAPrice } from '../methods/ecommerce.js';

import { cookies, socket, localEvents } from '../App.js';
const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');
const shakaAddonButtons = require('../addons/shaka/addonbuttons.js');
const typingRegex = /([a-z0-9.]*);([^]*);(.*)/; // regular expression for reading 'typing' emits
const bumpRegex = /([^]*);([^]*);([^]*);(.*)/; // regex for reading 'bump' emits

const RelatedPanel = lazy(() => import('./relatedpanel.js'));
const SocialVideoMeta = lazy(() => import('./socialvideometa.js'));
const Checkout = lazy(() => import('./checkout.js'));
const Comment = lazy(() => import('./comment/comment.js'));

export default class Video extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "", author: "", views: "", published: "", description: "", tags: "", mpd: "", mpdCloudAddress: "", viewCounted: false, clickCounted: false, viewInterval: "", descriptionOpen: false, articleResponses: [], videoResponses: [], relevant: [], responseTo: {}, liked: false, disliked: false, likes: 0, dislikes: 0, following: false, cloud: "", adStart: false, adEnd: false, adPlaying: false, adLink: "", skipTime: 5, impressionCounted: false, chatFriend: null, fullscreen: false, relevantTyping: '', chatlength: 0, scrollInterval: null, fetched: false, togglePlacementCheckout: false, completeOrderId: null, freeze: false, freezeData: null, interactInterval: "", productPlacement: null, livePlacement: null, livePlacementDisplay: false, productsAdded: [], surveyOn: false, survey: null, surveySubmitted: false, surveyErr: null
        }
        this.videoContainer = new React.createRef();
        this.videoComponent = new React.createRef();
        this.player = new React.createRef();
        this.controls = new React.createRef();
        this.moreOptions = new React.createRef();
        this.inputRef = new React.createRef();
        this.scrollRef = new React.createRef();
        this.progress = new EventEmitter();
        this.placementRef = new React.createRef();
        this.placementCheckoutRef = new React.createRef();
        this.miniCheckoutContainer = new React.createRef();
        window.addEventListener('keydown', this.interceptEnter);
    }

    async componentDidMount() {
        this.setUpState();
        this.loadPage();
        if (cookies.get('contentDelivery')) {
            this.setState({ cloud: cookies.get('contentDelivery')});
        } else {
            let cloudData = await this.props.fetchCloudUrl(); // Retrieve data from server if cloud data nonexistent in props and cookies
            this.setState({ cloud: cloudData });
        }
        if (cookies.get('video-wide') == "true") {
            if (document.getElementsByClassName('maindash')[0]) {
                document.getElementsByClassName('maindash')[0].classList.add('maindash-video-wide');
            }
        }
        this.maintainAspectRatio();
        document.addEventListener('fullscreenchange', (event) => {
            if (document.fullscreenElement) {
                this.setState({ fullscreen: true });
                if (this.scrollRef) {
                    this.toTop();
                }
            } else {
                this.setState({ fullscreen: false });
            }
        });
        document.onmousedown = () => { this.setState({ mousedown: true }) };
        document.onmouseup = () => { this.setState({ mousedown: false }) };
        if (setInterval) {
            try {
                let scrollInterval = setInterval(this.quickScroll, 1000);
                this.setState({ scrollInterval: scrollInterval });
            } catch (err) {
                // setInterval is not a function for some reason
            }
        }
        localEvents.on('orderFailed', (data) => this.orderFailed(data));
        localEvents.on('orderComplete', (data) => this.orderComplete(data));
    }

    componentWillUnmount() {
        try {
            // Untested. Supposed to remove event listeners from player when user leaves page
            if (this.player) {
                if (this.player.removeEventListener) {
                    this.player.removeEventListener('buffering');
                    this.player.removeEventListener('error');
                }
            }
            this.endViewCountInterval;
            if (document.getElementsByClassName('maindash')[0]) {
                let maindash = document.getElementsByClassName('maindash')[0];
                if (maindash) {
                    maindash.classList.remove('maindash-video-wide');
                }
            }
            if (this.state.scrollInterval) {
                clearInterval(this.state.scrollInterval);
            }
            if (this.state.interactInterval) {
                clearInterval(this.state.interactInterval);
            }
            localEvents.removeListener('orderFailed');
            localEvents.removeListener('orderComplete');
        } catch (err) {
            // Fail silently
        }
    }

    orderFailed(data) {
        try {
            this.setState({ placementSuccess: null, placementError: "Failed to complete" });
        } catch (err) {
            // Fail silently
        }
    }

    toTop() {
        try {
            this.scrollRef.current.scrollBy({
                top: 10000,
                behavior: "smooth"
            });
        } catch (err) {
            // Fail silently
        }
    }

    orderComplete(data) {
        try {
            this.setState({ placementError: null, placementSuccess: `Your order was completed. See order` });
            if (data) {
                this.setState({ completeOrderId: data });
            }
        } catch (err) {
            // Fail silently
        }
    }
    
    quickScroll = () => {
        if (this.scrollRef && !this.state.mousedown) {
            this.toTop();
        }
    }

    resolveFriend = () => {
        if (this.props.friendConvoMirror) {
            for (let i = 0; i < this.props.friendConvoMirror.users.length; i++) {
                if (this.props.friendConvoMirror.users[i] != this.props.username) {
                    this.setState({ chatFriend: this.props.friendConvoMirror.users[i] });
                }
            }
        }
    }
    
    interceptClick = (e) => {
        e.preventDefault(e);
        if (document.fullscreenElement != null && this.props.history.location.pathname.includes('watch')) { // Prevent exit by pressing enter on fullscreen. Used for sending chats in fullscreen mode instead
            e.preventDefault();
            this.handleKeyPress(e);
        }
    }

    interceptEnter = (e) => {
        try {
            if (e.key) {
                if (e.key == "Enter" && document.fullscreenElement != null && this.props.history.location.pathname.includes('watch')) { // Prevent exit by pressing enter on fullscreen. Used for sending chats in fullscreen mode instead
                    e.preventDefault();
                    this.handleKeyPress(e);
                }

            }
        } catch (err) {
            // Component may have unmounted
        }
    }
    
    handleKeyPress = (e) => { // Emit cleared message when message is sent
        try {
            this.resolveFriend();
            if (this.inputRef._ref.value.length > 0) { // Message must be valid
                let chatObj = {
                    "user": this.props.username,
                    "id": this.props.friendConvoMirror._id,
                    "message": this.inputRef._ref.value,
                    "chatwith": this.state.chatFriend
                }
                socket.emit('sendChat', chatObj);
                this.resetchat(e);
            }
            let pullToBottom = (i) => {
                setTimeout(() => {
                    if (this.scrollRef) {
                        this.topTop();
                    }
                    i--;
                    if (i > 0) {
                        pullToBottom(i);
                    }
                }, 25);
            }
            if (socket) {
                let roomId = this.props.friendConvoMirror ? this.props.friendConvoMirror._id : null;
                let leanString = this.props.username + ";" + "" + ";" + roomId;
                let ba = lzw.compress(leanString); // compress data as binary array before sending to socket
                setTimeout(() => {
                    pullToBottom(3);
                    socket.emit('typing', ba);
                }, 30);
            }
            
        } catch (err) {
            // Componenet may have unmounted
        }
    }

    handleChange = (e) => { // Emit typing to users in chat via socket
        try {
            if (socket) {
                if (this.props.friendConvoMirror) {
                    let leanString = this.props.username + ";" + this.inputRef._ref.value + ";" + this.props.friendConvoMirror._id;
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
    
    /**
     * Determines whether to use Hls or Mpd
     *
     * @param none
     * @return {String} "-hls.m3u8" or "-mpd.mpd"
     */
    checkPlaybackSupportType = async () => {
        try {
            const support = await shaka.Player.probeSupport();
            if (support.manifest.mpd) {
                return "-mpd.mpd";
            } else {
                return "-hls.m3u8";
            }
        } catch (err) {
            return "-mpd.mpd";
        }
    }
    
    /**
     * Sets up the page to load the next valid data to watch. To push the next video from a playlist (not ad) to play, use nextVideo (code logic later, not done yet)
     * @param {Boolean} reload 
     * @param {Boolean} playEndAd 
     * @param {Uuid} nextVideo 
     */
    loadPage = async (reload = false, playEndAd = false) => {
        try {
            let playbackFormat = await this.checkPlaybackSupportType();
            if (playbackFormat) {
                if (reload) {
                    this.initPlayer(await this.fetchVideoPageData(reload) + playbackFormat);
                    this.setState({ mpd: reload});
                } else {
                    if (window.location.href.match(/\?([v|a].*)=([a-zA-Z0-9].*)&([a-zA-Z0-9].*)\?([v|a].*)=([a-zA-Z0-9].*)/)) { // Unique match 2 urls in href, first video, second ad
                        this.initPlayer(await this.fetchVideoPageData(window.location.href.match(/\?([v|a].*)=([a-zA-Z0-9].*)&([a-zA-Z0-9].*)\?([v|a].*)=([a-zA-Z0-9].*)/)[2]) + playbackFormat, false, await this.fetchVideoPageData(window.location.href.match(/\?([v|a].*)=([a-zA-Z0-9].*)&([a-zA-Z0-9].*)\?([v|a].*)=([a-zA-Z0-9].*)/)[5], true) + playbackFormat); 
                        this.setState({ mpd: window.location.href.match(/\?([v|a].*)=([a-zA-Z0-9].*)&([a-zA-Z0-9].*)\?([v|a].*)=([a-zA-Z0-9].*)/)[2]});
                    } else if (window.location.href.match(/\?v=([a-zA-Z0-9].*)/)) {
                        this.initPlayer(await this.fetchVideoPageData(window.location.href.match(/\?v=([a-zA-Z0-9].*)/)[1]) + playbackFormat, playEndAd); // Play end ad false? Play normal video, else play end ad from ad playlist
                        this.setState({ mpd: window.location.href.match(/\?v=([a-zA-Z0-9].*)/)[1]});
                    } else if (this.props.location.pathname == "/watch") { // Runs if visitor loads directly from Url
                        if (this.props.location.search) {
                            if (this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)) {
                                if (this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)[1]) {
                                    this.initPlayer(await this.fetchVideoPageData(this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)[1]) + playbackFormat, playEndAd);
                                    this.setState({ mpd: this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)[1]});
                                }
                            } else if (this.props.location.search.match(/\?va=([a-zA-Z0-9].*)/)) {
                                if (this.props.location.search.match(/\?va=([a-zA-Z0-9].*)/)[1]) {
                                    this.initPlayer(await this.fetchVideoPageData(this.props.location.search.match(/\?va=([a-zA-Z0-9].*)/)[1], true) + playbackFormat, playEndAd);
                                    this.setState({ mpd: this.props.location.search.match(/\?va=([a-zA-Z0-9].*)/)[1]});
                                }
                            }
                        }
                    } else if (this.props.location.pathname) { // Runs if visitor loads from clicking video on website
                        if (this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)) {
                            if (this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)[2]) {
                                this.initPlayer(await this.fetchVideoPageData(this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)[2]) + playbackFormat, playEndAd);
                                this.setState({ mpd: this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)[2]});
                            }
                        } else if (this.props.location.pathname.match(/(\/watch\?va=)([a-zA-Z0-9].*)/)) {
                            if (this.props.location.pathname.match(/(\/watch\?va=)([a-zA-Z0-9].*)/)[2]) {
                                this.initPlayer(await this.fetchVideoPageData(this.props.location.pathname.match(/(\/watch\?va=)([a-zA-Z0-9].*)/)[2], true) + playbackFormat, playEndAd);
                                this.setState({ mpd: this.props.location.pathname.match(/(\/watch\?va=)([a-zA-Z0-9].*)/)[2]});
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // There was a problem retrieving url data
        }
    }
    /** Runs when user loads page by clicking from another page. Will not function when page is loaded from direct link or reload */
    setUpState() {
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.mpd) {
                    this.setState({ mpd: this.props.location.props.mpd })
                }
                if (this.props.location.props.title) {
                    this.setState({ title: this.props.location.props.title });
                }
                if (this.props.location.props.description) {
                    this.setState({ description: this.props.location.props.description });
                }
                if (this.props.location.props.author) {
                    this.setState({ author: this.props.location.props.author });
                }
                if (this.props.location.props.views) {
                    this.setState({ views: this.props.location.props.views });
                }
                if (this.props.location.props.published) {
                    if (!this.props.location.props.published) {
                        this.setState({ published: "No Date" });
                    } else {
                        this.setState({ published: this.props.location.props.published });
                    }
                }
                if (this.props.location.props.tags) {
                    if (typeof this.props.location.props.tags === 'string') {
                        this.setState({ tags: this.props.location.props.tags.split(',') });
                    }
                }
                let responseTo = {
                    title: "",
                    id: "",
                    type: "",
                    mpd: ""
                }
                if (this.props.location.props.responseToType) {
                    responseTo.type = this.props.location.props.responseToType;
                }
                if (this.props.location.props.responseToTitle) {
                    responseTo.title = this.props.location.props.responseToTitle;
                }
                if (this.props.location.props.responseToId) {
                    responseTo.id = this.props.location.props.responseToId;
                } else if (this.props.location.props.responseToMpd) {
                    responseTo.mpd = this.props.location.props.responseToMpd;
                }
                this.setState({ responseTo: responseTo });
            }
        }
    }

    /* Entire fetch request returns object containing video object, relevantVideos array of objects, articleResponses array of objects, videoResponses array of objects. Video object contains mpd, author, title, description, tags, published, likes, dislikes, views */
    fetchVideoPageData = async (rawMpd, ad = false) => {
        let username = "";
        let self = false;
        if (cookies.get('loggedIn')) {
            username = cookies.get('loggedIn');
            self = true;
        }
        let hash = cookies.get('hash');
        // When authentication doesn't matter, 
        try {
            const videoData = await fetch(currentrooturl + 'm/fetchvideopagedata', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    rawMpd, username, ad, hash, self
                })
            })
            .then((response) => {
                return response.json();
            })
            .then(async (result) => {
                console.log(result);
                let authenticated = this.props.checkAndConfirmAuthentication(result);
                if (authenticated) {
                    this.setState({ fetched: true });
                    /* Sets all video document related data */
                    if (result.video.hasOwnProperty('viewable')) {
                        if (result.video.viewable == false) {
                            this.setState({viewable: false });
                        } else {
                            this.setState({viewable: true });
                        }
                    }
                    for (const [key, value] of Object.entries(result.video)) {
                        if (this.state) {
                            if (key == "published") {
                                this.setState(setStateDynamic(key, roundTime(value)));
                            } else if (key == "likedDisliked") {
                                if (value == "likes") {
                                    this.setState({ liked: true });
                                    this.setState({ disliked: false });
                                } else if (value == "dislikes") {
                                    this.setState({ disliked: true });
                                    this.setState({ liked: false });
                                }
                            } else if (key == "description") {
                                this.setState({ description: value })
                            } else if (key == "adUrl") {
                                this.setState({ adLink: result.video.adUrl });
                            } else if (key == "dailyBudget") {
                                this.setState({ adBudget: result.video.dailyBudget });
                            } else if (key == "productPlacement") {
                                try {
                                    let temp = JSON.parse(result.video.productPlacement);
                                    for (let i = 0; i < temp.length; i++) {
                                        if (temp[i].images) {
                                            temp[i].images = JSON.parse(temp[i].images);
                                        }
                                        if (temp[i].styles) {
                                            temp[i].styles = JSON.parse(temp[i].styles);
                                        }
                                    }
                                    this.setState({ productPlacement: temp });  
                                } catch (err) {
                                    // Fail silently
                                }
                            } else if (key == "survey") {
                                this.setState({ survey: resolveSurvey(result.video.survey) });
                            } else if (value) {
                                this.setState(setStateDynamic(key, value));
                            } else if (!value && key == "views" || !value && key == "likes" || !value && key == "dislikes") {
                                this.setState(setStateDynamic(key, value));
                            }
                        }
                    }
                    if (ad) {
                        if (result.video.title) {
                            this.setState({ adTitle: result.video.title });
                        }
                        if (result.video.author) {
                            this.setState({ adAuthor: result.video.author });
                        }
                        if (result.video.mpd) {
                            if (result.video.mpd.match(/([a-zA-Z0-9].*)\/([a-zA-Z0-9].*)/)) {
                                this.setState({ adUriRaw: result.video.mpd.match(/([a-zA-Z0-9].*)\/([a-zA-Z0-9].*)/)[2] });
                            }
                        }
                    }
                    if (this.state.mpd) {
                        if (result.video.mpd.match(/([a-zA-Z0-9].*)\/([a-zA-Z0-9].*)/)) {
                            let surveyChecked = await checkCompletedSurvey(result.video.mpd.match(/([a-zA-Z0-9].*)\/([a-zA-Z0-9].*)/)[2]);
                            if (surveyChecked) {
                                this.setState({ surveySubmitted: true });
                            }
                        }
                    }
                    if (result) {
                        return result;
                    }
                }
                return false;
            });
            if (videoData) {
                if (videoData.video) {
                    if (videoData.video.mpd) {
                        this.setState({ articleResponses: videoData.articleResponses, responseTo: videoData.responseTo, videoResponses: videoData.videoResponses, friendsWatched: videoData.friendsWatched });
                        this.setState({ viewCounted: false });
                        // Determine if user is currently following
                        if (window.localStorage.getItem('mediahistory')) {
                            let jsondata = JSON.parse(window.localStorage.getItem('mediahistory'));
                            if (jsondata) {
                                if (jsondata.subscribed) {
                                    let subscriptions = JSON.parse(window.localStorage.getItem('mediahistory')).subscribed;
                                    for (let i = 0; i < subscriptions.length; i++) {
                                        if (subscriptions[i].channel == this.state.author) {
                                            this.setState({ following: true });
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        return videoData.video.mpd;
                    }
                }
            } 
        } catch (err) {
            // Componenent unmounted during method
            console.log(err);
            return false;
        }
        return false;
    }

    // Increments view on video by one on backend and visually on front end
    incrementView = async () => {
        this.endViewCountInterval();
        if (this.state.mpd && !this.state.viewCounted && !this.state.adPlaying || this.state.adUriRaw && this.state.adPlaying && this.state.adBudget && this.state.startDate && this.state.endDate && !this.state.viewCounted) {
            let username = "";
            let self = false;
            if (cookies.get('loggedIn')) {
                username = cookies.get('loggedIn');
                self = true;
            }
            let ad = false;
            if (this.props.ad) {
                ad = true;
            } else if (this.props.location.search) {
                if (this.props.location.search.match(/\?va=([a-zA-Z0-9].*)/)) {
                    ad = true;
                }
            } else if (this.props.location.pathname) {
                if (this.props.location.pathname.match(/\?va=([a-zA-Z0-9].*)/)) {
                    ad = true;
                }
            }
            if (this.state.adPlaying == true) {
                ad = true;
            }

            let dontInc = false;
            if (this.state.adPlaying && cookies.get('loggedIn') == this.state.adAuthor) {
                dontInc = true;
            }
            if (ad && !this.state.adBudget || ad && !this.state.startDate || ad && !this.state.endDate) { // If data is required to inc is not available, dont inc
                dontInc = true;
            }
            let mpd = this.state.mpd;
            if (this.state.adUriRaw) {
                mpd = this.state.adUriRaw;
            }
            let adBudget;
            let startDate;
            let endDate;
            if (this.state.adBudget && this.state.startDate && this.state.endDate) {
                adBudget = this.state.adBudget;
                startDate = this.state.startDate;
                endDate = this.state.endDate;
            }
            if (!dontInc) {
                if (username) {
                    let hash = cookies.get('hash');
                    await fetch(currentrooturl + 'm/incrementview', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            mpd, username, ad, adBudget, startDate, endDate, hash, self
                        })
                    })
                    .then(function(response) {
                        return response.json();
                    })
                    .then((result) => {
                        let authentication = this.props.checkAndConfirmAuthentication(result);
                        if (result && authentication) {
                            if (result.hasOwnProperty('increment')) {
                                if (result.increment) {
                                    this.setState({ viewCounted: true });
                                    this.setState({ views: this.state.views+1 });
                                }
                            }
                            if (result.hasOwnProperty('playlist')) {
                                if (result.playlist === false) {
                                    this.props.playlist.buildPlaylist(true);
                                }
                            }
                        }
                    });
                } else {
                    await fetch(currentrooturl + 'm/incrementview', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            mpd, ad, adBudget, startDate, endDate
                        })
                    })
                    .then(function(response) {
                        return response.json();
                    })
                    .then((result) => {
                        if (result) {
                            if (result.hasOwnProperty('increment')) {
                                if (result.increment) {
                                    this.setState({ viewCounted: true });
                                    this.setState({ views: this.state.views+1 });
                                }
                            }
                            if (result.hasOwnProperty('playlist')) {
                                if (result.playlist === false) {
                                    this.props.playlist.buildPlaylist(true);
                                }
                            }
                        }
                    });
                }
            }
        }
    }
    
    incrementClick = async () => {
        if (this.state.mpd && !this.state.clickCounted || this.state.adUriRaw && this.state.adPlaying && this.state.adBudget && this.state.startDate && this.state.endDate && !this.state.clickCounted) {
            let username = "";
            let self = false;
            if (cookies.get('loggedIn')) {
                username = cookies.get('loggedIn');
                self = true;
            }
            let ad = false;
            if (this.props.ad) {
                ad = true;
            } else if (this.props.location.search) {
                if (this.props.location.search.match(/\?va=([a-zA-Z0-9].*)/)) {
                    ad = true;
                }
            } else if (this.props.location.pathname) {
                if (this.props.location.pathname.match(/\?va=([a-zA-Z0-9].*)/)) {
                    ad = true;
                }
            }
            if (this.state.adPlaying == true) {
                ad = true;
            }

            let dontInc = false;
            if (this.state.adPlaying && cookies.get('loggedIn') == this.state.adAuthor) {
                dontInc = true;
            }
            if (ad && !this.state.adBudget || ad && !this.state.startDate || ad && !this.state.startDate) { // If data is required to inc is not available, dont inc
                dontInc = true;
            }
            let mpd = this.state.mpd;
            if (this.state.adUriRaw) {
                mpd = this.state.adUriRaw;
            }
            let adBudget;
            let startDate;
            let endDate;
            if (this.state.adBudget && this.state.startDate && this.state.endDate) {
                adBudget = this.state.adBudget;
                startDate = this.state.startDate;
                endDate = this.state.endDate;
            }
            if (!dontInc && username) {
                let hash = cookies.get('hash');
                await fetch(currentrooturl + 'm/incrementclick', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        mpd, username, ad, adBudget, startDate, endDate, hash, self
                    })
                })
                .then(function(response) {
                    return response.json();
                })
                .then((result) => {
                    let authentication = this.props.checkAndConfirmAuthentication(result);
                    if (result && authentication) {
                        if (result.hasOwnProperty('increment')) {
                            if (result.increment) {
                                this.setState({ clickCounted: true });
                            }
                        }
                        if (result.hasOwnProperty('playlist')) {
                            if (result.playlist === false) {
                                this.props.playlist.buildPlaylist(true);
                            }
                        }
                    }
                })
            }
        }
    }

    checkTogetherHost = () => {
        try {
            if (this.props.togetherToken) {
                if (this.props.togetherToken.host && cookies.get('loggedIn')) {
                    if (this.props.togetherToken.host == cookies.get('loggedIn')) {
                        return true; // Will play ad if host is choosing video
                    }
                }
            } else {
                return true; // Will play ad if no togetherToken
            }
            return false; 
        } catch (err) {
            return false;
        }
    }

    /**
     * Will determine if an ad is due to be played. Ads are played at the start if they haven't been played for x time ago. The default is 14 minutes but it can be set to anything externally and passed as an argument
     * If videos watched over 6 or last ad watched was over 14 min ago or adRun.start == 0 then set a new ad to play
     * If last end ad watched x minutes ago, set it to watch. 
     * This function will just determine if its time for an ad to be played. Nothing else.
     * @param {Object} adRun 
     * @param {Number} xMinutesAgo 
     * @param {Number} vidsWatched 
     */
    determineIfAdStartOrAdEndWaiting = (adRun, xMinutesAgo, vidsWatched) => {
        if (adRun) {
            if (adRun.hasOwnProperty('start')) {
                if (adRun.start == 0 || adRun.start < xMinutesAgo || vidsWatched > 6) { // null adStart, over 7 min ago or user watched 7 videos? Run ad
                    this.setState({ adStart: true });
                    this.props.playlist.setVidsWatchedZero(); // If ad is running, always set vids watched to 0 to reset counter
                }
            }
            if (adRun.hasOwnProperty('end')) {
                if (adRun.end == 0 || adRun.end < xMinutesAgo) {
                    this.setState({ adEnd: true });
                }
            }
        }
    }

    buildInteractInterval() {
        try {
            if (this.state.interactInterval) {
                clearInterval(this.state.interactInterval);
            }
            let productPlacement = this.state.productPlacement ? this.state.productPlacement : null;
            let interactIntervalRef = setInterval(() => {
                try {
                    let curTime = this.videoComponent.current.currentTime;
                    if (productPlacement) {
                        for (let i = 0; i < productPlacement.length; i++) {
                            if (productPlacement[i].start <= curTime && productPlacement[i].end >= curTime) {
                                if (this.state.livePlacement) {
                                    if (this.state.livePlacement.id) {
                                        if (this.state.livePlacement.id != productPlacement[i].id ) {
                                            this.setState({ livePlacement: productPlacement[i] }, () => {
                                                setTimeout(() => {
                                                    this.setState({ livePlacementDisplay: true });
                                                    this.setState({ placementSuccess: null }); // Different product loading but no wait inbetween. Remove placement success info
                                                }, 200);
                                            });
                                            break;
                                        }
                                    } else {
                                        this.setState({ livePlacement: productPlacement[i] }, () => {
                                            setTimeout(() => {
                                                this.setState({ livePlacementDisplay: true });
                                            }, 200);
                                        });
                                        break;
                                    }
                                } else {
                                    this.setState({ livePlacement: productPlacement[i] }, () => {
                                            setTimeout(() => {
                                                this.setState({ livePlacementDisplay: true });
                                            }, 200);
                                    });
                                    break;
                                }
                            } else {
                                if (this.state.livePlacement) {
                                    if (this.state.livePlacement.id == productPlacement[i].id) {
                                        setTimeout(() => {
                                            this.setState({ livePlacementDisplay: false }, () => { // Do placement set state in reverse here to ensure smooth transition out
                                                setTimeout(() => {
                                                    this.setState({ livePlacement: null, placementSuccess: null });
                                                }, 200);
                                            });
                                        }, 50);
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.log(err); // Fail silently
                }
            }, 1000);
            this.setState({ interactInterval: interactIntervalRef });
        } catch (err) {
            try {
                if (this.state.interactInterval) {
                    clearInterval(this.state.interactInterval);
                }
            } catch (err) {
                // Fail silently
            }
            console.log(err);
        }
    }
    
    /* Initialize player and player error handlers */
    initPlayer = async(manifest, playEndAd = false, serveAd = null) => {
        try {
            this.setState({ mpdCloudAddress: manifest });
            this.setState({ skipTime: 5 });
            this.buildInteractInterval();
            // Install polyfills to patch browser incompatibilies
            shaka.polyfill.installAll();
            encryptionSchemePolyfills.install();
            // Check browser support
            let playbackFormat = await this.checkPlaybackSupportType();
            if (shaka.Player.isBrowserSupported() && playbackFormat) {
                if (!manifest) {
                    manifest = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';
                }
                let manifestUri = manifest;

                // Before a video plays, you must check if an advertisement must run or not, whether or not (how much) ads must run within the video or at the end after completing. Ad played 10 minutes ago or user watched 5 videos since?
                let adRun = null;
                let vidsWatched = 0;
                if (this.props.playlist) {
                    adRun = await this.props.playlist.checkAdSetup();
                    vidsWatched = this.props.playlist.playlistVidsWatched;
                }
                let xMinutesAgo = new Date().getTime() - 1000*60*14; // 14 minutes ago

                this.determineIfAdStartOrAdEndWaiting(adRun, xMinutesAgo, vidsWatched);
                // Return array of times to play ad on this video. store. This will be retrieved from server from original fetch video data request

                // Run function to get ad, play ad as manifest and then return back to normal video playthrough on skip or finish. Run in playlist class, save video timestamp and manifest // Always play the very next ad. Advertisements can be ordered chronologically from server side
                let adData = null;
                let adUri = null;
                let adUriRaw = null;
                let adsAvailable = false;
                if (this.state.cloud && get(this, 'props.playlist._playlist.ads')) {
                    if (this.state.adStart || playEndAd) { // Only set ad data if adStart is true. Else play normal video
                        if (this.props.playlist._playlist.ads[0]) { // We can only play ads if there are ads to play in the playlist class
                            adsAvailable = true;
                            if (this.props.playlist._playlist.ads[0]._fields && this.checkTogetherHost()) {
                                if (this.props.playlist._playlist.ads[0]._fields[0]) {
                                    if (this.props.playlist._playlist.ads[0]._fields[0].properties) {
                                        if (this.props.playlist._playlist.ads[0]._fields[0].properties.mpd) {
                                            adUriRaw = this.props.playlist._playlist.ads[0]._fields[0].properties.mpd;
                                            adUri = this.state.cloud + "/" + this.props.playlist._playlist.ads[0]._fields[0].properties.mpd + playbackFormat;
                                        }
                                        adData = this.props.playlist._playlist.ads[0]._fields[0].properties; 
                                        this.setState({ adTitle: adData.title });
                                        this.setState({ adAuthor: adData.author });
                                    }
                                }
                            }
                        }
                    }
                }
                console.log(adUri, adData, this.state.adStart, playEndAd, adsAvailable);

                // During playback, at x time, send request to server set watched, at start set impression to server, on click send to server
                // After ad has played (start of video, defer) in video, dont defer, end of video (defer) (two different defers? one at end one at start?). Set defers and if more ads will play

                const video = this.videoComponent.current;
                const videoContainer = this.videoContainer.current;
                
                shakaAddonButtons.nextSeries();
                // Initialize player
                let player = new shaka.Player(video);
                this.player = player;

                // UI custom json
                const uiConfig = {};
                uiConfig['controlPanelElements'] = ['play_pause', 'time_and_duration', 'chatButton', 'spacer', 'mute', 'volume', 'overflow_menu', 'coverButton', 'theatreButton', 'fullscreen'];

                //Set up shaka player UI
                if (player && videoContainer && video) {
                    const ui = new shaka.ui.Overlay(player, videoContainer, video);

                    ui.configure(uiConfig);
                    ui.getControls();
                    this.controls = ui;

                    // Listen for errors
                    player.addEventListener('error', (err) => {
                        this.onErrorEvent();
                        console.log(err);
                    });

                    // Ensures buffering spinner is never indefinitely spinning
                    player.addEventListener('buffering', (event) => {
                        try {
                            setTimeout((event) => {
                                if (player.isBuffering()) {
                                    if (document.getElementsByClassName("shaka-spinner")[0]) {
                                        document.getElementsByClassName("shaka-spinner")[0].classList.remove("hidden");
                                        try {
                                            setTimeout(() => {
                                                if (!player.isBuffering()) {
                                                    if (document.getElementsByClassName("shaka-spinner")[0]) {
                                                        document.getElementsByClassName("shaka-spinner")[0].classList.add("hidden");
                                                    }
                                                }
                                            }, 10000);
                                        } catch (err) {
                                            // Fail silently
                                        }
                                    }
                                } else {
                                    if (document.getElementsByClassName("shaka-spinner")[0]) {
                                        document.getElementsByClassName("shaka-spinner")[0].classList.add("hidden");
                                    }
                                }
                            }, 1000);
                        } catch (err) {
                            // Fail silently
                        }
                    });
                    // Ensures that check counted interval is functioning 
                    video.addEventListener('playing', (event) => {
                        if (this.state.freeze) {
                            this.setState({ freeze: false });
                        }
                        if (this.videoComponent) {
                            this.viewCountedInterval();    
                        }
                        if (!this.state.impressionCounted && this.state.adPlaying && this.state.adUriRaw && this.state.adBudget && this.state.startDate && this.state.endDate) { // Only count impression if impression not counted yet and type ad
                            if (this.state.adAuthor != cookies.get('loggedIn')) {
                                let data = {
                                    id: this.state.adUriRaw,
                                    type: "impression",
                                    adBudget: this.state.adBudget,
                                    startDate: this.state.startDate,
                                    endDate: this.state.endDate
                                }
                                this.props.sendImpression(data);
                                this.setState({ impressionCounted: true });
                            }
                        }
                    });
                    video.addEventListener('ended', this.endOfVideoPlay);
                }
                if (serveAd) {
                    adUri = serveAd;
                }
                
                if (adUri && adData && this.state.adStart && adsAvailable && this.checkTogetherHost() || adUri && adData && playEndAd && adsAvailable && this.checkTogetherHost() || serveAd) { // there is an ad to be played. Load ad first, when ad is done, it will reload normal video
                    this.setupSendWatch(manifestUri, 0, true, adUriRaw); // Sends watch to the other user in the socket to update their view
                    player.load(adUri).then(() => {
                        this.setState({ viewInterval: "" });
                        this.setState({ viewCounted: false });
                        if (this.checkTogetherHost()) {
                            this.setState({ adBudget: this.props.playlist._playlist.ads[0]._fields[0].properties.dailyBudget });
                            this.setState({ startDate: this.props.playlist._playlist.ads[0]._fields[0].properties.startDate });
                            this.setState({ endDate: this.props.playlist._playlist.ads[0]._fields[0].properties.endDate });
                            this.setState({ adLink: this.props.playlist._playlist.ads[0]._fields[0].properties.adUrl });
                        }
                        if (this.checkTogetherHost()) {
                            this.props.playlist.incToNextAd(); // Once an ad has started playing, you should cycle the playlist in the background so next ad played is not the same
                            // Dont increment videos watched because ads do not count as videos watched. Videos watched are for normal videos. Once user has watched x amount of videos, then display ad
                        }
                        this.setState({ adPlaying: true });
                        if (adUriRaw) {
                            this.setState({ adUriRaw: adUriRaw });
                        }
                        if (this.videoComponent) {
                            if (this.videoComponent.current) {
                                this.videoComponent.current.play();
                                video.style.height = this.resolvePlaceholderHeight() + "px";
                                this.viewCountedInterval(adUriRaw); // set custom viewcountedinterval for ad
                            }
                            this.setUpCropButton();
                        }
                    }).catch((err) => {
                        console.log(err);
                    })
                } else {
                    // Try to load a manifest Asynchronous // The goal is that this should always load even if playlistData is corrupt
                    this.setupSendWatch(manifestUri, 0, false, adUri);
                    player.load(manifestUri).then(() => {
                        this.setState({ viewInterval: "" });
                        this.setState({ viewCounted: false });
                        this.setState({ adBudget: "" });
                        this.setState({ startDate: "" });
                        this.setState({ endDate: "" });
                        this.setState({ adPlaying: false });
                        this.setState({ adUriRaw: "" });
                        if (get(this, 'props.playlist')) {
                            this.props.playlist.incrementVidsWatched(); // Will increment videos watched on playlist. Ad automatically queued when x videos have been clicked through
                        }
                        if (this.videoComponent) {
                            if (this.videoComponent.current) {
                                this.videoComponent.current.play();
                                video.style.height=""; // log video.style.height to configure player height styling
                                this.viewCountedInterval(this.state.mpd);
                            }
                        }
                        if (this.player) {
                            updateHistory.call(this);
                        }
                        this.setUpCropButton();
                    }).catch((err) => {
                        console.log(err);    
                    });;
                }
            } else {
                // This browser does not have the minimum set of APIs we need.
                console.error('Browser not supported!');
            }
        } catch (err) {
            console.log(err);
        }
    }
    
    setupSendWatch = (uri, time, playad = false, ad) => {
        console.log(uri, cookies.get('loggedIn'), playad, ad, JSON.parse(window.localStorage.getItem('togetherdata')));
        if (uri && this.props.togetherToken && cookies.get('loggedIn') && JSON.parse(window.localStorage.getItem('togetherdata'))) {
            if (uri.match(/([0-9a-zA-Z].*)\/([0-9a-zA-Z].*)-/) && this.props.togetherToken.host == cookies.get('loggedIn') && JSON.parse(window.localStorage.getItem('togetherdata')).ads) { // You're only able to send a video to be watched if you are the host of the session
                if (uri.match(/([0-9a-zA-Z].*)\/([0-9a-zA-Z].*)-/)[2] && JSON.parse(window.localStorage.getItem('togetherdata')).ads[0]) {
                    this.props.sendWatch(uri.match(/([0-9a-zA-Z].*)\/([0-9a-zA-Z].*)-/)[2], ad, time, playad);
                } else { // Its possible that the user has no ads in their playlist. Revert to playing video
                    this.props.sendWatch(uri.match(/([0-9a-zA-Z].*)\/([0-9a-zA-Z].*)-/)[2], null, time, false);
                }
            }
        }
    }
    
    setUpCropButton() {
        let cropBtn;
        let mainvideocontainer;
        if (document.getElementsByClassName('crop-btn')[0] && document.getElementsByClassName('main-video-container')[0]) {
            cropBtn = document.getElementsByClassName('crop-btn')[0];
            mainvideocontainer = document.getElementsByClassName('main-video-container')[0];
            if (cookies.get('video-wide') == "true") {
                cropBtn.classList.add('crop_square');
                cropBtn.innerHTML = 'crop_square';
                mainvideocontainer.classList.add('wide-screen');
            }
        }
    }

    endOfVideoPlay = async() => {
        if (window.location.href.match(/\?([v|a].*)=([a-zA-Z0-9].*)&([a-zA-Z0-9].*)\?([v|a].*)=([a-zA-Z0-9].*)/) && this.props.togetherToken) {
            if (this.props.togetherToken.host != cookies.get('loggedIn')) {
                window.history.replaceState(null, "", "/watch?" + window.location.href.match(/\?([v|a].*)=([a-zA-Z0-9].*)&([a-zA-Z0-9].*)\?([v|a].*)=([a-zA-Z0-9].*)/)[1] + "=" + window.location.href.match(/\?([v|a].*)=([a-zA-Z0-9].*)&([a-zA-Z0-9].*)\?([v|a].*)=([a-zA-Z0-9].*)/)[2]);
            }
        }
        this.endViewCountInterval();
        console.log("ended", this.state);
        this.setState({ impressionCounted: false });
        if (this.checkTogetherHost()) {
            if (this.state.adPlaying && this.state.adStart) { // Ad was playing, we've reached the end of the ad. Neither of these will be true if playing during a normal video. Play normal video
                this.props.playlist.setVidsWatchedZero();
                this.setState({ adStart: false });
                let updateAdStart = new Promise((resolve, reject) => {
                    try {
                        resolve(this.props.playlist.setAdStart());
                    } catch (err) {
                        reject(err);
                    }
                })
                updateAdStart.then(async (result) => {
                    let detached = await this.player.detach();
                    this.player.destroy();
                    if (document.getElementsByClassName('shaka-controls-container')) {
                        if (document.getElementsByClassName('shaka-controls-container')[0]) {
                            document.getElementsByClassName('shaka-controls-container')[0].remove();
                        }
                    }
                    if (document.getElementsByClassName('shaka-spinner-container')) {
                        if (document.getElementsByClassName('shaka-spinner-container')[0]) {
                            document.getElementsByClassName('shaka-spinner-container')[0].remove();
                        }
                    }
                    this.setState({ adAuthor: "" });
                    this.setState({ adUri: "" });
                    this.setState({ adLink: "" });
                    this.setState({ clickCounted: false });
                    this.setState({ adPlaying: false });
                    this.endViewCountInterval();
                    this.loadPage(); // This should begin playing the normal video the user wished to play
                })
            } else if (this.state.adPlaying && this.state.adEnd) { // end ad was playing, set new data
                this.setState({ adEnd: false });
                let updateAdEnd = new Promise((resolve, reject) => {
                    try {
                        resolve(this.props.playlist.setAdEnd());
                    } catch (err) {
                        reject(err);
                    }
                })
                updateAdEnd.then(async (result) => {
                    let detached = await this.player.detach();
                    this.player.destroy();
                    if (document.getElementsByClassName('shaka-controls-container')) {
                        if (document.getElementsByClassName('shaka-controls-container')[0]) {
                            document.getElementsByClassName('shaka-controls-container')[0].remove();
                        }
                    }
                    if (document.getElementsByClassName('shaka-spinner-container')) {
                        if (document.getElementsByClassName('shaka-spinner-container')[0]) {
                            document.getElementsByClassName('shaka-spinner-container')[0].remove();
                        }
                    }
                    this.setState({ adAuthor: "" });
                    this.setState({ adUri: "" });
                    this.setState({ adLink: "" });
                    this.setState({ clickCounted: false });
                    this.setState({ adPlaying: false });
                    this.endViewCountInterval();
                    this.loadPage(); // Load next video, should be normal video if enough time didn't elapse, else it will be ad
                });
            } else if (this.state.adEnd) { // normal video was playing, try to play end ad if there is an end ad
                if (this.state.freeze) {
                    this.setState({ freeze: false });
                    let detached = await this.player.detach();
                    this.player.destroy();
                    if (document.getElementsByClassName('shaka-controls-container')) {
                        if (document.getElementsByClassName('shaka-controls-container')[0]) {
                            document.getElementsByClassName('shaka-controls-container')[0].remove();
                        }
                    }
                    if (document.getElementsByClassName('shaka-spinner-container')) {
                        if (document.getElementsByClassName('shaka-spinner-container')[0]) {
                            document.getElementsByClassName('shaka-spinner-container')[0].remove();
                        }
                    }
                    this.loadPage(false, true); // Will load end ad if there is one, always update window.location.href to next playlist video so after the end ad it will automatically load the next playlist item
                } else {
                    this.setState({ freeze: true });
                }
            }
        }
    }

    /** Determines if atleast 25% or 45 seconds of video has been watched to determine view increment fetch request to database */
    viewCountedInterval(video) {
        let refreshIntervalRate = () => { // Returns a appropriate interval rate to accomodate for shorter videos so user does not leave page before view is incremented. Otherwise really short videos could be adversely effected.
            try {
                if (get(this, 'videoComponent.current.played.end')) {
                    if (this.state.adPlaying) {
                        return 500; // Check constantly for ads
                    }
                    if (this.videoComponent.current.duration > 60) {
                        return 3500;
                    } else if (this.videoComponent.current.duration > 10) {
                        return 2000;
                    } else {
                        return 1200; // Accomodate for really short videos below 10 seconds
                    }
                }
                return 5000;
            } catch (err) {
                // Something went wrong
                return 5000;
            }
        }
        try {
            if (!this.state.viewCounted && !this.state.viewInterval) {
                let viewInterval = setInterval(() => {
                    let totalTime = 0;
                    if (this.videoComponent) {
                        if (this.videoComponent.current) {
                            for (let i = 0; i < this.videoComponent.current.played.length; i++) {
                                if (!this.state.viewCounted) {
                                    totalTime += (this.videoComponent.current.played.end(i) - this.videoComponent.current.played.start(i));
                                }
                            }
                            if (this.state.adPlaying && this.state.skipTime < 6 && this.state.skipTime > 0) {
                                this.setState({ skipTime: 5 - Math.floor(totalTime) });
                            }
                            // console.log(totalTime, this.videoComponent.current.duration);
                            let watchedTimeInc = 20;
                            let percentageInc = 0.25;
                            // Users must watch either x seconds of an ad or x percentage for it to constitute a "view". This is sensitive as this determines what advertisers pay to minipost and also how authors are compensated as a result.
                            if (this.state.adPlaying) {
                                watchedTimeInc = 17.5; 
                                percentageInc = 0.35;
                            }
                            if (totalTime / this.videoComponent.current.duration > percentageInc || totalTime > watchedTimeInc) { // Increment video view if user has watched more than 25% of the video or the totalTime watched is more than 45 seconds
                                totalTime = 0;
                                this.incrementView();
                            }
                        }
                    }
                }, refreshIntervalRate());
                this.setState({ viewInterval: viewInterval });
            }
        } catch (err) {
            if (err) {
                this.setState({ skipTime: 0 });
            }
            // Set interval may not have ran due to window not being available. User left page
        }
    }

    /** Ends view count interval and clears state record of interval */
    endViewCountInterval = () => {
        if (this.state.viewInterval) {
            clearInterval(this.state.viewInterval);
            this.setState({ viewInterval: "" });
            return true;
        }
        return false;
    }

    openDescription(e, boolean) {
        this.setState({ descriptionOpen: boolean });
    }

    tallDescription() {
        if (document.getElementsByClassName('video-description-info')[0]) {
            if (document.getElementsByClassName('video-description-info')[0].offsetHeight > 200) {
                return true;
            } else {
                return false;
            }
        }
    }

    // Prep to see if state is valid before attempting follow
    followCheck() {
        if (get(this, 'player.getAssetUri')) {
            if (this.player.getAssetUri()) {
                if (!this.state.following) {
                    this.props.follow(this.state.author);
                } else {
                    this.props.follow(this.state.author, false);
                }
            }
        }
        setTimeout(() => {
            if (window.localStorage.getItem('mediahistory')) {
                let temp = JSON.parse(window.localStorage.getItem('mediahistory'));
                let matchFound = false;
                for (let i = 0; i < temp.subscribed.length; i++) {
                    if (temp.subscribed[i].channel == this.state.author) {
                        matchFound = true;
                        this.setState({ following: true });
                        break;
                    }
                }
                if (!matchFound) {
                    this.setState({ following: false });
                }
            }
        }, 500);
    }

    returnAvatar = () => {
        if (this.state.avatarurl && this.state.cloud) {
            if (this.state.avatarurl.length > 0 && this.state.cloud.length > 0) {
                return this.state.cloud + "/av/" + this.state.avatarurl;
            }
        }
        return dummyavatar;
    }
    
    serveAdLink = (e) => {
        this.incrementClick();
    }
    
    skipAd = (e) => {
        if (this.state.skipTime < 1) {
            this.endOfVideoPlay();
        }
    }
    
    maintainAspectRatio = () => {
        let currVidAspRatio;
        try {
            let aspectInterval = setInterval(() => {
                try {
                currVidAspRatio = cookies.get('currentVideoAspectRatio');
                    if (this.state) {
                        if (get(this, 'videoComponent.current.clientHeight') && !this.state.adPlaying) {
                            if (!currVidAspRatio || currVidAspRatio!== this.videoComponent.current.clientHeight) {
                                cookies.set('currentVideoAspectRatio', this.videoComponent.current.clientHeight);
                                this.setState({ curVidAspRatio: this.videoComponent.current.clientHeight });
                            }
                        }
                    }
                } catch (err) {
                    // Throw peaceful error
                }
            }, 100);
        } catch (err) {
            console.log(err);
        }
    }
    
    resolvePlaceholderHeight() {
        if (cookies.get('currentVideoAspectRatio')) {
            let currVidAspRatio = cookies.get('currentVideoAspectRatio');
            if (currVidAspRatio && !this.videoComponent.current) { // Only force height if video component is null. Prevents some janky movements of video component when loading from placeholder image
                return cookies.get('currentVideoAspectRatio');
            }
        }
        return "";
    }

    resolveRelevantTyping = (typing) => {
        try {
            if (this.props.togetherToken) {
                for (let i = 0; i < typing.length; i++) {
                    if (typing[i].match(typingRegex)[1] == this.props.togetherToken.host || this.props.togetherToken.participants.indexOf(typing[i].match(typingRegex)[1]) >= 0) {
                        if (this.state.relevantTyping != typing[i]) {
                            this.setState({ relevantTyping: typing[i] });
                        }
                        return typing[i];
                    }
                }
            } else {
                return false;
            }
        } catch (err) {
            console.log(err);
        }
    }

    resolveThumbnailSafely() {
        try {
            if (this.state.cloud && this.state.thumbnail) {
                return this.state.cloud + "/" + this.state.thumbnail;
            } else {
                return minipostpreviewbanner;
            }
        } catch (err) {
            return minipostpreviewbanner;
        }
    }

    resolveLivePlacementPrice() {
        try {
            if (this.state.livePlacement.styles.length == 1) {
                return formatAPrice(this.state.livePlacement.styles[0].options[0].price);
            }
        } catch (err) {
            return null;
        }
    }

    resolveSingleProductBuyChoice() {
        try {
            if (this.state.livePlacement) {
                if (this.state.livePlacement.styles.length == 1 && this.state.livePlacement.styles[0].options.length == 1) {
                    return "Add To Cart";
                }
            }
            return "See Details";
        } catch (err) {
            return "See Details";
        }
    }

    async addToCart() {
        try {
            this.setState({ placementError: "" });
            if (this.state.livePlacement.styles.length == 1 && this.state.livePlacement.styles[0].options.length == 1) {
                let userShippingData = this.props.userShippingData;
                let productsAdded = this.state.productsAdded;
                if (this.state.livePlacement) {
                    let tempProduct = this.state.livePlacement;
                    if (productsAdded.indexOf(tempProduct.id) == -1) { // Ensures that product is not added twice between See Details & Buy Now
                        tempProduct.style = tempProduct.styles[0].descriptor;
                        tempProduct.option = tempProduct.styles[0].options[0].descriptor;
                        let data = await addOneProductToCart(tempProduct, userShippingData);
                        if (data.error) {
                            throw new Error;
                        } else {
                            this.setState({ placementSuccess: "Added to cart" });
                            productsAdded.push(tempProduct.id);
                            this.setState({ productsAdded: productsAdded });
                        }
                    } else {
                         // The following will run if the user has already just purchased this product in the context of the current video playback
                        this.setState({ placementSuccess: "Added to cart" });
                        this.togglePlacementCheckoutState();
                    }
                }
            } else {
                this.props.history.push("/product?p=" + this.state.livePlacement.id);
            }
        } catch (err) {
            this.setState({ placementError: "Was not able to add product to cart"});
        }
    }

    async goBuy() {
        try {
            this.setState({ placementError: "" });
            if (this.state.livePlacement.styles.length == 1 && this.state.livePlacement.styles[0].options.length == 1) {
                let userShippingData = this.props.userShippingData;
                let productsAdded = this.state.productsAdded;
                if (this.state.livePlacement) {
                    let tempProduct = this.state.livePlacement;
                    if (productsAdded.indexOf(tempProduct.id) == -1) {
                        tempProduct.style = tempProduct.styles[0].descriptor;
                        tempProduct.option = tempProduct.styles[0].options[0].descriptor;
                        let data = await addOneProductToCart(tempProduct, userShippingData);
                        if (data.error) {
                            throw new Error;
                        } else {
                            this.setState({ placementSuccess: "Added to cart" });
                            productsAdded.push(tempProduct.id);
                            this.setState({ productsAdded: productsAdded });
                            this.togglePlacementCheckoutState();
                        }
                    } else {
                        this.setState({ placementSuccess: "Added to cart" });
                        this.togglePlacementCheckoutState();
                    }
                }
            } else {
                this.props.history.push("/product?p=" + this.state.livePlacement.id);
            }
        } catch (err) {
            console.log(err);
            this.setState({ placementError: "Was not able to checkout products"});
        }
    }

    togglePlacementCheckoutState() {
        try {
            if (!this.state.togglePlacementCheckout) {
                let fullHeight = this.placementRef.current.offsetHeight;
                this.setState({ togglePlacementCheckout: true }); // Show mini checkout module
                this.placementCheckoutRef.current.style.height = fullHeight + "px";
                this.miniCheckoutContainer.current.style.overflowY = "auto";
                this.miniCheckoutContainer.current.style.overflowX = "hidden";
                this.miniCheckoutContainer.current.style.maxHeight = (Number(fullHeight) - 60) + "px";
                this.miniCheckoutContainer.current.style.marginBottom = "5px";
                this.miniCheckoutContainer.current.style.paddingRight = "5px";
            } else {
                this.placementCheckoutRef.current.style.height = "0px";
                this.setState({ togglePlacementCheckout: false }); 
                this.miniCheckoutContainer.current.style.overflowY = "hidden";
                this.miniCheckoutContainer.current.style.overflowX = "hidden";
                this.miniCheckoutContainer.current.style.maxHeight = "auto"
                this.miniCheckoutContainer.current.style.marginBottom = "0px";
                this.miniCheckoutContainer.current.style.paddingRight = "0px";
            }
        } catch (err) {
            return false;
        }
    }

    enableSurvey = (e) => {
        try {
            this.setState({ surveyOn: true });
        } catch (err) {
            // Fail silently
        }
    }

    render() {
        let styles = {
            height: { height: this.resolvePlaceholderHeight() + "px"},
            maxheight: {maxHeight: '100%' },
            minHeight: {minHeight: '100%' }
        };
        let currPoster = this.resolveThumbnailSafely();
        let livePlacementPrice = this.resolveLivePlacementPrice();
        let buyChoice = this.resolveSingleProductBuyChoice();
        return (
            <div className="video-page-flex">
                <div id='videocontainer' className='main-video-container'>
                    <div className={this.state.adPlaying ? "video-container shaka-video-container ad-playing" : "video-container shaka-video-container"} ref={this.videoContainer}>
                        {
                            this.state.freeze ?
                                <button className={this.state.freeze ? "btn upload-button grey-dark-btn next-freeze-button hidden-visible" : "btn upload-button grey-dark-btn next-freeze-button hidden"} onClick={(e) => {this.endOfVideoPlay()}}>next &#10144;</button>
                                : null
                        }
                        <div className={this.state.freeze ? "freeze freeze-opaque" : "freeze"}>
                            {
                                this.state.freezeData ?
                                    this.state.freezeData.visible ?
                                        <div></div>
                                        : null
                                    : null
                            }
                        </div>
                        <div className="video-over-player-details">
                            <div className="video-over-player-title">{this.state.adPlaying ? this.state.adTitle : this.state.title }</div>
                            <div className="video-over-player-author">{this.state.adPlaying ? this.state.adAuthor : this.state.author}</div>
                            { 
                                this.state.adLink ? 
                                    <a href={"https://" + this.state.adLink} target="_blank" onClick={(e) => {this.serveAdLink(e)}}><div className="video-over-player-ad-link">{this.state.adLink ? this.state.adLink : null }</div></a>
                                : null
                            }
                        </div>
                        {
                            this.state.adPlaying ?
                                <button className="skip-ad-button" onClick={(e) => {this.skipAd(e)}}>{this.state.skipTime < 6 && this.state.skipTime > 0 ? this.state.skipTime : "Skip"}</button>
                                : null
                        }
                        <div className="fullscreen-video-chat-container friendchat-chat-container-open">
                            <div className="fullscreen-video-chats" ref={this.scrollRef}>
                                {
                                    this.props.friendConvoMirror ?
                                        this.props.friendConvoMirror.log ?
                                            this.props.friendConvoMirror.log.map((log, index) => {
                                                if (index > this.props.friendConvoMirror.log.length - 100) {
                                                    if (log.author == this.props.username) {
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
                                                }
                                            })
                                        : null
                                    : null
                                }
                            <div className={this.resolveRelevantTyping(this.props.typingMirror) ? this.resolveRelevantTyping(this.props.typingMirror).match(typingRegex)[2].length > 0 ? "chat-log chat-log-other typing-cell typing-cell-visible" : "chat-log chat-log-other typing-cell typing-cell" : "chat-log chat-log-other typing-cell"}
                            ref={tag => (this.typingRef = tag)}>
                                <div className='author-of-chat author-of-chat-other'>{ this.resolveRelevantTyping(this.props.typingMirror) ? this.resolveRelevantTyping(this.props.typingMirror).match(typingRegex)[1] : null }</div>
                                <div className={ this.resolveRelevantTyping(this.props.typingMirror) ? this.resolveRelevantTyping(this.props.typingMirror).match(typingRegex)[2].length < 35 ? 'content-of-chat' : 'content-of-chat typing-content-of-chat-long' : 'content-of-chat' }><div>{this.resolveRelevantTyping(this.props.typingMirror) ? this.resolveRelevantTyping(this.props.typingMirror).match(typingRegex)[2] : null}</div></div>
                            </div>
                        </div>
                        <form className="friend-chat-form friend-chat-form-closed friend-chat-form-open" onSubmit={this.interceptEnter}>
                            <span>
                            <TextareaAutosize className ="textarea-chat-autosize fixfocuscolor"
                            ref={tag => (this.inputRef = tag)} onKeyPress={this.interceptEnter} onChange={this.handleChange} />
                            <button className="friend-chat-submit friend-chat-submit-open prevent-open-toggle"
                            onClick={(e) => {this.interceptClick(e)}} type='submit' value='submit'><img className="sendarrow-icon" src={sendarrow} alt="sendarrow"></img></button>
                            </span>
                        </form>
                    </div>
                    <div className="hide-seek">&nbsp;</div>
                    <div className="lead-video-container">
                        <div className="overlay-interaction-container">
                            {
                                this.state.cloud ?
                                    <div className={this.state.livePlacementDisplay ? "placement-container-visibility placement-container-visibility-true" : "placement-container-visibility"}>
                                        <div className={!this.state.togglePlacementCheckout ? "placement-display-product placement-display-product-visible" : "placement-display-product placement-display-product-hidden"}>
                                            <div className={this.state.livePlacement ? this.state.livePlacement.position && this.state.livePlacementDisplay ? this.state.livePlacement.position == "right" && this.state.livePlacementDisplay ? "product-placement-in-video place-right placement-visible" : "product-placement-in-video place-left placement-visible" : "product-placement-in-video place-right placement-visible" : "product-placement-in-video placement-hide"} ref={this.placementRef}>
                                                <div className="product-placement-margin-container">
                                                    <h5 className="product-placement-product-title">{this.state.livePlacement ? this.state.livePlacement.name ? this.state.livePlacement.name : null : null}</h5>
                                                    <div class="product-placement-img-container">
                                                        <img src={this.state.livePlacement ? this.state.livePlacement.images ? this.state.livePlacement.images[0] ? this.state.livePlacement.images[0].url ? this.state.cloud + "/" + this.state.livePlacement.images[0].url : dummyproduct : dummyproduct : dummyproduct : dummyproduct} className="product-placement-main-img"></img>
                                                    </div>
                                                    <div className={livePlacementPrice ? "price-add-to-cart-container margin-top-bottom-2-5 flex" : ""}>
                                                        <div className="weight600 placement-price-display">{livePlacementPrice}</div>
                                                        <div className="transaction-button-pad">
                                                            <div className="transaction-button-container" onClick={(e)=>{this.addToCart()}}>
                                                                <Button className="transaction-button transaction-button-add-cart btn-center cart-button-space">{buyChoice}</Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="action-go-checkout-buttons-container">
                                                        <div>
                                                            <Button className="transaction-button transaction-button-checkout btn-center cart-button-space placement-action-buy-button" onClick={(e)=>{this.goBuy()}}>Buy Now</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={this.state.placementSuccess || this.state.placementError ? "placement-info-container placement-info-container-visible" : "placement-info-container"}>
                                                    <div className={this.state.placementSuccess ? this.state.placementSuccess.length > 0 ? "generic-success generic-success-active" : "generic-success generic-success-hidden" : "generic-success generic-success-hidden"}>
                                                        {
                                                            this.state.completeOrderId && this.state.placementSuccess == "Your order was completed. See order" ?
                                                                <Link to={{
                                                                    pathname: `/order?o=${this.state.completeOrderId}`
                                                                }}>{this.state.placementSuccess}</Link>
                                                                : this.state.placementSuccess
                                                        }
                                                        </div>
                                                    <div className={this.state.placementError ? this.state.placementError.length > 0 ? "err-status err-status-product-active err-status-active" : "err-status err-status-product err-status-hidden" : "err-status err-status-product err-status-hidden"}>{this.state.placementError}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={this.state.togglePlacementCheckout ? "placement-display-checkout-container placement-display-checkout-container-visible" : "placement-display-checkout-container"}>
                                            <div className={this.state.livePlacement ? this.state.livePlacement.position ? this.state.livePlacement.position == "right" ? "placement-display-checkout place-right" : "placement-display-checkout place-left" : "placement-display-checkout place-right" : "placement-display-checkout" } ref={this.placementCheckoutRef}>
                                                <div className="flex mini-checkout-clear-container">
                                                    <p className="weight600 prompt-basic-s mini-checkout-header">Checkout</p>
                                                    <span className="clear" onClick={(e) => {this.togglePlacementCheckoutState()}} title="Clear">&times;</span>
                                                </div>
                                                <div ref={this.miniCheckoutContainer} className="mini-checkout-video-container">
                                                    {
                                                        this.state.togglePlacementCheckout ?
                                                            <Suspense fallback={<div className="fallback-loading"></div>}>
                                                                <Checkout {...this.props} fullCheckout={true} minifiedCheckout={true} cloud={this.props.cloud} setCloud={this.props.setCloud} fetchCloudUrl={this.props.fetchCloudUrl} />
                                                            </Suspense>
                                                            : null
                                                            
                                                    }
                                                </div>
                                                <div className={this.state.placementSuccess || this.state.placementError ? "placement-info-container placement-info-container-visible" : "placement-info-container"}>
                                                    <div className={this.state.placementSuccess ? this.state.placementSuccess.length > 0 ? "generic-success generic-success-active" : "generic-success generic-success-hidden" : "generic-success generic-success-hidden"}>
                                                        {
                                                            this.state.completeOrderId ?
                                                                <Link to={{
                                                                    pathname: `/order?o=${this.state.completeOrderId}`
                                                                }}>{this.state.placementSuccess}</Link>
                                                                : <div>{this.state.placementSuccess}</div>
                                                        }
                                                    </div>
                                                    <div className={this.state.placementError ? this.state.placementError.length > 0 ? "err-status err-status-product-active err-status-active" : "err-status err-status-product err-status-hidden" : "err-status err-status-product err-status-hidden"}>{this.state.placementError}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    : null
                            }
                        </div>
                        <video className="shaka-video"
                        ref={this.videoComponent}
                        poster={currPoster}
                        style={Object.assign(styles.height, styles.maxheight)}
                        playsinline
                        />
                    </div>
                </div>
                <div className="video-stats-and-related-container">
                    <div className="video-stats-container">
                        <h2 className='watchpage-title'>{this.state.title}</h2>
                        <div className={this.state.adPlaying ? "video-stats-bar no-display" : "video-stats-bar"}>
                            <div className="video-stats-main-stats"><span>{this.state.views.length != "" ? this.state.views + (this.state.views == "1" ? " view" : " views") : null}</span><span className={this.state.title ? "video-stats-main-dot" : "hidden"}>&nbsp;•&nbsp;</span><span>{this.state.published != "" ? this.state.published : null}</span></div>
                            <div className="publisher-video-interact">
                                <div className="publisher-video-interact-block">
                                    <div className="favorite-click">
                                        <FontAwesomeIcon className="favorites-interact" icon={faHeart} color={ 'grey' } alt="favorite"/>
                                        <div>save</div>
                                    </div>
                                </div>
                                <div className='publisher-video-interact-block'>
                                    <div className="likes-click" onClick={(e) => {incrementLike.call(this, opposite(this.state.liked), this.state.mpd, "video", cookies.get('loggedIn'), this.state.fetched)}}>
                                        <FontAwesomeIcon className={this.state.liked ? "thumbsup-interact active-black" : "thumbsup-interact"} icon={faThumbsUp} color={ 'grey' } alt="thumbs up" />
                                        <div className={this.state.liked ? "active-black" : ""}>{roundNumber(this.state.likes)}</div>
                                    </div>
                                </div>
                                <div className='publisher-video-interact-block'>
                                    <div className="dislikes-click">
                                        <FontAwesomeIcon className={this.state.disliked ? "thumbsdown-interact active-black" : "thumbsdown-interact"}icon={faThumbsDown} color={ 'grey' } alt="thumbs down" onClick={(e) => {incrementDislike.call(this, opposite(this.state.disliked), this.state.mpd, "video", cookies.get('loggedIn'), this.state.fetched)}}/>
                                        <div className={this.state.disliked ? "active-black" : ""}>{roundNumber(this.state.dislikes)}</div>
                                    </div>
                                </div>
                                <FontAwesomeIcon className="share-interact" icon={faShare} color={ 'grey' } alt="share"/>
                                <div className="more-options-ellipsis-container">
                                    <div className='more-options-ellipsis' onClick={(e) => {showMoreOptions.call(this, e)}}>...</div>
                                    <ul className={this.props.moreOptionsVisible ? "more-options-ellipsis-dropdown prompt-basic dropdown-menu more-options-videopage-dropdown hidden hidden-visible" : "more-options-ellipsis-dropdown prompt-basic dropdown-menu more-options-videopage-dropdown hidden"} ref={this.moreOptions}>
                                        <li><Link to={{
                                            pathname: `${setResponseUrl('article', this.state.mpd, 'video')}`,
                                            props:{
                                                responseToMpd: `${this.state.mpd}`,
                                                responseToTitle: `${this.state.title}`,
                                                responseToType: "video"
                                            }
                                        }}>Write article response</Link></li>
                                        <li><Link to={{
                                            pathname:`${setResponseUrl('video', this.state.mpd, 'video')}`,
                                            props:{
                                                responseToMpd: `${this.state.mpd}`,
                                                responseToTitle: `${this.state.title}`,
                                                responseToType: "video"
                                            }
                                        }}>Publish video response</Link></li>
                                     </ul>
                                 </div>
                             </div>
                         </div>
                         {
                             this.state.survey ?
                                !this.state.surveySubmitted ?
                                    this.props.username ?
                                        <div>
                                            <div className={this.state.surveyOn ? "survey-res-container survey-on" : "survey-res-container" }>
                                                {
                                                    this.state.survey.length > 0 ?
                                                        this.state.survey.map((q, i) => 
                                                            <div>
                                                                <p className="prompt-basic border-radius-10 border-width-1 margin-bottom-5 padding-basic weight600 q-sizing q-video-pg">{q.q}</p>
                                                                {
                                                                    q.type == "radio" ? 
                                                                        q.options.map((op) => 
                                                                            <div class="flex q-flex">
                                                                                <input type="radio" name={resolveInputName(q.q)} value={op} className="border-radius-10 border-width-1 margin-bottom-2-5 padding-basic" onChange={(e) => {updateA.call(this, q, i, e)}} /><label for={op}>{op}</label>
                                                                            </div>
                                                                        ) 
                                                                        : q.type == "checkbox" ?
                                                                            q.options.map((op) => 
                                                                                <div class="flex q-flex">
                                                                                    <input type="checkbox" name={resolveInputName(q.q)} value={op} className="border-radius-10 border-width-1 margin-bottom-2-5 padding-basic" onChange={(e) => {updateA.call(this, q, i, e)}} /><label for={op}>{op}</label>
                                                                                </div>
                                                                            )
                                                                        : <input type="text" placeholder="Answer" className="border-radius-10 border-width-1 margin-bottom-2-5 padding-basic" onChange={(e) => {updateA.call(this, q, i, e)}} />
                                                                }
                                                            </div>
                                                        )
                                                        : null
                                                }
                                            </div>
                                            {
                                                !this.state.surveyOn ?
                                                    <Button className="btn grey-btn set-btn survey-btn" onClick={(e) => {this.enableSurvey(e)}}>Survey</Button>
                                                    : <Button className="btn red-btn set-btn survey-btn" onClick={(e) => {submitSurvey.call(this, e)}}>Submit</Button>
                                            }
                                            {
                                                this.state.surveyErr ?
                                                    <div className="err-status err-status-active">{this.state.surveyErr}</div>
                                                    : null
                                            }
                                        </div>
                                        : <div className="prompt-basic-s weight600 simple-sign-in-prompt">This channel made a survey for this video. Sign in to complete it</div>
                                    : <div className="prompt-basic-s weight600 simple-sign-in-prompt">You completed this survey</div>
                                : null
                         }
                         <div className='publisher-bar'>
                             <div className='publisher-info'>
                                 <div className="avatar-author-desc-videopage">
                                     <div className="publisher-avatar-col">
                                        <img className="publisher-avatar" src={this.returnAvatar()}></img>
                                    </div>
                                    <div className="video-desc-container">
                                        <div className={this.state.descriptionOpen ? "video-desc-col video-desc-col-open" : "video-desc-col"}>
                                            <span className='publisher-userandjoindate'>
                                                <NavLink exact to={"/profile?p=" + this.state.author}><span className='publisher-username'>{this.state.author}</span></NavLink>
                                                {
                                                    cookies.get('loggedIn') ?
                                                        cookies.get('loggedIn') != this.state.author ?
                                                            <span className={this.state.following ? 'publisher-followbutton publisher-followbutton-following btn upload-button save-data-button red-btn' : 'publisher-followbutton btn upload-button save-data-button red-btn'} onClick={(e)=>{this.followCheck()}}>{ this.state.following == false ? "follow" : "following" }</span>
                                                        : null
                                                    : null
                                                }
                                            </span>
                                            <div className='video-description-info'>{this.state.description}</div>
                                            <div className="video-tags-list">
                                                {this.state.tags ?
                                                    this.state.tags.map((tag, index) => (
                                                            <span className="video-tag-individual" key={index}>{tag}</span>
                                                    )) : null
                                                }
                                            </div>
                                        </div>
                                        {this.tallDescription() ?
                                            !this.state.descriptionOpen ?
                                                <button className="video-desc-expand-button" onClick={(e) => {this.openDescription(e, true)}}>expand</button>
                                                : <button className="video-desc-expand-button" onClick={(e) => {this.openDescription(e, false)}}>less</button>
                                            : null
                                        }
                                    </div>
                                </div>
                            </div>
                            {this.state.responseTo ?
                                this.state.responseTo.title ?
                                    <div className="response-to-link prompt-basic grey-out">
                                        response to <Link to={setResponseToParentPath.call(this)}>{this.state.responseTo.title}</Link>
                                    </div>
                                : null : null
                            }
                        </div>
                        <Suspense fallback={<div className="fallback-loading"></div>}>
                            <SocialVideoMeta friendsWatched={this.state.friendsWatched} cloud={this.state.cloud} />
                        </Suspense>
                        <div className='responses'>responses</div>
                        <div className={this.state.articleResponses ? this.state.articleResponses.length > 0 ? "articles-bar" : "articles-bar hidden no-margin-no-padding" : "articles-bar hidden no-margin-no-padding"}>
                            <div className='article-container-header'>{this.state.articleResponses ? this.state.articleResponses.length > 0 ? "Articles" : null : null}</div>
                            <div className='article-responses-container'>
                                {this.state.articleResponses ?
                                    this.state.articleResponses.length > 0 ?
                                        this.state.articleResponses.map((article, i) => {
                                            return (
                                                article.id && article ?
                                                <div className="article-container-videopage" key={i}>
                                                    <Link to={{
                                                        pathname:`/read?a=${article.id}`,
                                                        props:{
                                                            author: `${article.author}`,
                                                            body: `${article.body}`,
                                                            title: `${article.title}`,
                                                            id: `${article.id}`,
                                                            published: `${article.publishDate}`,
                                                            likes: `${article.likes}`,
                                                            dislikes: `${article.dislikes}`,
                                                            reads: `${article.reads}`,
                                                            responseToMpd: `${this.state.mpd}`,
                                                            responseToTitle: `${this.state.title}`,
                                                            responseToType: "video"
                                                        }
                                                    }}>
                                                        <div className="article-title-videopage">{shortenTitle(article.title)}</div>
                                                        <div className="article-body-videopage">{parseBody(article.body, 600, true)}</div>
                                                        <div className="article-stats-videopage">
                                                            <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="read-interact-s" icon={faBookOpen} color={ 'grey' } alt="read"/>{article.reads}</span><span>&nbsp;•&nbsp;</span>
                                                            <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsup-interact-s" icon={faThumbsUp} color={ 'grey' } alt="read"/>{article.likes}</span><span>&nbsp;•&nbsp;</span>
                                                            <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsdown-interact-s" icon={faThumbsDown} color={ 'grey' } alt="read"/>{article.dislikes}</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                                : null
                                            )
                                        })
                                    : null : null
                                }
                            </div>
                        </div>
                        <div className={this.state.videoResponses ? this.state.videoResponses.length > 0 ? "videos-bar" : "videos-bar hidden no-margin-no-padding" : "videos-bar hidden no-margin-no-padding"}>
                            <div className='video-container-header'>{this.state.videoResponses ? this.state.videoResponses.length > 0 ? "videos" : null : null}</div>
                            <div className='video-responses-container flex-grid videogrid'>
                                {
                                    this.state.videoResponses ?
                                        this.state.videoResponses.length > 0 ?
                                            this.state.videoResponses.map((video, i) => {
                                                return (
                                                    video.mpd && video ?
                                                        <div className="video-container-videopage videocontainer" key={i}>
                                                            <Link to={{
                                                                pathname:`/watch?v=${video.mpd}`,
                                                                props:{
                                                                    author: `${video.author}`,
                                                                    body: `${video.body}`,
                                                                    title: `${video.title}`,
                                                                    id: `${video.id}`,
                                                                    published: `${video.publishDate}`,
                                                                    likes: `${video.likes}`,
                                                                    dislikes: `${video.dislikes}`,
                                                                    views: `${video.views}`,
                                                                    responseToMpd: `${this.state.mpd}`,
                                                                    responseToTitle: `${this.state.title}`,
                                                                    responseToType: "video"
                                                                }
                                                            }}>
                                                                <img className={video.mpd ? video.mpd.length > 0 ? 'videothumb videothumb-videopage' : 'videothumb videothumb-videopage videothumb-placeholder ' : 'videothumb videothumb-videopage videothumb-placeholder'} src={video.thumbnailUrl ? this.state.cloud + "/" + video.thumbnailUrl + ".jpeg" : dummythumbnail}></img>
                                                                <div className="video-title-videopage mainvideotitle">{shortenTitle(video.title)}</div>
                                                                <div className="dash-video-bar-stats dash-video-bar-stats-videopage">
                                                                    <div className='video-author-videopage'>{video.author}</div>&nbsp;•&nbsp;<div className="video-publish-date-videopage">{convertDate(video.publishDate)}</div>
                                                                </div>
                                                                <div className="video-stats-videopage">
                                                                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="read-interact-s" icon={faEye} color={ 'grey' } alt="views"/>{video.views}</span><span>&nbsp;•&nbsp;</span>
                                                                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsup-interact-s" icon={faThumbsUp} color={ 'grey' } alt="read"/>{video.likes}</span><span>&nbsp;•&nbsp;</span>
                                                                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsdown-interact-s" icon={faThumbsDown} color={ 'grey' } alt="read"/>{video.dislikes}</span>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                        : null
                                                    )
                                                })
                                            : null 
                                        : null
                                }
                                </div>
                            </div>
                            <Suspense fallback={<div className="fallback-loading"></div>}>
                                <Comment cloud={this.state.cloud} media={this.state.mpd} mediaType="video" username={this.props.username} copyFriends={this.props.copyFriends} />
                            </Suspense>
                        </div>
                        <Suspense fallback={<div className="fallback-loading"></div>}>
                            <RelatedPanel content={this.state.mpd}
                                contentType='video'
                                title={this.state.title}
                                cloud={this.state.cloud}
                                secondary={true}
                                />
                        </Suspense>
                    </div>
                </div>
                <Suspense fallback={<div className="fallback-loading"></div>}>
                    <RelatedPanel content={this.state.mpd}
                        contentType='video'
                        title={this.state.title}
                        cloud={this.state.cloud}
                        />
                </Suspense>
            </div>
        )
    }
}
