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
            <div className="page-basic-container-600">
                <h5>Unsubscribe</h5>
                {
                    this.state.error ?
                        <div className="err-status margin-bottom-25">{this.state.error}</div>
                        : null
                }
                {
                    this.state.unsubscribed ?
                        <div className="margin-bottom-25">We've unsubscribed you from our mailing list. Sorry to see you go. Be well.</div>
                        : null
                }
                <p className="prompt-basic-s2 max-width-800 prompt-highlight">If you have any issues just email us at admin@minipost.app and we will deal with your query promptly.</p>
            </div>
        )
    }
}