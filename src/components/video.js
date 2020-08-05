import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import currentrooturl from '../url';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faHeart, faShare } from '@fortawesome/free-solid-svg-icons';
import heart from '../static/heart.svg'; import thumbsup from '../static/thumbsup.svg'; import thumbsdown from '../static/thumbsdown.svg'; import share from '../static/share.svg'; import minipostpreviewbanner from '../static/minipostbannerblack.png';
const cookies = new Cookies();
const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');

export default class Video extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: "", author: "", views: "", published: "", description: "", tags: "", mpd: "", mpdCloudAddress: "", viewCounted: false, viewInterval: ""
        }
        this.videoContainer = new React.createRef();
        this.videoComponent = new React.createRef();
        this.player = new React.createRef();
        this.progress = new EventEmitter();
    }

    async componentDidMount() {
        this.setUpState();
        // Install polyfills to patch browser incompatibilies
        shaka.polyfill.installAll();
        if (this.props.location.pathname == "/watch") { // Runs if visitor loads directly from Url
            if (this.props.location.search) {
                if (this.props.location.search.match(/([?v=]*)([a-zA-Z0-9].*)/)) {
                    this.initPlayer(await this.fetchVideoPageData(this.props.location.search.match(/([?v=]*)([a-zA-Z0-9].*)/)[2]) + "-mpd.mpd");
                    this.setState({ mpd: this.props.location.search.match(/([?v=]*)([a-zA-Z0-9].*)/)[2]});
                }
            }
        } else if (this.props.location.pathname) { // Runs if visitor loads from clicking video on website
            if (this.props.location.pathname.match(/([/watch?v=]*)([a-zA-Z0-9].*)/)) {
                this.initPlayer(await this.fetchVideoPageData(this.props.location.pathname.match(/([/watch?v=]*)([a-zA-Z0-9].*)/)[2]) + "-mpd.mpd");
                this.setState({ mpd: this.props.location.pathname.match(/([/watch?v=]*)([a-zA-Z0-9].*)/)[2]});
            }
        }
    }

    componentWillUnmount() {
        // Untested. Supposd to remove event listeners from player when user leaves page
        if (this.player) {
            if (this.player.current) {
                this.player.current.removeEventListener('buffering');
                this.player.current.removeEventListener('error');
            }
        }
        this.endViewCountInterval();
    }

    /** Runs when user loads page by clicking from another page. Will not function when page is loaded from direct link or reload */
    setUpState() {
        if (this.props.location) {
            if (this.props.location.props) {
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
            }
        }

    }

    /* Entire fetch request returns object containing video object, relevantVideos array of objects, articleResponses array of objects, videoResponses array of objects. Video object contains mpd, author, title, description, tags, published, likes, dislikes, views */
    async fetchVideoPageData(rawMpd) {
        const mpdUrl = await fetch(currentrooturl + 'm/fetchvideopagedata', {
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
        .then(function(response) {
            return response.json();
        })
        .then((result) => {
            console.log(result);
            /* Sets all video document related data */
            for (const [key, value] of Object.entries(result.video)) {
                if (key == "published") {
                    this.setState(this.setStateDynamic(key, this.roundTime(value)));
                } else if (value) {
                    this.setState(this.setStateDynamic(key, value));
                } else if (!value && key == "views" || !value && key == "likes" || !value && key == "dislikes") {
                    this.setState(this.setStateDynamic(key, value));
                }
            }
            if (result.video.mpd) {
                return result.video.mpd;
            } else {
                return false;
            }
            return false;
        })
        return mpdUrl;
    }

    async incrementView() {
        if (this.state.mpd) {
            let mpd = this.state.mpd;
            await fetch(currentrooturl + 'm/incrementview', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        mpd
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

    /* Dynamically sets state when given the key/value location and the name of the key name to be used */
    setStateDynamic(key, value) {
        return { [key]: value };
    }

    initPlayer(manifest) {
        this.setState({ mpdCloudAddress: manifest });
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

                // Listen for errors
                player.addEventListener('error', this.onErrorEvent);

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
            }).catch(this.onError);


        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }
    }

    /** Determines if atleast x (25%) amount of video has been watched to determine view increment fetch request to database */
    viewCountedInterval() {
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
                        }
                    }
                }
            }, 5000);
            this.setState({ viewInterval: viewInterval });
        }
    }

    /** Ends view count interval and clears state record of interval */
    endViewCountInterval() {
        if (this.state.viewInterval) {
            clearInterval(this.state.viewInterval);
            this.setState({ viewInterval: "" });
        }
    }

    /* Simplifies time format 00/00/0000, 0:00:00 AM to 00/00/00, 0:00 am */
    roundTime(time) {
        if (time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)) {
            if (time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[1] && time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[2]) {
                return time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[1] + " " + time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[2].toLowerCase();
            } else {
                return time;
            }
        } else {
            return time;
        }
    }

    roundNumber(number) {
        return number;
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
                                <div>{this.roundNumber(this.state.likes)}</div>
                            </div>
                        </div>
                        <div className='publisher-video-interact-block'>
                            <div className="dislikes-click">
                                <FontAwesomeIcon className="thumbsdown-interact" icon={faThumbsDown} color={ 'grey' } alt="thumbs down"/>
                                <div>{this.roundNumber(this.state.dislikes)}</div>
                            </div>
                        </div>
                        <FontAwesomeIcon className="share-interact" icon={faShare} color={ 'grey' } alt="share"/>
                        <div className='more-options-ellipsis'>...</div>
                    </div>
                </div>
                <div className='publisher-bar'>
                    <div className='publisher-info'>
                        <div className="publisher-avatar-col">
                        <img className="publisher-avatar" src={require("../static/spacexavatar.jpg")}></img>
                        </div>
                        <div className="video-desc-col">
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
                    </div>
                </div>
            </div>
        )
    }
}
