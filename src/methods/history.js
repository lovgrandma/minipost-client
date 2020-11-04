import Cookies from 'universal-cookie';
import { cookies } from '../App.js';
import { get } from './utility';
import parseBody from './htmlparser.js';
import $ from 'jquery';
import { createBrowserHistory } from 'history';
export default createBrowserHistory();

// This function cycles the history in a cookie called "mediahistory" access video history using cookies.get('mediahistory');
// The function will determine if a mediahistory cookie exists and create it if necessary. Cycles through array cookie to see if media already exists, if so delete and push to front of array to cycle history. Will only save last 100 pieces of media. When media is cycled, thumbnail will be set again (fixes issue if publisher changes thumbnail)
// media uuid and thumbnail uuids are both 32 characters long. Regex for media includes a= so it captures first {33} while thumbnail regex captures {31}
// Store data as objects: media = { type: video/article, id: id, thumbnail: thumbnail, title: title, body: body/description, views/reads: views/reads }
// : "v/a=MEDIA0ID0000000000000000000000000;THUMBNAIL0URL000000000000000000;TITLE;BODY/DESCRIPTION;VIEWS/READS"
export const updateHistory = function(type = "video") {
    const appendHistory = () => {
        let cookieCheck = cookies.get('mediahistory');
        if (cookieCheck && cookies.get('loggedIn')) {
            if (cookieCheck.user != cookies.get('loggedIn')) {
                cookies.remove('mediahistory');
            }
        }
        try {
            if (window) {
                if (window.location) {
                    if (window.location.search) {
                        console.log(cookies.get('mediahistory'));
                        // Create first cookie history member if no history saved in cookies
                        if (!cookies.get('mediahistory') && window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)) {
                            if (cookies.get('loggedIn') && window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0]) {
                                cookies.set('mediahistory', { user: cookies.get('loggedIn'), history: [ createMediaObject.call(this)], subscribed: [] }, { path: '/', sameSite: true, signed: true });
                            }
                        }
                        if (cookies.get('mediahistory')) {
                            if (!cookies.get('mediahistory').history) {
                                cookies.set('mediahistory', { user: cookies.get('loggedIn'), history: [ createMediaObject.call(this)], subscribed: [] }, { path: '/', sameSite: true, signed: true });
                            } else {
                                if (!Array.isArray(cookies.get('mediahistory').history)) {
                                    cookies.set('mediahistory', { user: cookies.get('loggedIn'), history: [ createMediaObject.call(this)], subscribed: [] }, { path: '/', sameSite: true, signed: true });
                                }
                            }
                        }
                        // Shorten history to 100 members max and loop through members to see if media already exists. Push to front of array
                        if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)) {
                            if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0] && cookies.get('mediahistory').history) {
                                let contentHistory = cookies.get('mediahistory');
                                if (contentHistory.history.length > 100) { // If length of history is over 100, remove oldest record
                                    contentHistory = contentHistory.history.slice(0, 100);
                                }
                                for (let i = 0; i < contentHistory.history.length; i++) {
                                    if (contentHistory.history[i].id.match(/([v|a=a-zA-Z0-9].{33})/)) {
                                        if (contentHistory.history[i].id.match(/([v|a=a-zA-Z0-9].{33})/)[1] == window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0]) {
                                            contentHistory.history.splice(i, 1); // Remove old duplicate
                                        }
                                    }
                                }
                                contentHistory.history.push(createMediaObject.call(this)); // Append duplicate as recently read or watched to front of array for cookies
                                cookies.set('mediahistory', contentHistory, { path: '/', sameSite: true, signed: true });
                            }
                        }
                    }
                }
            }
        } catch (err) {
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
        if (!cookies.get('mediahistory')) {
            for (let i = 0; i < subscription.length; i++) {
                for (let j = 0; j < subscription[i].notifications.length; j++) {
                    subscription[i].notifications[j] = subscription[i].notifications[j] + ";u";
                }
            }
            cookies.set('mediahistory', { user: cookies.get('loggedIn'), history: [], subscribed: subscription },
                        { path: '/', sameSite: true, signed: true });
            return subscription;
        } else if (cookies.get('mediahistory').subscribed.length == 0) {
            let mediahistory = cookies.get('mediahistory');
            for (let i = 0; i < subscription.length; i++) {
                for (let j = 0; j < subscription[i].notifications.length; j++) {
                    subscription[i].notifications[j] = subscription[i].notifications[j] + ";u";
                }
            }
            mediahistory.subscribed = [...subscription];
            cookies.set('mediahistory', mediahistory, { path: '/', sameSite: true, signed: true });
            return mediahistory.subscribed;
        } else {
            let mediahistory = cookies.get('mediahistory');
            // Check to see if all users in received data are present in local. If not add data to local cookie, if present determine if all new
            // content is accounted for
            for (let i = 0; i < subscription.length; i++) { // Iterate on each subscription channel in received
                let foundChannelMatch = false;
                for (let j = 0; j < mediahistory.subscribed.length; j++) { // Iterate on each subscription channel in local
                    if (subscription[i].channel == mediahistory.subscribed[j].channel) { // Channel was found in local cookies, check for content updates/inconsistency
                        for (let k = 0; k < subscription[i].notifications.length; k++) {
                            let foundContentMatch = false;
                            for (let l = 0; l < mediahistory.subscribed[j].notifications.length; l++) {
                                if (mediahistory.subscribed[j].notifications[l].match(/([A-Za-z0-9-].*);([a-z].*)/)) {
                                    if (subscription[i].notifications[k] == mediahistory.subscribed[j].notifications[l].match(/([A-Za-z0-9-].*);([a-z].*)/)[1]) {
                                        subscription[i].notifications[k] = mediahistory.subscribed[j].notifications[l];
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
                    mediahistory.subscribed.push(subscription[i]);
                }
            }
            mediahistory.subscribed = [...subscription];
            if (mediahistory) {
                cookies.set('mediahistory', mediahistory, { path: '/', sameSite: true, signed: true });
            }
            return mediahistory.subscribed;
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
