/** playlist file utility.js
@version 0.1
@author Jesse Thompson
This file is used to create playlists. This handles what video plays next and how ads are queued inbetween playtime */

import currentrooturl from '../url';
import { deepEquals } from '../methods/utility.js';
import { cookies } from '../App.js';

export class Playlist {
    constructor(user = null, others = [], playlist = { videos:[], ads:[], defer: 0 }) {
        if (!Playlist.instance) {
            Playlist.instance = this;
            this.others = others; // Tracks other users involved in watch together
            this.playlist = playlist; // A list of the mpd's to be played
        }
        this.user = user; // Using React's dynamic functionality this will update anytime a log in change is detected
        return Playlist.instance;
    }
    
    // Make a call to server to retrieve a list of mpd's for the playlist. The server must handle organizing of the playlist. For example, it must determine the order of videos and ads. The client side can defer ads inbetween videos to later by altering the playlist but the server is responsible for setting the original order. Playlist is stored in class for reference but is primarily backed up in local storage
    buildPlaylist() {
        let localPlaylistData = JSON.parse(window.localStorage.getItem('playlistdata'));
        let defer = true;
        if (localPlaylistData) {
            if (localPlaylistData.defer) {
                if (localPlaylistData.defer < new Date().getTime()) { // if defer time past 6 hours, need to update
                    defer = false;
                }
            } else { // if no defer value, need to update
                defer = false;
            }
            if (localPlaylistData.hasOwnProperty('videos') && localPlaylistData.hasOwnProperty('ads')) {
                if (localPlaylistData.videos.length == 0 && localPlaylistData.ads.length == 0) { // no ads or videos, get more
                    defer = false; // if length of videos and ads is 0, playlist need to be populated
                }
            }
        } else {
            defer = false; // no local playlist, need to update
        }
        if (!defer) {
            let user = this.user;
            let append = this.playlist.videos.length; // Will send the length of the playlist to the server
            fetch(currentrooturl + 'm/buildplaylist', {
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
                let date = new Date().getTime() + 1000*60*60*6; // Get current time plus 6. Don't ask server again for new playlist data until 6 hours have passed
                data.defer = date;
                this.playlist = data;
                window.localStorage.setItem('playlistdata', JSON.stringify(this.playlist));
            })
            .catch((err) => {
                console.log(err);    
            });
        } else {
            this.playlist = localPlaylistData;
        }
        console.log(this.playlist);
    }
    
    // Will determine if ad points should be setup throughout video and if ad should play immediately at start of video before it begins
    checkAdSetup() {
        
    }
    
    get user() {
        return this._user;
    }
    
    get playlist() {
        return this._playlist;
    }
    
    set user(user) {
        if (this._user != user) {
            this._user = user;
        }
    }
    
    set playlist(playlist) {
        this._playlist = playlist;
    }
    
    // This will run if a playlist is already existing and has less than 10 videos queued. Can return up to 50 more videos or can be called manually by scrolling down through playlist to bottom
    get appendPlaylist() {
        
    }
}


