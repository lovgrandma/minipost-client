import currentrooturl from '../url';
import { cookies } from '../App.js';

export const setResponseUrl = function(type = 'video', data, responseType) {
    if (responseType == 'video') {
        responseType = 'v';
    } else if (responseType == 'article') {
        responseType = 'a';
    }
    if (type == 'video') {
        return '/upload?r=' + responseType + '-' + data;
    } else if (type == 'article') {
        return '/writearticle?r=' + responseType + '-' + data;
    }
    return '/writearticle';
}

export const setReplyData = function(id) {
    try {
        if (cookies.get('loggedIn') && !this.state.published && id && id.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)) {
            let data = [id];
            fetch(currentrooturl + 'm/fetchcontentdata', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    data
                })
            })
            .then((response) => {
                return response.json(); // Parsed data
            })
            .then((data) => {
                console.log(data);
                if (data) {
                    if (data[0]) {
                        let type = '';
                        if (id.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[1] == 'v') {
                            type = 'video';
                        } else if (id.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[1] == 'a') {
                            type = 'article';
                        }
                        if (data[0].id == id.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[2] || data[0].mpd == id.match(/([a-zA-Z0-9].*)-([a-zA-Z0-9].*)/)[2]) {
                            if (data[0].title && type) {
                                this.setState({ responseToTitle: data[0].title, responseToType: type });
                                if (type == 'article') {
                                    this.setState({ responseToId: data[0].id });
                                } else {
                                    this.setState({ responseToMpd: data[0].mpd });
                                }
                            }
                        }
                    }
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
}
