import Cookies from 'universal-cookie';
import { cookies } from '../App.js';
import { get } from './utility';
import parseBody from './htmlparser.js';
import $ from 'jquery';

// This function cycles the history in a cookie called "mediahistory" access video history using cookies.get('mediahistory');
// The function will determine if a mediahistory cookie exists and create it if necessary. Cycles through array cookie to see if media already exists, if so delete and push to front of array to cycle history. Will only save last 100 pieces of media. When media is cycled, thumbnail will be set again (fixes issue if publisher changes thumbnail)
// media uuid and thumbnail uuids are both 32 characters long. Regex for media includes a= so it captures first {33} while thumbnail regex captures {31}
// Store data as objects: media = { type: video/article, id: id, thumbnail: thumbnail, title: title, body: body/description, views/reads: views/reads }
// : "v/a=MEDIA0ID0000000000000000000000000;THUMBNAIL0URL000000000000000000;TITLE;BODY/DESCRIPTION;VIEWS/READS"
export const updateHistory = function(type = "video") {
    const appendHistory = () => {
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
                        // Shorten history to 100 members max and loop through members to see if media already exists. Push to front of array
                        if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)) {
                            if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0] && cookies.get('mediahistory').history) {
                                let contentHistory = cookies.get('mediahistory');
                                if (contentHistory.history.length > 100) {
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
    console.log(subscription);
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
        console.log(err);
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
