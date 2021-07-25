import React, { Component } from 'react';
import { unsubscribeMinipost } from '../../methods/context.js';
import {
    Button
} from 'react-bootstrap';

export default class NewsLetter extends Component {
    constructor(props) {
        super(props);
        this.state = {
            unsubscribed: false, error: null
        }
    }

    componentDidMount() {
        this.doUnsubscribe();
    }

    doUnsubscribe = () => {
        try {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const u = urlParams.get('p');
            unsubscribeMinipost.call(this, u);
        } catch (err) {
            // Fail silently
        }
    }

    render() {
        return (
            <div className="max-width-800 page-basic-container">
                <h5>Unsubscribe</h5>
                {
                    this.state.error ?
                        <div className="err-status">{this.state.error}</div>
                        : null
                }
                {
                    this.state.unsubscribed ?
                        <div>We've unsubscribed you. Sorry to see you go. Be well.</div>
                        : null
                }
                <p>If you have any issues just email us at admin@minipost.app and we will deal your query promptly.</p>
            </div>
        )
    }
}