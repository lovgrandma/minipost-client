import React, { Component } from 'react';
import { cookies } from '../App.js';
import axios from 'axios';
import currentrooturl from '../url';
import currentshopurl from '../shopurl.js';
import {
    Button
} from 'react-bootstrap';
import {
    NavLink,
    Link
} from 'react-router-dom';
import minipostpreviewbanner from '../static/minipostbannerblack.png';
import { dataURItoBlob, get, randomProperty } from '../methods/utility.js';
import { setReplyData } from '../methods/responses.js';
import { debounce, calcTime, getCurrDate } from '../methods/utility.js';
import { deleteProcessingVideo } from '../methods/context.js';
import corsdefault from '../cors.js';
import greyproduct from '../static/greyproduct.jpg';

const shaka = require('shaka-player/dist/shaka-player.ui.js');
const EventEmitter = require('events');
let socket;

export default class Upload extends Component { // ulc upload component
    constructor(props) {
        super(props);
        this.state = {
            progress: 0, videoPreview: "", tags: [], placeholderTitle: "", placeholderDesc: "", socket: null, dots: "", currentErr: "", videoId: '', beginUpload: false, publishing: false, dotInterval: "", uploadInfo: "", uploadInfoInterval: "", published: false, publishedAwait: false, publishedMpd: "", gettingUserVideos: false, responseToId: "", responseToMpd: "", responseToTitle: "", responseToType: "", thumbnailUrl: "", thumbnailLoaded: false, advertisement: false, dateEditable: true, costEditable: true, shopData: null, productData: null, placementData: null, placementError: null, survey: null
        }
        this.upload = React.createRef();
        this.progressBar = React.createRef();
        this.tagsInput = React.createRef();
        this.titleIn = React.createRef();
        this.descIn = React.createRef();
        this.progress = new EventEmitter();
        this.videoContainer = new React.createRef();
        this.videoComponent = new React.createRef();
        this.player = new React.createRef();
        this.thumbnailpreview = new React.createRef();
        this.advertisementSwitch = new React.createRef();
        this.onErrorEvent = this.onErrorEvent.bind(this);
		this.onError = this.onError.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
        this.startDate = React.createRef();
        this.endDate = React.createRef();
        this.cost = React.createRef();
        this.budgetTotal = React.createRef();
        this.adUrl = React.createRef();
        this.uploadMessages = {
            takeAWhile: 'Depending on the size of your video, transcoding can take a while',
            whileYoureGone: 'When your video is converting you can visit other pages and watch videos, we\'ll take care of this while you\'re gone',
            copyright: 'We have a strict policy on posting stolen content. If you suspect your video does not satisfy Fair Use requirements, please revisit our guidelines'
        }
        this.debounceUpdateProductPlacement = this.debounceUpdateProductPlacement.bind(this);
    }

    componentDidMount = async() => {
        try {
            if (!this.props.edit) {
                this.setUpState();
                socket = this.getSocket(0, 150);
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
                if (this.props.uploadStatus === "video ready") {
                    this.clearMsgInt();
                }
            } else { //Edit page, not uploading new video. Editing data members of video that has already been published
                if (this.props.location) {
                    if (get(this, "props.location.pathname")) {
                        if (this.props.location.pathname.match(/\/edit[?]v=([a-zA-Z0-9].*)/)) {
                            this.initPlayer(this.props.cloud + "/" + this.props.location.pathname.match(/\/edit[?]v=([a-zA-Z0-9].*)/)[1] + await this.checkPlaybackSupportType(), true);
                            this.setState({ videoId: this.props.location.pathname.match(/\/edit[?]v=([a-zA-Z0-9].*)/)[1], progress: 100, publishedAwait: false });
                        } else if (this.props.location.pathname.match(/\/edit[?]va=([a-zA-Z0-9].*)/)) {
                            this.initPlayer(this.props.cloud + "/" + this.props.location.pathname.match(/\/edit[?]va=([a-zA-Z0-9].*)/)[1] + await this.checkPlaybackSupportType(), true);
                            this.setState({ videoId: this.props.location.pathname.match(/\/edit[?]va=([a-zA-Z0-9].*)/)[1], progress: 100, publishedAwait: false });
                            if (this.props.ad) {
                                this.setState({ advertisement: true });
                                this.retrieveSingleVideo("ad", this.props.location.pathname.match(/\/edit[?]va=([a-zA-Z0-9].*)/)[1]);
                            }
                        }
                    }
                    if (this.props.location.props) {
                        if (this.props.location.props.title) {
                            this.setState({ placeholderTitle: this.props.location.props.title });
                        }
                        if (this.props.location.props.author) {
                            this.setState({ author: this.props.location.props.author });
                        }
                        if (this.props.location.props.description) {
                            this.setState({ placeholderDesc: this.props.location.props.description });
                        }
                        if (this.props.location.props.tags) {
                            let tags = this.props.location.props.tags.split(',');
                            this.setState({ tags: tags });
                        }
                        if (this.props.location.props.thumbnailUrl) {
                            this.setState({ thumbnailUrl: this.props.location.props.thumbnailUrl });
                        }
                        if (this.props.location.props.shopOwner) {
                            this.getShopProductInfo(); // If user editing video owns a shop allow them to add product info
                        }
                        try {
                            if (this.props.location.props.survey) {
                                if (JSON.parse(this.props.location.props.survey)) {
                                    let s = JSON.parse(this.props.location.props.survey);
                                    if (Array.isArray(s)) {
                                        this.setState({ survey: s });
                                    }
                                }
                            }
                        } catch (err) {
                            // Fail silently
                        }
                    }
                }
            }
            
            if (window.location.search) {
                const urlParams = new URLSearchParams(window.location.search);
                let response = urlParams.get('r');
                let replyContent = '';
                let type = '';
                if (response) {
                    if (response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)) {
                        replyContent = response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[2];
                        if (response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[1] == 'a') {
                            type = 'a';
                        } else if (response.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[1] == 'v') {
                            type = 'v';
                        }
                    }
                    if (type && replyContent) {
                        setReplyData.call(this, response);
                    }
                }
            }
        } catch (err) {
            console.log(err);
            // something went wrong
        }
    }

    componentDidUpdate = async (prevProps, prevState) => {
        try {
            if (this.state) {
                if (prevProps.mpd == "") {
                    if (this.props.mpd.length > 0 && !this.props.edit) {
                        this.initPlayer(await this.convertMpdToM3u8(this.props.mpd));
                    }
                }
                if (prevProps.errStatus != this.props.errStatus && this.props.errStatus.length > 0) { // Reset page after receiving an error
                    this.resetPage();
                }

                if (prevProps && this.props && !this.state.busyInt) {
                    if (prevProps.uploadStatus && this.props.uploadStatus) {
                        if (prevProps.uploadStatus != this.props.uploadStatus && this.props.uploadStatus != "video ready") {
                            this.setMsgInt();
                        }
                    }
                }
            }
        } catch (err) {
            // Page was unmounted, state not accessible. Catch error.
        }
    }

    setMsgInt() {
        try {
            this.state ? this.setState({uploadInfo: randomProperty(this.uploadMessages) }) : null
            if (this.state.uploadInfoInterval.length <= 0) {
                let infoIntervalId = setInterval = (() => {
                    if (this.state) {
                        this.setState({uploadInfo: randomProperty(this.uploadMessages) });
                    }
                }, 15000);
                if (this.state) {
                    this.setState({ uploadInfoInterval: infoIntervalId });
                }
            }
        } catch (err) {
            // Component may have been unmounted
        }
    }

    // Clears message interval for showing randomized upload info text blurbs
    clearMsgInt() {
        try {
            if (this.state) {
                clearInterval(this.state.uploadInfoInterval);
                this.setState({ uploadInfo: "" });
            }
        } catch (err) {
            // Component may have been unmounted
        }

    }

    componentWillUnmount() {
        if (this.player) {
            if (this.player.detach) {
                this.player.detach();
            }
        }
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

    // Sets up state for response data gathering
    setUpState() {
        if (this.props) {
            if (this.props.location) {
                if (this.props.location.props) {
                    if (this.props.location.props.responseToMpd) {
                        this.setState({ responseToMpd: this.props.location.props.responseToMpd });
                    }
                    if (this.props.location.props.responseToId) {
                        this.setState({ responseToId: this.props.location.props.responseToId });
                    }
                    if (this.props.location.props.responseToType) {
                        this.setState({ responseToType: this.props.location.props.responseToType });
                    }
                    if (this.props.location.props.responseToTitle) {
                        this.setState({ responseToTitle: this.props.location.props.responseToTitle });
                    }
                }
            }
        }
    }

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
        try {
            let intervalId = setInterval(() => {
                try {
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
                } catch (err) {
                    // something went wrong
                }
            }, 1000);
            this.setState({ dotInterval: intervalId });
        } catch (err) {
            // setInterval did not function as window object must have been deleted
        }
    }

    retrieveSingleVideo = (type = "video", mpd) => {
        if (type == "ad" && cookies.get('loggedIn') && mpd) {
            const username = cookies.get('loggedIn');
            let hash = cookies.get('hash');
            let self = true;
            fetch(currentrooturl + 'm/getSingleAd', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    mpd, username, hash, self
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
                let authenticated = this.props.checkAndConfirmAuthentication(data);
                if (authenticated) {
                    if (data.video) {
                        if (get(data, 'video.startDate') && get(data, 'video.endDate') && get(data, 'video.dailyBudget')) {
                            if (parseInt(data.video.startDate) && parseInt(data.video.endDate)) {
                                if (new Date(parseInt(data.video.startDate)) && new Date(parseInt(data.video.endDate))) {
                                    this.startDate.current.valueAsDate = new Date(parseInt(data.video.startDate));
                                    this.endDate.current.valueAsDate = new Date(parseInt(data.video.endDate));
                                    this.setState({ dateEditable: false });
                                }
                            }
                            this.cost.current.value = data.video.dailyBudget;
                            this.adUrl.current.value = data.video.adUrl;
                            this.setState({ costEditable: false });
                        }
                    }
                }
            })
        }
    }
    
    // Use this when the server has an ID but hasnt appended mpd or hls yet
    checkPlaybackSupportType = async () => {
        const support = await shaka.Player.probeSupport();
        console.log(support.manifest);
        if (support.manifest.mpd) {
            return "-mpd.mpd";
        } else {
            return "-hls.m3u8";
        }
        return "-mpd.mpd";
    }
    
    // Use this when the server has already returned an mpd.
    convertMpdToM3u8 = async (value) => {
        if (await this.checkPlaybackSupportType() == "-hls.m3u8") {
            if (value.match(/([a-zA-Z0-9.\/\\:].*)-([a-zA-Z0-9].*)/)) {
                if (value.match(/([a-zA-Z0-9.\/\\:].*)-([a-zA-Z0-9].*)/)[1]) {
                    return value.match(/([a-zA-Z0-9.\/\\:].*)-([a-zA-Z0-9].*)/)[1] + "-hls.m3u8";
                }
            }
        }
        return value;
    }
    
    /* Gets videos on page load to ensure that videos are handled when they are currently being processed or missing info. User must add info to video if none or will have to wait until video is done processing */
    getUserVideos = async() => {
        if (!this.state.gettingUserVideos) {
            this.setState({ gettingUserVideos: true });
            if (cookies.get('loggedIn')) {
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                fetch(currentrooturl + 'm/getuservideos', {
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
                .then((response) => {
                    return response.json(); // Parsed data
                })
                .then(async(data) => {
                    console.log(data);
                    let authenticated = this.props.checkAndConfirmAuthentication(data);
                    if (authenticated) {
                        if (data.shopOwner) {
                            this.getShopProductInfo();
                        }
                        if (data.advertiser) {
                            this.setState({ advertiser: data.advertiser });
                        }
                        if (data.advertisement) {
                            this.setState({ advertisement: data.advertisement });
                        }
                        if (data.querystatus.toString().match(/([a-z0-9].*);processing/)) { // Set UploadStatus to "processing" if video being processed
                            if (data.title) {
                                if (data.title.length > 0) {
                                    this.setState({ placeholderTitle: data.title });
                                }
                            }
                            if (data.description) {
                                this.setState({ placeholderDesc: data.description });
                            }
                            if (data.tags && data.tags != undefined) {
                                if (data.tags.length > 0) {
                                    if (data.tags[0] != "") {
                                         this.setState({ tags: data.tags });
                                    }
                                }
                            }
                            try {
                                if (data.survey) {
                                    if (JSON.parse(survey)) {
                                        let s = JSON.parse(survey);
                                        if (Array.isArray(s)) {
                                            this.setState({ survey: s });
                                        }
                                    }
                                }
                            } catch (err) {
                                // Fail silently
                            }
                            this.props.updateErrStatus("");
                            this.setMsgInt();
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
                            if (this.props.uploadStatus !== "video ready") {
                                this.props.updateUploadStatus("video ready;" + data.querystatus.toString().match(/([a-z0-9].*);awaitinginfo/)[1]);
                            } else {
                                this.clearMsgInt();
                            }
                            if (data.querystatus.toString().match(/([a-z0-9].*)\/([a-z0-9].*)-/)) {
                                this.setState({ videoId: data.querystatus.toString().match(/([a-z0-9].*)\/([a-z0-9].*)-/)[2] });
                            }
                            this.progress.emit('progress', 100);
                            console.log(data.querystatus.toString().match(/([a-z0-9].*);awaitinginfo/)[1]);
                            this.initPlayer(await this.convertMpdToM3u8(data.querystatus.toString().match(/([a-z0-9].*);awaitinginfo/)[1]));
                        } else if (data.querystatus.toString() == "no pending videos") { // Resets state of upload video if no video is currently being uploaded
                            if (this.state.progress == 0) {
                                this.props.updateUploadStatus("");
                                this.props.updateUploadStatus("remove mpd");
                            }
                        } else if (data.querystatus.toString() == null) {
                            // no video processing found
                        }
                    }
                    this.setState({ gettingUserVideos: false });
                    return data;
                })
                .catch(error => {
                    this.setState({ gettingUserVideos: false });
                    console.log(error);
                })
            } else {
                this.setState({ gettingUserVideos: false });
            }
        }
    }

    /**
     * Will retrieve shop product information if state to shopOwner is true
     */
    getShopProductInfo() {
        if (cookies.get('loggedIn') && cookies.get('hash')) {
            let username = cookies.get('loggedIn');
            let hash = cookies.get('hash');
            let self = true;
            let videoId = this.state.videoId ? this.state.videoId : null;
            fetch(currentshopurl + "s/getproductsforvideoplacement", {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self, videoId
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                if (result.data) {
                    if (result.data.productData) {
                        this.setState({ productData: result.data.productData });
                    }
                    if (result.data.placementData) {
                        if (JSON.parse(result.data.placementData)) {
                            let a = JSON.parse(result.data.placementData); 
                            this.setState({ placementData: a });
                            for (let i = 0; i < a.length; i++) {
                                let [stHr, stMin, stSec] = calcTime(a[i].id, a[i].start);
                                let [enHr, enMin, enSec] = calcTime(a[i].id, a[i].end);
                                document.getElementsByClassName('placement-hr-start')[i].value = stHr;
                                document.getElementsByClassName('placement-min-start')[i].value = stMin;
                                document.getElementsByClassName('placement-sec-start')[i].value = stSec;
                                document.getElementsByClassName('placement-hr-end')[i].value = enHr;
                                document.getElementsByClassName('placement-min-end')[i].value = enMin;
                                document.getElementsByClassName('placement-sec-end')[i].value = enSec;
                            }
                        }
                    }
                }
            })
            .catch((err) => {
                return false;
            });
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

    initPlayer(manifest, edit) {
        // Check browser support
        if (shaka.Player.isBrowserSupported()) {
            if (!manifest) {
                manifest = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd'; // Eventually if no manifest cause failure to load and just load technical difficulties image instead of this vdieo
            }
            let manifestUri = manifest;

            const video = this.videoComponent.current;
            const videoContainer = this.videoContainer.current;

            // Initialize player
            let player = new shaka.Player(video);

            // UI custom json
            const uiConfig = {};
            uiConfig['controlPanelElements'] = ['play_pause', 'time_and_duration', 'spacer', 'mute', 'volume', 'overflow_menu', 'fullscreen'];

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

            this.player = player;

            // Try to load a manifest Asynchronous
            player.load(manifestUri).then(() => {
                setTimeout(() => {
                    try {
                        if (this.state.thumbnailUrl) {
                            this.setThumbnailPreview(this.state.thumbnailUrl);
                        } else {
                            this.setThumbnailPreview();
                        }
                        if (get(this, 'videoComponent.current')) {
                            this.videoComponent.current.currentTime = 0;
                            this.setState({ publishedAwait: false });
                        }
                    } catch (err) {
                        // Something went wrong
                    }
                }, 500);
                console.log('video has now been loaded!');
            }).catch(this.onError);



        } else {
            // This browser does not have the minimum set of APIs we need.
            console.error('Browser not supported!');
        }
    }

    uploadFileS3 = async (rerun, editFirst = false) => {
        let advertisement = false;
        if (get(this, "advertisementSwitch.current.checked")) {
            if (this.advertisementSwitch.current.checked) {
                advertisement = true;
            }
        }
        let userSocket = await this.getSocket(0, 2);
        this.props.updateErrStatus("");
        if (this.upload.current.files[0] && this.state.beginUpload == false || this.upload.current.files[0] && rerun && cookies.get('loggedIn')) {
            this.setState({ beginUpload: true });
            let file = this.upload.current.files[0];
            let data = new FormData();
            let loaded;
            let total;
            let uploadPercentage;
            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1]; // match last set of strings after period
            data.append('extension', extension);
            data.append('video', file);
            data.append('username', cookies.get('loggedIn'));
            data.append('hash', cookies.get('hash'));
            if (advertisement) {
                data.append('advertisement', true);
            }
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
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true,
                timeout: 1000000
            };
            // Use axios to make post request and update user on gradual progress of upload. Only upload if videoPreview == null. If videoPreview is true, then there is a video currently being processed
            // Application only handles a single upload currently
            if (this.state.videoPreview == "") {
                this.props.updateUploadStatus("uploading video");
                axios.post(currentrooturl + 'm/videoupload', data, options)
                    .then(async (response) => {
                        console.log(response);
                        let authenticated = this.props.checkAndConfirmAuthentication(response);
                        console.log(response.data.querystatus);
                        if (response.data.err || !authenticated) {
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
                            if (response.data.querystatus.match(/processbegin/)[0]) { // Successful start of video upload
                                if (advertisement) {
                                    this.setState({ advertisement: true });
                                }
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
    
    buildAdvertisingSchedule = () => {
        try {
            if (get(this, 'startDate.current.value') && get(this, 'endDate.current.value') && get(this, 'cost.current.value') && get(this, 'adUrl.current.value')) {
                if (Date.parse(this.startDate.current.value) && Date.parse(this.endDate.current.value)) {
                    if (Date.parse(this.startDate.current.value) < Date.parse(this.endDate.current.value)) {
                        if (this.cost.current.value > 24.99) {
                            return {
                                startDate: Date.parse(this.startDate.current.value),
                                endDate: Date.parse(this.endDate.current.value),
                                dailyBudget: this.cost.current.value,
                                adUrl: this.adUrl.current.value
                            }
                        } else {
                            this.setState({ adErr: "Your daily budget cannot run less than $25 usd a day" });
                            return null;
                        }
                    } else {
                        this.setState({ adErr: "The start date cannot be later than the end date" });
                        return null;
                    }
                }
            }
        } catch (err) {
            this.setState({ adErr: err });
            return null;
        }
    }

    /* Publish. Updates a single video record in the backend database on mongodb and graph database */
    updateRecord = async () => {
        let adData;
        if (this.state.advertisement || this.props.ad) {
            adData = this.buildAdvertisingSchedule();
            if (!adData) {
                return; // Exit, advertising schedule did not compile properly
            }
        }
        if (this.state.publishing == false && this.titleIn.current && cookies.get('loggedIn')) {
            if (this.titleIn.current.value.length > 0 && (this.props.uploading != null || this.state.videoId.length > 0)) {
                this.setState({ publishing: true});
                const title = this.titleIn.current.value;
                const username = cookies.get('loggedIn');
                let desc = "";
                if (this.descIn.current) {
                    if (this.descIn.current.value.length > 0) {
                        desc = this.descIn.current.value;
                    }
                }
                let tags = this.state.tags;
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
                let responseTo = "";
                let responseType = this.state.responseToType;
                if (this.state.responseToId) {
                    responseTo = this.state.responseToId;
                } else if (this.state.responseToMpd) {
                    responseTo = this.state.responseToMpd;
                }
                let survey;
                try {
                    if (this.state.survey) {
                        if (Array.isArray(this.state.survey)) {
                            if (this.state.survey.length > 0) {
                                survey = JSON.stringify(this.state.survey);
                            }
                        }
                    }
                } catch (err) {
                    // Failed to apply survey, continue
                }
                console.log(survey);
                const options = {
                    headers: {
                        'content-type': 'multipart/form-data'
                    },
                    timeout: 1000000
                };
                let data = new FormData();
                data.append('title', this.titleIn.current.value);
                data.append('username', username);
                data.append('desc', desc);
                data.append('tags', tags);
                data.append('nudity', nudity);
                data.append('mpd', mpd);
                data.append('thumbnailLoaded', this.state.thumbnailLoaded);
                data.append('responseTo', responseTo);
                data.append('responseType', responseType);
                data.append('extension', 'jpeg');
                if (survey) {
                    data.append('survey', survey);
                }
                data.append('hash', cookies.get('hash'));
                if (this.state.placementData) { // If user has placement data, do validation on front end before publish
                    if (this.state.placementData.length > 0) {
                        if (this.updateProductPlacementAll()) {
                            data.append('productPlacement', JSON.stringify(this.state.placementData));
                        } else {
                            this.setState({ publishing: false });
                            return false;
                        }
                    }
                }
                if (adData) { // if user is creating an advertisement. Forward the appropriate data
                    data.append('startDate', adData.startDate);
                    data.append('endDate', adData.endDate);
                    data.append('dailyBudget', adData.dailyBudget);
                    data.append('adUrl', adData.adUrl);
                }
                let thumbUrl = null;
                if (this.thumbnailpreview && this.state.thumbnailLoaded) {
                    if (this.thumbnailpreview.current) {
                        thumbUrl = this.thumbnailpreview.current.toDataURL('image/jpeg');
                        if (thumbUrl) {
                            let blob = dataURItoBlob(thumbUrl);
                            data.append('image', blob);
                        }
                    }
                }
                try {
                    axios.post(currentrooturl + 'm/publishvideo', data, options)
                        .then((data) => {
                            let authenticated = this.props.checkAndConfirmAuthentication(data);
                            if (authenticated) {
                                this.setState({ publishing: false });
                                if (data.data.querystatus === "record published/updated") {
                                    this.setState({ publishedMpd: data.data.mpd });
                                    if (!this.player.getAssetUri) {
                                        this.setState({ publishedAwait: true });
                                    } else {
                                        this.setState({ publishedAwait: false });
                                        this.setState({ published: true });
                                    }
                                }
                            }
                        });
                } catch (err) { // axios request failed to publish video
                    try {
                        if (this) {
                            if (this.state) {
                                this.setState({ currentErr: "video failed to publish ", publishing: false });
                            }
                        }
                    } catch (err) {
                        // component unmounted
                    }
                }

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

    setResponseParentLink() {
        if (this.state.responseToMpd) { // Response is video set watch pathname
            return {
                pathname:`/watch?v=${this.state.responseToMpd}`
            }
        } else if (this.state.responseToId) { // Response is article set read pathname
            return {
                pathname:`/read?a=${this.state.responseToId}`
            }
        } else {
            return {
                pathname:`/`
            }
        }
    }

    setThumbnailPreview(url, retry = true) {
        try {
            if (this.thumbnailpreview) {
                if (this.thumbnailpreview.current) {
                    this.thumbnailpreview.current.width = 320;
                    this.thumbnailpreview.current.height = 180;
                    let ctx = this.thumbnailpreview.current.getContext('2d'); // Canvas
                    if (url && url != "undefined") { // Will set thumbnail to current video image if edited video to preserve same thumbnail if user does not change
                        let img = new Image;
                        img.crossOrigin = "Use-Credentials";
                        let cloudUrl = this.props.cloud + "/" + url + ".jpeg";
                        img.src = cloudUrl;
                        img.onload = () => {
                            try {
                                let calcAsp = this.videoComponent.current.videoHeight / 180;
                                let calcHeight = this.videoComponent.current.videoHeight / calcAsp;
                                let calcWidth = this.videoComponent.current.videoWidth / calcAsp;
                                let xOffset = (320 - calcWidth) / 2;
                                let yOffset = (180 - calcHeight) / 2;
                                ctx.drawImage(this.videoComponent.current, xOffset, yOffset, calcWidth, calcHeight);
                            } catch (err) {
                                console.log(err);
                            }
                        }
                    } else {
                        if (this.videoComponent.current) {
                            let calcAsp = this.videoComponent.current.videoHeight / 180;
                            let calcHeight = this.videoComponent.current.videoHeight / calcAsp;
                            let calcWidth = this.videoComponent.current.videoWidth / calcAsp;
                            let xOffset = (320 - calcWidth) / 2;
                            let yOffset = (180 - calcHeight) / 2;
                            ctx.drawImage(this.videoComponent.current, xOffset, yOffset, calcWidth, calcHeight);
                        }
                    }
                    let totalData = 0;
                    for (let i = 0; i < 500; i++) {
                        totalData += ctx.getImageData(0, 0, 320, 180).data[i];
                    }
                    if (totalData == 0) {
                        this.setState({ thumbnailLoaded: false });
                        setTimeout(() => {
                            if (retry) { // Will retry setting thumbnail once but second parameter ensures it does not fire again
                                this.setThumbnailPreview(url, false);
                            }
                        }, 1500);
                    } else {
                        this.setState({ thumbnailLoaded: true });
                    }
                }
            }
        } catch (err) {
            return false; // Failure to set thumbnail
        }
    }

    getWatchHere = () => {
        if (this.state.publishedMpd) {
            return this.state.publishedMpd;
        } else {
            return this.state.videoId;
        }
    }

    // Will allow user to add products from their list to product placement for the current video
    addProductToPlacement(e, product) {
        try {
            if (this.state.productData) { // User must have products in order to add product to placement data. If no products user has no products or they are not allowed to add placement data
                let temp = this.state.placementData ? this.state.placementData : [];
                if (temp.length < 3) { // Cannot add more than 3 products
                    let doChange = true;
                    for (let i = 0; i < temp.length; i++) {
                        if (temp[i].id == product.id) {
                            doChange = false;
                        }
                    }
                    if (doChange) {
                        temp.push({
                            id: product.id,
                            name: product.name,
                            start: null,
                            end: null,
                            position: "right"
                        });
                        this.setState({ placementData: temp });
                    }
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    removeProductFromPlacement(e, product) {
        try {
            let temp  = this.state.placementData ? this.state.placementData : [];
            for (let i = 0; i < temp.length; i++) {
                if (temp[i].id == product.id) {
                    temp.splice(i, 1);
                }
            }
            this.setState({ placementData: temp });
        } catch (err) {
            // Fail silently
        }
    }

    forceTwoPlaces(id) {
        let dataIndex = [...document.getElementsByClassName('placement-hr-start')].map(function(el) { return el.getAttribute('product') }).indexOf(id);
        let data = [];
        data.push(document.getElementsByClassName('placement-hr-start')[dataIndex]);
        data.push(document.getElementsByClassName('placement-min-start')[dataIndex]);
        data.push(document.getElementsByClassName('placement-sec-start')[dataIndex]);
        data.push(document.getElementsByClassName('placement-hr-end')[dataIndex]);
        data.push(document.getElementsByClassName('placement-min-end')[dataIndex]);
        data.push(document.getElementsByClassName('placement-sec-end')[dataIndex]);
        function pad(num, hr = false) {
            if (hr) {
                return num > 48 ? 48 : num; // Allow videos to be 48 hours long
            }
            return num > 59 ? 59 : num;
        }
        for (let i = 0; i < data.length; i++) {
            if (data[i].classList.contains("placement-hr-start") || data[i].classList.contains("placement-hr-end")) {
                data[i].value = pad(data[i].value, true);
            } else {
                data[i].value = pad(data[i].value);
            }
        }
    }

    // Will determine if product placement for all products is valid
    updateProductPlacementAll() {
        let placements = this.state.placementData;
        for (let i = 0; i < placements.length; i++) {
            let result = this.doUpdateProductPlacement(placements[i].id);
            if (!result) {
                return false;
            }
        }
        return true;
    }

    doUpdateProductPlacement(id) {
        try {
            this.setState({ placementError: null });
            let dataIndex = [...document.getElementsByClassName('placement-hr-start')].map(function(el) { return el.getAttribute('product') }).indexOf(id);
            let startHr = document.getElementsByClassName('placement-hr-start')[dataIndex].value;
            let startMin = document.getElementsByClassName('placement-min-start')[dataIndex].value;
            let startSec = document.getElementsByClassName('placement-sec-start')[dataIndex].value;
            let endHr = document.getElementsByClassName('placement-hr-end')[dataIndex].value;
            let endMin = document.getElementsByClassName('placement-min-end')[dataIndex].value;
            let endSec = document.getElementsByClassName('placement-sec-end')[dataIndex].value;
            let start = Number(startHr * 60 * 60) + Number(startMin * 60) + Number(startSec);
            let end = Number(endHr * 60 * 60) + Number(endMin * 60) + Number(endSec);
            console.log(startHr, startMin);
            let startString = startMin && startSec ? startHr && startMin && startSec? `${startHr}:${startMin}:${startSec}` : `${startMin}:${startSec}` : `${startSec}`;
            let endString = endMin && endSec ? endHr && endMin && endSec ? `${endHr}:${endMin}:${endSec}` : `${endMin}:${endSec}` : `${endSec}`;
            // In order to evaluate times, allow user to implement both start and end before updating max or valid intervals (not overlapping with other products)
            function resetStart() {
                document.getElementsByClassName('placement-hr-start')[dataIndex].value = null;
                document.getElementsByClassName('placement-min-start')[dataIndex].value = null;
                document.getElementsByClassName('placement-sec-start')[dataIndex].value = "00";
            }
            function resetEnd() {
                document.getElementsByClassName('placement-hr-end')[dataIndex].value = null;
                document.getElementsByClassName('placement-min-end')[dataIndex].value = null;
                document.getElementsByClassName('placement-sec-end')[dataIndex].value = "00";
            }
            if (start == 0) {
                this.setState({ placementError: "Start time for all product placements should begin after 0 seconds"});
                resetStart();
                return false;
            } else if (end < 2) {
                this.setState({ placementError: "End time for all product placements should begin after 1 second"});
                resetEnd();
                return false;
            }
            if (start && end) {
                if (start == end) {
                    this.setState({ placementError: "The start time for product placement cannot be the same as end time. Doesn't really make sense"});
                    resetEnd();
                    return false;
                }
                if (start > end) { // We have a problem. Start of a product placement interval cannot be greater than the end
                    resetEnd();
                    this.setState({ placementError: "The start time of your product placement cannot be greater than the end time"});
                    return false;
                }
                if (this.videoComponent) {
                    if (this.videoComponent.current) {
                        if (this.videoComponent.current.duration) {
                            // Check if for some reason the user set one of the placement times past the duration of the video itself
                            let curDur = this.videoComponent.current.duration;
                            if (start > curDur || end > curDur) {
                                if (start > curDur) {
                                    resetStart();
                                }
                                if (end > curDur) {
                                    resetEnd();
                                }
                                this.setState({ placementError: "Your product placement can only occur during video playtime duration"});
                                return false;
                            }
                        }
                    }
                }
                // Check to see if product placement collides with other product placement timelines
                let placementData = this.state.placementData;
                let match = -1;
                for (let i = 0; i < placementData.length; i++) {
                    if (placementData[i].id == id) {
                        match = i;
                    } else {
                        if (typeof placementData[i].start == 'number' && typeof placementData[i].end == 'number') { // Type of number, good to compare. Defaults to null
                            // Cannot start another placement within the time of another
                            if (start <= placementData[i].end && start >= placementData[i].start) {
                                resetStart();
                                this.setState({ placementError: "Product placement times cannot overlap with your other placements"});
                                return false;
                            }
                            if (end >= placementData[i].start && end <= placementData[i].end) {
                                resetEnd();
                                this.setState({ placementError: "Product placement times cannot overlap with your other placements"});
                                return false;
                            }
                        }
                    }
                }
                if (match > -1) {
                    placementData[match].start = start;
                    placementData[match].end = end;
                    this.setState({ placementData: placementData });
                }
                return true;
            }
        } catch (err) {
            console.log(err);
            // Fail silently
        }
    }

    changeScreenPosition(e, id) {
        try {
            let placementData = this.state.placementData;
            let position = e.target.value;
            for (let i = 0; i < placementData.length; i++) {
                if (placementData[i].id == id) {
                    placementData[i].position = position;
                    break;
                }
            }
            this.setState({ placementData: placementData });
        } catch (err) {
            return false;
        }
    }

    clearAllPlacement(e) {
        try {
            this.setState({ placementData: [] });
        } catch (err) {
            // Fail silently
        }
    }

    buildSurvey = (e) => {
        try {
            if (!Array.isArray(this.state.survey)) {
                this.setState({ survey: [] });
            }
        } catch (err) {
            // Fail silently
        }
    }

    addQuestion = (e) => {
        try {
            if (Array.isArray(this.state.survey)) {
                let t = this.state.survey;
                t.push({type: "text", q: "" });
                this.setState({ survey: t });
            }
        } catch (err) {
            // Fail silently
        }
    }

    changeSurveyQ = (e, i) => {
        try {
            console.log(e.target.value, i);
            if (e.target.value && typeof i == "number") {
                let t = this.state.survey;
                t[i].type = e.target.value;
                if (e.target.value == "checkbox" || e.target.value == "radio") {
                    if (e.target.value == "radio") {
                        t[i].options = ["", ""];
                    } else {
                        t[i].options = [];
                    }
                } else {
                    t[i].options = null;
                }
                this.setState({ survey: t });
            }
        } catch (err) {
            // Fail silently
        }
    }

    addOp = (e, i) => {
        try {
            let t = this.state.survey;
            t[i].options.push("");
            this.setState({ survey: t });
        } catch (err) {
            // Fail silently
        }
    }

    updateOption = (e, j, i) => {
        try {
            let t = this.state.survey;
            t[i].options[j] = e.target.value;
            this.setState({ survey: t });
        } catch (err) {
            // Fail silently
        }
    }

    changeQ = (e, i) => {
        try {
            let t = this.state.survey;
            t[i].q = e.target.value;
            this.setState({ survey: t });
        } catch (err) {
            // Fail silently
        }
    }

    deleteQ = (e, i) => {
        try {
            let t = this.state.survey;
            t.splice(i, 1);
            this.setState({ survey: t });
        } catch (err) {
            // Fail silently
        }
    }
    
    debounceUpdateProductPlacement = debounce((id) => this.updateProductPlacementAll(), 7500);

    // Must add thumbnail option in input section
    render() {
        return (
            <div className={!this.state.gettingUserVideos  && !this.props.edit || !this.state.published && !this.props.edit || this.props.edit ? "hidden hidden-visible" : "hidden"}>
                <div className={ cookies.get('loggedIn') ? "upload-video-text" : "upload-video-text bottom-50"}>{!this.props.edit ? "Upload video" : "Edit video"}</div>
                { !cookies.get('loggedIn') ? <div className="not-logged-in prompt-basic grey-out">For you to upload a video you'll have to login first. Open the side panel to login or create a new account.</div> : null}
                <div className={this.state.currentErr ? "upload-err-status" : "upload-info"}>{this.state.currentErr ? this.state.currentErr : this.state.uploadInfo}</div>
                <div className={this.props.sidebarStatus ? this.props.sidebarStatus == 'open' ? "progress-bar-container-sidebaropen" : "progress-bar-container" : "progress-bar-container"}>
                    <div className={this.state.progress >= 100.00 && !this.props.edit ? "delete-container" : "hidden"}><div className="delete-video-text">{this.props.uploadStatus != "video ready" ? "You can delete this video before it completes processing." : "Video bugged out? Delete it here"} Click</div><div className="material-icons arrow-back-login">arrow_forward</div><div className="social-portal-times" onClick={(e)=>{deleteProcessingVideo(e)}}>&times;</div></div>
                    <div className="flex progress-update">
                        <div className="progress-upload-status">{this.props.uploadStatus}{this.state.dots}</div>
                        <div className="progress-num">{this.state.progress == 0 ? "" : Math.round(this.state.progress) + "%"}</div>
                    </div>
                    <div className="progress-bar" ref={this.progressBar} >&nbsp;</div>
                </div>
                <div className={ cookies.get('loggedIn') && !this.state.gettingUserVideos ? "upload-button-container" : "hidden"}>
                    <input className={this.state.progress == 0 && this.state.videoId == "" && !this.state.rawEdit ? "choose-file" : "choose-file-hidden"} ref={this.upload} type="file" name="fileToUpload" id="fileToUpload" size="1" />
                    <div className={this.state.progress == 0 ? "flex flex-start gap10" : "hidden"}>
                        <Button className={this.state.progress == 0 ? "upload-button red-btn" : "red-btn upload-button-hidden"} onClick={(e) => {this.uploadFileS3(true)}}>Upload</Button>
                    </div>
                    <div className={ this.state.advertiser && this.props.uploadStatus != "video ready" && !this.state.beginUpload ? "hidden hidden-visible custom-control custom-switch margin-bottom-5 custom-switch-spacing-upload" : "hidden" }>
                        <input type="checkbox" className="custom-control-input" id="customSwitch1" ref={this.advertisementSwitch}></input>
                        <label className="custom-control-label info-blurb switch-line-height-text" for="customSwitch1">Upload as an advertisement and fill in advertisement contract details</label>
                    </div>
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
                            <label className="upl-vid-date-label">{getCurrDate()}</label>
                            <span className="video-separator">|</span>
                            <label className="upl-vid-author-label">{this.props.isLoggedIn ? this.props.isLoggedIn : ""}</label>
                        </div>
                        <div className="video-detail-separator">&nbsp;</div>
                        <label className={this.state.placeholderDesc == "" ? "upl-vid-desc-label upl-vid-desc-label-hidden" : "upl-vid-desc-label"}>{this.state.placeholderDesc}</label>
                        <label className={this.state.tags ? this.state.tags.length > 0 ? "upl-vid-tags-label" : "upl-vid-tags-label upl-vid-tags-label-hidden" : "upl-vid-tags-label upl-vid-tags-label-hidden"}>{
                            this.state.tags ?
                                this.state.tags.map((tag, index) => {
                                    return (
                                        <span className="tag-label" key={index}>{tag}</span>
                                    )
                                })
                            : null
                        }
                        </label>
                        <div className="video-preview-input-separator">&nbsp;</div>
                        <div>
                            <Button className="set-thumbnail-btn btn btn-default" onClick={(e)=>{this.setThumbnailPreview()}}>Set thumbnail</Button>
                            <div className="info-blurb margin-bottom-5">{ !this.props.edit ? "Select a timepoint above once your video has loaded and click the button above to choose a thumbnail for your video" : "If your saved thumbnail does not load here, don't worry. If you wish to keep the same thumbnail don't set a new one before updating this video. If you do set a new thumbnail it will overwrite the old one when you click update" }</div>
                            <canvas className="canvas-thumbnail-preview" ref={this.thumbnailpreview}></canvas>
                        </div>
                        <input type='text' id="upl-vid-title" className="fixfocuscolor" ref={this.titleIn} onChange={(e) => {this.updateTitle(e, "title")}} name="upl-vid-title" placeholder="enter a fitting title for your video" autoComplete="off" value={this.state.placeholderTitle}></input>
                        <textarea type='text' id="upl-vid-desc" className="fixfocuscolor" ref={this.descIn} onChange={(e) => {this.updateTitle(e, "desc")}} name="upl-vid-desc" placeholder="describe what your video is about" value={this.state.placeholderDesc}></textarea>
                        <div className="tags-input-container" data-name="tags-input" onClick={(e) => {this.tagInputFocus(e)}}>
                            {
                                this.state.tags ?
                                    this.state.tags.map((tag, index) => {
                                        return (
                                            <span className="tag" key={index}>{tag}<span className="tag-close" onClick={(e) => {this.deleteTag(e)}}></span></span>
                                        )
                                    })
                                : null
                            }
                            <input type='text' id="upl-vid-tags" name="upl-vid-tags-input" ref={this.tagsInput} onKeyDown={(e) => this.onKeyPress(e)} placeholder={this.state.tags ? this.state.tags.length > 0 ? "" : "" : "tags"}></input>
                        </div>
                        <div className="info-blurb tags-blurb">Tags help us in organizing content on minipost. Enter relevant tags to help users find your content easier</div>

                        <div className={ this.state.advertisement || this.props.ad ? "hidden-visible advertisement-contract" : "hidden advertisement-contract" }>
                            <h3 className="medium-data-text margin-bottom-5">Advertisement Contract</h3>
                            <div className="info-blurb margin-bottom-5">Select a corresponding start and end date for your advertisement. The advertisement will run from the start date up until the end of the end date. Please be advised this data cannot be changed after you submit this contract.</div>
                            <label className="medium-data-text" for="start">Start date:&nbsp;</label>
                            <input className="border-radius-round-1 margin-bottom-5" type="date" id="start" name="ad-start" ref={this.startDate} disabled={this.state.dateEditable ? "" : "disabled"}></input><br></br>
                            <label className="medium-data-text" for="end">End date:&nbsp;</label>
                            <input className="border-radius-round-1 margin-bottom-5" type="date" id="end" name="ad-end" ref={this.endDate} disabled={this.state.dateEditable ? "" : "disabled"}></input><br></br>
                            <div className="info-blurb margin-bottom-5">Specify a daily budget for your campaign. Your ad will only be ran up to the value that you choose. For example if you set a limit of $50, your ad will stop running for that day once it meets a certain amount of clicks and impressions that match that daily budget</div>
                            <label className="medium-data-text margin-bottom-5" for="cost">Max daily budget (usd):&nbsp;</label>
                            <input className="border-radius-round-1" type='text' id="upl-ad-cost" name="upl-ad-cost-input" ref={this.cost} placeholder="" disabled={this.state.costEditable ? "" : "disabled"}></input><br></br>
                            <div className="info-blurb margin-bottom-5">Specify the endpoint that you&rsquo;d like your advertisement to point to. This can lead to your website, your miniprofile or any other url that your ad is for</div>
                            <label className="medium-data-text margin-bottom-5" for="cost">Ad Url:&nbsp;</label>
                            <input className="border-radius-round-1 border-radius-round-1-long" type='text' id="upl-ad-input" name="upl-ad-url-input" ref={this.adUrl} placeholder=""></input>
                            <label className="medium-data-text margin-bottom-5" for="budgetTotal" ref={this.budgetTotal}>{this.state.budgetTotal}</label>
                        </div>
                        <div className="survey-placement-container">
                            <h5 className="weight600 margin-bottom-10">Survey</h5>
                            {
                                this.state.survey ?
                                    <div>
                                        {
                                            this.state.survey.length > 0 ?
                                                this.state.survey.map((q, i) =>
                                                    q.type ?
                                                        q.type == "text" ? <div className="margin-bottom-10">
                                                                    <div className="margin-bottom-5">
                                                                        <p className="prompt-basic-s weight600 survey-h margin-bottom-5">Text</p>
                                                                        <input type="text" placeholder="Enter Your Question" defaultValue={q.q} className="border-radius-10 border-width-1 margin-bottom-5 padding-basic weight600 q-sizing" onChange={(e) => {this.changeQ(e, i)}}></input>
                                                                        <span class="social-portal-times" onClick={(e) => {this.deleteQ(e, i)}}>×</span>
                                                                    </div>
                                                                    <select name="change-survey-q" className="border-radius-10 margin-bottom-5" onChange={(e) => {this.changeSurveyQ(e, i)}}>
                                                                        <option value="text">Text</option>
                                                                        <option value="radio">Radio</option>
                                                                        <option value="checkbox">Checkbox</option>
                                                                    </select>
                                                                </div> : q.type == "radio" ?
                                                                <div className="margin-bottom-10">
                                                                    <div className="margin-bottom-5">
                                                                        <p className="prompt-basic-s weight600 survey-h margin-bottom-5">Radio</p>
                                                                        <input type="text" placeholder="Enter Your Question" className="border-radius-10 border-width-1 margin-bottom-5 padding-basic weight600 q-sizing" defaultValue={q.q} onChange={(e) => {this.changeQ(e, i)}}></input>
                                                                        <span class="social-portal-times" onClick={(e) => {this.deleteQ(e, i)}}>×</span>
                                                                        {
                                                                            q.options ?
                                                                                q.options.length == 2 ?
                                                                                    <div className="flex-column gap5">
                                                                                        <input type="text" placeholder="Option 1" defaultValue={q.options[0]}className="border-radius-10 border-width-1 margin-bottom-2-5 padding-basic" onChange={(e) => {this.updateOption(e, 0, i)}}></input>
                                                                                        <input type="text" placeholder="Option 2" defaultValue={q.options[1]} className="border-radius-10 border-width-1 padding-basic" onChange={(e) => {this.updateOption(e, 1, i)}}></input>
                                                                                    </div>
                                                                                    : null
                                                                                :null
                                                                        }   
                                                                    </div>
                                                                    <select name="change-survey-q" className="border-radius-10 margin-bottom-5" onChange={(e) => {this.changeSurveyQ(e, i)}}>
                                                                        <option value="text">Text</option>
                                                                        <option value="radio">Radio</option>
                                                                        <option value="checkbox">Checkbox</option>
                                                                    </select>
                                                                </div>
                                                                : <div className="margin-bottom-10">
                                                                        <div className="margin-bottom-5">
                                                                            <p className="prompt-basic-s weight600 survey-h margin-bottom-5">Checkbox</p>
                                                                            <input type="text" placeholder="Enter Your Question" className="border-radius-10 border-width-1 margin-bottom-5 padding-basic weight600 q-sizing" defaultValue={q.q} onChange={(e) => {this.changeQ(e, i)}}></input>
                                                                            <span class="social-portal-times" onClick={(e) => {this.deleteQ(e, i)}}>×</span>
                                                                            <div className="flex-column gap5">
                                                                                {
                                                                                    q.options ?
                                                                                        q.options.length > 0 ?
                                                                                            q.options.map((op, j) =>
                                                                                                <input type="text" defaultValue={op} className="border-radius-10 border-width-1 margin-bottom-5 padding-basic" placeholder="Option" onChange={(e) => {this.updateOption(e, j, i)}} />
                                                                                            )
                                                                                        : null
                                                                                    : null
                                                                                }
                                                                            </div>
                                                                            {
                                                                                q.options ?
                                                                                    q.options.length < 5 ?
                                                                                    <Button className="set-survey-btn btn" onClick={(e) => {this.addOp(e, i)}}>Add Option</Button>
                                                                                    : null
                                                                                : null
                                                                            }
                                                                        </div>
                                                                        <select name="change-survey-q" className="border-radius-10" onChange={(e) => {this.changeSurveyQ(e, i)}}>
                                                                            <option value="text">Text</option>
                                                                            <option value="radio">Radio</option>
                                                                            <option value="checkbox">Checkbox</option>
                                                                        </select>
                                                                    </div>
                                                        : null
                                                )
                                                : null
                                        }
                                        {
                                            this.state.survey.length < 10 ?
                                                <Button className="set-survey-btn btn" onClick={(e) => {this.addQuestion(e)}}>Add Question</Button>
                                                : null
                                        }
                                    </div>
                                    : <Button className="set-survey-btn btn margin-bottom-5" onClick={(e) => {this.buildSurvey(e)}}>Add Survey</Button>
                            }
                        </div>
                        <form className="nudity-radio">
                            <div className="nudity-question">Is there any nudity in your video?</div>
                            <input type="radio" id="nudity-yes" name="nudity" value="yes"/>
                            <label htmlFor="nudity-yes">Yes</label>
                            <input type="radio" id="nudity-no" name="nudity" value="no" defaultChecked/>
                            <label htmlFor="nudity-no">No</label>
                            <div className="info-blurb">Please be candid with us on whether or not there is nudity in your video. We allow nudity on minipost within reason. Efforts to post restricted content on minipost can result in your account receiving strikes or account termination.<br /><NavLink exact to="/guidelines">See our guidelines for more info</NavLink></div>
                        </form>
                        {
                            this.state.productData ?
                                this.state.productData.length > 0 ?
                                    <div className="upload-placement-main-container margin-bottom-25">
                                        <h5>Product Placement</h5>
                                        <div className="info-blurb-max margin-bottom-10">You can place your own products in your video so that users can buy and sell products within the context of your playing video</div>
                                        <div className="upload-placement-container flex margin-bottom-10">
                                            {
                                                this.state.productData.map((product) =>
                                                    <div className="upload-placement-product">
                                                        <div className="upload-placement-product-meta">
                                                            <div className="prompt-basic-s3 grey-out">{product.id}</div>
                                                            <div className="prompt-basic-s weight600">{product.name}</div>
                                                            <div className="upload-product-placement-img"><img src={product.images ? product.images[0] ? product.images[0].url && this.props.cloud ? this.props.cloud + "/" + product.images[0].url : greyproduct : greyproduct : greyproduct}></img></div>
                                                        </div>
                                                        <div className="flex space-around margin-bottom-10">
                                                            <button className="btn btn-default prompt-basic-s" onClick={(e) => {this.addProductToPlacement(e, product)}}>Add</button>
                                                            <button className="btn btn-default prompt-basic-s" onClick={(e) => {this.removeProductFromPlacement(e, product)}}>Remove</button>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        </div>
                                        <button className="btn btn-default btn-ref prompt-basic-s2 margin-bottom-5" onClick={(e) => {this.clearAllPlacement(e)}}>Clear All Product Placement</button>
                                        <div className="upload-placement-added-products flex">
                                            {
                                                this.state.placementData ?
                                                    this.state.placementData.map((product) =>
                                                        <div className="placement-settings">
                                                            <div className="upload-placement-product-meta upload-placement-product-meta-settings">
                                                                <div className="prompt-basic-s3 grey-out">{product.id}</div>
                                                                <div className="prompt-basic-s weight600">{product.name}</div>
                                                            </div>
                                                            <div className="margin-bottom-10 placement-setting-inputs">
                                                                <div>
                                                                    <label className="product-placement-start-times medium-data-text grey-out weight600">Start Time:</label>
                                                                    <div className="flex placement-input-flex">
                                                                        <input type="number" id="placement-hr-start" className="placement-hr-start" name="placement-hr-start" min="0" max="48" placeholder="00" product={product.id} onBlur={(e) => {this.debounceUpdateProductPlacement(product.id)}} onChange={(e) => {this.forceTwoPlaces(product.id)}}></input>
                                                                        <span>:</span>
                                                                        <input type="number" id="placement-min-start" className="placement-min-start" name="placement-min-start" min="0" max="59" placeholder="00" product={product.id} onBlur={(e) => {this.debounceUpdateProductPlacement(product.id)}} onChange={(e) => {this.forceTwoPlaces(product.id)}}></input>
                                                                        <span>:</span>
                                                                        <input type="number" id="placement-sec-start" className="placement-sec-start" name="placement-sec-start" min="0" max="59" placeholder="00" defaultValue="00" product={product.id} onBlur={(e) => {this.debounceUpdateProductPlacement(product.id)}} onChange={(e) => {this.forceTwoPlaces(product.id)}}></input>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="product-placement-end-times medium-data-text grey-out weight600">End Time:</label>
                                                                    <div className="flex placement-input-flex" product={product.id}>
                                                                        <input type="number" id="placement-hr-end" className="placement-hr-end" name="placement-hr-end" min="0" max="48" placeholder="00" product={product.id} onBlur={(e) => {this.debounceUpdateProductPlacement(product.id)}} onChange={(e) => {this.forceTwoPlaces(product.id)}}></input>
                                                                        <span>:</span>
                                                                        <input type="number" id="placement-min-end" className="placement-min-end" name="placement-min-end" min="0" max="59" placeholder="00" product={product.id} onBlur={(e) => {this.debounceUpdateProductPlacement(product.id)}} onChange={(e) => {this.forceTwoPlaces(product.id)}}></input>
                                                                        <span>:</span>
                                                                        <input type="number" id="placement-sec-end" className="placement-sec-end" name="placement-sec-end" min="0" max="59" placeholder="00" defaultValue="00" product={product.id} onBlur={(e) => {this.debounceUpdateProductPlacement(product.id)}} onChange={(e) => {this.forceTwoPlaces(product.id)}}></input>
                                                                    </div>
                                                                </div>
                                                                <label className="medium-data-text grey-out weight600">Screen Position:</label>
                                                                <select id="screen-placement" name="screen-placement" product={product.id} onChange={(e) => {this.changeScreenPosition(e, product.id)}}>
                                                                    <option value="right">Right</option>
                                                                    <option value="left">Left</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )
                                                    : null
                                            }
                                        </div>
                                        <div className={this.state.placementError ? "upload-err-status err-status-wide margin-top-10" : ""}>{this.state.placementError}</div>
                                    </div>
                                    : null
                                : null
                        }
                        <div className={this.props.edit ? "prompt-basic-s grey-out margin-bottom-5" : "hidden"}>{this.props.edit ? "If you've made changes that you don\'t want to save you can just leave this page and nothing will be changed. Otherwise you can revise your changes and click the button below" : null}</div>
                        <Button className={this.state.progress >= 100 && this.state.videoId != "" && this.state.publishing == false && this.state.published === false ? "publish-button publish-video red-btn" : "publish-button publish-video publish-video-hidden"} onClick={this.updateRecord}>{!this.props.edit ? "Publish" : "Update"}</Button>
                    </div>
                </div>
                <div className={this.state.responseToTitle ? this.state.responseToTitle.length > 0 ? "prompt-basic grey-out responding-to" : "hidden" : "hidden"}>Responding to <Link to={this.setResponseParentLink()}>{this.state.responseToTitle ? this.state.responseToTitle : null}</Link></div>
                <div className={this.state.published && !this.state.publishedAwait ? "hidden hidden-visible prompt-basic weight600" : "hidden"}>Your video has been published, watch it <Link to={{ pathname:`/watch?v=${this.getWatchHere()}`}}>here</Link></div>
                <div className={this.state.publishedAwait ? "hidden hidden-visible prompt-basic grey-out weight600" : "hidden"}>Your video has been published but it has not finished uploading yet. You can continue to edit video details above</div>
                <div className={this.props.isLoggedIn && !this.props.edit ? "write-article-prompt prompt-basic grey-out" : "write-article-prompt hidden"}>Want to write an article instead? <NavLink exact to="/writearticle">Click here</NavLink></div>
            </div>
        )
    }
}
