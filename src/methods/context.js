import currentrooturl from '../url.js';

export const setResponseToParentPath = function() {
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
}

// Increment or decrements like.
export const incrementLike = async function(increment, id, type, user) {
    if (type == "video" && this) {
        if (this.player) {
            if (this.player.getAssetUri()) {
                return await incrementLikeDislike(true, increment, id, type, user);
            }
        }
    } else if (type == "article" && this) {
        if (this.state) {
            if (this.state.body) {
                if (this.state.body.length > 0) {
                    return await incrementLikeDislike(true, increment, id, type, user);
                }
            }
        }
    }
    return false;
}

// Increment or decrements dislike
export const incrementDislike = async function(increment, id, type, user) {
    if (type == "video" && this) {
        if (this.player) {
            if (this.player.getAssetUri()) {
                return await incrementLikeDislike(false, increment, id, type, user);
            }
        }
    } else if (type == "article" && this) {
        if (this.state) {
            if (this.state.body) {
                if (this.state.body.length > 0) {
                    return await incrementLikeDislike(false, increment, id, type, user);
                }
            }
        }
    }
    return false;
}

// like property: False for dislike, true for like. Increment is true or false, id contains either video mpd/id or article id, type defines video or article, user is name of user to record on users document data they have liked/disliked
const incrementLikeDislike = async function(like, increment, id, type, user) {
    try {
        return await fetch(currentrooturl + 'm/likedislike', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                like, increment, id, type, user
            })
        })
            .then((response) => {
            return response.json();
        })
            .then((result) => {
            console.log(result);
        })
    } catch (err) {
        return false;
    }
}
