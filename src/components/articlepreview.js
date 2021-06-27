import React, {Component} from 'react';
import {
    NavLink,
    Link
} from 'react-router-dom';
import { convertDate } from '../methods/utility.js';
import { showContentMenu, promptDeleteContent, tryDeleteContent } from '../methods/context.js';
import parseBody from '../methods/htmlparser.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Videos from './videos.js';
import { faEdit, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

export default class ArticlePreview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            body: "", contentMenu: false, deleteContentPrompt: false, deleteErr: "", dash: true
        }
        this.articleContainer = React.createRef();
        this.titleDelete = React.createRef();
    }

    componentDidMount() {
        let parseLength = this.setParseLength();
        if (this.props.dash) {
            this.setState({ dash: true });
        }
        if (this.props.body) {
            this.setState({ body: parseBody(this.props.body, parseLength, true) });
        }
    }
    
    componentDidUpdate(prevProps, prevState) {
        let parseLength = this.setParseLength();
        if (this.props.body != prevProps.body) {
            this.setState({ body: parseBody(this.props.body, parseLength, true) });
        }
    }
    
    setParseLength = () => {
        let parseLength = 182;
        if (this.props.edit || this.props.viewProfile || this.props.dash || this.state.dash) {
            parseLength = 750;
        }
        return parseLength;
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
    articleEditLink() {
        return {
            pathname:`/edit?a=${this.props.id}`,
            props:{
                title: `${this.props.title}`,
                author: `${this.props.author}`,
                reads: `${this.props.reads}`,
                published: `${this.props.published}`,
                body: `${this.props.body}`,
                id: `${this.props.id}`
            }
        }
    }

    linkToArticle() {
        return {
            pathname:`/read?a=${this.props.id}`,
            props:{
                author: `${this.props.author}`,
                body: `${this.props.body}`,
                title: `${this.props.title}`,
                id: `${this.props.id}`,
                published: `${this.props.published}`,
                likes: `${this.props.likes}`,
                dislikes: `${this.props.dislikes}`,
                reads: `${this.props.reads}`,
                responseToMpd: `${this.props.responseToMpd}`,
                responseToTitle: `${this.props.responseToTitle}`,
                responseToType: `${this.props.responseToType}`
            }
        }
    }

    render() {
        return (
            <div className={this.props.edit  || this.props.viewProfile || this.props.dash || this.props.related ? "col" : ""}>
                <div className={this.props.edit || this.props.viewProfile ? "article-container-edit" : this.props.dash ? "article-container-dash" : this.props.related ? "article-container article-container-preview article-container-related" : "article-container article-container-preview"}>
                    {
                        this.state.deleteContentPrompt ?
                            <div className="delete-prompt-box delete-prompt-box-article">
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
                    <Link to={this.linkToArticle()}>
                        <div className="article-preview-title"><span className="tiny-read-label">{this.props.id && this.props.published ? "read" : null}</span><span>&nbsp;&nbsp;</span><span className="article-preview-title-span">{this.props.title}</span></div>
                    </Link>
                    {
                        this.props.edit ?
                            <div>
                                <FontAwesomeIcon className="edit-interact menu-content-interact" onClick={(e) => {showContentMenu.call(this, e)}} icon={faEllipsisH} color={ '#919191' } alt="edit"/>
                                {
                                    this.state.contentMenu ?
                                        <ul className="editor-menu-content-interact">
                                            <li onClick={(e) => {promptDeleteContent.call(this, e)}}>Delete article</li>
                                        </ul>
                                    : null
                                }
                                <Link to={this.articleEditLink()}><FontAwesomeIcon className="edit-interact" icon={faEdit} color={ '#919191' } alt="edit"/></Link>
                            </div>
                        : null
                    }
                    <Link to={this.linkToArticle()}>
                        <div className={this.props.edit || this.props.viewProfile ? "article-preview-body-edit" : "article-preview-body"}>{this.state.body}</div>
                    </Link>
                    <span className="dash-video-bar">
                        <NavLink exact to={"/profile?p=" + this.props.author}><p className='video-author grey-out'>{this.props.author}</p></NavLink>
                        <div className="dash-video-bar-stats">
                            <p className='video-views'>{this.props.reads} {this.props.title ? this.props.views == 1 ? "read" : "reads" : null}</p>
                            <span>&nbsp;{this.props.title ? "•" : null}&nbsp;</span>
                            <div className="video-article-responses" onMouseOver={(e)=>{this.showArticles(e, true)}} onMouseOut={(e)=>{this.showArticles(e, false)}}>
                                <div className="video-article-responses-length">{this.props.responses ? this.props.responses.length > 0 ? this.props.responses.length == 1 ? this.props.responses.length + " reply" : this.props.responses.length + " replies" : null : null}</div>
                                <div className={this.props.responses ? this.props.responses.length > 1 ? "video-article-responses-preview-container dropdown-menu hidden-fast" : "video-article-responses-preview-container article-responses-preview-container-single dropdown-menu hidden-fast" : "video-article-responses-preview-container dropdown-menu hidden-fast"} ref={this.articleContainer}>{this.props.responses ? this.props.responses.length > 0 ? this.props.responses.map((content, index) =>
                                    content.properties.id ? 
                                        <ArticlePreview title={content.properties.title}
                                        author={content.properties.author}
                                        body={content.properties.body}
                                        id={content.properties.id}
                                        likes={content.properties.likes}
                                        dislikes={content.properties.dislikes}
                                        reads={content.properties.reads}
                                        published={content.properties.publishDate}
                                        responseToMpd={this.props.mpd}
                                        responseToTitle={this.props.title}
                                        responseToType="video"
                                        key={index}
                                        />
                                    :   <Videos title={content.properties.title}
                                        author={content.properties.author}
                                        title={content.properties.title}
                                        mpd={content.properties.mpd}
                                        thumbnailUrl={content.properties.thumbnailUrl}
                                        likes={content.properties.likes}
                                        dislikes={content.properties.dislikes}
                                        views={content.properties.views}
                                        published={content.properties.publishDate}
                                        responseToMpd={this.props.mpd}
                                        dashReply={true}
                                        responseToTitle={this.props.title}
                                        responseToType="video"
                                        cloud={this.props.cloud}
                                        key={index}
                                        />
                                ) : null : null}
                                </div>
                            </div>
                            <span>{this.props.responses ? this.props.responses.length > 0 ? "\u00A0•\u00A0" : null : null}</span>
                            <p className="video-publish-date">{convertDate(this.props.published)}</p>
                        </div>
                    </span> 
                </div>
            </div>
        )
    }
}
