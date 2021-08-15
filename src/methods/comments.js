import currentrooturl from '../url.js';
import corsdefault from '../cors.js';
import { cookies } from '../App.js';

export const publishNewComment = async function(e, location = "main", media, mediaType, re = null) {
    try {
        if (media && mediaType) {
            if (location == "main") {
                if (this.mainNewComment.current._ref.value) {
                    let hash = cookies.get('hash');
                    let username = cookies.get('loggedIn');
                    let content = this.mainNewComment.current._ref.value;
                    let append = 0;
                    return await fetch(currentrooturl + 'm/publishcomment', {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({
                            username, hash, content, media, mediaType, re, append
                        })
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((result) => {
                        if (result) {
                            this.mainNewComment.current._ref.value = "";
                            this.setState({ comments: result.comments, commented: true });
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

            }
        } else {
            return false;
        }
    } catch (err) {
        console.log(err);
        return false;
    }
}

export const getComments = async function(media, mediaType) {
    try {
        let hash = cookies.get('hash');
        let username = cookies.get('loggedIn');
        let append = this.state.comments ? this.state.comments.length ? this.state.comments.length : 0 : 0;
        return await fetch(currentrooturl + 'm/getComments', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username, hash, media, mediaType, append
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                if (result) {
                    console.log(result);
                    this.setState({ comments: result });
                } else {
                    throw new Error;
                }
            })
            .catch((err) => {
                return false;
            });
    } catch (err) {
        return false;
    }
}