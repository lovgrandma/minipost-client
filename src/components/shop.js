import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import currentshopurl from '../shopurl.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';

import { cookies, socket } from '../App.js';

export default class Shop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            
        }
        this.videoContainer = new React.createRef();
        window.addEventListener('keydown', this.interceptEnter);
    }

    componentDidMount() {
        this.fetchShopData();
    }

    resolveData(data, prop) {
        if (data) {
            return data[prop];
        }
        return null;
    }

    /**
     * Takes a shop 
     */
    fetchShopData = async() => {
        let owner = this.props.owner;
        if (owner) {
            fetch(currentshopurl + 's/getshopproducts', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: corsdefault,
                body: JSON.stringify({
                    owner
                })
            })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                console.log(result);
                return result;
            });
        }

    }

    render() {
        return (
            <div className="profile-shop-container">
                <div className="shop-name profile-shop off-black weight600">{this.resolveData(this.props.shop, "name")}</div>
            </div> 
        )
    }
}
