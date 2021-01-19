import React, {Component} from 'react';
import currentrooturl from '../url';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import { parseId, get } from '../methods/utility.js';
import { showContentMenu, promptDeleteContent, tryDeleteContent } from '../methods/context.js';
import parseBody from '../methods/htmlparser.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

export default class articlepreview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            body: "", contentMenu: false, deleteContentPrompt: false, deleteErr: ""
        }
        this.titleDelete = React.createRef();
    }

    componentDidMount() {
        let parseLength = 132;
        if (this.props.edit || this.props.viewProfile) {
            parseLength = 750;
        }
        if (this.props.body) {
            this.setState({ body: parseBody(this.props.body, parseLength, true) });
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
            <div className={this.props.edit  || this.props.viewProfile ? "col" : ""}>
                <div className={this.props.edit || this.props.viewProfile ? "article-container-edit" : "article-container article-container-preview"}>
                    {
                        this.state.deleteContentPrompt ?
                            <div className="delete-prompt-box delete-prompt-box-article">
                                <div className="flex"><label htmlFor="titleDelete">Delete "{this.props.title}" ? Please enter the title below:</label><div className="clear-content-menu" onClick={(e) => {promptDeleteContent.call(this, e)}}>×</div></div>
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
                        <div className="article-preview-title">{this.props.title}</div>
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
                </div>
            </div>
        )
    }
}
