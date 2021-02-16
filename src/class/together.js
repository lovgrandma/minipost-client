/** playlist file utility.js
@version 0.1
@author Jesse Thompson
This file is used to manage live video playback amongst two users who are already sharing a chat */

import currentrooturl from '../url';
import Playlist from './playlist.js';

export class Together {
    constructor(host = null, others = [], room = '', playlist = { videos:[], ads:[], defer: 0 }) {
        if (!Together.instance) {
            Together.instance = this;
            this.host = host;
            this.others = others; // Tracks other users involved in watch together
            this.room = room;
            this.playlist = playlist; // A list of the mpd's to be played
        }
        return Together.instance;
    }
    
    // Builds single playlist in local storage. Returns whether or not request for playlist videos on server side should be deferred or not
    buildPlaylistLocalStorage() {
        let localPlaylistData = JSON.parse(window.localStorage.getItem('togetherdata'));
        if (localPlaylistData) {
            if (localPlaylistData.defer) {
                if (localPlaylistData.defer == 0) {
                    return false;
                }
                // if defer time past 3 hours, need to update. Defer time is always created as current time plus 3 hours. So if it is less than current time then it should be updated from server. This must be updated as advertisers reach ad limits and new ads must be recommended
                if (localPlaylistData.defer < new Date().getTime()) { 
                    return false;
                }
            } else { // if no defer value, need to update
                return false;
            }
            if (localPlaylistData.hasOwnProperty('videos') && localPlaylistData.hasOwnProperty('ads')) {
                if (localPlaylistData.videos.length == 0 && localPlaylistData.ads.length == 0) { // no ads or videos, get more
                    return false; // if length of videos and ads is 0, playlist need to be populated
                }
            }
        } else {
            return false; // no local playlist, need to update
        }
        return true;
    }
    // Make a call to server to retrieve a list of mpd's for the playlist. The server must handle organizing of the playlist. For example, it must determine the order of videos and ads. The client side can defer ads inbetween videos to later by altering the playlist but the server is responsible for setting the original order. Playlist is stored in class for reference but is primarily backed up in local storage
    buildPlaylist = async (skipDeferCheck = false) => {
        let defer = true;
        if (!skipDeferCheck) {
            defer = this.buildPlaylistLocalStorage();
        }
        console.log(defer, skipDeferCheck);
        if (!defer || skipDeferCheck) {
            console.log("Running build playlist");
            let user = this.host;
            let append = this.playlist.videos.length; // Will send the length of the playlist to the server
            return await fetch(currentrooturl + 'm/buildplaylist', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    user, append
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                console.log(data);
                let date = new Date().getTime() + 1000*60*60*3; // Get current time plus 3. Don't ask server again for new playlist data until 3 hours have passed
                data.defer = date;
                data.adTimes = {
                    start: 0, // Will be last time ad was played at start of video, set null at start
                    end: 0, // Will be last time ad was played at end of video, set null at start
                    vids: 0
                }
                this.playlist = data;
                window.localStorage.setItem('togetherdata', JSON.stringify(this.playlist));
                return this.playlist;
            })
            .catch((err) => {
                console.log(err); 
                return null;
            });
        } else {
            this.playlist = JSON.parse(window.localStorage.getItem('togetherdata'));
        }
    }
    
    // Will determine if ad points should be setup throughout video and if ad should play immediately at start of video before it begins or at end
    checkAdSetup = async() => {
        let playlistExists = this.buildPlaylistLocalStorage();
        if (!playlistExists) {
            let playlist = await this.buildPlaylist(true);
            if (playlist.adTimes) {
                return playlist.adTimes;
            } else {
                return null;
            }
        } else {
            return this.playlist.adTimes;
        }
    }
    
    get host() {
        return this._host;
    }
    
    get playlist() {
        return this._playlist;
    }

    get playlistVidsWatched() {
        return this._playlist.adTimes.vids;
    }

    incrementVidsWatched() {
        let localPlaylistData = JSON.parse(window.localStorage.getItem('togetherdata'));
        if (!localPlaylistData) {
            this.buildPlaylist();
        } else {
            this.playlist.adTimes.vids = this.playlist.adTimes.vids + 1;
            localPlaylistData.adTimes.vids = localPlaylistData.adTimes.vids + 1;
            window.localStorage.setItem('togetherdata', JSON.stringify(localPlaylistData));
        }
    }

    setVidsWatchedZero() {
        let localPlaylistData = JSON.parse(window.localStorage.getItem('togetherdata'));
        if (!localPlaylistData) {
            this.buildPlaylist();
        } else {
            this._playlist.adTimes.vids = 0;
            localPlaylistData.adTimes.vids = 0;
            window.localStorage.setItem('togetherdata', JSON.stringify(localPlaylistData));
        }
    }
    
    setAdStart() {
        let newTime = new Date().getTime();
        if (this._playlist && JSON.parse(window.localStorage.getItem('togetherdata'))) {
            this._playlist.adTimes.start = newTime;
            let localPlaylistData = JSON.parse(window.localStorage.getItem('togetherdata'));
            localPlaylistData.adTimes.start = newTime;
            window.localStorage.setItem('togetherdata', JSON.stringify(localPlaylistData));
            return newTime;
        } else {
            this.buildPlaylist();
            return null;
        }
    }

    setAdEnd() {
        let newTime = new Date().getTime();
        if (this._playlist && JSON.parse(window.localStorage.getItem('togetherdata'))) {
            this._playlist.adTimes.end = newTime;
            let localPlaylistData = JSON.parse(window.localStorage.getItem('togetherdata'));
            localPlaylistData.adTimes.end = newTime;
            window.localStorage.setItem('togetherdata', JSON.stringify(localPlaylistData));
            return newTime;
        } else {
            this.buildPlaylist();
            return null;
        }
    }

    // Will shuffle the ads playlist to show the next ad on next ad play
    incToNextAd() {
        let localPlaylistData = JSON.parse(window.localStorage.getItem('togetherdata'));
        if (this._playlist && localPlaylistData) {
            let first = localPlaylistData.ads.shift();
            localPlaylistData.ads.push(first);
            this._playlist.ads = localPlaylistData.ads;
            window.localStorage.setItem('togetherdata', JSON.stringify(localPlaylistData));
            return this._playlist.ads;
        } else {
            this.buildPlaylist();
            return null;
        }
    }

    set host(host) {
        if (this._host != host) {
            this._host = host;
        }
    }
    
    set playlist(playlist) {
        this._playlist = playlist;
    }
    
    // This will run if a playlist is already existing and has less than 10 videos queued. Can return up to 50 more videos or can be called manually by scrolling down through playlist to bottom
    get appendPlaylist() {
        
    }
    
    
}