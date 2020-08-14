import React, {Component} from 'react';
import Cookies from 'universal-cookie';
import axios from 'axios';
import currentrooturl from '../url';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import io from "socket.io-client";
import {v4 as uuidv4 } from 'uuid';
import minipostpreviewbanner from '../static/minipostbannerblack.png';

const cookies = new Cookies();
const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');
let socket;

export default class Upload extends Component { // ulc upload component
    constructor(props) {
        super(props);
        this.state = {
            progress: 0, videoPreview: "", tags: [], placeholderTitle: "", placeholderDesc: "", socket: null, dots: "", currentErr: "", videoId: '', beginUpload: false, publishing: false, dotInterval: "", uploadInfo: "", uploadInfoInterval: ""
        }
        this.upload = React.createRef();
        this.progressBar = React.createRef();
        this.tagsInput = React.createRef();
        this.titleIn = React.createRef();
        this.descIn = React.createRef();
        this.progress = new EventEmitter();
        this.videoContainer = new React.createRef();
        this.videoComponent = new React.createRef();
        this.onErrorEvent = this.onErrorEvent.bind(this);
		this.onError = this.onError.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.uploadMessages = {
            takeAWhile: 'Depending on the size of your video, uploading can take a while',
            whileYoureGone: 'When your video is converting you can visit other pages and watch videos, we\'ll take care of this while you\'re gone',
            copyright: 'We have a strict policy on posting stolen content. If you suspect your video does not satisfy Fair Use requirements, please revisit our policy'
        }
    }

    componentDidMount() {
        this.getSocket(0, 150);

        /* Progress event for uploading video */
        this.progress.on('progress', (percent, data) => {
            if (this.state.percent != percent) {
                this.setState({progress: percent});
            }
            if (this.progressBar.current) {
                this.progressBar.current.style.width = Math.round(percent) + "%";
            }
            if (data) {
                if (this.state.videoPreview != data.name) {
                    this.loadPlayer(data);
                }
            }
        });

        // Install polyfills to patch browser incompatibilies
        shaka.polyfill.installAll();

        this.dotsAnim();
        this.getUserVideos();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.mpd == "") {
            if (this.props.mpd.length > 0) {
                this.initPlayer(this.props.mpd);
            }
        }
        if (prevProps.errStatus != this.props.errStatus && this.props.errStatus.length > 0) { // Reset page after receiving an error
            this.resetPage();
        }

        if (prevProps && this.props) {
            if (prevProps.uploadStatus && this.props.uploadStatus) {
                if (prevProps.uploadStatus != this.props.uploadStatus && this.props.uploadStatus != "video ready") {
                    this.setState({uploadInfo: this.randomProperty(this.uploadMessages) });
                    if (this.state.uploadInfoInterval.length <= 0) {
                        let infoIntervalId = setInterval = (() => {
                            this.setState({uploadInfo: this.randomProperty(this.uploadMessages) });
                            if (this.state.uploadStatus == "video ready") {
                                clearInterval(this.state.uploadInfoInterval);
                                this.setState({ uploadInfo: "" });
                            }
                        }, 15000);
                        this.setState({ uploadInfoInterval: infoIntervalId });
                        this.setState({ uploadInfo: "" });
                    }
                }
            }
        }


    }

    randomProperty(obj) {
        if (obj) {
            let keys = Object.keys(obj);
            return obj[ keys[ keys.length * Math.random() << 0]];
        } else {
            return null;
        }
    }

    componentWillUnmount() {
        if (this.state) {
            if (this.state.dotInterval) {
                if (this.state.dotInterval.length > 0) {
                    clearInterval(this.state.dotInterval); // Clear "dots" state updating interval to prevent memory leak
                }
            }
            if (this.state.uploadInfoInterval) {
                if (this.state.uploadInfoInterval.length > 0) {
                    clearInterval(this.state.uploadInfoInterval);
                }
            }
        }
    };

    /* Parses all key presses for component elements */
    onKeyPress(e) {
        if (this.tagsInput.current == document.activeElement) {
            if (e.key == "," || e.keyCode == 13) {
                e.preventDefault();
                if (this.tagsInput.current.value.length > 0) {
                    let tempTags = this.state.tags;
                    if (tempTags.indexOf(this.tagsInput.current.value) < 0) {
                        tempTags.push(this.tagsInput.current.value);
                        this.setState({ tags : tempTags });
                        this.tagsInput.current.value = "";
                        if (this.tagsInput.current.value == ",") {
                            this.tagsInput.current.value = "";
                        }
                    } else {
                        this.tagsInput.current.value = "";
                        if (this.tagsInput.current.value == ",") {
                            this.tagsInput.current.value = "";
                        }
                    }
                }
            }
        }
    }

    /* Deletes tag when clicked on */
    deleteTag(e) {
        let tempTags = this.state.tags;
        for (let i = 0; i < tempTags.length; i++) {
            if (e.target) {
                if (e.target.parentNode) {
                    if (e.target.parentNode.textContent) {
                        if (e.target.parentNode.textContent == tempTags[i]) {
                            tempTags.splice(i, 1);
                        }
                    }
                }
            }
        }
        this.setState({ tags: tempTags });
    }

    /* Updates visual appearance of title on preview view */
    updateTitle(e, element) {
        if (element == "title") {
            if (this.titleIn.current) {
                this.setState({ placeholderTitle: this.titleIn.current.value });
            }
        } else if (element == "desc") {
            if (this.descIn.current) {
                this.setState({ placeholderDesc: this.descIn.current.value.replace(/br/g, "\n") })
            }
        }
    }

    /* Returns the current date to show in preview */
    getDate() {
        let today = new Date();
        let month = "";
        switch (today.getMonth()) {
            case 0: month = "january";
                break;
            case 1: month = "february";
                break;
            case 2: month = "march";
                break;
            case 3: month = "april";
                break;
            case 4: month = "may";
                break;
            case 5: month = "june";
                break;
            case 6: month = "july";
                break;
            case 7: month = "august";
                break;
            case 8: month = "september";
                break;
            case 9: month = "october";
                break;
            case 10: month = "november";
                break;
            case 0: month = "december";
                break;
        }
        return month + " " + (today.getDate()) + ", " + today.getFullYear();
    }

    tagInputFocus(e) {
        this.tagsInput.current.focus();
    }

    onErrorEvent(event) {
        this.onError(event.detail);
    }

    onError(error) {
        console.error('Error code', error.code, 'object', error);
    }

    dotsAnim = () => {
        let intervalId = setInterval(() => {
            if (this.state) {
                if (this.props.uploadStatus != "" && this.props.uploadStatus != "video ready") {
                    if (this.state.dots.length < 2) {
                        let dots = this.state.dots;
                        dots += ".";
                        this.setState({ dots: dots });
                    } else {
                        this.setState({ dots: "" });
                    }
                } else {
                    this.setState({ dots: "" });
                }
            } else {
                if (this.state.dotInterval) {
                    clearInterval(this.state.dotInterval);
                }
            }
        }, 1000);
        this.setState({ dotInterval: intervalId });
    }

    /* Gets videos on page load to ensure that videos are handled when they are currently being processed or missing info. User must add info to video if none or will have to wait until video is done processing */
    getUserVideos = () => {
        if (this.props.isLoggedIn) {
            let username = this.props.isLoggedIn;
            fetch(currentrooturl + 'm/getUserVideos', {
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
                .then((response) => {
                return response.json(); // Parsed data
            })
                .then((data) => {
                console.log(data);
                if (data.querystatus.toString().match(/([a-z0-9].*);processing/)) { // Set UploadStatus to "processing" if video being processed
                    this.props.updateErrStatus("");
                    this.setState({ videoId: data.querystatus.toString().match(/([a-z0-9].*);processing/)[1]});
                    if (this.props.socket) {
                        this.props.socket.emit('joinUploadSession', "upl-" +  data.querystatus.toString().match(/([a-z0-9].*);processing/)[1]);
                    } else if (this.state.socket) {
                        this.state.socket.emit('joinUploadSession', "upl-" +  data.querystatus.toString().match(/([a-z0-9].*);processing/)[1]);
                    }
                    if (this.props.uploadStatus.length < 1) {
                        this.props.updateUploadStatus("processing video");
                    }
                    this.progress.emit('progress', 100);
                } else if (data.querystatus.toString().match(/([a-z0-9].*);awaitinginfo/)) { // Else set UploadStatus awaitinginfo state for video
                    this.props.updateErrStatus("");
                    this.props.updateUploadStatus("video ready;" + data.querystatus.toString().match(/([a-z0-9].*);awaitinginfo/)[1]);
                    if (data.querystatus.toString().match(/([a-z0-9].*)\/([a-z0-9].*)-/)) {
                        this.setState({ videoId: data.querystatus.toString().match(/([a-z0-9].*)\/([a-z0-9].*)-/)[2] });
                    }
                    this.progress.emit('progress', 100);
                    console.log(data.querystatus.toString().match(/([a-z0-9].*);awaitinginfo/)[1]);
                    this.initPlayer(data.querystatus.toString().match(/([a-z0-9].*);awaitinginfo/)[1]);
                } else if (data.querystatus.toString() == "no pending videos") { // Resets state of upload video if no video is currently being uploaded
                    if (this.state.progress == 0) {
                        this.props.updateUploadStatus("");
                        this.props.updateUploadStatus("remove mpd");
                    }
                } else if (data.querystatus.toString() == null) {
                    // no video processing found
                }
                return data;
            })
                .catch(error => {
                console.log(error);
            })
        }
    }

    getSocket = (i, interval) => { // Manually returns socket from main component to ensure socket communication during upload
        return new Promise(resolve => {
            setTimeout(() => {
                i++;
                if (i < 5 && !this.state.socket) {
                    this.setState({ socket: this.props.getSocket()});
                    this.getSocket(i, interval*1.5);
                } else {
                    if (this.state.socket) {
                        resolve(this.state.socket);
                    }
                }
            }, interval);
        });
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
            uiConfig['controlPanelElements'] = ['play_pause', 'time_and_duration', 'spacer', 'overflow_menu', 'mute', 'volume', 'fullscreen'];

            if (player && videoContainer && video) {
                //Set up shaka player UI
                const ui = new shaka.ui.Overlay(player, videoContainer, video);

                ui.configure(uiConfig);
                ui.getControls();

                // Listen for errors
                player.addEventListener('error', this.onErrorEvent);

                // Ensures buffering spinner is never indefinitely spinning
                player.addEventListener('buffering', (event) => {
                    setTimeout((event) => {
                        try {
                            if (player.isBuffering()) {
                                if (document.getElementsByClassName("shaka-spinner")[0]) {
                                    document.getElementsByClassName("shaka-spinner")[0].classList.remove("hidden");
                                    setTimeout(() => {
                                        try {
                                            if (!player.isBuffering()) {
                                                if (document.getElementsByClassName("shaka-spinner")[0]) {
                                                    document.getElementsByClassName("shaka-spinner")[0].classList.add("hidden");
                                                }
                                            }
                                        } catch (err) {
                                            // there was an error locating the shaka spinner on document page. User may have changed pages or spinner div was removed temporarily.
                                        }
                                    }, 10000);
                                }
                            } else {
                                if (document.getElementsByClassName("shaka-spinner")[0]) {
                                    document.getElementsByClassName("shaka-spinner")[0].classList.add("hidden");
                                }
                            }
                        } catch (err) {
                             // there was an error locating the shaka spinner on document page. User may have changed pages or spinner div was removed temporarily.
                        }
                    }, 1000);
                });
            }

            // Try to load a manifest Asynchronous
            player.load(manifestUri).then(function() {
                console.log('video has now been loaded!');
            }).catch(this.onError);


        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }
    }

    uploadFileS3 = async (rerun) => {
        let userSocket = await this.getSocket(0, 2);
        this.props.updateErrStatus("");
        if (this.upload.current.files[0] && this.state.beginUpload == false || this.upload.current.files[0] && rerun) {
            this.setState({ beginUpload: true });
            let file = this.upload.current.files[0];
            let data = new FormData();
            let loaded;
            let total;
            let uploadPercentage;
            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1]; // match last set of strings after period
            data.append('extension', extension);
            data.append('video', file);
            data.append('user', this.props.isLoggedIn);
            if (this.props.socket) {
                data.append('socket', this.props.socket.id);
            } else if (this.state.socket) {
                data.append('socket', this.state.socket.id);
            } else if (userSocket) {
                data.append('socket', userSocket);
            }
            const options = {
                onUploadProgress: progressEvent => { // upload status logic
                    loaded = progressEvent.loaded / 1000000;
                    total = file.size / 1000000;
                    uploadPercentage = (loaded/total) * 100;
                    if (this.upload.current) {
                        if (this.upload.current.files) {
                            if (this.upload.current.files[0]) {
                                this.progress.emit('progress', uploadPercentage, this.upload.current.files[0]);
                            }
                        }
                    }
                },
                headers: {
                    'content-type': 'multipart/form-data'
                },
                timeout: 1000000
            };
            // Use axios to make post request and update user on gradual progress of upload. Only upload if videoPreview == null. If videoPreview is true, then there is a video currently being processed
            // Application only handles a single upload currently
            if (this.state.videoPreview == "") {
                this.props.updateUploadStatus("uploading video");
                axios.post(currentrooturl + 'm/videoupload', data, options)
                    .then(async (response) => {
                    console.log(response);
                    if (response.data.err) {
                        if (response.data.err == "reset") {
                            if (response.data.querystatus) {
                                if (response.data.querystatus == "Bad resolution") {
                                    this.props.updateErrStatus("Bad resolution");
                                } else {
                                    this.props.updateErrStatus("Video upload failed");
                                }
                            } else {
                                this.props.updateErrStatus("Video upload failed");
                            }
                            this.resetPage();
                        }
                    } else if (response.data.querystatus) {
                        if (response.data.querystatus.match(/processbegin/)[0]) {
                            let uplRoom = response.data.querystatus.match(/;([upla-z0-9].*)/)[1];
                            cookies.set('uplsession', uplRoom, { path: '/', sameSite: true, signed: true, maxAge: 86400 }); // Max age for video upload session 24 hours.
                            if (uplRoom.match(/upl-([a-z0-9].*)/)) {
                                this.setState({ videoId: uplRoom.match(/upl-([a-z0-9].*)/)[1] });
                                this.props.updateUploadStatus("processing;" + uplRoom.match(/upl-([a-z0-9].*)/)[1]);
                            }
                            if (this.props.uploadStatus == "uploading video") {
                                this.props.updateUploadStatus("waiting in queue");
                            }
                            if (this.props.socket) {
                                this.props.socket.emit('joinUploadSession', uplRoom);
                            } else if (this.state.socket) {
                                this.state.socket.emit('joinUploadSession', uplRoom);
                            } else if (userSocket) {
                                userSocket.emit('joinUploadSession', uplRoom);
                            }
                        }
                    }
                    return { response };
                })
                .then((data) => {
                    console.log(data);
                })
                .catch((error) => {
                    error => console.log(error);
                });
            }
        } else {
            if (!rerun && this.state.beginUpload == false) {
                setTimeout(() => {
                    this.uploadFileS3(true);
                }, 10000);
            }
        }
    }

    /* Updates a single video record in the backend database on mongodb and graph database */
    updateRecord = async () => {
        if (this.state.publishing == false && this.titleIn.current && this.props.isLoggedIn) {
            if (this.titleIn.current.value.length > 0 && (this.props.uploading != null || this.state.videoId.length > 0)) {
                this.setState({ publishing: true});
                const title = this.titleIn.current.value;
                const user = this.props.isLoggedIn;
                let desc = "";
                if (this.descIn.current) {
                    if (this.descIn.current.value.length > 0) {
                        desc = this.descIn.current.value;
                    }
                }
                let tags = [];
                for (let tag of this.state.tags) {
                    tags.push(tag);
                }
                let nudity = null;
                if (document.getElementById("nudity-no").checked) {
                    nudity = false;
                } else if (document.getElementById("nudity-yes").checked) {
                    nudity = true;
                }
                let mpd = "";
                if (this.props.uploading != null) {
                    mpd = this.props.uploading;
                } else if (this.state.videoId.length > 0) {
                    mpd = this.state.videoId;
                }
                fetch(currentrooturl + 'm/publishvideo', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        user, title, desc, tags, nudity, mpd
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    this.setState({ publishing: false });
                    console.log(data);
                });
            }
        }
    }

    loadPlayer = async (data) => {
        this.setState({ videoPreview: data.name }); // Set video preview
    }

    resetPage() {
        this.setState({ progress: 0, videoPreview: "" });
        if (this.progressBar.current) {
            this.progressBar.current.style.width = 0 + "%";
        }
    }
    // Must add thumbnail option in input section
    render() {
        return (
            <div>
                <div className={this.props.isLoggedIn ? "upload-video-text" : "upload-video-text bottom-50"}>Upload video</div>
                {!this.props.isLoggedIn ? <div className="not-logged-in prompt-basic grey-out">For you to upload a video you'll have to login first. Open the side panel to login or create a new account.</div> : null}
                <div className={this.state.currentErr ? "upload-err-status" : "upload-info"}>{this.state.currentErr ? this.state.currentErr : this.state.uploadInfo}</div>
                <div className={this.props.sidebarStatus ? this.props.sidebarStatus == 'open' ? "progress-bar-container-sidebaropen" : "progress-bar-container" : "progress-bar-container"}>
                    <div className="flex progress-update">
                        <div className="progress-upload-status">{this.props.uploadStatus}{this.state.dots}</div>
                        <div className="progress-num">{this.state.progress == 0 ? "" : Math.round(this.state.progress) + "%"}</div>
                    </div>
                    <div className="progress-bar" ref={this.progressBar} >&nbsp;</div>
                </div>
                <div className={this.props.isLoggedIn ? "" : "hidden"}>
                    <input className={this.state.progress == 0 && this.state.videoId == "" ? "choose-file" : "choose-file-hidden"} ref={this.upload} type="file" name="fileToUpload" id="fileToUpload" size="1" />
                    <Button className={this.state.progress == 0 && this.state.videoId == "" ? "upload-button" : "upload-button-hidden"} onClick={(e) => {{this.uploadFileS3(true)}}}>Upload</Button>
                </div>
                <div className={this.state.progress >= 100 ? "upload-media-container video-preview" : "upload-media-container video-preview video-preview-hidden"}>
                    <div className="video-container video-container-preview" ref={this.videoContainer}>
                        <video
                            className="shaka-video"
                            ref={this.videoComponent}
                            poster={minipostpreviewbanner}
                        />
                    </div>
                    <div className="video-input-data">
                        <label className={this.state.placeholderTitle == "" ? "upl-vid-title-label" : "upl-vid-title-label upl-vid-title-label-fill"}>{this.state.placeholderTitle == "" ? "title" : this.state.placeholderTitle}</label>
                        <div className={this.state.placeholderTitle != "" || this.state.placeholderDesc != "" ? "video-detail-container" : "video-detail-container video-detail-container-hidden"}>
                            <label className="upl-vid-date-label">{this.getDate()}</label>
                            <span className="video-separator">|</span>
                            <label className="upl-vid-author-label">{this.props.isLoggedIn ? this.props.isLoggedIn : ""}</label>
                        </div>
                        <div className="video-detail-separator">&nbsp;</div>
                        <label className={this.state.placeholderDesc == "" ? "upl-vid-desc-label upl-vid-desc-label-hidden" : "upl-vid-desc-label"}>{this.state.placeholderDesc}</label>
                        <label className={this.state.tags.length == 0 ? "upl-vid-tags-label upl-vid-tags-label-hidden" : "upl-vid-tags-label"}>{
                            this.state.tags.map((tag, index) => {
                                return (
                                    <span className="tag-label" key={index}>{tag}</span>
                                )
                            })
                        }
                        </label>
                        <div className="video-preview-input-separator">&nbsp;</div>
                        <input type='text' id="upl-vid-title" className="fixfocuscolor" ref={this.titleIn} onChange={(e) => {this.updateTitle(e, "title")}} name="upl-vid-title" placeholder="enter a fitting title for your video" autoComplete="off"></input>
                        <textarea type='text' id="upl-vid-desc" className="fixfocuscolor" ref={this.descIn} onChange={(e) => {this.updateTitle(e, "desc")}} name="upl-vid-desc" placeholder="describe what your video is about"></textarea>
                        <div className="tags-input-container" data-name="tags-input" onClick={(e) => {this.tagInputFocus(e)}}>
                            {
                                this.state.tags.map((tag, index) => {
                                    return (
                                        <span className="tag" key={index}>{tag}<span className="tag-close" onClick={(e) => {this.deleteTag(e)}}></span></span>
                                    )
                                })
                            }
                            <input type='text' id="upl-vid-tags" name="upl-vid-tags-input" ref={this.tagsInput} onKeyDown={(e) => this.onKeyPress(e)} placeholder={this.state.tags.length == 0 ? "tags" : ""}></input>
                        </div>
                        <div className="info-blurb tags-blurb">Tags help us in organizing content on minipost. Enter relevant tags to help users find your content easier</div>
                        <form className="nudity-radio">
                            <div className="nudity-question">Is there any nudity in your video?</div>
                            <input type="radio" id="nudity-yes" name="nudity" value="yes"/>
                            <label htmlFor="nudity-yes">Yes</label>
                            <input type="radio" id="nudity-no" name="nudity" value="no" defaultChecked/>
                            <label htmlFor="nudity-no">No</label>
                            <div className="info-blurb">Please be candid with us on whether or not there is nudity in your video. We allow nudity on minipost within reason. Efforts to post restricted content on minipost can result in your account receiving strikes or account termination.<br /><NavLink exact to="/guidelines">See our guidelines for more info</NavLink></div>
                        </form>
                        <Button className={this.state.progress >= 100 && this.state.videoId != "" && this.state.publishing == false ? "publish-button publish-video" : "publish-button publish-video publish-video-hidden"} onClick={this.updateRecord}>Publish</Button>
                    </div>
                </div>
            <div className={this.props.isLoggedIn ? "write-article-prompt prompt-basic grey-out" : "write-article-prompt hidden"}>Want to write an article instead? <NavLink exact to="/writearticle">Click here</NavLink></div>
            </div>
        )
    }
}
