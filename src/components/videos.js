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
                tags: `${this.props.tags}`,
                thumbnailUrl: `${this.props.thumbnailUrl}`
            }
        }
    }

    showContentMenu(e) {
        if (this.state.contentMenu === false) {
            this.setState({ contentMenu: true });
            this.setState({ deleteErr: ""})
            this.setState({ deleteContentPrompt: false });
        } else {
            this.setState({ deleteErr: ""})
            this.setState({ contentMenu: false });
        }
    }

    promptDeleteContent(e) {
        if (this.state.deleteContentPrompt === false) {
            this.setState({ deleteContentPrompt: true });
            this.setState({ contentMenu: false });
        } else {
            this.setState({ deleteErr: ""})
            this.setState({ deleteContentPrompt: false });
        }
    }

    tryDeleteContent = async (e) => {
        if (get(this, "titleDelete.current.value") && this.props.title) {
            if (this.props.mpd || this.props.id) {
                if (this.titleDelete.current.value == this.props.title) {
                    let id = "";
                    let type = "";
                    if (this.props.mpd) {
                        id = this.props.mpd;
                        type = "video";
                    } else if (this.props.id) {
                        id = this.props.id;
                        type = "article";
                    }
                    let confirm = this.titleDelete.current.value;
                    if (id && type) {
                        await fetch(currentrooturl + 'm/deleteOneContent', {
                                method: "POST",
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'same-origin',
                                body: JSON.stringify({
                                    id, type
                                })
                            })
                            .then(function(response) {
                                return response.json();
                            })
                            .then((result) => {
                                if (result == true) {
                                    window.location.reload(false);
                                }
                            })
                    }
                } else {
                    this.setState({ deleteErr: "the title you entered does not match the content's title"})
                }
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
            this.props.title ?
                 this.props.title.length > 0 ?
                    <div className="col">
                        <div className='videocontainer'>
                            {
                                this.state.deleteContentPrompt ?
                                    <div className="delete-prompt-box">
                                        <div className="flex"><label htmlFor="titleDelete">Delete "{this.props.title}" ? Please enter the title below:</label><div className="clear-content-menu" onClick={(e) => {this.promptDeleteContent(e)}}>×</div></div>
                                        <input type="text" id="titleDelete" name="titleDelete" className="title-delete-input" ref={this.titleDelete} />
                                        <input type="submit" value="delete" className="title-delete-submit" onClick={(e) => {this.tryDeleteContent(e)}} />
                                        {
                                            this.state.deleteErr ?
                                                <div className="delete-err">{this.state.deleteErr}</div>
                                            : null
                                        }
                                    </div>
                                : null
                            }
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
                                            <div>
                                                <FontAwesomeIcon className="edit-interact menu-content-interact" onClick={(e) => {this.showContentMenu(e)}} icon={faEllipsisH} color={ '#919191' } alt="edit"/>
                                                {
                                                    this.state.contentMenu ?
                                                        <ul className="editor-menu-content-interact">
                                                            <li onClick={(e) => {this.promptDeleteContent(e)}}>Delete video</li>
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
                : null
            : null
        )
    }
}
