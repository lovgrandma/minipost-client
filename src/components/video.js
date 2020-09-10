import React, { Component } from 'react';
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
import heart from '../static/heart.svg'; import thumbsup from '../static/thumbsup.svg'; import thumbsdown from '../static/thumbsdown.svg'; import share from '../static/share.svg'; import minipostpreviewbanner from '../static/minipostbannerblack.png';
import encryptionSchemePolyfills from 'eme-encryption-scheme-polyfill';
import { roundTime, setStateDynamic, roundNumber, shortenTitle, convertDate } from '../methods/utility.js';
import { setResponseToParentPath } from '../methods/context.js';
import { updateHistory } from '../methods/history.js';
import parseBody from '../methods/htmlparser.js';
import dummythumbnail from '../static/greythumb.jpg';
import dummyavatar from '../static/greyavatar.jpg';

const cookies = new Cookies();
const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');

export default class Video extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "", author: "", views: "", published: "", description: "", tags: "", mpd: "", mpdCloudAddress: "", viewCounted: false, viewInterval: "", descriptionOpen: false, articleResponses: [], videoResponses: [], relevant: [], responseTo: {}
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
    }

    componentWillUnmount() {
        // Untested. Supposed to remove event listeners from player when user leaves page
        if (this.player) {
            if (this.player.removeEventListener) {
                this.player.removeEventListener('buffering');
                this.player.removeEventListener('error');
            }
        }
        this.endViewCountInterval();
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
        try {
            const videoData = await fetch(currentrooturl + 'm/fetchvideopagedata', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    rawMpd
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                console.log(result);
                /* Sets all video document related data */
                for (const [key, value] of Object.entries(result.video)) {
                    if (this.state) {
                        if (key == "published") {
                            this.setState(setStateDynamic(key, roundTime(value)));
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
                return videoData.video.mpd;
            }
        } catch (err) {
            // Componenent unmounted during method
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

            // Initialize player
            let player = new shaka.Player(video);
            this.player = player;

            // UI custom json
            const uiConfig = {};
            uiConfig['controlPanelElements'] = ['play_pause', 'time_and_duration', 'spacer', 'overflow_menu', 'mute', 'volume', 'fullscreen'];

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
            }).catch(this.onError);


        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }
    }

    /** Determines if atleast 25% or 45 seconds of video has been watched to determine view increment fetch request to database */
    viewCountedInterval() {
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
                            if (totalTime / this.videoComponent.current.duration > 0.25) {
                                this.incrementView();
                                this.endViewCountInterval();
                            } else if (totalTime > 45) {
                                this.incrementView();
                                this.endViewCountInterval();
                            }
                        }
                    }
                }, 5000);
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
        }
    }

    openDescription(e, boolean) {
        this.setState({ descriptionOpen: boolean });
    }

    showMoreOptions(e, show) {
        if (this.moreOptions.current) {
            if (show) {
                this.moreOptions.current.classList.add("hidden-visible");
            } else {
                this.moreOptions.current.classList.remove("hidden-visible");
            }
        }
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

    render() {
        return (
            <div id='videocontainer'>
                <div className="video-container video-container-preview" ref={this.videoContainer}>
                    <video className="shaka-video"
                    ref={this.videoComponent}
                    poster={minipostpreviewbanner}
                    />
              </div>
                <h2 className='watchpage-title'>{this.state.title}</h2>
                <div className="video-stats-bar">
                    <div className="video-stats-main-stats">{this.state.views.length != "" ? this.state.views + (this.state.views == "1" ? " view" : " views") : null}{this.state.published != "" ? " • " + this.state.published : null}</div>
                    <div className='publisher-video-interact'>
                        <div className="publisher-video-interact-block">
                            <div className="favorite-click">
                                <FontAwesomeIcon className="favorites-interact" icon={faHeart} color={ 'grey' } alt="favorite"/>
                                <div>favorite</div>
                            </div>
                        </div>
                        <div className='publisher-video-interact-block'>
                            <div className="likes-click">
                                <FontAwesomeIcon className="thumbsup-interact" icon={faThumbsUp} color={ 'grey' } alt="thumbs up"/>
                                <div>{roundNumber(this.state.likes)}</div>
                            </div>
                        </div>
                        <div className='publisher-video-interact-block'>
                            <div className="dislikes-click">
                                <FontAwesomeIcon className="thumbsdown-interact" icon={faThumbsDown} color={ 'grey' } alt="thumbs down"/>
                                <div>{roundNumber(this.state.dislikes)}</div>
                            </div>
                        </div>
                        <FontAwesomeIcon className="share-interact" icon={faShare} color={ 'grey' } alt="share"/>
                        <div className="more-options-ellipsis-container" onMouseOver={(e) => {this.showMoreOptions(e, true)}} onMouseOut={(e) => {this.showMoreOptions(e, false)}}>
                            <div className='more-options-ellipsis'>...</div>
                            <ul className='more-options-ellipsis-dropdown prompt-basic dropdown-menu more-options-videopage-dropdown hidden' ref={this.moreOptions}>
                                <li><Link to={{
                                    pathname:`/writearticle`,
                                    props:{
                                        responseToMpd: `${this.state.mpd}`,
                                        responseToTitle: `${this.state.title}`,
                                        responseToType: "video"
                                    }
                                }}>Write article response</Link></li>
                                <li><Link to={{
                                    pathname:`/upload`,
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
                                <img className="publisher-avatar" src={require("../static/spacexavatar.jpg")}></img>
                            </div>
                            <div className="video-desc-container">
                                <div className={this.state.descriptionOpen ? "video-desc-col video-desc-col-open" : "video-desc-col"}>
                                    <span className='publisher-userandjoindate'>
                                        <span className='publisher-username'>{this.state.author}</span>
                                        <span className='publisher-followbutton'>follow</span>
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
                <div className='articles-bar'>
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
                <div className='videos-bar'>
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
                                                    <img className={video.mpd ? video.mpd.length > 0 ? 'videothumb videothumb-videopage' : 'videothumb videothumb-videopage videothumb-placeholder ' : 'videothumb videothumb-videopage videothumb-placeholder'} src={dummythumbnail}></img>
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
        )
    }
}
