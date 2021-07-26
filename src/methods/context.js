import currentrooturl from '../url.js';
import corsdefault from '../cors.js';
import $ from 'jquery';
import { get } from './utility.js';
import { cookies } from '../App.js';
import parseBody from './htmlparser.js';

export const setResponseToParentPath = function() {
    try {
        if (this.state.responseTo) {
            if (this.state.responseTo.type == "video" && this.state.responseTo.mpd) {
                return {
                    pathname:`/watch?v=${this.state.responseTo.mpd}`
                }
            } else if (this.state.responseTo.type == "article" && this.state.responseTo.id) {
                return {
                    pathname:`/read?a=${this.state.responseTo.id}`
                }
            }
        }
        return {
            pathname:`/`
        }
    } catch (err) {
        return {
            pathname: '/'
        }
    }
}

// Increment or decrements like.
export const incrementLike = async function(increment, id, type, user, fetched) {
    try {
        if (fetched) {
            if (type == "video" && this) {
                if (this.player) {
                    if (this.player.getAssetUri()) {
                        return await incrementLikeDislike.call(this, true, increment, id, type, user);
                    }
                }
            } else if (type == "article" && this) {
                if (this.state) {
                    if (this.state.body) {
                        if (this.state.body.length > 0) {
                            return await incrementLikeDislike.call(this, true, increment, id, type, user);
                        }
                    }
                }
            }
        }
    } catch (err) {
        return false;
    }
    return false;
}

// Increment or decrements dislike
export const incrementDislike = async function(increment, id, type, user) {
    try {
        if (type == "video" && this) {
            if (this.player) {
                if (this.player.getAssetUri()) {
                    return await incrementLikeDislike.call(this, false, increment, id, type, user);
                }
            }
        } else if (type == "article" && this) {
            if (this.state) {
                if (this.state.body) {
                    if (this.state.body.length > 0) {
                        return await incrementLikeDislike.call(this, false, increment, id, type, user);
                    }
                }
            }
        }
    } catch (err) {
        return false;
    }
    return false;
}

// like property: true for like, false for dislike. Increment is true or false, id contains either video mpd/id or article id, type defines video or article, user is name of user to record on users document data they have liked/disliked
const incrementLikeDislike = async function(like, increment, id, type, username) {
    try {
        let hash = cookies.get('hash');
        return await fetch(currentrooturl + 'm/likedislike', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                like, increment, id, type, username, hash
            })
        })
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            if (result) {
                if (result.action) {
                    if (result.action == "logout") {
                        cookies.remove('loggedIn', { path: '/' }); // User logged out
                        cookies.remove('hash', { path: '/' });
                    }
                } else {
                    let likes = this.state.likes;
                    let dislikes = this.state.dislikes;
                    if (like) {
                        if (increment) {
                            this.setState({ likes: likes + 1 });
                            this.setState({ liked: true });
                            if (this.state.disliked) {
                                this.setState({ dislikes: dislikes - 1 });
                            }
                            this.setState({ disliked: false });
                        } else {
                            this.setState({ likes: likes - 1 });
                            this.setState({ liked: false });
                        }
                    } else {
                        if (increment) {
                            this.setState({ dislikes: dislikes + 1 });
                            this.setState({ disliked: true });
                            if (this.state.liked) {
                                this.setState({ likes: likes - 1 });
                            }
                            this.setState({ liked: false });
                        } else {
                            this.setState({ dislikes: dislikes - 1 });
                            this.setState({ disliked: false });
                        }
                    }
                }
            }
            return result;
        })
        .catch((err) => {
            return false;
        })
    } catch (err) {
        return false;
    }
}

export const showMoreOptions = function(e, type = "replies") {
    try {
        if (type == "replies") {
            if (this.moreOptions.current) {
                if (!this.props.moreOptionsVisible) {
                    this.props.setMoreOptionsVisible();
                }
            }
        } else if (type == "upload") {
            if (this.uploadOptions) {
                if (this.uploadOptions.classList.contains("visible")) {
                    return this.uploadOptions.classList.remove("visible");
                } else if (!this.uploadOptions.classList.contains("visible")) {
                    resetOpenMenus.call(this, "upload");
                    return this.uploadOptions.classList.add("visible");
                }
            }
        } else if (type == "profile") {
            if (this.userOptions) {
                if (this.userOptions.classList.contains("visible")) {
                    return this.userOptions.classList.remove("visible");
                } else if (!this.userOptions.classList.contains("visible")) {
                    resetOpenMenus.call(this, "profile");
                    return this.userOptions.classList.add("visible");
                }
            }
        }
    } catch (err) {
        // something went wrong
    }
}

export const resetOpenMenus = function(exclude) {
    try {
        if (exclude != "upload") {
            if (document.getElementsByClassName('btn-desc-upl')) {
                if (document.getElementsByClassName('btn-desc-upl')[0]) {
                    if (document.getElementsByClassName('btn-desc-upl')[0].classList.contains("visible")) {
                        document.getElementsByClassName('btn-desc-upl')[0].classList.remove("visible");
                    }
                }
            }
        }
        if (exclude != "profile") {
            if (document.getElementsByClassName('btn-desc-conf-menu')) {
                if (document.getElementsByClassName('btn-desc-conf-menu')[0]) {
                    if (document.getElementsByClassName('btn-desc-conf-menu')[0].classList.contains("visible")) {
                        document.getElementsByClassName('btn-desc-conf-menu')[0].classList.remove("visible");
                    }
                }
            }
        }
        return;
    } catch (err) {
        // Fail silently
    }
}

export const hideOptions = function(e, type = "replies") {
    try {
        if (type == "replies") {
            if (e.target) {
                if (e.target.classList) {
                    if (!$.contains(document.getElementsByClassName('more-options-ellipsis-container')[0], e.target)) {
                        this.setState({ moreOptionsVisible: false });
                    }
                }
            }
        }
    } catch (err) {
        // something went wrong
    }
}

export const showContentMenu = function(e) {
    if (this.state.contentMenu === false) {
        this.setState({ contentMenu: true });
        this.setState({ deleteErr: ""})
        this.setState({ deleteContentPrompt: false });
    } else {
        this.setState({ deleteErr: ""})
        this.setState({ contentMenu: false });
    }
}

export const promptDeleteContent = function(e) {
    if (this.state.deleteContentPrompt === false) {
        this.setState({ deleteContentPrompt: true });
        this.setState({ contentMenu: false });
    } else {
        this.setState({ deleteErr: ""})
        this.setState({ deleteContentPrompt: false });
    }
}

export const tryDeleteContent = async function(e) {
    let id = '';
    let type = "";
    if (this.props.mpd) {
        id = this.props.mpd;
        type = "video";
    } else if (this.props.id) {
        id = this.props.id;
        type = "article";
    }
    let ad = null;
    if (this.props.ad) {
        ad = this.props.ad;
    }
    if (get(this, "titleDelete.current.value") && id) {
        if (this.titleDelete.current.value == "delete me") {
            let confirm = this.titleDelete.current.value;
            if (id && type) {
                await fetch(currentrooturl + 'm/deleteOneContent', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        id, type, ad
                    })
                })
                .then(function(response) {
                    return response.json();
                })
                .then((result) => {
                    if (result == true) {
                        window.location.reload(false);
                    }
                })
            }
        } else {
            this.setState({ deleteErr: "the title you entered does not match the content's title"})
        }
    }
}

export const resolveViews = function() {
    if (!this.props.title) {
        return '';
    } else {
        return this.props.views;
    }
}


export const editable = function() {
    if (cookies.get('loggedIn')) {
        if (cookies.get('loggedIn') == this.state.username) {
            return true;
        }
    }
    return false;
}

export const canFollow = function() {
    if (cookies.get('loggedIn')) {
        if (editable.call(this) == true) {
            return false;
        } else {
            return true;
        }
    } 
    return false;
}

export const isAd = function(record) {
    if (record.dailyBudget && record.mpd || record.hasOwnProperty('clicks')) {
        return "AdVideo";
    } else {
        return false;
    }
}

export const getPathnameMatchProfile = async function() {
    try {
        if (this.props.location.search) {
            if (this.props.location.search.length > 0) {
                if (this.props.location.search.match(/\?(s|p)=([a-zA-Z0-9].*)/)) {
                    if (this.props.location.search.match(/\?(s|p)=([a-zA-Z0-9].*)/)[2]) {
                        return await this.fetchProfileData(this.props.location.search.match(/\?(s|p)=([a-zA-Z0-9].*)/)[2]);
                    }
                }
            }
        }
        if (this.props.location.pathname) {
            if (this.props.location.pathname.length > 0) {
                if (this.props.location.pathname.match(/\?(s|p)=([a-zA-Z0-9].*)/)) {
                    if (this.props.location.pathname.match(/\?(s|p)=([a-zA-Z0-9].*)/)[2]) {
                        return await this.fetchProfileData(this.props.location.pathname.match(/\?(s|p)=([a-zA-Z0-9].*)/)[2]);
                    }
                }
            }
        }
        return await this.fetchProfileData(cookies.get('loggedIn')); // fetch user data
    } catch (err) {
        // Component unmounted
    }
}

export const interceptProfileMenuClick = function(page) {
    try {
        if (page) {
            this.setState({ page: page });
        } else {
            this.setState({ page: "" });
        }
    } catch (err) {
        // Fail silently
    }
}

export const resolveMeta = function(type) {
    try {
        switch (type) {
            case "title":
                return this.state.title;
            case "description":
                return this.state.description;
            case "vThumbnail":
                return this.state.cloud + "/" + this.state.thumbnail + ".jpeg";
            case "url":
                return window.location.href;
            case "sitename":
                return "Minipost";
            case "body":
                return parseBody(this.state.body).toString();
            default:
                return "";
        }
    } catch (err) {
        return "";
    }
}

export const deleteProcessingVideo = async function() {
    console.log("delete processing")
    let username = cookies.get('loggedIn');
    let hash = cookies.get('hash');
    let self = true;
    if (username && hash) {
        let data = await fetch(currentrooturl + 'm/deleteprocessingvideo', {
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
            return response.json(response);
        })
        .then((result) => {
            return result;
        })
        .catch((err) => {
            return err;
        });
        if (data) {
            if (data.querystatus) {
                window.location.reload(); // Will send user back to upload page after video deletion
            }
        }
    }
}

export const submitSurvey = async function(e) {
    try {
        this.setState({ surveyErr: null });
        let username = cookies.get('loggedIn');
        let hash = cookies.get('hash');
        let survey = this.state.survey;
        let author = this.state.author;
        if (username && hash && survey && author) {
            return await fetch(currentrooturl + 'm/submitsurvey', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username, hash, survey, author
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                if (result) {
                    let surveys = window.localStorage.getItem('surveys') ? JSON.parse(window.localStorage.getItem('surveys')) : [];
                    if (surveys.indexOf(this.state.mpd) < 0) {
                        surveys.push(this.state.mpd);
                        surveys = surveys.length > 1000 ? surveys.slice(0, 1000) : surveys; // Max completed recorded surveys on local storage
                        surveys = JSON.stringify(surveys);
                        window.localStorage.setItem('surveys', surveys);
                        this.setState({ surveySubmitted: true });
                    }
                } else {
                    this.setState({ surveyErr: "We weren't able to submit the survey. Please try a bit later." });
                }
            })
            .catch((err) => {
                this.setState({ surveyErr: "We weren't able to submit the survey. Please try a bit later." });
                return false;
            });
        } else {
            throw new Error;
        }
    } catch (err) {
        this.setState({ surveyErr: "We weren't able to submit the survey. Please try a bit later." });
        return false;
    }
}

export const checkCompletedSurvey = async function(mpd) {
    try {
        let surveys = window.localStorage.getItem('surveys') ? JSON.parse(window.localStorage.getItem('surveys')) : [];
        if (surveys.indexOf(mpd) < 0) {
            return false;
        } else {
            return true;
        }
    } catch (err) {
        return false;
    }
}

export const updateA = async function(q, i, e) {
    try {
        let t = this.state.survey;
        if (q.type == "checkbox") {
            let c = document.getElementsByName(e.target.name);
            let checked = [];
            for (let i = 0; i < c.length; i++) {
                if (c[i].checked) {
                    checked.push(c[i].value);
                }
            }
            t[i].a = checked;
            this.setState({ survey: t });
        } else {
            t[i].a = e.target.value; // Recorded answer by user 
            this.setState({ survey: t });
        }
    } catch (err) {
        // Fail silently
    }
}

export const subscribeMinipost = async function(e) {
    try {
        this.setState({ error: null });
        let email = this.email.current.value;
        return await fetch(currentrooturl + 'm/subscribeminipost', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    email
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                if (result) {
                    this.setState({ subscribed: true });
                } else {
                    this.setState({ error: "We had an issue subscribing you please try again. "});
                }
            })
            .catch((err) => {
                return false;
            });
    } catch (err) {
        return false;
    }
}

export const unsubscribeMinipost = async function(email) {
    try {
        this.setState({ error: null });
        if (email) {
            return await fetch(currentrooturl + 'm/unsubscribeminipost', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        email
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        this.setState({ unsubscribed: true });
                    } else {
                        throw new Error;
                    }
                })
                .catch((err) => {
                    this.setState({ error: "We were unable to unsubscribe you. Contact us at admin@minipost.app" });
                    return false;
                });
        } else {
            throw new Error;
        }
    } catch (err) {
        this.setState({ error: "We were unable to unsubscribe you. Contact us at admin@minipost.app" });
        return false;
    }
}