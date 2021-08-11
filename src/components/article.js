import React, { Component, lazy, Suspense } from 'react';
import {
    NavLink,
    Link
} from 'react-router-dom';
import currentrooturl from '../url';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faThumbsDown, faBookOpen, faReply, faEye } from '@fortawesome/free-solid-svg-icons';
import { roundTime, setStateDynamic, shortenTitle, convertDate, opposite } from '../methods/utility.js';
import { setResponseToParentPath, incrementLike, incrementDislike, showMoreOptions, resolveMeta } from '../methods/context.js';
import { updateHistory } from '../methods/history.js';
import parseBody from '../methods/htmlparser.js';
import { countBody } from '../methods/htmlparser.js';
import dummythumbnail from '../static/greythumb.jpg';
import dummyavatar from '../static/greyavatar.jpg';
import { cookies } from '../App.js';
import { setResponseUrl } from '../methods/responses.js';
import corsdefault from '../cors.js';

const RelatedPanel = lazy(() => import('./relatedpanel.js'));

export default class Article extends Component {
    constructor(props) {
        super(props)
        this.state = {
            id: "", title: "", author: "", body: "", published: "", reads: 0, responseTo: {}, articleResponses: [], videoResponses: [], relevant: [], liked: false, disliked: false, likes: 0, dislikes: 0, thumbnail: "", words: 200, sbri: '', readIncrementId: '', fetched: false
        }
        this.moreOptions = React.createRef();
    }

    componentDidMount() {
        this.setUpState();
        if (cookies.get('contentDelivery')) {
            this.setState({ cloud: cookies.get('contentDelivery') });
        }
    }
    
    componentWillUnmount() {
        if (this) {
            if (this.state) {
                if (this.state.readIncrementId) {
                    clearTimeout(this.state.readIncrementId);
                    console.log(' cleared ' + this.state.readIncrementId);
                }
            }
        }
    }

    /** Runs when user loads page by clicking from another page. Will not function when page is loaded from direct link or reload */
    setUpState() {
        try {
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
                        this.setState({ published: roundTime(this.props.location.props.published) });
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
        } catch (err) {
            // Component likely unmounted
        }
    }

    // Will run when user loads from external link or not from within minipost
    fetchPageData = async () => {
        try {
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
                            let username = "";
                            let self = false;
                            if (cookies.get('loggedIn')) {
                                username = cookies.get('loggedIn');
                                self = true;
                            }
                            let hash = cookies.get('hash');
                            const articleData = await fetch(currentrooturl + 'm/fetcharticlepagedata', {
                                method: "POST",
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                credentials: corsdefault,
                                body: JSON.stringify({
                                    id, username, hash, self
                                })
                            })
                            .then((response) => {
                                return response.json();
                            })
                            .then((result) => {
                                let authenticated = this.props.checkAndConfirmAuthentication(result);
                                if (authenticated) {
                                    if (result.article) {
                                        this.setState({ fetched: true });
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
                                    } else {
                                        return false;
                                    }
                                } else {
                                    return false;
                                }
                                console.log(result);
                                return result;
                            });
                            if (articleData) {
                                let words = countBody(this.state.body);
                                this.setState({ words: words });
                                this.setTtr(words);
                                if (articleData.articleResponses) {
                                    this.setState({ articleResponses: articleData.articleResponses });
                                }
                                if (articleData.videoResponses) {
                                    this.setState({ videoResponses: articleData.videoResponses });
                                }
                                if (articleData.responseTo) {
                                    this.setState({ responseTo: articleData.responseTo });
                                }
                                if (articleData.likedDisliked) {
                                    if (articleData.likedDisliked == "likes") {
                                        this.setState({ liked: true });
                                        this.setState({ disliked: false });
                                    } else if (articleData.likedDisliked == "dislikes") {
                                        this.setState({ disliked: true });
                                        this.setState({ liked: false });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            // Component likely unmounted
        }
    }
    
    // Sets time to read before sending increment read request
    setTtr = (words) => {
        try {
            let ttr160 = words/160; // Get the time to read of the article if person was reading 160 words a minute (high)
            let ttrDivided = ttr160/16; // Divide this by an eighth to accomodate fast reading/less stringent on reading time
            let secondsBeforeReadIncrement = ttrDivided*60;
            this.setState({ sbri: secondsBeforeReadIncrement });
            this.setState({ readIncrementId: this.setReadIncrement(secondsBeforeReadIncrement, this.state.title)});
            return secondsBeforeReadIncrement;
        } catch (err) {
            this.setState({ sbri: 45 });
            this.setReadIncrement(45);
            return 45;
        }
    }
    
    setReadIncrement = (seconds, title) => {
        return setTimeout(() => {
            if (this.state.title && title) {
                if (title == this.state.title) {
                    // make post request for read increment
                    this.incrementRead();
                }
            }
        }, seconds*1000);
    }
    
    incrementRead = () => {
        if (this.state.id) {
            let id = this.state.id;
            if (cookies.get('loggedIn') && this.state.id ) {
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                fetch(currentrooturl + 'm/incrementread', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        id, username, hash, self
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    console.log(result);
                    let authenticated = this.props.checkAndConfirmAuthentication(result);
                    if (result && authenticated) {
                        this.setState({ reads: this.state.reads + 1 });
                    }
                });
            } else { // Anonymous read
                fetch(currentrooturl + 'm/incrementread', {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        id
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    if (result) {
                        this.setState({ reads: this.state.reads + 1 });
                    }
                });
            }
        }
    }

    render() {
        return (
            <div className="article-container-articlepage">
                <div className="article-title-articlepage">{this.state.title}</div>
                <div className="article-author-articlepage prompt-basic-s grey-out">published by <NavLink exact to={"/profile?p=" + this.state.author} className="to-profile-link-btn">{this.state.author}</NavLink> at {this.state.published}</div>
                <div className="article-body-articlepage article-font-body">{parseBody(this.state.body)}</div>
                <div className="article-menu-flex">
                    <div className="article-stats-articlepage">
                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="read-interact-s" icon={faBookOpen} color={ 'grey' } alt="read"/>{this.state.reads}</span>
                        <span className="nbsp-w">&nbsp;•&nbsp;</span>
                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className={this.state.liked ? "thumbsup-interact-s active-black" : "thumbsup-interact-s"} icon={faThumbsUp} color={ 'grey' } alt="thumbs up" onClick={(e) => {incrementLike.call(this, opposite(this.state.liked), this.state.id, "article", cookies.get('loggedIn'), this.state.fetched)}}/>{this.state.likes}</span>
                        <span className="nbsp-w">&nbsp;•&nbsp;</span>
                        <span className="prompt-basic stats-container-s"><FontAwesomeIcon className={this.state.disliked ? "thumbsdown-interact-s active-black" : "thumbsdown-interact-s"} icon={faThumbsDown} color={ 'grey' } alt="thumbs down" onClick={(e) => {incrementDislike.call(this, opposite(this.state.disliked), this.state.id, "article", cookies.get('loggedIn'), this.state.fetched)}}/>{this.state.dislikes}</span>
                    </div>
                    <div className="more-options-ellipsis-container">
                        <FontAwesomeIcon className="read-interact-s icon-hover" icon={faReply} color={ 'grey' } onClick={(e) => {showMoreOptions.call(this, e)}} alt="reply"/>
                        <ul className={this.props.moreOptionsVisible ? "more-options-ellipsis-dropdown prompt-basic dropdown-menu more-options-videopage-dropdown hidden hidden-visible" : "more-options-ellipsis-dropdown prompt-basic dropdown-menu more-options-videopage-dropdown hidden"} ref={this.moreOptions}>
                            <li><Link to={{
                                pathname:`${setResponseUrl('article', this.state.id, 'article')}`,
                                props:{
                                    responseToId: `${this.state.id}`,
                                    responseToTitle: `${this.state.title}`,
                                    responseToType: "article"
                                }
                            }}>Write article response</Link></li>
                            <li><Link to={{
                                pathname:`${setResponseUrl('video', this.state.id, 'article')}`,
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
                <div className='responses'>{this.state.articleResponses && this.state.videoResponses ? this.state.articleResponses.length > 0 && this.state.videoResponses.length > 0 ? "Responses" : "" : ""}</div>
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
                <div className="responses">Related</div>
                <Suspense fallback={<div className="fallback-loading"></div>}>
                    <RelatedPanel content={this.state.id}
                        contentType='article'
                        title={this.state.title}
                        cloud={this.state.cloud}
                        />
                </Suspense>
            </div>
        )
    }
}
