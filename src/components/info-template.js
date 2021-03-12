/** Dash file dash.js
@version 0.3
@author Jesse Thompson
Information page basic template */

import React, { Component } from 'react';
import currentrooturl from '../url.js';
import { checkAtBottom, setData, getNumber } from '../methods/utility.js';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';
import { cookies } from '../App.js';
const EventEmitter = require('events');

export default class Dash extends Component {
    constructor(props) {
        super(props);
        this.state = {  };
        this.handleMouseDown = this.handleMouseDown.bind(this);
    }

    componentDidMount() {
        
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

    render() {
        return (
            <div className='info-template'>
               
            </div>
        )
    }
}
