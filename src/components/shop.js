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
            products: [], self: false, editIndex: -1, showShippingPortal: false, dummystyles: [{ descriptor: "", options: [{descriptor: "", price: null, quantity: 0}] }], dummyname: "", dummydesc: "", dummyshipping: [], dummyid: "dummyid"
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

    /**
     * This is a helper method that helps the client to fill out options. If an option has no price, the data will autofill others.
     * We could do this functionality for price but we would have to set the default 0 quantity value to -0 meaning unset price. 
     * If the user set that to 0 then it would become free. Is this complicated? Maybe we should leave it alone
     *  
     * @param {Array} newData 
     * @returns {Array} newData
     */
    appendOptionsPriceDataToOthersIfNull = (newData) => {
        try {
            let firstValidPrice = null;
            for (let i = 0; i < newData.length; i++) { // Find the first valid price and then break
                for (let j = 0; j < newData[i].options.length; j++) {
                    if (newData[i].options[j].price !== null) {
                        firstValidPrice = newData[i].options[j].price; // Should work for even 0 value
                        break;
                    }
                }
            }
            for (let i = 0; i < newData.length; i++) {
                for (let j = 0; j < newData[i].options.length; j++) {
                    if ((newData[i].options[j].price === null || isNaN(newData[i].options[j].price)) && firstValidPrice) {
                        newData[i].options[j].price = firstValidPrice; // We update the null price to the first valid price we see. Once prices are set this will just not fire
                    }
                }
            }
            return newData;
        } catch (err) {
            console.log(err);
            return newData;
        }
    }

    /**
     * Will update styles for specific product
     * 
     * @param {Number} index 
     * @param {Object} data 
     */
    updateLocalProducts = (index, data, priceUpdate = false) => {
        if (index == "dummy") {
            if (priceUpdate) {
                data = this.appendOptionsPriceDataToOthersIfNull(data);
            }
             this.setState({ dummystyles: data });
        } else {
            let products = this.state.products;
            if (priceUpdate) {
                data = this.appendOptionsPriceDataToOthersIfNull(data);
            }
            products[index].styles = data; // Make sure to update the styles not the actual index member
            this.setState({ products: products });
        }
    }

    /**
     * Will select an index, determine if its a dummy or real product and then use the data to update the meta
     * 
     * @param {Number || String "dummy"} index 
     * @param {*} data 
     * @param {String} type 
     */
    updateLocalProductMeta = (index, data, type = "name") => {
        if (index == "dummy") {
            if (type == "name") {
                this.setState({ dummyname: data });
            } else if (type == "desc") {
                this.setState({ dummydesc: data });
            } else if (type == "appliedShipping") {
                let tempShipping = this.state.dummyshipping;
                if (tempShipping.indexOf(data) < 0) { // data should be a uuid
                    tempShipping.push(data);
                }
                this.setState({ dummyshipping: tempShipping });
            }
        } else {
            let products = this.state.products;
            if (type == "name") {
                products[index].name = data;
            } else if (type == "desc") {
                products[index].description = data;
            } else if (type == "appliedShipping") {
                if (products[index].shipping.indexOf(data) < 0) { // data should be a uuid
                    products[index].shipping.push(data);
                }
            }
            this.setState({ products: products });
        }
    }

    /**
     * Will remove the uuid locally from this products shipping classes given a uuid
     * @param {Number || String "dummy"} index Value of index to change
     * @param {String} uuid 
     */
    removeShippingClassFromProduct = (index, uuid) => {
        if (index == "dummy") {
            let tempShipping = this.state.dummyshipping;
            if (tempShipping.indexOf(uuid) > -1) {
                tempShipping.splice(tempShipping.indexOf(uuid), 1);
            }
            this.setState({ dummyshipping: tempShipping });
        } else {
            let products = this.state.products;
            if (products[index].shipping.indexOf(uuid) > -1) {
                products[index].shipping.splice(products[index].shipping.indexOf(uuid), 1);
            }
            this.setState({ products: products });
        }
    }

    render() {
        return (
            <div className="profile-shop-container">
                <div className="shop-name profile-shop off-black weight600">{this.resolveData(this.props.shop, "name")}</div>
                <div className="profile-products-container">
                    {
                        this.state.self ?
                            <div className={this.state.showShippingPortal ? "shipping-portal shipping-portal-visible" : "shipping-portal"}>
                                <ShippingClassSetup owner={this.props.owner}
                                self={this.state.self}
                                shippingClasses={this.props.shippingClasses}
                                toggleShippingPortal={this.toggleShippingPortal}
                                updateShippingClasses={this.props.updateShippingClasses}
                                />
                            </div>
                            : null
                    }
                    {
                        this.state.products ?
                            this.state.products.map((product, index) => 
                                <Product name={product.name}
                                desc={product.description}
                                styles={product.styles}
                                id={product.id}
                                shipping={product.shipping}
                                self={this.state.self}
                                enableEditMode={this.enableEditMode}
                                toggleShippingPortal={this.toggleShippingPortal}
                                updateLocalProducts={this.updateLocalProducts}
                                updateLocalProductMeta={this.updateLocalProductMeta}
                                removeShippingClassFromProduct={this.removeShippingClassFromProduct}
                                editing={this.state.editIndex}
                                shippingClasses={this.props.shippingClasses}
                                index={index}
                                key={index}
                                owner={this.props.owner}
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
                            id={this.state.dummyid}
                            shipping={this.state.dummyshipping}
                            self={true}
                            enableEditMode={this.enableEditMode}
                            toggleShippingPortal={this.toggleShippingPortal}
                            updateLocalProducts={this.updateLocalProducts}
                            updateLocalProductMeta={this.updateLocalProductMeta}
                            removeShippingClassFromProduct={this.removeShippingClassFromProduct}
                            editing={this.state.editIndex}
                            shippingClasses={this.props.shippingClasses}
                            index="dummy"
                            owner={this.props.owner}
                            />
                            : null
                    }
                </div>
            </div> 
        )
    }
}
