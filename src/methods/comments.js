import currentrooturl from '../url.js';
import corsdefault from '../cors.js';
import { cookies } from '../App.js';

export const publishNewComment = async function(e, location = "main", media, mediaType) {
    try {
        if (media && mediaType) {
            let hash = cookies.get('hash');
            let username = cookies.get('loggedIn');
            let append = this.state.comments ? this.state.comments.length ? this.state.comments.length : 0 : 0;
            let muteappend = true;
            if (location == "main") {
                if (this.mainNewComment.current._ref.value) {
                    let content = this.mainNewComment.current._ref.value;
                    return await fetch(currentrooturl + 'm/publishcomment', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            username, hash, content, media, mediaType, append, muteappend
                        })
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((result) => {
                        if (result) {
                            this.mainNewComment.current._ref.value = "";
                            this.setState({ comments: result.comments.data, commented: true });
                            setTimeout(() => {
                                try {
                                    this.setState({ commented: false });
                                } catch (err) {
                                    // Fail silently
                                }
                            }, 15000);
                        }
                        console.log(result);
                    })
                    .catch((err) => {
                        return false;
                    });
                } else {
                    this.setState({ error: "Failed To Post Comment" });
                    return false;
                }
            } else {
                if (this.subNewComment.current._ref.value) {
                    let content = this.subNewComment.current._ref.value;
                    let replyTo = this.state.replyToParent ? this.state.replyToParent : this.state.openReplyTo; // Choose to reply to parent as subsub comment (after first sub comment) for linear reply stream or default reply to parent as 1st sub comment
                    let subId = replyTo;
                    let subLength = this.state.subLength;
                    let cachedReplyTo = this.state.openReplyTo; // Save toc check later if reply to matches
                    return await fetch(currentrooturl + 'm/publishcomment', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            username, hash, content, media, mediaType, append, muteappend, replyTo, subId, subLength
                        })
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((result) => {
                        if (result) {
                            this.subNewComment.current._ref.value = "";
                            this.setState({ comments: result.comments.data, commentedSub: true, subId: result.comments.subId, subLength: result.comments.subLength });
                            setTimeout(() => {
                                try {
                                    if (this.state.commentedSub && this.state.openReplyTo == cachedReplyTo) { // Still showing comment published, turn off published notification
                                        this.setState({ commentedSub: false, openReplyTo: null });
                                    }
                                } catch (err) {
                                    // Fail silently
                                }
                            }, 10000);
                        }
                    })
                    .catch((err) => {
                        return false;
                    });
                } else {
                    this.setState({ error: "Failed To Post Comment" });
                    return false;
                }
            }
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

export const getComments = async function(media, mediaType, subId = null, subLength = null) {
    try {
        let hash = cookies.get('hash');
        let username = cookies.get('loggedIn');
        let append = this.state.comments ? this.state.comments.length ? this.state.comments.length : 0 : 0;
        if (subId != this.state.subId) {
            subLength = 5;
        }
        return await fetch(currentrooturl + 'm/getComments', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username, hash, media, mediaType, append, subId, subLength
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                if (result) {
                    if (result.subId) {
                        this.setState({ comments: result.data, subId: result.subId, subLength: result.subLength });
                    } else {
                        this.setState({ comments: result.data });
                    }
                } else {
                    throw new Error;
                }
            })
            .catch((err) => {
                return false;
            });
    } catch (err) {
        console.log(err);
        return false;
    }
}

export const openReply = async function(e, comment, doParentSubCom) {
    try {
        if (doParentSubCom) {
            this.setState({ replyToParent: doParentSubCom.id }); // Must track highest parent comment to do proper reply to. 
        } else {
            this.setState({ replyToParent: null });
        }
        if (comment.id) {
            this.setState({ openReplyTo: comment.id, commentedSub: false });
        } else {
            throw new Error;
        }
    } catch (err) {
        return false;
    }
}