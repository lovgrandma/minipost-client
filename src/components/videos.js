import React, {Component} from 'react';
import {
    NavLink,
    Link
} from 'react-router-dom';
import dummythumbnail from '../static/greythumb.jpg';
import dummyavatar from '../static/greyavatar.jpg';
import currentrooturl from '../url';
import ArticlePreview from './articlepreview.js';
import { convertDate, get } from '../methods/utility.js';
import { showContentMenu, promptDeleteContent, tryDeleteContent } from '../methods/context.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

export default class Videos extends Component {
    constructor(props) {
        super(props);
        this.state = {
            contentMenu: false, deleteContentPrompt: false, deleteErr: ""
        }
        this.articleContainer = React.createRef();
        this.titleDelete = React.createRef();
    }

    componentDidMount() {

    }
    componentDidUpdate() {

    }

    cutTitle(title) {
        if (title) {
            if (title.length > 80) {
                return title.slice(0, 80) + "...";
            }
        } else {
            return '*unpublished video*'
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
                tags: `${this.props.tags}`,
                thumbnailUrl: `${this.props.thumbnailUrl}`
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
        if (this.props.thumbnailUrl && this.props.cloud) {
            if (this.props.thumbnailUrl.length > 0) {
                return this.props.cloud + "/" + this.props.thumbnailUrl + ".jpeg";
            }
        }
        return dummythumbnail;
    }
    
    getAvatar = () => {
        if (this.props.avatarUrl && this.props.cloud) {
            if (this.props.avatarUrl.length > 0) {
                return this.props.cloud + "/av/" + this.props.avatarUrl;
            }
        }
        return dummyavatar;
    }

    editReturn = () => {
        if (this.props.edit && !this.props.title) {
            return this.videoEditLink();
        } else {
            return this.videoObjectLink();
        }
    }

    resolveViews = () => {
        if (!this.props.title) {
            return ''
        } else {
            return this.props.views;
        }
    }

    render () {
        return (
            this.props.title && !this.props.edit || this.props.edit ?
                <div className="col">
                    <div className={this.props.related ? 'videocontainer videocontainer-related' : 'videocontainer'}>
                        {
                            this.state.deleteContentPrompt ?
                                <div className="delete-prompt-box">
                                    <div className="flex"><label htmlFor="titleDelete">Delete "{this.props.title}" ? Please enter "delete me" below:</label><div className="clear-content-menu" onClick={(e) => {promptDeleteContent.call(this, e)}}>×</div></div>
                                    <input type="text" id="titleDelete" name="titleDelete" className="title-delete-input" ref={this.titleDelete} />
                                    <input type="submit" value="delete" className="title-delete-submit" onClick={(e) => {tryDeleteContent.call(this, e)}} />
                                    {
                                        this.state.deleteErr ?
                                            <div className="delete-err">{this.state.deleteErr}</div>
                                        : null
                                    }
                                </div>
                            : null
                        }
                        <Link to={this.editReturn()}>
                            <div className="videothumb-holder">
                                <img className={this.props.mpd ? this.props.mpd.length > 0 ? 'videothumb' : 'videothumb videothumb-placeholder' : 'videothumb videothumb-placeholder'} src={this.getThumb()}></img>
                            </div>
                        </Link>
                        <div className="dash-video-details-container">
                            <img className={this.props.mpd ? this.props.mpd.length > 0 ? 'publisheravatar-dash' : 'publisheravatar-dash avatar-placeholder' : 'publisheravatar-dash avatar-placeholder'} src={this.getAvatar()}></img>
                            <div className={this.props.edit ? "video-details-title-edit" : "video-details"}>
                                <Link to={this.editReturn()}>
                                    <p className='mainvideotitle'>{this.cutTitle(this.props.title)}</p>
                                </Link>
                                {
                                    this.props.edit ?
                                        <div>
                                            <FontAwesomeIcon className="edit-interact menu-content-interact" onClick={(e) => {showContentMenu.call(this, e)}} icon={faEllipsisH} color={ '#919191' } alt="edit"/>
                                            {
                                                this.state.contentMenu ?
                                                    <ul className="editor-menu-content-interact">
                                                        <li onClick={(e) => {promptDeleteContent.call(this, e)}}>Delete video</li>
                                                    </ul>
                                                : null
                                            }
                                            <Link to={this.videoEditLink()}><FontAwesomeIcon className="edit-interact" icon={faEdit} color={ '#919191' } alt="edit"/></Link>
                                        </div>
                                    : null
                                }
                                <div className="dash-video-details-col">
                                    <span className="dash-video-bar">
                                        <NavLink exact to={"/profile?p=" + this.props.author}><p className='video-author'>{this.props.author}</p></NavLink>
                                        <div className="dash-video-bar-stats">
                                            <p className='video-views'>{this.resolveViews()} {this.props.title ? this.props.views == 1 ? "view" : "views" : null}</p>
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
            : null
        )
    }
}
