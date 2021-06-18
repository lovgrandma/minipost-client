import React, { Component } from 'react';
import currentrooturl from '../../url';
import currentshopurl from '../../shopurl.js';
import { cookies } from '../../App.js';
import corsdefault from '../../cors.js';

export default class AdminOptions extends Component {
    constructor() {
        super();
        this.state = { admin: false, placementSuccess: null, placementError: null };
        this.owner = React.createRef();
        this.shopName = React.createRef();
        this.description = React.createRef();
    }

    componentDidMount = () => {
        try {
            this.checkAdmin();
        } catch (err) {
            // Component unmounted
        }
    }

    componentDidUpdate(prevProps) {

    }

    checkAdmin() {
        if (cookies.get('adminCheck')) {
            this.setState({ admin: true });
        }
    }

    async makeNewShop() {
        const username = cookies.get('loggedIn');
        const hash = cookies.get('hash');
        const owner = this.owner.current.value;
        const shop = this.shopName.current.value;
        const description = this.description.current.value;
        await fetch(currentshopurl + 'a/buildshop', {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: corsdefault,
                body: JSON.stringify({
                    username, hash, owner, shop, description, 
                })
            })
            .then((response) => {
                return response.json(); // Parsed data
            })
            .then((data) => {
                if (data) {
                    this.setState({ placementSuccess: "Was able to successfully create shop" });
                } else {
                    throw new Error;
                }
            })
            .catch((err) => {
                this.setState({ placementError: "Was not able to create new shop"});
                return false;
            })
    }

    render() {
        return (
            <div>
                {
                    this.state.admin ?
                        <div>
                            <h3>Admin</h3>
                            <div className="prompt-basic margin-bottom-5">Build new Shop</div>
                            <div className="prompt-basic-s margin-bottom-10 grey-out">Hello Administrator. This endpoint will attempt to create a shop on the backend and will set their authorization on the neo4j record to true. Meaning they are live. Use staff procedures ensure to communicate to shop owner the conditions of their vendor account on Minipost.</div>
                            <div className="flex-column">
                                <input type="text" ref={this.owner} placeholder="Owner Username" className="margin-bottom-5 border-radius-5"></input>
                                <input type="text" ref={this.shopName} placeholder="Shop Name" className="margin-bottom-5 border-radius-5"></input>
                                <input type="text" ref={this.description} placeholder="Shop Description" className="margin-bottom-5 border-radius-5"></input>
                                <button className="red-btn border-radius-5" onClick={(e) => {this.makeNewShop(e)}}>Create Shop</button>
                            </div>
                            <div className={this.state.placementSuccess || this.state.placementError ? "placement-info-container placement-info-container-visible" : "placement-info-container"}>
                                <div className={this.state.placementSuccess ? this.state.placementSuccess.length > 0 ? "generic-success generic-success-active" : "generic-success generic-success-hidden" : "generic-success generic-success-hidden"}>{this.state.placementSuccess}</div>
                                <div className={this.state.placementError ? this.state.placementError.length > 0 ? "err-status err-status-product-active err-status-active" : "err-status err-status-product err-status-hidden" : "err-status err-status-product err-status-hidden"}>{this.state.placementError}</div>
                            </div>
                        </div>
                        : <div>Disauthenticated</div>
                }
            </div>
        )
    }

}
