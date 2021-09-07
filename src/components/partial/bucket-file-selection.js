import React, { Component } from 'react';
import {
    Button
} from 'react-bootstrap';
import currentshopurl from '../../shopurl.js';
import corsdefault from '../../cors.js';
import { cookies } from '../../App.js';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

export default class Bucket extends Component {
    constructor(props) {
        super(props);
        this.state = {
            self: false
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

    render() {
        return (
            <div>
                <h5 className="weight600 off-black">Add Virtual Content To Your Product</h5>
                <div className="flex bucket-files-array flex-start margin-top-10">
                    {
                        this.state.files ?
                            this.state.files.map((fi) => 
                                <div className="bucket-files-imgs-container">
                                    <img className="bucket-file-img" src={this.props.cloud + "/" + fi.url} />
                                    <Button onClick={(e) => {this.props.appendFile(this.props.editing, fi, true)}} className="edit-interact-product">
                                        <span>Add</span>
                                        <FontAwesomeIcon className="edit-interact" icon={faPlus} color={ '#919191' } alt="add content" />
                                    </Button>
                                </div>
                            )
                            : <div className="prompt-basic-s margin-top-10 grey-out weight600">Empty Repository</div>
                    }
                </div>
                <h5 className="weight600 off-black margin-top-10">Selected Product Files</h5>
                <div className="flex flex-start gap5 margin-top-10">
                    {
                        this.props.editing != "dummy" ?
                            this.props.products ?
                                this.props.products[this.props.editing] ?
                                    this.props.products[this.props.editing].files ?
                                        this.props.products[this.props.editing].files.map((fi) => 
                                            <div className="bucket-files-imgs-container selected-product-file-sm">
                                                <img className="bucket-file-img" src={this.props.cloud + "/" + fi.url} />
                                                <Button onClick={(e) => {this.props.appendFile(this.props.editing, fi, false)}} className="edit-interact-product">
                                                    <FontAwesomeIcon className="edit-interact" icon={faMinus} color={ '#919191' } alt="remove content" />
                                                </Button>
                                            </div>
                                        )
                                        : null
                                    : null
                                : null
                            : this.props.dummyfiles ?
                                this.props.dummyfiles.map((fi) => 
                                    <div className="bucket-files-imgs-container selected-product-file-sm">
                                        <img className="bucket-file-img" src={this.props.cloud + "/" + fi.url} />
                                        <Button onClick={(e) => {this.props.appendFile(this.props.editing, fi, false)}} className="edit-interact-product">
                                            <FontAwesomeIcon className="edit-interact" icon={faMinus} color={ '#919191' } alt="remove content" />
                                        </Button>
                                    </div>
                                )
                                : null
                    }
                </div>
                <div className="margin-top-10 content-edit-container weight600">
                    <Button onClick={(e) => {this.props.showBucketPortal(e, false)}}>Close Content Portal</Button>
                </div>
            </div>
        )
    }
}
