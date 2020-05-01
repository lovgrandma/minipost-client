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

const cookies = new Cookies();
const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');

export default class Upload extends Component { // ulc upload component
    constructor(props) {
        super(props);
        this.state = {
            progress: 0, videoPreview: "", tags: [], placeholderTitle: "", placeholderDesc: ""
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
    }

    /* Parses all key presses for componenet elements */
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

    updateTitle(e, element) {
        if (element == "title") {
            if (this.titleIn.current) {
                this.setState({ placeholderTitle: this.titleIn.current.value });
            }
        } else if (element == "desc") {
            if (this.descIn.current) {
                this.setState({ placeholderDesc: this.descIn.current.value })
            }
        }
    }

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

    getDescPlaceholder() {
        if (this.state.placeholderDesc.length > 219) {
            return this.state.placeholderDesc.substring(0, 220) + "...";
        } else {
            return this.state.placeholderDesc;
        }
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

    componentDidMount() {
        this.progress.on('progress', (percent, data) => {
            console.log(percent);
            this.setState({progress: percent});
            if (this.progressBar.current) {
                this.progressBar.current.style.width = Math.round(percent) + "%";
            }
            if (this.state.videoPreview != data.name) {
                this.loadPlayer(data);
            }
        });

        // Install polyfills to patch browser incompatibilies
        shaka.polyfill.installAll();

        // Check browser support
        if (shaka.Player.isBrowserSupported()) {
            // Everything looks good!
            this.initPlayer();
        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }

    }

    initPlayer() {
        let manifestUri = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';

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

        // Try to load a manifest Asynchronous
        player.load(manifestUri).then(function() {
            console.log('video has now been loaded!');
        }).catch(this.onError);
    }

    uploadFileS3 = async () => {
        if (this.upload.current.files[0]) {
            let file = this.upload.current.files[0];
            let data = new FormData();
            let loaded;
            let total;
            let uploadPercentage;
            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1]; // match last set of strings after period
            data.append('extension', extension);
            data.append('video', file);
            data.append('user', this.props.isLoggedIn);
            const options = {
                onUploadProgress: progressEvent => { // upload status logic
                    loaded = progressEvent.loaded / 1000000;
                    total = file.size / 1000000;
                    uploadPercentage = (loaded/total) * 100;
                    this.progress.emit('progress', uploadPercentage, this.upload.current.files[0]);
                },
                headers: {
                    'content-type': 'multipart/form-data'
                },
                timeout: 1000000
            };
            // Use axios to make post request and update user on gradual progress of upload
            if (this.state.videoPreview == "") {
                axios.post(currentrooturl + 'm/videoupload', data, options)
                .then((response) => {
                    console.log(response);
                    if (response.data) {
                        if (response.data.match(/processbegin/)[0]) {
                            let uplRoom = response.data.match(/;([upla-z0-9].*)/)[1];
                            cookies.set('uplsession', uplRoom, { path: '/', sameSite: true, signed: true, maxAge: 86400 }); // Max age for video upload session 24 hours.
                            this.props.socket.emit('joinUploadSession', uplRoom);
                        }
                    }
                    return { response };
                })
                .catch((error) => {
                    error => console.log(error);
                });
            }
        }
    }

    loadPlayer = async (data) => {
        // Set video preview
        this.setState({ videoPreview: data.name });
        console.log(data);
    }
    // Must add thumbnail option in input section
    render() {
        return (
            <div>
                <div className="upload-video-txt">Upload video</div>
                <div className={this.props.sidebarStatus ? this.props.sidebarStatus == 'open' ? "progress-bar-container-sidebaropen" : "progress-bar-container" : "progress-bar-container"}>
                    <div className="progress-num">{this.state.progress == 0 ? "" : Math.round(this.state.progress) + "%"}</div>
                    <div className="progress-bar" ref={this.progressBar} >&nbsp;</div>
                </div>
                <div>
                    <input className="choose-file" ref={this.upload} type="file" name="fileToUpload" id="fileToUpload" size="1" />
                    <Button className="upload-button" onClick={this.uploadFileS3}>Upload</Button>
                </div>
                <div className={this.state.progress >= 100 ? "upload-media-container video-preview" : "upload-media-container video-preview video-preview-hidden"}>
                    <div className="video-container video-container-preview" ref={this.videoContainer}>
                        <video
                            className="shaka-video"
                            ref={this.videoComponent}
                            poster="//shaka-player-demo.appspot.com/assets/poster.jpg"
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
                        <label className={this.state.placeholderDesc == "" ? "upl-vid-desc-label upl-vid-desc-label-hidden" : "upl-vid-desc-label"}>{this.getDescPlaceholder()}</label>
                        <input type='text' id="upl-vid-title" ref={this.titleIn} onChange={(e) => {this.updateTitle(e, "title")}} name="upl-vid-title" placeholder="enter a fitting title for your video"></input>
                        <textarea type='text' id="upl-vid-desc" ref={this.descIn} onChange={(e) => {this.updateTitle(e, "desc")}} name="upl-vid-desc" placeholder="describe what your video is about"></textarea>
                        <div class="tags-input-container" data-name="tags-input" onClick={(e) => {this.tagInputFocus(e)}}>
                            {
                                this.state.tags.map((tag, index) => {
                                    return (
                                        <span class="tag">{tag}<span class="tag-close" onClick={(e) => {this.deleteTag(e)}}></span></span>
                                    )
                                })
                            }
                            <input type='text' id="upl-vid-tags" name="upl-vid-tags-input" ref={this.tagsInput} onKeyDown={(e) => this.onKeyPress(e)} placeholder={this.state.tags.length == 0 ? "tags" : ""}></input>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
