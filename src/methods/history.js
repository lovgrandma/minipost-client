import Cookies from 'universal-cookie';
import { cookies } from '../App.js';

// This function cycles the history in a cookie called "mediahistory" access video history using cookies.get('mediahistory');
// The function will determine if a mediahistory cookie exists and create it if necessary. Cycles through array cookie to see if media already exists, if so delete and push to front of array to cycle history. Will only save last 100 pieces of media. When media is cycled, thumbnail will be set again (fixes issue if publisher changes thumbnail)
// media uuid and thumbnail uuids are both 32 characters long. Regex for media includes a= so it captures first {33} while thumbnail regex captures {31}
export const updateHistory = function(type = "video") {
    const appendHistory = () => {
        let thumbnail = "00000000000000000000000000000000";
        if (this.state.thumbnail) {
            thumbnail = this.state.thumbnail;
        }
        if (window) {
            if (window.location) {
                if (window.location.search) {
                    if (!cookies.get('mediahistory') && window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)) {
                        if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0]) {
                            cookies.set('mediahistory', [ window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0] + ";" + thumbnail ], { path: '/', sameSite: true, signed: true });
                        }
                    }
                    if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)) {
                        if (window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0]) {
                            let contentHistory = cookies.get('mediahistory');
                            if (contentHistory.length > 100) {
                                contentHistory = contentHistory.slice(0, 100);
                            }
                            for (let i = 0; i < contentHistory.length; i++) {
                                if (contentHistory[i].match(/([v|a=a-zA-Z0-9].{33});([a-zA-Z0-9].{31})/)) {
                                    if (contentHistory[i].match(/([v|a=a-zA-Z0-9].{33});([a-zA-Z0-9].{31})/)[1] == window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0]) {
                                        contentHistory.splice(i, 1);
                                    }
                                }
                            }
                            contentHistory.push(window.location.search.match(/([v|a=a-zA-Z0-9].{33})/)[0] + ";" + thumbnail);
                            cookies.set('mediahistory', contentHistory, { path: '/', sameSite: true, signed: true });
                        }
                    }
                }
            }
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
