import React, { Component } from 'react';
import { subscribeMinipost } from '../../methods/context.js';
import {
    Button
} from 'react-bootstrap';

export default class NewsLetter extends Component {
    constructor(props) {
        super(props);
        this.state = {
            subscribed: false, error: null
        }
        this.email = React.createRef();
    }

    render() {
        return (
            <div className="page-basic-container-600">
                <h3 class="branded margin-bottom-25 margin-top-25">minipost llc ©</h3>
                <h5 className="margin-bottom-50 weight600 prompt-basic">At Minipost we publish case studies that inform you of new business trends and ways to ultimately improve your business. Subscribe below and get our most recent publication:</h5>
                <h1 className="millerbolditalic margin-bottom-50 font-4em">"Why It May Not Be Cost Effective To Use Your Grandpa’s Advice To Sell Internet Products"</h1>
                <div className="flex-column">
                    <input type="email" placeholder="Subscription Email" className="margin-bottom-10 border-radius-5 border-width-1 padding-basic" ref={this.email} />
                    {
                        !this.state.subscribed ?
                            <Button className="red-btn max-width-350 margin-bottom-50" onClick={(e) => {subscribeMinipost.call(this, e)}}>Subscribe To the Minipost Newsletter</Button>
                            : <div className="weight600 margin-bottom-50">You subscribed. Check your email</div>
                    }
                    {
                        this.state.error ?
                            <div className="err-status margin-bottom-25">{this.state.error}</div>
                            : null
                    }
                </div>
            </div>
        )
    }
}