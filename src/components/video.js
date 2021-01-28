import React, { Component } from 'react';
import RelatedPanel from './relatedpanel.js';
import Cookies from 'universal-cookie';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import currentrooturl from '../url';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faHeart, faShare, faBookOpen, faEye } from '@fortawesome/free-solid-svg-icons';
import heart from '../static/heart.svg'; import thumbsup from '../static/thumbsup.svg'; import thumbsdown from '../static/thumbsdown.svg'; import share from '../static/share.svg'; import minipostpreviewbanner from '../static/minipostbannerblack.png'; import '../static/expand-video.png'; import '../static/minimize-video.png';
import encryptionSchemePolyfills from 'eme-encryption-scheme-polyfill';
import { roundTime, setStateDynamic, roundNumber, shortenTitle, convertDate, opposite, get } from '../methods/utility.js';
import { setResponseToParentPath, incrementLike, incrementDislike, showMoreOptions } from '../methods/context.js';
import { updateHistory } from '../methods/history.js';
import parseBody from '../methods/htmlparser.js';
import dummythumbnail from '../static/greythumb.jpg';
import dummyavatar from '../static/greyavatar.jpg';
import { setResponseUrl } from '../methods/responses.js';

import { cookies } from '../App.js';
const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');
const shakaAddonButtons = require('../addons/shaka/addonbuttons.js');

export default class Video extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "", author: "", views: "", published: "", description: "", tags: "", mpd: "", mpdCloudAddress: "", viewCounted: false, viewInterval: "", descriptionOpen: false, articleResponses: [], videoResponses: [], relevant: [], responseTo: {}, liked: false, disliked: false, likes: 0, dislikes: 0, following: false, cloud: ""
        }
        this.videoContainer = new React.createRef();
        this.videoComponent = new React.createRef();
        this.player = new React.createRef();
        this.controls = new React.createRef();
        this.moreOptions = new React.createRef();
        this.progress = new EventEmitter();
    }

    componentDidMount = async () => {
        this.setUpState();
        this.loadPage();
        if (cookies.get('contentDelivery')) {
            this.setState({ cloud: cookies.get('contentDelivery')});
        }
        if (cookies.get('video-wide') == "true") {
            if (document.getElementsByClassName('maindash')[0]) {
                document.getElementsByClassName('maindash')[0].classList.add('maindash-video-wide');
            }
        }
    }

    componentWillUnmount() {
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
    }

    loadPage = async (reload = false) => {
        if (reload) {
            this.initPlayer(await this.fetchVideoPageData(reload) + "-mpd.mpd");
            this.setState({ mpd: reload});
        } else {
            if (this.props.location.pathname == "/watch") { // Runs if visitor loads directly from Url
                if (this.props.location.search) {
                    if (this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)) {
                        if (this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)[1]) {
                            this.initPlayer(await this.fetchVideoPageData(this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)[1]) + "-mpd.mpd");
                            this.setState({ mpd: this.props.location.search.match(/\?v=([a-zA-Z0-9].*)/)[1]});
                        }
                    }
                }
            } else if (this.props.location.pathname) { // Runs if visitor loads from clicking video on website
                if (this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)) {
                    if (this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)[2]) {
                        this.initPlayer(await this.fetchVideoPageData(this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)[2]) + "-mpd.mpd");
                        this.setState({ mpd: this.props.location.pathname.match(/(\/watch\?v=)([a-zA-Z0-9].*)/)[2]});
                    }
                }
            }
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
                    this.setState({ published: this.props.location.props.published });
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
    fetchVideoPageData = async (rawMpd) => {
        let user = "";
        if (cookies.get('loggedIn')) {
            user = cookies.get('loggedIn');
        }
        try {
            const videoData = await fetch(currentrooturl + 'm/fetchvideopagedata', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    rawMpd, user
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                console.log(result);
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
                        } else if (value) {
                            this.setState(setStateDynamic(key, value));
                        } else if (!value && key == "views" || !value && key == "likes" || !value && key == "dislikes") {
                            this.setState(setStateDynamic(key, value));
                        }
                    }
                }
                if (result) {
                    return result;
                }
                return false;
            });
            if (videoData.video.mpd) {
                this.setState({ articleResponses: videoData.articleResponses, responseTo: videoData.responseTo, videoResponses: videoData.videoResponses });
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
        } catch (err) {
            // Componenent unmounted during method
            console.log(err);
            return false;
        }
        return false;
    }

    // Increments view on video by one on backend and visually on front end
    async incrementView() {
        if (this.state.mpd && !this.state.viewCounted) {
            let user = "";
            if (cookies.get('loggedIn')) {
                user = cookies.get('loggedIn');
            }
            let mpd = this.state.mpd;
            await fetch(currentrooturl + 'm/incrementview', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        mpd, user
                    })
                })
                .then(function(response) {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        this.setState({ viewCounted: true });
                        let viewCount = ++this.state.views;
                        this.setState({ views: viewCount });
                    }
                })
        }
    }

    /* Initialize player and player error handlers */
    initPlayer(manifest) {
        this.setState({ mpdCloudAddress: manifest });
        // Install polyfills to patch browser incompatibilies
        shaka.polyfill.installAll();
        encryptionSchemePolyfills.install();
        // Check browser support
        if (shaka.Player.isBrowserSupported()) {
            if (!manifest) {
                manifest = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';
            }
            let manifestUri = manifest;

            const video = this.videoComponent.current;
            const videoContainer = this.videoContainer.current;

            shakaAddonButtons.nextSeries();
            // Initialize player
            let player = new shaka.Player(video);
            this.player = player;

            // UI custom json
            const uiConfig = {};
            uiConfig['controlPanelElements'] = ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'overflow_menu', 'theatreButton', 'fullscreen'];

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
                    setTimeout((event) => {
                        if (player.isBuffering()) {
                            if (document.getElementsByClassName("shaka-spinner")[0]) {
                                document.getElementsByClassName("shaka-spinner")[0].classList.remove("hidden");
                                setTimeout(() => {
                                    if (!player.isBuffering()) {
                                        if (document.getElementsByClassName("shaka-spinner")[0]) {
                                            document.getElementsByClassName("shaka-spinner")[0].classList.add("hidden");
                                        }
                                    }
                                }, 10000);
                            }
                        } else {
                            if (document.getElementsByClassName("shaka-spinner")[0]) {
                                document.getElementsByClassName("shaka-spinner")[0].classList.add("hidden");
                            }
                        }
                    }, 1000);
                });
                // Ensures that check counted interval is functioning 
                video.addEventListener('playing', (event) => {
                    if (this.videoComponent) {
                        this.viewCountedInterval();    
                    }
                });
            }

            // Try to load a manifest Asynchronous
            player.load(manifestUri).then(() => {
                if (this.videoComponent) {
                    if (this.videoComponent.current) {
                        this.videoComponent.current.play();
                        this.viewCountedInterval();
                    }
                }
                if (this.player) {
                    updateHistory.call(this);
                }
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
            }).catch((err) => {
                console.log(err);    
            });;


        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }
    }

    /** Determines if atleast 25% or 45 seconds of video has been watched to determine view increment fetch request to database */
    viewCountedInterval() {
        let refreshIntervalRate = () => { // Returns a appropriate interval rate to accomodate for shorter videos so user does not leave page before view is incremented. Otherwise really short videos could be adversely effected.
            try {
                if (get(this, 'videoComponent.current.played.end')) {
                    if (this.videoComponent.current.duration > 60) {
                        return 5000;
                    } else if (this.videoComponent.current.duration > 10) {
                        return 3000;
                    } else {
                        return 1650; // Accomodate for really short videos below 10 seconds
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
                            // console.log(totalTime, this.videoComponent.current.duration);
                            if (totalTime / this.videoComponent.current.duration > 0.25 || totalTime > 45) { // Increment video view if user has watched more than 25% of the video or the totalTime watched is more than 45 seconds
                                this.incrementView();
                                this.endViewCountInterval();
                            }
                        }
                    }
                }, refreshIntervalRate());
                this.setState({ viewInterval: viewInterval });
            }
        } catch (err) {
            // Set interval may not have ran due to window not being available. User left page
        }
    }

    /** Ends view count interval and clears state record of interval */
    endViewCountInterval() {
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

    render() {
        return (
            <div className="video-page-flex">
            <div id='videocontainer' className='main-video-container'>
                <div className="video-container" ref={this.videoContainer}>
                    <video className="shaka-video"
                    ref={this.videoComponent}
                    poster={minipostpreviewbanner}
                    />
                </div>
                <div className="video-stats-and-related-container">
                    <div className="video-stats-container">
                        <h2 className='watchpage-title'>{this.state.title}</h2>
                        <div className="video-stats-bar">
                            <div className="video-stats-main-stats">{this.state.views.length != "" ? this.state.views + (this.state.views == "1" ? " view" : " views") : null}{this.state.published != "" ? " • " + this.state.published : null}</div>
                            <div className='publisher-video-interact'>
                                <div className="publisher-video-interact-block">
                                    <div className="favorite-click">
                                        <FontAwesomeIcon className="favorites-interact" icon={faHeart} color={ 'grey' } alt="favorite"/>
                                        <div>save</div>
                                    </div>
                                </div>
                                <div className='publisher-video-interact-block'>
                                    <div className="likes-click" onClick={(e) => {incrementLike.call(this, opposite(this.state.liked), this.state.mpd, "video", cookies.get('loggedIn'))}}>
                                        <FontAwesomeIcon className={this.state.liked ? "thumbsup-interact active-black" : "thumbsup-interact"} icon={faThumbsUp} color={ 'grey' } alt="thumbs up" />
                                        <div className={this.state.liked ? "active-black" : ""}>{roundNumber(this.state.likes)}</div>
                                    </div>
                                </div>
                                <div className='publisher-video-interact-block'>
                                    <div className="dislikes-click">
                                        <FontAwesomeIcon className={this.state.disliked ? "thumbsdown-interact active-black" : "thumbsdown-interact"}icon={faThumbsDown} color={ 'grey' } alt="thumbs down" onClick={(e) => {incrementDislike.call(this, opposite(this.state.disliked), this.state.mpd, "video", cookies.get('loggedIn'))}}/>
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
                                                            <span className='publisher-followbutton' onClick={(e)=>{this.followCheck()}}>{ this.state.following == false ? "follow" : "unfollow" }</span>
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
                                {this.state.videoResponses ?
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
                                        : null : null
                                    }
                                </div>
                            </div>
                        </div>
                        <RelatedPanel content={this.state.mpd}
                            contentType='video'
                            title={this.state.title}
                            cloud={this.state.cloud}
                            secondary={true}
                            />
                    </div>
                </div>
                <RelatedPanel content={this.state.mpd}
                    contentType='video'
                    title={this.state.title}
                    cloud={this.state.cloud}
                    />
            </div>
        )
    }
}
