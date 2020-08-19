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

export default class articlepreview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            body: ""
        }
    }

    componentDidMount() {
        if (this.props.body) {
            this.parseBody(this.props.body);
        }
    }

    parseBody = (body) => {
        if (body) {
            if (body.length > 162) {
                const html = ReactHtmlParser(body.slice(0, 162));
                html[0].props.children[0] += "..";
                this.setState({ body: html });
            }
        }
    }

    render() {
        return (
            <div className="article-container">
                <Link to={{
                    pathname:`/read?a=${parseId(true, this.props.id)}`,
                    props:{
                        responseMpd: `${this.state.mpd}`,
                        responseTitle: `${this.state.title}`,
                        responseType: "video"
                    }
                }}>
                    <div className="article-preview-title">{this.props.title}</div>
                    <div className="article-preview-body">{this.state.body}</div>
                </Link>
            </div>
        )
    }
}
