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
import { convertDate, roundHour} from '../methods/utility.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

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

    videoEditLink() {
        return {
            pathname:`/edit?v=${this.props.mpd}`,
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

    getThumb = () => {
        if (this.props.thumbnailUrl) {
            return this.props.cloud + "/" + this.props.thumbnailUrl + ".jpeg";
        }
        return dummythumbnail;
    }

    render () {
        return (
            <div className="col">
                <div className='videocontainer'>
                        <Link to={this.videoObjectLink()}>
                            <div className="videothumb-holder">
                                <img className={this.props.mpd ? this.props.mpd.length > 0 ? 'videothumb' : 'videothumb videothumb-placeholder' : 'videothumb videothumb-placeholder'} src={this.getThumb()}></img>
                            </div>
                        </Link>
                    <div className="dash-video-details-container">
                        <img className={this.props.mpd ? this.props.mpd.length > 0 ? 'publisheravatar-dash' : 'publisheravatar-dash avatar-placeholder' : 'publisheravatar-dash avatar-placeholder'} src={dummyavatar}></img>
                        <div className={this.props.edit ? "video-details-title-edit" : ""}>
                            <Link to={this.videoObjectLink()}>
                                <p className='mainvideotitle'>{this.cutTitle(this.props.title)}</p>
                            </Link>
                            {
                                this.props.edit ?
                                    <Link to={this.videoEditLink()}><FontAwesomeIcon className="edit-interact" icon={faEdit} color={ '#919191' } alt="edit"/></Link> : null
                            }
                            <div className="dash-video-details-col">
                                <span className="dash-video-bar">
                                    <NavLink exact to={"/profile?p=" + this.props.author}><p className='video-author'>{this.props.author}</p></NavLink>
                                    <div className="dash-video-bar-stats">
                                        <p className='video-views'>{this.props.views} {this.props.title ? this.props.views == 1 ? "view" : "views" : null}</p>
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
                                        <p className="video-publish-date">{convertDate(this.props.published)}</p>
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
