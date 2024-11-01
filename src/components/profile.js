import React, { Component } from 'react';
import {
    NavLink
} from 'react-router-dom';
import {
    Button
} from 'react-bootstrap';
import Videos from './videos.js'; import ArticlePreview from './articlepreview.js'; import Shop from './shop.js'; import Bucket from './virtual/bucket.js';
import currentrooturl from '../url';
import { cookies } from '../App.js';
import { get, resolveSurvey } from '../methods/utility.js';
import { isAd, canFollow, editable, getPathnameMatchProfile, interceptProfileMenuClick } from '../methods/context.js';
import corsdefault from '../cors.js';

export default class Profile extends Component {
    constructor() {
        super();
        this.state = { username: "", avatarurl: "", content: [], videosUploaded: 0, totalVideoViews: 0, totalReads: 0, following: 0, followers: 0, about: "", page: "", shop: null, shippingClasses: [], shopOwner: false }
    }

    componentDidMount = async () => {
        if (this.props.cloud) {
            this.setState({ cloud: this.props.cloud });
        } else if (cookies.get("contentDelivery")) {
            this.setState({ cloud: cookies.get("contentDelivery" ) });
        } else {
            let cloudData = await this.props.fetchCloudUrl(); // Retrieve data from server if cloud data nonexistent in props and cookies
            this.setState({ cloud: cloudData });
        }
        try {
            if (this.props.page) {
                interceptProfileMenuClick.call(this, this.props.page);
            }
            await getPathnameMatchProfile.call(this);
        } catch (err) {
            // Component unmounted
        }
    }

    // Fetch profile data, always match by user name instead of id. Username more readily available
    fetchProfileData = async (username) => {
        try {
            let self = false;
            if (username == cookies.get('loggedIn')) {
                self = true;
            }
            if (username) {
                let hash = cookies.get('hash');
                return await fetch(currentrooturl + 'm/fetchprofilepagedata', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        username, self, hash
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    let authenticated = this.props.checkAndConfirmAuthentication(result);
                    if (result && authenticated) {
                        if (result.shop) {
                            if (result.shop.shippingClasses) {
                                try {
                                    JSON.parse(result.shop.shippingClasses);
                                    result.shop.shippingClasses = JSON.parse(result.shop.shippingClasses);
                                } catch (err) {
                                    result.shop.shippingClasses = [];
                                }
                            } else {
                                result.shop.shippingClasses = [];
                            }
                            this.setState({ shop: result.shop, shippingClasses: result.shop.shippingClasses, shopOwner: true });
                        }
                        if (result.totalviews) {
                            this.setState({ totalVideoViews: result.totalviews });
                        }
                        if (result.totalvideos) {
                            this.setState({ videosUploaded: result.totalvideos });
                        }
                        if (result.totalreads) {
                            this.setState({ totalReads: result.totalreads });
                        }
                        if (get(result, "user.username")) {
                            this.setState({ username: result.user.username });
                        }
                        if (get(result, "user.avatarurl")) {
                            this.setState({ avatarurl: result.user.avatarurl });
                        }
                        if (result.content) {
                            if (result.content.length > 0) {
                                this.setState({ content: result.content });
                            }
                        }
                        if (result.cloud) {
                            this.props.setCloud(result.cloud);
                        }
                    }
                    console.log(result);
                    return result;
                });
            }
        } catch (err) {
            // Component was unmounted
            return false;
        }
        return true;
    }

    updateShippingClasses = (data) => {
        try {
            JSON.parse(data);
            data = JSON.parse(data);
            this.setState({ shippingClasses: data });
        } catch (err) {
            // Fail silently
        }
    }


    render() {
        let pageData;
        let profileData = <div className="profile-content flex-grid videogrid">
                            { this.state.content ?
                                this.state.content.length > 0 ?
                                    this.state.content.map((record, index) =>
                                        record.mpd ? <Videos mpd={record.mpd}
                                            title={record.title}
                                            description={record.description}
                                            thumbnailUrl={record.thumbnailUrl}
                                            avatarUrl={this.state.avatarurl}
                                            author={record.author}
                                            published={record.publishDate}
                                            views={record.views}
                                            articles={record.articles}
                                            tags={record.tags}
                                            cloud={this.state.cloud}
                                            key={index}
                                            index={index}
                                            edit={editable.call(this)}
                                            ad={isAd(record)}
                                            shopOwner={this.state.shopOwner}
                                            survey={resolveSurvey(record.survey)}
                                            />
                                        : <ArticlePreview title={record.title}
                                            author={record.author}
                                            body={record.body}
                                            id={record.id}
                                            likes={record.likes}
                                            dislikes={record.dislikes}
                                            reads={record.reads}
                                            published={record.publishDate}
                                            key={index}
                                            edit={editable.call(this)}
                                            viewProfile={true}
                                        />
                                    )
                                : null
                            : null }
                        </div>
        if (this.state.page == "") {
            pageData = profileData;
        } else if (this.state.page == "shop") {
            pageData = <Shop {...this.props} owner={this.state.username}
                            shop={this.state.shop}
                            shippingClasses={this.state.shippingClasses}
                            edit={editable.call(this)}
                            updateShippingClasses={this.updateShippingClasses}
                            cloud={this.state.cloud}
                            userShippingData={this.props.userShippingData}
                        />
        } else if (this.state.page == "bucket") {
            pageData = <Bucket {...this.props} owner={this.state.username}
                            shop={this.state.shop}
                            shippingClasses={this.state.shippingClasses}
                            edit={editable.call(this)}
                            cloud={this.state.cloud}
                        />
        } else {
            pageData = profileData;
        }
        return (
            <div className="user-page-container">
                <div className="flex-profile main-profile-header">
                    <img className="profileavatar" src={this.state.cloud + "/av/" + this.state.avatarurl}></img>
                    <div>
                        <div className="flex-profile-data off-black align-center">
                            <div className="profile-user-container-meta">
                                <div className="prompt-basic off-black weight500">{this.state.username}</div>
                                <div className="profile-following-container-meta">
                                    <div className="prompt-basic flex italicized"><div className="off-black">following</div>&nbsp;{this.state.following}</div>
                                    <div className="prompt-basic flex italicized"><div className="off-black">followers</div>&nbsp;{this.state.followers}</div>
                                </div>
                                <Button className={!canFollow.call(this) ? "prompt-basic hidden" : "prompt-basic red-btn weight600"}>{!canFollow.call(this) ? "" : "follow"}</Button>
                            </div>
                            <div className="flex-profile profile-stats-container">
                                <div className="prompt-basic-s grey-out">total reads {this.state.totalReads}</div>
                                <div className="prompt-basic-s grey-out">total video views {this.state.totalVideoViews}</div>
                                <div className="prompt-basic-s grey-out">videos uploaded {this.state.videosUploaded}</div>
                            </div>
                        </div>
                        <div className="prompt-basic off-black about-profile">{this.state.about}</div>
                    </div>
                </div>
                <div className="profile-stats">
                    {
                        this.state.shop && this.state.username ? 
                            <div className="profile-menu">
                                <NavLink exact to={"/profile?p=" + this.state.username}>
                                    <Button className="profile-menu-link grey-btn" onClick={(e)=> {interceptProfileMenuClick.call(this, "")}}>Published</Button>
                                </NavLink>
                                <NavLink exact to={"/shop?s=" + this.state.username}>
                                    <Button className="profile-menu-link grey-btn" onClick={(e)=> {interceptProfileMenuClick.call(this, "shop")}}>Shop</Button>
                                </NavLink>
                                {
                                    editable.call(this) ? 
                                        <NavLink exact to={"/bucket?p=" + this.state.username}>
                                            <Button className="profile-menu-link grey-btn" onClick={(e)=> {interceptProfileMenuClick.call(this, "bucket")}}>Bucket</Button>
                                        </NavLink>
                                        : null
                                }
                            </div> 
                            : 
                            null
                    }
                </div>
                {pageData}
            </div>
        )
    }
}
