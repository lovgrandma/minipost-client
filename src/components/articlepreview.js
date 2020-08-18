import React, {Component} from 'react';
import currentrooturl from '../url';
import ReactHtmlParser, { processNodes, convertNodeToElement, htmlparser2 } from 'react-html-parser';

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
            if (body.length > 112) {
                const html = ReactHtmlParser(body.slice(0, 112));
                console.log(html);
                html[0].props.children[0] += "..";
                this.setState({ body: html });
            }
        }
    }

    render() {
        return (
            <div className="article-container">
                <div className="article-preview-title">{this.props.title}</div>
                <div className="article-preview-body">{this.state.body}</div>
            </div>
        )
    }
}
