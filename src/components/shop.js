import React, { Component } from 'react';
import {
    BrowserRouter,
    Route,
    NavLink,
    Link
} from 'react-router-dom';
import currentshopurl from '../shopurl.js';
import Product from './product.js'; import ShippingClassSetup from './shippingclasssetup.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TextareaAutosize from 'react-textarea-autosize';
import corsdefault from '../cors.js';

import { cookies, socket } from '../App.js';

export default class Shop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            products: [], self: false, editIndex: -1, showShippingPortal: false, dummystyles: [{ descriptor: "", options: [{descriptor: "", price: null, quantity: 0}] }], dummyname: "", dummydesc: "", dummyshipping: null
        }
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
        let owner = this.props.owner; // Should be the value of the profile being accessed
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
            })
            .then((result) => {
                if (this.state.self) {
                    // make request for admin protected edit data 
                    // for editing shipping classes and other things
                }
            })
        }
    }

    enableEditMode = (e, index) => {
        if (this.state.editIndex != index) {
            this.setState({ editIndex: index });
        } else {
            this.setState({ editIndex: -1 });
        }
    }

    /**
     * Allows admin to toggle whether to show shipping class setup portal or not
     * 
     * @param {Boolean} val "true"
     */
    toggleShippingPortal = (val) => {
        if (val && this.state.self) {
            this.setState({ showShippingPortal: true });
        } else {
            this.setState({ showShippingPortal: false });
        }
    }

    updateLocalProducts = (index, data) => {
        if (index == "dummy") {
            this.setState({ dummystyles: data });
        } else {
            let products = this.state.products;
            products[index] = data;
            this.setState({ products: products });
        }
    }

    render() {
        return (
            <div className="profile-shop-container">
                <div className="shop-name profile-shop off-black weight600">{this.resolveData(this.props.shop, "name")}</div>
                <div className="profile-products-container shop-col">
                    {
                        this.state.self ?
                            <div className={this.state.showShippingPortal ? "shipping-portal shipping-portal-visible" : "shipping-portal"}>
                                <ShippingClassSetup owner={this.props.owner}
                                self={this.state.self}
                                shippingClasses={this.props.shippingClasses}
                                toggleShippingPortal={this.toggleShippingPortal}
                                />
                            </div>
                            : null
                    }
                    {
                        this.state.products ?
                            this.state.products.map((product, index) => 
                                <Product name={product.name}
                                desc={product.desc}
                                styles={product.styles}
                                self={this.state.self}
                                shipping={product.shipping}
                                enableEditMode={this.enableEditMode}
                                toggleShippingPortal={this.toggleShippingPortal}
                                updateLocalProducts={this.updateLocalProducts}
                                editing={this.state.editIndex}
                                shippingClasses={this.props.shippingClasses}
                                index={index}
                                key={index}
                                />
                            )
                            : null
                    }
                    {
                        this.state.self ? 
                            <Product dummy={true}
                            name={this.state.dummyname}
                            desc={this.state.dummydesc}
                            styles={this.state.dummystyles}
                            shipping={this.state.dummyshipping}
                            self={true}
                            enableEditMode={this.enableEditMode}
                            toggleShippingPortal={this.toggleShippingPortal}
                            updateLocalProducts={this.updateLocalProducts}
                            editing={this.state.editIndex}
                            shippingClasses={this.props.shippingClasses}
                            index="dummy"
                            />
                            : null
                    }
                </div>
            </div> 
        )
    }
}
