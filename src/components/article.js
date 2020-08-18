import React, {Component} from 'react';
import currentrooturl from '../url';

export default class article extends Component {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    componentDidMount() {

    }

    render() {
        return (
            <div className="article-container">
                <div className>{this.props.title}</div>
                <div className="article-title"></div>
                <div className="article-body"></div>
            </div>
        )
    }
}
