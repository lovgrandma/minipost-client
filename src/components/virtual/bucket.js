import React, { Component } from 'react';
import currentshopurl from '../../shopurl.js';
import corsdefault from '../../cors.js';
import { cookies } from '../../App.js';

export default class Bucket extends Component {
    constructor(props) {
        super(props);
        this.state = {
            self: false, uploadImageBusy: false
        }
        this.uploadImg = React.createRef();
        this.spinnerRef = React.createRef();
    }

    componentDidMount() {
        if (this.props.cloud) {
            this.setState({ cloud: this.props.cloud });
        } else if (cookies.get('contentDelivery')) {
            this.setState({ cloud: cookies.get('contentDelivery')});
        }
        this.fetchBucketData();
    }

    async fetchBucketData() {
        try {
            this.setState({ error: null });
            let owner; // Should be the value of the profile being accessed
            if (this.props.owner) {
                owner = this.props.owner;
            } else {
                owner = window.location.search.match(/\?(s|p)=([a-zA-Z0-9].*)/)[2];
            }
            if (owner && cookies.get('loggedIn') && cookies.get('hash')) {
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                fetch(currentshopurl + 's/getbucket', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        owner, username, hash, self
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        if (result.data) {
                            this.setState({ files: result.data });
                            this.getMbTotal();
                        }
                    }
                    return result;
                })
                .catch((err) => {
                    this.setState({ error: "Bucket was not able to load" });
                })
            }
        } catch (err) {
            this.setState({ error: "Bucket was not able to load" });
            // Fail silently
        }
    }

    async uploadFile(e) {
        try {
            this.setState({ error: null });
            if (this.state.uploadImageBusy == false) {
                this.setState({ uploadImageBusy: true });
                if (this.uploadImg.current.files[0]) {
                    let file = this.uploadImg.current.files[0];
                    if ((file.type == "image/png" || file.type == "image/jpeg" || file.type == "image/jpg")) {
                        if (file.name.match(/\.([a-zA-Z0-9]*)$/)) {
                            let formData = new FormData();
                            let extension = file.name.match(/\.([a-zA-Z0-9]*)$/)[1];
                            let username = cookies.get('loggedIn');
                            formData.append('extension', extension);
                            formData.append('image', file);
                            formData.append('username', username);
                            formData.append('hash', cookies.get('hash'));
                            formData.append('self', true);
                            return await fetch(currentshopurl + 's/uploadbucketfile', {
                                method: "POST",
                                credentials: corsdefault,
                                body: formData
                            })
                            .then((response) => {
                                return response.json();
                            })
                            .then((result) => {
                                console.log(result);
                                let authenticated = this.props.checkAndConfirmAuthentication(result);
                                if (authenticated) {
                                    if (result.data) {
                                        this.setState({ files: result.data });
                                        this.getMbTotal();
                                    } else {
                                        throw new Error;
                                    }
                                }
                                this.setState({ uploadImageBusy: false });
                            })
                            .catch((err) => {
                                this.setState({ uploadImageBusy: false, error: "Was not able to upload file" });
                            })
                        } else {
                            throw new Error;
                        }
                    } else {
                        throw new Error;
                    }
                } else {
                    throw new Error;
                }
            }
        } catch (err) {
            this.setState({ uploadImageBusy: false, error: "Was not able to upload file" });
        }
    }

    getMbTotal() {
        try {
            let t = 0;
            if (Array.isArray(this.state.files)) {
                for (let i = 0; i < this.state.files.length; i++) {
                    if (this.state.files[i]) {
                        if (this.state.files[i].size) {
                            t += this.state.files[i].size;
                        }
                    }
                }
            }
            this.setState({ size: t });
        } catch (err) {
            return false;
        }
    }

    render() {
        return (
            <div>
                {
                    this.props.edit ?
                        <div className="profile-bucket-container">
                            <div className="off-black weight600 prompt-basic">Store your files for usage in products here</div>
                            <div className="flex flex-start margin-top-5 gap5">
                                <div className="off-black prompt-basic-s2 grey-out">The default size for your vendor bucket is 200 mbs</div>
                                {
                                    this.state.size ?
                                        <div className="prompt-basic-s2">{this.state.size} mbs used</div>
                                        : null
                                }
                            </div>
                            <div className="flex bucket-files-array flex-start margin-top-10">
                                {
                                    this.state.files ?
                                        this.state.files.map((fi) => 
                                            <div className="bucket-files-imgs-container"><img className="bucket-file-img" src={this.props.cloud + "/" + fi.url} /></div>
                                        )
                                        : <div className="prompt-basic-s margin-top-10 grey-out weight600">Empty Repository</div>
                                }
                            </div>
                            {
                                !this.state.uploadImageBusy ?
                                    <div className="flex flex-start margin-top-10 gap5">
                                        <input className="upload-img-bucket-input prompt-basic-s weight600" ref={this.uploadImg} type="file" name="upload-img-bucket-input" id="upload-img-bucket-input" size="1" />
                                        <button id="upload-img-bucket" className="red-btn btn prompt-basic-s weight600" onClick={(e) => {this.uploadFile(e)}}>Upload Image</button>
                                    </div>
                                    : <div ref={this.spinnerRef} className="spinner-search-holder-visible spinner-video-dash margin-top-10">
                                        <div className="loadingio-spinner-dual-ball-m6fvn6j93c loadingio-spinner-dual-ball-m6fvn6j93c-dash">
                                            <div className="ldio-oo3b7d4nmnr ldio-oo3b7d4nmnr-dash">
                                                <div></div><div></div><div></div>
                                            </div>
                                        </div>
                                    </div>
                            }
                            {
                                this.state.error ?
                                    <div className={this.state.error ? "upload-err-status err-status-wide margin-top-10" : ""}>{this.state.error}</div>
                                    : null
                            }
                        </div> 
                        : <div>Unauthorized</div>
                }
            </div>
        )
    }
}
