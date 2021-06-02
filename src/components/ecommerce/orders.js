import React, { Component } from 'react';
import corsdefault from '../../cors.js';
import currentshopurl from '../../shopurl.js';
import { cookies } from '../../App.js';
import { resolveOrderDesc, resolveTotal, resolveOrderId, sendToOrderReceipt, resolveOrderShops } from '../../methods/ecommerce.js';

export default class Orders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            busy: false, orderHistory: []
        }
    }

    componentDidMount() {
        this.getUserOrders();
    }

    getUserOrders() {
        try {
            this.setState({ busy: true });
            setTimeout(() => { // 25 seconds to do fetch
                this.setState({ busy: false });
            }, 25000);
            if (cookies.get('loggedIn') && cookies.get('hash')) {
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                fetch(currentshopurl + "s/getuserorders", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        username, hash, self
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    this.setState({ busy: false});
                    if (result) {
                        console.log(result);
                        this.setState({ orderHistory: result.data });
                    } else {
                        throw new Error;
                    }
                }).catch((err) => {
                    this.setState({ busy: false});
                    return false;
                });
            }
        } catch (err) {
            this.setState({ busy: false}); // Fail silently
        }
    }

    render() {
        return (
            <div className="fullcheckout-flex max-width-1600 margin0auto">
                <div className={this.state.busy ? "cover-page cover-on" : "cover-page cover-off"}></div>
                <div className="checkout-products-and-btn-container">
                    <div className="margin-bottom-25">
                        <h3>Orders</h3>
                    </div>
                    <div>
                        {
                            this.state.orderHistory ?
                                this.state.orderHistory.slice(0).reverse().map((order, i) => 
                                    <table className="margin-bottom-5 orders-page-table">
                                        <tr>
                                            <div className="prompt-basic-s2 grey-out pointer orders-page-order-id margin-bottom-5" onClick={(e) => {sendToOrderReceipt.call(this, order)}}>{resolveOrderId(order)}</div>
                                            <div>
                                                <div className="order-orders-page weight600">
                                                    <td className="prompt-basic product-receipt-data product-receipt-data-orders-pg pointer" onClick={(e) => {sendToOrderReceipt.call(this, order)}}>{resolveOrderDesc(order, i)}</td><span>&nbsp;</span><td className="prompt-basic-s2 margin-bottom-5">{resolveOrderShops(order)}</td><span>&nbsp;</span><td className="prompt-basic-s receipt-total-light-bg weight600">Order Total:&nbsp;{resolveTotal(order)}</td>
                                                </div>
                                            </div>
                                        </tr>
                                    </table>
                                )
                                : null
                        }
                    </div>
                </div>
            </div>
        )
    }
}