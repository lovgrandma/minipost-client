import React, {Component} from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import dummythumbnail from '../static/greythumb.jpg';
import dummyavatar from '../static/greyavatar.jpg';
import ArticlePreview from './articlepreview.js';

export default class Videos extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
        this.articleContainer = React.createRef();
    }

    componentDidMount() {

    }
    componentDidUpdate() {

    }

    roundHour(hour) {
        if (Math.round(hour/3600) == 1) {
            return "1 hour ago";
        } else {
            return Math.round(hour/3600) + " hours ago";
        }
        return Math.round(hour/3600) + "hours ago";
    }

    /* Converts static document date into relevant publish time from now */
    convertDate(date) {
        let timeFromNow = (Date.now() - new Date(date).getTime())/1000;
        if (timeFromNow <= 60) {
            return "1 minute ago";
        } else if (timeFromNow <= 120) {
            return "2 minutes ago";
        } else if (timeFromNow <= 180) {
            return "3 minutes ago";
        } else if (timeFromNow <= 300) {
            return "5 minutes ago";
        } else if (timeFromNow <= 600) {
            return "10 minutes ago";
        } else if (timeFromNow <= 900) {
            return "15 minutes ago";
        } else if (timeFromNow <= 1200) {
            return "20 minutes ago";
        } else if (timeFromNow <= 1800) {
            return "Half an hour ago";
        } else if (timeFromNow <= 3600) {
            return "1 hour ago";
        } else if (timeFromNow < 86400) {
            return this.roundHour(timeFromNow); // Rounds hour for hours uploaded from now
        } else if (new Date(Date.now()).getDate() - new Date(date).getDate() == 1) {
            return "yesterday";
        } else {
            if (date.match(/([a-zA-Z0-9].*),/)) {
                return date.match(/([a-zA-Z0-9].*),/)[1];
            } else {
                date = date.split(' ')[0];
                return date.substring(0, date.length -1);
            }
        }
        date = date.split(' ')[0];
        return date.substring(0, date.length -1);
    }

    cutTitle(title) {
        if (title.length > 80) {
            return title.slice(0, 80) + "...";
        }
        return title;
    }

    /** Stores data for video link props */
    videoObjectLink() {
        return {
            pathname:`/watch?v=${this.props.mpd}`,
            props:{
                title: `${this.props.title}`,
                author: `${this.props.author}`,
                views: `${this.props.views}`,
                published: `${this.props.published}`,
                description: `${this.props.description}`,
                tags: `${this.props.tags}`
            }
        }
    }

    showArticles = (e, show) => {
        if (this.articleContainer.current) {
            if (show) {
                this.articleContainer.current.classList.add("hidden-visible");
            } else {
                this.articleContainer.current.classList.remove("hidden-visible");
            }
        }
    }

    render () {
        return (
            <div className="col">
                <div className='videocontainer'>
                    <Link to={this.videoObjectLink()}>
                        <div>
                            <img className={this.props.mpd ? this.props.mpd.length > 0 ? 'videothumb' : 'videothumb videothumb-placeholder' : 'videothumb videothumb-placeholder'} src={dummythumbnail}></img>
                        </div>
                    </Link>
                    <div className="dash-video-details-container">
                        <img className={this.props.mpd ? this.props.mpd.length > 0 ? 'publisheravatar-dash' : 'publisheravatar-dash avatar-placeholder' : 'publisheravatar-dash avatar-placeholder'} src={dummyavatar}></img>
                        <div>
                            <Link to={this.videoObjectLink()}>
                                <p className='mainvideotitle'>{this.cutTitle(this.props.title)}</p>
                            </Link>
                            <div className="dash-video-details-col">
                                <span className="dash-video-bar">
                                    <div><p className='video-author'>{this.props.author}</p></div>
                                    <div className="dash-video-bar-stats">
                                        <p className='video-views'>{this.props.views} {this.props.title ? "views" : null}</p>
                                        <span>&nbsp;{this.props.title ? "•" : null}&nbsp;</span>
                                        <div className="video-article-responses" onMouseOver={(e)=>{this.showArticles(e, true)}} onMouseOut={(e)=>{this.showArticles(e, false)}}>
                                            <div className="video-article-responses-length">{this.props.articles ? this.props.articles.length > 0 ? this.props.articles.length == 1 ? this.props.articles.length + " article" : this.props.articles.length + " articles" : null : null}</div>
                                            <div className={this.props.articles ? this.props.articles.length > 1 ? "video-article-responses-preview-container dropdown-menu hidden-fast" : "video-article-responses-preview-container article-responses-preview-container-single dropdown-menu hidden-fast" : "video-article-responses-preview-container dropdown-menu hidden-fast"} ref={this.articleContainer}>{this.props.articles ? this.props.articles.length > 0 ? this.props.articles.map((article, index) =>
                                                <ArticlePreview title={article.properties.title}
                                                author={article.properties.author}
                                                body={article.properties.body}
                                                id={article.properties.id}
                                                likes={article.properties.likes}
                                                dislikes={article.properties.dislikes}
                                                reads={article.properties.reads}
                                                published={article.properties.publishDate}
                                                responseToMpd={this.props.mpd}
                                                responseToTitle={this.props.title}
                                                responseToType="video"
                                                key={index}
                                                />
                                            ) : null : null}
                                            </div>
                                        </div>
                                        <span>{this.props.articles ? this.props.articles.length > 0 ? "\u00A0•\u00A0" : null : null}</span>
                                        <p className="video-publish-date">{this.convertDate(this.props.published)}</p>
                                    </div>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
