import React, {Component} from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import Videos from './videos.js';
import ArticlePreview from './articlepreview.js';
import currentrooturl from '../url';
import dummythumbnail from '../static/greythumb.jpg';
import { cookies } from '../App.js';
import { get, setData } from '../methods/utility.js';

export default class Options extends Component {
    constructor() {
        super();
        this.state = { username: "", avatarurl: '', uploadavatarbusy: false }
        this.upload = React.createRef();
    }

    componentDidMount = async () => {
        try {
            this.fetchProfileOptionsData();
            this.setState({ uploadavatarbusy: false });
        } catch (err) {
            // Component unmounted
        }
    }
    
    // Fetch profile data, always match by user name instead of id. Username more readily available
    fetchProfileOptionsData = async () => {
        try {
            if (cookies.get('loggedIn')) {
                let user = cookies.get('loggedIn');
                return await fetch(currentrooturl + 'm/fetchprofileoptionsdata', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        user
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        if (result.avatarurl) {
                            this.setState({ avatarurl: result.avatarurl });
                        }
                    }
                })
            }
        } catch (err) {
            // Component was unmounted
            return false;
        }
        return true;
    }
    
    uploadThumbnailS3 = async () => {
        if (this.state.uploadavatarbusy == false) {
            try {
                this.setState({ uploadavatarbusy: true });
                if (this.upload.current.files[0]) {
                    let file = this.upload.current.files[0];
                    if (file.type == "image/png" || file.type == "image/jpeg" || file.type == "image/jpg" && cookies.get('loggedIn')) {
                        if (file.name.match(/\.([a-zA-Z0-9]*)$/)) {
                            let formData = new FormData();
                            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1];
                            let user = cookies.get('loggedIn');
                            formData.append('extension', extension);
                            formData.append('thumbnail', file);
                            formData.append('user', user);
                            return await fetch(currentrooturl + 'm/uploadthumbnail', {
                                method: "POST",
                                body: formData                        
                            })
                            .then((response) => {
                                return response.json();
                            })
                            .then((result) => {
                                console.log(result);
                                if (result.avatarurl) {
                                    this.setState({ avatarurl: result.avatarurl });
                                }
                                this.setState({ uploadavatarbusy: false });
                            })
                            .catch((err) => {
                                this.setState({ uploadavatarbusy: false });
                            })
                        } else {
                            this.setState({ uploadavatarbusy: false });
                        }
                    } else {
                        this.setState({ uploadavatarbusy: false });
                    }
                } else {
                    this.setState({ uploadavatarbusy: false });
                }
            } catch (err) {
                this.setState({ uploadavatarbusy: true });
            }
        }
    }
    
    render() {
        return (
            <div>
                <div className="page-header-text">Options</div>
                <div className="options-thumbnail-form">
                    <div className="options-avatar-container">
                        <img className="avatar" src={this.props.cloud + "/av/" + this.state.avatarurl}></img>
                    </div>
                    <input className="thumbnail-upload-choose-file" ref={this.upload} type="file" name="thumbnailToUpload" id="thumbnailToUpload" size="1" />
                    <div className={this.state.uploadavatarbusy ? "thumbnail-upload-container thumbnail-upload-busy" : "thumbnail-upload-container"}>
                        <button className="btn upload-button thumbnail-upload-button" onClick={(e) => {this.uploadThumbnailS3(e)}}>Change Profile Picture</button>
                    </div>
                </div>
            </div>
        )
    }
}
