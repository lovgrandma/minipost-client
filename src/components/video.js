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
            title: "", author: "", views: "", published: "", description: "", tags: "", mpdCloudAddress: "", viewed: false
        }
        this.videoContainer = new React.createRef();
        this.videoComponent = new React.createRef();
        this.progress = new EventEmitter();
    }

    async componentDidMount() {
        this.setUpState();
        // Install polyfills to patch browser incompatibilies
        shaka.polyfill.installAll();
        if (this.props.location.pathname == "/watch") { // Runs if visitor loads directly from Url
            if (this.props.location.search) {
                if (this.props.location.search.match(/([?v=]*)([a-zA-Z0-9].*)/)) {
                    this.initPlayer(await this.fetchCloudFrontUrl(this.props.location.search.match(/([?v=]*)([a-zA-Z0-9].*)/)[2]) + "-mpd.mpd");
                }
            }
        } else if (this.props.location.pathname) { // Runs if visitor loads from clicking video on website
            if (this.props.location.pathname.match(/([/watch?v=]*)([a-zA-Z0-9].*)/)) {
                this.initPlayer(await this.fetchCloudFrontUrl(this.props.location.pathname.match(/([/watch?v=]*)([a-zA-Z0-9].*)/)[2]) + "-mpd.mpd");
            }
        }
    }

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
    async fetchCloudFrontUrl(rawMpd) {
        const mpdUrl = await fetch(currentrooturl + 'm/fetchCloudfrontUrl', {
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
            if (result.querystatus) {
                return result.querystatus;
            } else {
                return false;
            }
            return false;
        })
        return mpdUrl;
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

            // UI custom json
            const uiConfig = {};
            uiConfig['controlPanelElements'] = ['play_pause', 'spacer', 'mute', 'volume', 'time_and_duration', 'fullscreen', 'overflow_menu', , ];

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
                console.log(this.videoComponent);
                if (document.getElementsByClassName('shaka-video')[0]) {
                    document.getElementsByClassName('shaka-video')[0].play();
                }
            }).catch(this.onError);


        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }
    }

    getTitle() {
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.title) {
                    return this.props.location.props.title;
                }
            }
        } else {
            return this.state.title;
        }
    }

    getAuthor() {
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.author) {
                    return this.props.location.props.author;
                }
            }
        } else {
            return this.state.author;
        }
    }

    getViews() {
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.views) {
                    return this.props.location.props.views;
                }
            }
        } else {
            return this.state.views;
        }
    }

    getPublishDate() {
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.published) {
                    return this.props.location.props.published;
                }
            }
        } else {
            return this.state.published;
        }
    }

    getDescription() {
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.description) {
                    return this.props.location.props.description;
                }
            }
        } else {
            return this.state.description;
        }
    }
     // TODO integrate videojs
    render() {
        return (
            <div id='videocontainer'>
                <div className="video-container video-container-preview" ref={this.videoContainer}>
                    <video className="shaka-video"
                    ref={this.videoComponent}
                    poster={minipostpreviewbanner}
                    />
              </div>
                <h2 className='watchpage-title'>{this.getTitle()}</h2>
                <div className="video-stats-bar">
                    <div className="video-stats-main-stats">{this.state.views.length != "" ? this.state.views + " views" : null}{this.state.published != "" ? " • " + this.state.published : null}</div>
                    <div className='publisher-video-interact'>
                        <div className="publisher-video-interact-block">
                            <FontAwesomeIcon className="favorites-interact" icon={faHeart} color={ 'grey' } alt="favorite"/>
                            <div>favorite</div>
                        </div>
                        <div className='publisher-video-interact-block'>
                            <FontAwesomeIcon className="thumbsup-interact" icon={faThumbsUp} color={ 'grey' } alt="thumbs up"/>
                            <div>432K</div>
                        </div>
                        <div className='publisher-video-interact-block'>
                            <FontAwesomeIcon className="thumbsdown-interact" icon={faThumbsDown} color={ 'grey' } alt="thumbs down"/>
                            <div>12K</div>
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
                                            <span className="video-tag-individual">{tag}</span>
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
