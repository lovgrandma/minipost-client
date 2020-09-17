import React, {Component} from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import currentrooturl from '../url';

export default class Profile extends Component {
    constructor() {
        super();
        this.state = {}
    }

    render() {
        return (
            <div>
                <div className="page-header-text">Profile</div>
                <div>
                    <div>avatar</div>
                    <div>
                        <div></div>
                            <div>username</div>
                            <div>follow button</div>
                            <div>following</div>
                            <div>followers</div>
                        <div></div>
                        <div>about</div>
                    </div>
                </div>
                <div>
                    <div>videos uploaded</div>
                    <div>total video views</div>
                </div>
                <div>

                </div>
            </div>
        )
    }
}
