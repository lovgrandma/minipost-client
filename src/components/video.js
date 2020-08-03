import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { Player } from 'video-react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import currentrooturl from '../url';
import heart from '../static/heart.svg'; import thumbsup from '../static/thumbsup.svg'; import thumbsdown from '../static/thumbsdown.svg'; import share from '../static/share.svg'; import minipostpreviewbanner from '../static/minipostbannerblack.png';
const cookies = new Cookies();
const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');


export default class Video extends Component {
    constructor(props) {
        super(props);
        this.state = {
            title: ""
        }
        this.videoContainer = new React.createRef();
        this.videoComponent = new React.createRef();
        this.progress = new EventEmitter();
    }

    async componentDidMount() {
        // Install polyfills to patch browser incompatibilies
        shaka.polyfill.installAll();
        console.log(this.props.location);
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

            // Try to load a manifest Asynchronous
            player.load(manifestUri).then(() => {
                console.log(this.videoComponent);
                document.getElementsByClassName('shaka-video')[0].play();
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
                <div className='publisher-bar'>
                    <div className='publisher-info'>
                        <img className="publisher-avatar" src={require("../static/spacexavatar.jpg")}></img>
                        <span className='publisher-userandjoindate'>
                            <span>
                                <span className='publisher-username'>{this.getAuthor()}</span>
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
}
