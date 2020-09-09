import React, {Component} from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import currentrooturl from '../url';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faHeart, faShare, faBookOpen, faReply, faEye } from '@fortawesome/free-solid-svg-icons';
import { roundTime, setStateDynamic, shortenTitle, convertDate } from '../methods/utility.js';
import { setResponseToParentPath } from '../methods/context.js';
import { updateHistory } from '../methods/history.js';
import parseBody from '../methods/htmlparser.js';
import dummythumbnail from '../static/greythumb.jpg';
import dummyavatar from '../static/greyavatar.jpg';

export default class Article extends Component {
    constructor(props) {
        super(props)
        this.state = {
            id: "", title: "", author: "", body: "", published: "", reads: "", likes: "", dislikes: "", responseTo: {}, articleResponses: [], videoResponses: [], relevant: []
        }
        this.moreOptions = React.createRef();
    }

    componentDidMount() {
        this.setUpState();
    }

    /** Runs when user loads page by clicking from another page. Will not function when page is loaded from direct link or reload */
    setUpState() {
        if (this.props.location) {
            if (this.props.location.props) {
                if (this.props.location.props.id) {
                    this.setState({ id: this.props.location.props.id });
                }
                if (this.props.location.props.title) {
                    this.setState({ title: this.props.location.props.title });
                }
                if (this.props.location.props.body) {
                    this.setState({ body: this.props.location.props.body });
                }
                if (this.props.location.props.author) {
                    this.setState({ author: this.props.location.props.author });
                }
                if (this.props.location.props.published) {
                    this.setState({ published: this.props.location.props.published });
                }
                if (this.props.location.props.reads) {
                    this.setState({ reads: this.props.location.props.reads });
                }
                if (this.props.location.props.likes) {
                    this.setState({ likes: this.props.location.props.likes });
                }
                if (this.props.location.props.dislikes) {
                    this.setState({ dislikes: this.props.location.props.dislikes });
                }
                if (this.props.location.props.tags) {
                    if (typeof this.props.location.props.tags === 'string') {
                        this.setState({ tags: this.props.location.props.tags.split(',') });
                    }
                }
                let responseTo = {
                    title: "",
                    id: "",
                    type: "",
                    mpd: ""
                }
                if (this.props.location.props.responseToType) {
                    responseTo.type = this.props.location.props.responseToType;
                }
                if (this.props.location.props.responseToTitle) {
                    responseTo.title = this.props.location.props.responseToTitle;
                }
                if (this.props.location.props.responseToId) {
                    responseTo.id = this.props.location.props.responseToId;
                } else if (this.props.location.props.responseToMpd) {
                    responseTo.mpd = this.props.location.props.responseToMpd;
                }
                this.setState({ responseTo: responseTo });
            }
        }
        this.fetchPageData();
    }

    // Will run when user loads from external link or not from within minipost
    fetchPageData = async () => {
        if (this.props) {
            if (this.props.location) {
                if (this.props.location.search || this.props.location.pathname) {
                    let id = "";
                    if (this.props.location.search.match(/\?a=([a-zA-Z0-9].*)/)) {
                        if (this.props.location.search.match(/\?a=([a-zA-Z0-9].*)/)[1]) {
                            id = this.props.location.search.match(/\?a=([a-zA-Z0-9].*)/)[1];
                        }
                    } else if (this.props.location.pathname.match(/(\/read\?a=)([a-zA-Z0-9].*)/)) {
                        if (this.props.location.pathname.match(/(\/read\?a=)([a-zA-Z0-9].*)/)[2]) {
                            id = this.props.location.pathname.match(/(\/read\?a=)([a-zA-Z0-9].*)/)[2];
                        }
                    }
                    if (id) {
                        const articleData = await fetch(currentrooturl + 'm/fetcharticlepagedata', {
                            method: "POST",
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            credentials: 'same-origin',
                            body: JSON.stringify({
                                id
                            })
                        })
                        .then((response) => {
                            return response.json();
                        })
                        .then((result) => {
                            if (result.article) {
                                for (const [key, value] of Object.entries(result.article)) {
                                    if (key == "published") { // If date, round value
                                        this.setState(setStateDynamic(key, roundTime(value)));
                                    } else if (value) {
                                        this.setState(setStateDynamic(key, value));
                                    } else if (!value && key == "reads" || !value && key == "likes" || !value && key == "dislikes") {
                                        this.setState(setStateDynamic(key, value));
                                    }
                                }
                                if (result.article.body) {
                                    updateHistory.call(this, 'article');
                                }
                            }
                            console.log(result);
                            return result;
                        });
                        if (articleData.articleResponses) {
                            this.setState({ articleResponses: articleData.articleResponses });
                        }
                        if (articleData.videoResponses) {
                            this.setState({ videoResponses: articleData.videoResponses });
                        }
                        if (articleData.responseTo) {
                            this.setState({ responseTo: articleData.responseTo });
                        }
                    }
                }
            }
        }
    }

    showMoreOptions(e, show) {
        if (this.moreOptions.current) {
            if (show) {
                this.moreOptions.current.classList.add("hidden-visible");
            } else {
                this.moreOptions.current.classList.remove("hidden-visible");
            }
        }
    }

    render() {
        return (
            <div className="article-container-articlepage">
                <div className="article-title-articlepage">{this.state.title}</div>
                <div className="article-author-articlepage prompt-basic-s grey-out">published by {this.state.author} at {roundTime(this.state.published)}</div>
                <div className="article-body-articlepage">{parseBody(this.state.body)}</div>
                <div className="article-menu-flex">
                    <div className="article-stats-articlepage">
                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="read-interact-s" icon={faBookOpen} color={ 'grey' } alt="read"/>{this.state.reads}</span>
                        <span className="nbsp-w">&nbsp;•&nbsp;</span>
                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsup-interact-s" icon={faThumbsUp} color={ 'grey' } alt="thumbs up"/>{this.state.likes}</span>
                        <span className="nbsp-w">&nbsp;•&nbsp;</span>
                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsdown-interact-s" icon={faThumbsDown} color={ 'grey' } alt="thumbs down"/>{this.state.dislikes}</span>
                    </div>
                    <div className="more-options-ellipsis-container" onMouseOver={(e) => {this.showMoreOptions(e, true)}} onMouseOut={(e) => {this.showMoreOptions(e, false)}}>
                        <FontAwesomeIcon className="read-interact-s" icon={faReply} color={ 'grey' } alt="reply"/>
                        <ul className='more-options-ellipsis-dropdown prompt-basic dropdown-menu more-options-articlepage-dropdown hidden' ref={this.moreOptions}>
                            <li><Link to={{
                                pathname:`/writearticle`,
                                props:{
                                    responseToId: `${this.state.id}`,
                                    responseToTitle: `${this.state.title}`,
                                    responseToType: "article"
                                }
                            }}>Write article response</Link></li>
                            <li><Link to={{
                                pathname:`/upload`,
                                props:{
                                    responseToId: `${this.state.id}`,
                                    responseToTitle: `${this.state.title}`,
                                    responseToType: "article"
                                }
                            }}>Publish video response</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="prompt-basic grey-out response-to">{this.state.responseTo ? this.state.responseTo.title ? "Response to " : "" : ""}<span className="grey-out">{this.state.responseTo && this.state.responseTo.title ? this.state.responseTo.title.length > 0 ? <Link to={setResponseToParentPath.call(this)}>{this.state.responseTo.title}</Link> : "" : ""}</span></div>
                <div className='responses'>responses</div>
                <div className='articles-bar'>
                    <div className='article-container-header'>{this.state.articleResponses ? this.state.articleResponses.length > 0 ? "Articles" : null : null}</div>
                    <div className='article-responses-container'>
                        {this.state.articleResponses ?
                            this.state.articleResponses.length > 0 ?
                                this.state.articleResponses.map((article, i) => {
                                    return (
                                        article.id && article ?
                                        <div className="article-container-videopage" key={i}>
                                            <Link to={{
                                                pathname:`/read?a=${article.id}`,
                                                props:{
                                                    author: `${article.author}`,
                                                    body: `${article.body}`,
                                                    title: `${article.title}`,
                                                    id: `${article.id}`,
                                                    published: `${article.publishDate}`,
                                                    likes: `${article.likes}`,
                                                    dislikes: `${article.dislikes}`,
                                                    reads: `${article.reads}`,
                                                    responseToMpd: `${this.state.mpd}`,
                                                    responseToTitle: `${this.state.title}`,
                                                    responseToType: "video"
                                                }
                                            }}>
                                                <div className="article-title-videopage">{shortenTitle(article.title)}</div>
                                                <div className="article-body-videopage">{parseBody(article.body, 600, true)}</div>
                                                <div className="article-stats-videopage">
                                                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="read-interact-s" icon={faBookOpen} color={ 'grey' } alt="read"/>{article.reads}</span><span>&nbsp;•&nbsp;</span>
                                                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsup-interact-s" icon={faThumbsUp} color={ 'grey' } alt="read"/>{article.likes}</span><span>&nbsp;•&nbsp;</span>
                                                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsdown-interact-s" icon={faThumbsDown} color={ 'grey' } alt="read"/>{article.dislikes}</span>
                                                </div>
                                            </Link>
                                        </div>
                                        : null
                                    )
                                })
                            : null : null
                        }
                    </div>
                </div>
                <div className='videos-bar'>
                    <div className='video-container-header'>{this.state.videoResponses ? this.state.videoResponses.length > 0 ? "videos" : null : null}</div>
                    <div className='video-responses-container flex-grid videogrid'>
                        {this.state.videoResponses ?
                            this.state.videoResponses.length > 0 ?
                                this.state.videoResponses.map((video, i) => {
                                    return (
                                        video.mpd && video ?
                                            <div className="video-container-videopage videocontainer" key={i}>
                                                <Link to={{
                                                    pathname:`/watch?v=${video.mpd}`,
                                                    props:{
                                                        author: `${video.author}`,
                                                        body: `${video.body}`,
                                                        title: `${video.title}`,
                                                        id: `${video.id}`,
                                                        published: `${video.publishDate}`,
                                                        likes: `${video.likes}`,
                                                        dislikes: `${video.dislikes}`,
                                                        views: `${video.views}`,
                                                        responseToMpd: `${this.state.mpd}`,
                                                        responseToTitle: `${this.state.title}`,
                                                        responseToType: "video"
                                                    }
                                                }}>
                                                    <img className={video.mpd ? video.mpd.length > 0 ? 'videothumb videothumb-videopage' : 'videothumb videothumb-videopage videothumb-placeholder ' : 'videothumb videothumb-videopage videothumb-placeholder'} src={dummythumbnail}></img>
                                                    <div className="video-title-videopage mainvideotitle">{shortenTitle(video.title)}</div>
                                                    <div className="dash-video-bar-stats dash-video-bar-stats-videopage">
                                                        <div className='video-author-videopage'>{video.author}</div>&nbsp;•&nbsp;<div className="video-publish-date-videopage">{convertDate(video.publishDate)}</div>
                                                    </div>
                                                    <div className="video-stats-videopage">
                                                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="read-interact-s" icon={faEye} color={ 'grey' } alt="views"/>{video.views}</span><span>&nbsp;•&nbsp;</span>
                                                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsup-interact-s" icon={faThumbsUp} color={ 'grey' } alt="read"/>{video.likes}</span><span>&nbsp;•&nbsp;</span>
                                                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsdown-interact-s" icon={faThumbsDown} color={ 'grey' } alt="read"/>{video.dislikes}</span>
                                                    </div>
                                                </Link>
                                            </div>
                                        : null
                                    )
                                })
                            : null : null
                        }
                    </div>
                </div>
            </div>
        )
    }
}
