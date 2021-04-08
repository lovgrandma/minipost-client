import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import currentshopurl from '../shopurl.js';
import Product from './product.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';

import { cookies, socket } from '../App.js';

export default class Shop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            products: [], self: false, editIndex: -1
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
            if (cookies.get('loggedIn') == owner && !this.state.self) {
                this.setState({ self: true });
            }
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
                if (result) {
                    if (result.products) {
                        this.setState({ products: result.products });
                    }
                }
                return result;
            });
        }
    }

    enableEditMode = (e, index) => {
        if (this.state.editIndex != index) {
            this.setState({ editIndex: index });
        } else {
            this.setState({ editIndex: -1 });
        }
        
    }

    render() {
        return (
            <div className="profile-shop-container">
                <div className="shop-name profile-shop off-black weight600">{this.resolveData(this.props.shop, "name")}</div>
                <div className="profile-products-container shop-col">
                    {
                        this.state.products ?
                            this.state.products.map((product, index) => 
                                <Product name={product.name}
                                desc={product.desc}
                                self={this.state.self}
                                enableEditMode={this.enableEditMode}
                                editing={this.state.editIndex}
                                index={index}
                                key={index}
                                />
                            )
                            : null
                    }
                    {
                        this.state.self ? 
                            <Product dummy={true}
                            self={true}
                            enableEditMode={this.enableEditMode}
                            editing={this.state.editIndex}
                            index="dummy"
                            />
                            : null
                    }
                </div>
            </div> 
        )
    }
}
