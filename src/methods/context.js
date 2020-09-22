import currentrooturl from '../url.js';
import $ from 'jquery';

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
    try {
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
    } catch (err) {
        return false;
    }
    return false;
}

// Increment or decrements dislike
export const incrementDislike = async function(increment, id, type, user) {
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
    return false;
}

// like property: true for like, false for dislike. Increment is true or false, id contains either video mpd/id or article id, type defines video or article, user is name of user to record on users document data they have liked/disliked
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
            if (result) {
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
            return result;
        })
    } catch (err) {
        return false;
    }
}

export const showMoreOptions = function(e) {
    try {
        if (this.moreOptions.current) {
            if (!this.props.moreOptionsVisible) {
                this.props.setMoreOptionsVisible();
            }
        }
    } catch (err) {
        // something went wrong
    }
}

export const hideOptions = function(e) {
    try {
        console.log(e.target);
        if (e.target) {
            if (e.target.classList) {
                if (!$.contains(document.getElementsByClassName('more-options-ellipsis-container')[0], e.target)) {
                    this.setState({ moreOptionsVisible: false });
                }
            }
        }
    } catch (err) {
        // something went wrong
    }
}
