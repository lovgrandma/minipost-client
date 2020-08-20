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
import { faThumbsUp, faThumbsDown, faHeart, faShare, faBookOpen, faReply } from '@fortawesome/free-solid-svg-icons';
import { roundTime } from '../methods/utility.js';

export default class Article extends Component {
    constructor(props) {
        super(props)
        this.state = {
            id: "", title: "", author: "", body: "", published: "", reads: "", likes: "", dislikes: "", responseToMpd: "", responseToTitle: "", responseToType: "", responseToId: "", articleResponses: [], videoResponses: [], relevant: []
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
                if (this.props.location.props.responseToId) {
                    this.setState({ responseToId: this.props.location.props.responseToId });
                }
                if (this.props.location.props.responseToMpd) {
                    this.setState({ responseToMpd: this.props.location.props.responseToMpd });
                }
                if (this.props.location.props.responseToTitle) {
                    this.setState({ responseToTitle: this.props.location.props.responseToTitle });
                }
                if (this.props.location.props.responseToType) {
                    this.setState({ responseToType: this.props.location.props.responseToType });
                }
            }
        }
        this.fetchPageData();
    }

    // Will run when user loads from external link or not from within minipost
    fetchPageData = async () => {
        if (!this.state.title || !this.state.author || !this.state.title || !this.state.published || this.state.relevant.length == 0) {
            if (this.props) {
                if (this.props.location) {
                    if (this.props.location.search) {
                        if (this.props.location.search.match(/([?a=]*)([a-zA-Z0-9].*)/)) {
                            if (this.props.location.search.match(/([?a=]*)([a-zA-Z0-9].*)/)[2]) {
                                let id = this.props.location.search.match(/([?a=]*)([a-zA-Z0-9].*)/)[2];
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
                                    console.log(result);
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    parseBody(body) {
        if (body) {
            return ReactHtmlParser(body);
        }
        return body;
    }

    setResponseParentLink() {
        if (this.state.responseToMpd) { // Response is video set watch pathname
            return {
                pathname:`/watch?v=${this.state.responseToMpd}`
            }
        } else if (this.state.responseToId) { // Response is article set read pathname
            return {
                pathname:`/read?a=${this.state.responseToId}`
            }
        } else {
            return {
                pathname:`/`
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
                <div className="article-body-articlepage">{this.parseBody(this.state.body)}</div>
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
                <div className="prompt-basic">{this.state.responseToTitle ? "Response to " : ""}<span className="grey-out">{this.state.responseToType && this.state.responseToTitle ? this.state.responseToTitle.length > 0 ? <Link to={this.setResponseParentLink()}>{this.state.responseToTitle}</Link> : "" : ""}</span></div>
            </div>
        )
    }
}
