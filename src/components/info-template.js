/** Dash file dash.js
@version 0.3
@author Jesse Thompson
Information page basic template */

import React, { Component } from 'react';
import currentrooturl from '../url.js';
import { checkAtBottom, setData, getNumber, get } from '../methods/utility.js';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import parseBody from '../methods/htmlparser.js';
import { cookies } from '../App.js';

export default class InfoTemplate extends Component {
    constructor(props) {
        super(props);
        this.state = { pageContent: null };
    }

    componentDidMount() {
        this.fetchPageContent();
    }

    componentDidUpdate(prevProps, prevState) {
        try {
            
        } catch (err) {
            // Component may have unmounted
        }
    }

    componentDidCatchError(error, errorInfo) {
        console.log(error);
    }
    
    fetchPageContent() {
        if (this) {
            if (this.props) {
                if (this.props.location) {
                    if (this.props.location.pathname) {
                        let path = this.props.location.pathname;
                        fetch(currentrooturl + '/m/fetchinfopagecontent', {
                                method: "POST",
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'same-origin',
                                body: JSON.stringify({
                                    path
                                })
                            })
                            .then((response) => {
                                return response.text();
                            })
                            .then((result) => {
                                this.setState({ pageContent: result });
                            });
                    }
                }
            }
        }
    }

    render() {
        return (
            <div className='info-template'>
               {
                    this.state.pageContent ? parseBody(this.state.pageContent) : null
                }
            </div>
        )
    }
}
