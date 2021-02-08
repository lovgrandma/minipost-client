import React, {Component} from 'react';
import ReactDom from 'react-dom';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import {
    Form,
    FormGroup,
    FormControl,
    Button,
    Col, Grid, Row, Clearfix,
} from 'react-bootstrap';

export default class PlaylistPortal extends Component {
    constructor() {
        super();
        this.state = {  }
        this.playlistBox = React.createRef();
    }

    componentDidMount = async () => {
        try {

        } catch (err) {
            // Component unmounted
        }
    }
    
    render() {
        return (
            <div>
                
            </div>
        )
    }

}
