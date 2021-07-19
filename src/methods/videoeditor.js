import currentrooturl from '../url.js';
import corsdefault from '../cors.js';
import { cookies } from '../App.js';

export const getTracks = async function() {
    try {
        if (this.searchTracks.current.value) {
            let username = cookies.get('loggedIn');
            let hash = cookies.get('hash');
            let self = true;
            let search = this.searchTracks.current.value;
            return await fetch(currentrooturl + 'm/searchtracks', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, self, search
                })
            })
            .then((response) => {
                return response.json();
            })
            .then(async (result) => {
                if (result.data) {
                    if (Array.isArray(result.data)) {
                        this.setState({ trackResults1: result.data });
                    }
                }
            })
            .catch((err) => {
                this.setState({ trackResults1: [] });
                return false;
            });
        } else {
            this.setState({ trackResults1: [] });
            return [];
        }
    } catch (err) {
        return [];
    }
}

export const destroyToneEnvironment = async function() {
    try {
        if (this.track1Player) {
            this.track1Player.stop();
            this.track1Player.dispose();
            this.track1Player = null;
        }
        this.tone.Transport.stop();
        if (this.state) {
            if (this.state.track1Interval) {
                clearInterval(this.state.track1Interval);
            }
        }
    } catch (err) {
        console.log(err);
    }
}

export const loadOntoTrack = async function(record, track = 1) {
    if (track == 1) {
        if (this.track1Player) {
            if (this.track1Player.state == "started") {
                this.track1Player.stop();
                this.track1Player.dispose();
                this.track1Player = null;
            }
        }
        record.time = 0;
        this.setState({ track1Src: record, track1State: "stopped" });
        this.track1Player = new this.tone.Player(`${this.props.cloud}/${record.mpd}-audio.mp4`).toDestination();
        var au = document.createElement('audio');
        au.src = `${this.props.cloud}/${record.mpd}-audio.mp4`;
        au.addEventListener('loadedmetadata', () => {
            let t = this.state.track1Src;
            t.duration = au.duration;
            this.setState({ track1Src: t });
        }, false);
        this.tone.Transport.stop();
        this.tone.Transport.seconds = 0;
    } else {
        if (this.track2Player) {
            this.track2Player.unsync();
        }
        record.time = 0;
        this.setState({ track2Src: record, track2State: "stopped" });
    }
}

export const playTrack = async function(track = 1) {
    const pauseTrack = (track) => {
        if (track == 1) {
            console.log(this.track1Player);
            console.log(this.tone.Transport);
            let t = this.state.track1Src;
            t.time = this.tone.Transport.seconds;
            this.setState({ track1State: t });
            this.tone.Transport.pause();
            this.track1Player.stop();
            this.setState({ track1State: this.track1Player.state });
        } else {
            let t = this.state.track2Src;
            t.time = this.track2Player.now();
            this.setState({ track2State: t });
            this.track2Player.stop();
            this.setState({ track2State: this.track2Player.state });
        }
    }
    try {
        if (track == 1) {
            if (this.track1Player.loaded) {
                if (this.track1Player.state == "started") {
                    pauseTrack(1);
                } else {
                    this.tone.Transport.start();
                    this.track1Player.start(0, this.state.track1Src.time);
                    this.setState({ track1State: this.track1Player.state });
                }
            }
        } else {
            if (this.track2Player.state == "started") {
                pauseTrack(2);
            } else {
                this.track1Player.start(0, this.state.track1Src.time);
                this.setState({ track1State: this.track1Player.state });
            }
        }
    } catch (err) {
        if (track == 1) {
            pauseTrack(1);
        } else {
            pauseTrack(2);
        }
    }
}

export const buildToneEnvironment = async function() {
    try {
        let interval = setInterval((i) => {
            try {
                if (this.tone && this.state) {
                    if (this.tone.Transport && this.state.track1Src) {
                        if (typeof this.tone.Transport.seconds == "number" && this.state.track1Src.duration) {
                            var t1t = (this.tone.Transport.seconds / this.state.track1Src.duration) * 100; // Calculate time of current playback
                            if (t1t > 100) {
                                this.tone.Transport.stop();
                                this.tone.Transport.seconds = 0;
                                this.track1Player.stop();
                                this.setState({ track1State: this.track1Player.state });
                            }
                            this.setState({ track1Time: t1t });
                            var marker = document.getElementsByClassName('track1-marker1')[0];
                            marker.style.left = t1t + "%";
                        }
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }, 20);
        this.setState({ track1Interval: interval });
    } catch (err) {
        // Fail silently
    }
}

export const gotoTime = async function(track, x, w) {
    try {
         if (track == 1) {
            let dur = this.state.track1Src.duration;
            var t = x/w * dur;
            this.track1Player.seek(t);
            this.tone.Transport.seconds = t;
         } else {
            // For later implementation of two tracks, mixing 2 tracks dj
         }
    } catch (err) {
        console.log(err); // Fail silently
    }
}