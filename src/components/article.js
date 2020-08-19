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
import { faThumbsUp, faThumbsDown, faHeart, faShare, faBookOpen } from '@fortawesome/free-solid-svg-icons';

export default class Article extends Component {
    constructor(props) {
        super(props)
        this.state = {
            title: "", author: "", body: "", published: "", reads: "", likes: "", dislikes: "", responseToMpd: "", responseToTitle: "", responseToType: "", responseToId: ""
        }
    }

    componentDidMount() {
        this.setUpState();
    }

    /** Runs when user loads page by clicking from another page. Will not function when page is loaded from direct link or reload */
    setUpState() {
        if (this.props.location) {
            if (this.props.location.props) {
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

    render() {
        return (
            <div className="article-container-articlepage">
                <div className="article-title-articlepage">{this.state.title}</div>
                <div className="article-author-articlepage prompt-basic-s grey-out">published by {this.state.author} at {this.state.published}</div>
                <div className="article-body-articlepage">{this.parseBody(this.state.body)}</div>
                <div className="article-stats-articlepage">
                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="read-interact-s" icon={faBookOpen} color={ 'grey' } alt="read"/>{this.state.reads}</span>
                    <span className="nbsp-w">&nbsp;•&nbsp;</span>
                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsup-interact-s" icon={faThumbsUp} color={ 'grey' } alt="read"/>{this.state.likes}</span>
                    <span className="nbsp-w">&nbsp;•&nbsp;</span>
                    <span className="prompt-basic stats-container-s"><FontAwesomeIcon className="thumbsdown-interact-s" icon={faThumbsDown} color={ 'grey' } alt="read"/>{this.state.dislikes}</span>
                </div>
                <div className="prompt-basic">{this.state.responseToTitle ? "Response to " : ""}<span className="grey-out">{this.state.responseToType && this.state.responseToTitle ? this.state.responseToTitle.length > 0 ? <Link to={this.setResponseParentLink()}>{this.state.responseToTitle}</Link> : "" : ""}</span></div>
            </div>
        )
    }
}
