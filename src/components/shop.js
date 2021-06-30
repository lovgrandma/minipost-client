import React, { Component } from 'react';
import currentshopurl from '../shopurl.js';
import Product from './product.js'; import ShippingClassSetup from './shippingclasssetup.js'; import ImageUploadSelection from './partial/image-upload-selection.js';
import corsdefault from '../cors.js';

import { cookies } from '../App.js';

export default class Shop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            products: [], self: false, editIndex: -1, showShippingPortal: false, showImagePortal: false, dummystyles: [{ descriptor: "", options: [{descriptor: "", price: null, quantity: 0}] }], dummyname: "", dummydesc: "", dummyshipping: [], dummyid: "dummyid", dummyimages: [], tempImgData: [], cloud: "", error: "", deletions: new Map()
        }
    }

    componentDidMount() {
        if (this.props.cloud) {
            this.setState({ cloud: this.props.cloud });
        } else if (cookies.get('contentDelivery')) {
            this.setState({ cloud: cookies.get('contentDelivery')});
        }
        console.log(this.state.cloud);
        this.fetchShopData();
    }

    resolveData(data, prop) {
        if (data) {
            return data[prop];
        }
        return null;
    }

    /**
     * Takes a shop and retrieves product data
     */
    fetchShopData = async() => {
        try {
            let owner; // Should be the value of the profile being accessed
            if (this.props.owner) {
                owner = this.props.owner;
            } else {
                owner = window.location.search.match(/\?(s|p)=([a-zA-Z0-9].*)/)[2];
            }
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
        } catch (err) {
            console.log(err);
            this.setState({ error: "Shop wasn't able to load "});
            // Fail silently
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
     * Allows admin to toggle whether to show image portal or not
     * @param {Boolean} val 
     */
    toggleImagePortal = (val) => {
        if (val && this.state.self) {
            this.setState({ showImagePortal: true });
        } else {
            this.setState({ showImagePortal: false });
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

    resolveCurrentImages() {
        if (this.state.editIndex == "dummy") {
            return this.state.dummyimages;
        } else if (this.state.products && this.state.editIndex > -1) {
            if (this.state.products[this.state.editIndex].images) {
                return this.state.products[this.state.editIndex].images;
            }
        }
        return [];
    }

    sendTempImgData = (data) => {
        this.setState({ tempImgData: data });
    }

    /**
     * Will search images for current images selected index by url and then update the name
     * If editing dummy, search this state tempImgData, else search existing product image data on product object
     * 
     * @param {String} url 
     * @param {String || Number} editing 
     * @param {String} name 
     */
    searchAndUpdateImgName = (url, editing, name) => {
        console.log(url, editing, name);
        if (editing == "dummy") {
            for (let i = 0; i < this.state.tempImgData.length; i++) {
                if (url == this.state.tempImgData[i].url) {
                    let temp = this.state.tempImgData;
                    temp[i].name = name;
                    this.setState({ tempImgData: temp });
                    break;
                }
            }
        } else {
            let currImages = this.resolveCurrentImages();
            for (let i = 0; i < currImages.length; i++) {
                if (url == currImages[i].url) {
                    currImages[i].name = name;
                    let tempProducts = this.state.products;
                    tempProducts[this.state.editIndex].images = currImages;
                    this.setState({ products: tempProducts });
                }
            }
        }
    }

    setDeletions(deletions) {
        try {
            this.setState({ deletions: deletions });
        } catch (err) {
            // Fail silently
        }
    }

    moveImg = (editing, index, dir) => {
        console.log(editing, index, dir);
        try {
            let products = this.state.products;
            let pro = products[editing];
            if (dir == "left") {
                if (index != 0) { // try move left
                    let temp = pro.images[index -1];
                    pro.images[index -1] = pro.images[index];
                    pro.images[index] = temp;
                    products[editing] = pro;
                    this.setState({ products: products });
                }
            } else {
                if (index != pro.images.length -1) { // try move right
                    let temp = pro.images[index +1];
                    pro.images[index +1] = pro.images[index];
                    pro.images[index] = temp;
                    products[editing] = pro;
                    this.setState({ products: products });
                }
            }
        } catch (err) {
            console.log(err);
            return false; // Fail silently
        }
    }

    render() {
        let currImages = this.resolveCurrentImages();
        return (
            <div className="profile-shop-container">
                <div className="shop-name profile-shop off-black weight600">{this.resolveData(this.props.shop, "name")}</div>
                <div className="profile-products-container">
                    {
                        this.state.self ?
                            <div>
                                <div className={this.state.showShippingPortal ? "shipping-portal shipping-portal-visible" : "shipping-portal"}>
                                    <ShippingClassSetup owner={this.props.owner}
                                    self={this.state.self}
                                    shippingClasses={this.props.shippingClasses}
                                    toggleShippingPortal={this.toggleShippingPortal}
                                    updateShippingClasses={this.props.updateShippingClasses}
                                    />
                                </div>
                                <div className={this.state.showImagePortal ? "image-portal image-portal-visible" : "image-portal"}>
                                    <ImageUploadSelection images={currImages}
                                    editing={this.state.editIndex}
                                    toggleImagePortal={this.toggleImagePortal} 
                                    sendTempImgData={this.sendTempImgData}
                                    searchAndUpdateImgName={this.searchAndUpdateImgName}
                                    tempImgData={this.state.tempImgData}
                                    deletions={this.state.deletions}
                                    moveImg={this.moveImg}
                                    />
                                </div>
                            </div>
                            : null
                    }
                    {
                        this.state.products ?
                            this.state.products.map((product, index) => 
                                <Product {...this.props} dummy={false}
                                name={product.name}
                                desc={product.description}
                                images={product.images}
                                styles={product.styles}
                                id={product.id}
                                shipping={product.shipping}
                                self={this.state.self}
                                enableEditMode={this.enableEditMode}
                                toggleShippingPortal={this.toggleShippingPortal}
                                toggleImagePortal={this.toggleImagePortal}
                                updateLocalProducts={this.updateLocalProducts}
                                updateLocalProductMeta={this.updateLocalProductMeta}
                                removeShippingClassFromProduct={this.removeShippingClassFromProduct}
                                editing={this.state.editIndex}
                                shippingClasses={this.props.shippingClasses}
                                index={index}
                                key={index}
                                owner={this.props.owner}
                                tempImgData={this.state.tempImgData}
                                cloud={this.state.cloud}
                                userShippingData={this.props.userShippingData}
                                deletions={this.state.deletions}
                                />
                            )
                            : null
                    }
                    {
                        this.state.self ? 
                            <Product {...this.props} dummy={true}
                            name={this.state.dummyname}
                            desc={this.state.dummydesc}
                            images={this.state.dummyimages}
                            styles={this.state.dummystyles}
                            id={this.state.dummyid}
                            shipping={this.state.dummyshipping}
                            self={true}
                            enableEditMode={this.enableEditMode}
                            toggleShippingPortal={this.toggleShippingPortal}
                            toggleImagePortal={this.toggleImagePortal}
                            updateLocalProducts={this.updateLocalProducts}
                            updateLocalProductMeta={this.updateLocalProductMeta}
                            removeShippingClassFromProduct={this.removeShippingClassFromProduct}
                            editing={this.state.editIndex}
                            shippingClasses={this.props.shippingClasses}
                            index="dummy"
                            owner={this.props.owner}
                            tempImgData={this.state.tempImgData}
                            userShippingData={this.props.userShippingData}
                            />
                            : null
                    }
                </div>
            </div> 
        )
    }
}
