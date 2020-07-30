import React, {Component} from 'react';
import {
    BrowserRouter,
    Route,
    NavLink
} from 'react-router-dom';
import dummythumbnail from '../static/warrenbuffetthumb.jpg';

export default class Videos extends Component {
    render () {
        return (
            <div className="col">
                <div className='videocontainer'>
                <NavLink to='/watch/'><img className='videothumb' src={dummythumbnail}></img></NavLink>
                <p className='mainvideotitle'>{this.props.title}</p>
                <p className='videodesc'>{this.props.description}</p>
                </div>
            </div>
        )
    }
}
