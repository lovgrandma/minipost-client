import React, {Component} from 'react';
import currentrooturl from '../url';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';
import { parseId } from '../methods/utility.js';
import parseBody from '../methods/htmlparser.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

export default class articlepreview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            body: ""
        }
    }

    componentDidMount() {
        let parseLength = 132;
        if (this.props.edit) {
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
                    <Link to={this.linkToArticle()}>
                        <div className="article-preview-title">{this.props.title}</div>
                    </Link>
                    {
                        this.props.edit ?
                            <div>
                                <FontAwesomeIcon className="edit-interact menu-content-interact" icon={faEllipsisH} color={ '#919191' } alt="edit"/>
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
