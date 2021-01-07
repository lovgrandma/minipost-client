import Cookies from 'universal-cookie';
import { cookies } from '../App.js';
import { get, deepEquals } from './utility';
import parseBody from './htmlparser.js';
import $ from 'jquery';
import { createBrowserHistory } from 'history';
export default createBrowserHistory();

// This function cycles the history in local storage called "mediahistory" access video history using JSON.parse(window.localStorage.getItem('mediahistory'))
// The function will determine if a mediahistory cookie exists and create it if necessary. Cycles through array cookie to see if media already exists, if so delete and push to front of array to cycle history. Will only save last 100 pieces of media. When media is cycled, thumbnail will be set again (fixes issue if publisher changes thumbnail)
// media uuid and thumbnail uuids are both 32 characters long. Regex for media includes a= so it captures first {33} while thumbnail regex captures {31}
// Store data as objects: media = { type: video/article, id: id, thumbnail: thumbnail, title: title, body: body/description, views/reads: views/reads }
// : "v/a=MEDIA0ID0000000000000000000000000;THUMBNAIL0URL000000000000000000;TITLE;BODY/DESCRIPTION;VIEWS/READS"
export const updateHistory = function(type = "video") {
    console.log(JSON.parse(window.localStorage.getItem('mediahistory')));
    const appendHistory = () => {
        let cookieCheck = JSON.parse(window.localStorage.getItem('mediahistory'));
        cookieCheck.history = checkBadHistoryData(cookieCheck.history);
        window.localStorage.setItem('mediahistory', JSON.stringify(cookieCheck));
        if (cookieCheck && cookies.get('loggedIn')) {
            if (cookieCheck.user != cookies.get('loggedIn')) {
                window.localStorage.removeItem('mediahistory');
            }
        }
        try {
            if (window) {
                if (window.location) {
                    if (window.location.search) {
                        // Create first cookie history member if no history saved in cookies
                        if (!window.localStorage.getItem('mediahistory') && window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)) {
                            if (window.localStorage.getItem('loggedIn') && window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0]) {
                                let mediaObject = { user: cookies.get('loggedIn'), history: checkBadHistoryData([ createMediaObject.call(this)]), subscribed: [] };
                                window.localStorage.setItem('mediahistory', JSON.stringify(mediaObject));
                            }
                        }
                        if (window.localStorage.getItem('loggedIn')) {
                            let temp = JSON.parse(window.localStorage.getItem('mediahistory'));
                            if (!temp.history) {
                                let mediaObject = { user: cookies.get('loggedIn'), history: checkBadHistoryData([ createMediaObject.call(this)]), subscribed: [] };
                                window.localStorage.setItem('mediahistory', JSON.stringify(mediaObject));
                            } else {
                                if (!Array.isArray(temp.history)) {
                                    let mediaObject = { user: cookies.get('loggedIn'), history: checkBadHistoryData([ createMediaObject.call(this)]), subscribed: [] };
                                    window.localStorage.setItem('mediahistory', JSON.stringify(mediaObject));
                                }
                            }
                        }
                        // Shorten history to 100 members max and loop through members to see if media already exists. Push to front of array
                        if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)) {
                            let temp = JSON.parse(window.localStorage.getItem('mediahistory'));
                            if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0] && temp.history) {
                                if (temp.history.length > 100) { // If length of history is over 100, remove oldest record
                                    temp = temp.history.slice(0, 100);
                                }
                                for (let i = 0; i < temp.history.length; i++) {
                                    if (temp.history[i].id.match(/([v|a=a-zA-Z0-9].{33})/)) {
                                        if (temp.history[i].id.match(/([v|a=a-zA-Z0-9].{33})/)[1] == window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0]) {
                                            temp.history.splice(i, 1); // Remove old duplicate
                                        }
                                    }
                                }
                                const doPush = async () => {
                                    let object = createMediaObject.call(this);
                                    if (object) {
                                        let contentLength = await temp.history.push(object); // Append duplicate as recently read or watched to front of array for cookies
                                        if (contentLength) {
                                            return temp;
                                        } else {
                                            return null;
                                        }
                                    }
                                }
                                doPush().then(async (contentHistory) => {
                                    if (contentHistory) {
                                        window.localStorage.setItem('mediahistory', JSON.stringify(contentHistory));
                                    }
                                });
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err);
            // Something went wrong
        }
    }
    // If appending history video, check to ensure video is valid before adding location to history, else it is article. Article runs article validity check in article.js on page fetch
    if (type == "video") {
        if (doubleCheck.call(this)) {
            appendHistory();
        }
    } else {
        appendHistory();
    }
}

export const updateNotif = function(subscription) {
    if (cookies.get('loggedIn')) {
        if (!window.localStorage.getItem('mediahistory')) {
            for (let i = 0; i < subscription.length; i++) {
                for (let j = 0; j < subscription[i].notifications.length; j++) {
                    subscription[i].notifications[j] = subscription[i].notifications[j] + ";u";
                }
            }
            let temp = { user: cookies.get('loggedIn'), history: [], subscribed: subscription }
            window.localStorage.setItem('mediahistory', JSON.stringify(temp));
            return subscription;
        } else {
            let temp = JSON.parse(window.localStorage.getItem('mediahistory'));
            if (temp.subscribed.length == 0) {
                for (let i = 0; i < subscription.length; i++) {
                    for (let j = 0; j < subscription[i].notifications.length; j++) {
                        subscription[i].notifications[j] = subscription[i].notifications[j] + ";u";
                    }
                }
                temp.subscribed = [...subscription];
                window.localStorage.setItem('mediahistory', JSON.stringify(temp));
                return temp.subscribed;
            } else {
                let temp = JSON.parse(window.localStorage.getItem('mediahistory'));
                // Check to see if all users in received data are present in local. If not add data to local cookie, if present determine if all new
                // content is accounted for
                for (let i = 0; i < subscription.length; i++) { // Iterate on each subscription channel in received
                    let foundChannelMatch = false;
                    for (let j = 0; j < temp.subscribed.length; j++) { // Iterate on each subscription channel in local
                        if (subscription[i].channel == temp.subscribed[j].channel) { // Channel was found in local cookies, check for content updates/inconsistency
                            for (let k = 0; k < subscription[i].notifications.length; k++) {
                                let foundContentMatch = false;
                                for (let l = 0; l < temp.subscribed[j].notifications.length; l++) {
                                    if (temp.subscribed[j].notifications[l].match(/([A-Za-z0-9-].*);([a-z].*)/)) {
                                        if (subscription[i].notifications[k] == temp.subscribed[j].notifications[l].match(/([A-Za-z0-9-].*);([a-z].*)/)[1]) {
                                            subscription[i].notifications[k] = temp.subscribed[j].notifications[l];
                                            foundContentMatch = true;
                                        }
                                    }
                                }
                                if (!foundContentMatch) {
                                    subscription[i].notifications[k] = subscription[i].notifications[k] + ";u";
                                }
                            }
                            foundChannelMatch = true;
                            break;
                        }
                    }
                    if (!foundChannelMatch) {
                        for (let k = 0; k < subscription[i].notifications.length; k++) {
                            subscription[i].notifications[k] = subscription[i].notifications[k] + ";u";
                        }
                        temp.subscribed.push(subscription[i]);
                    }
                }
                temp.subscribed = [...subscription];
                window.localStorage.setItem('mediahistory', JSON.stringify(temp));
                return temp.subscribed;
            }
        }
    }
}

// Will create a generic media object depending on type of media
const createMediaObject = function() {
    try {
        if (get(this, 'state')) {
           if (this.state.mpd) {
               return {
                   id: window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0],
                   title: this.state.title,
                   views: this.state.views,
                   thumbnail: this.state.thumbnail,
                   published: this.state.published,
                   author: this.state.author,
                   description: this.state.description
               }
           } else if (this.state.id) {
               return {
                   id: window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0],
                   title: this.state.title,
                   reads: this.state.reads,
                   thumbnail: this.state.thumbnail,
                   published: this.state.published,
                   author: this.state.author,
                   body: parseBody(this.state.body, 400, true)
               }
           }
        }
        return false;
    } catch (err) {
        // something went wrong
        return false;
    }
}

const checkBadHistoryData = function(arr) {
    for (let i = 0; i < arr.length; i++) {
        if (!arr[i]) {
            arr.splice(i, 1);
        }
    }
    return arr;
}

// Checks to ensure that video playing is valid before putting path into history
const doubleCheck = function() {
    if (this.player) {
        if (this.player.getAssetUri) {
            if (this.player.getAssetUri()) {
                return true;
            }
        } else {
            return setTimeout(() => {
                if (this.player) {
                    if (this.player.getAssetUri) {
                        if (this.player.getAssetUri()) {
                            return true;
                        }
                    }
                }
            }, 2000);
        }
    } else {
        return setTimeout(() => {
            if (this.player) {
                if (this.player.getAssetUri) {
                    if (this.player.getAssetUri()) {
                        return true;
                    }
                }
            }
        }, 2000);
    }
    return false;
}
