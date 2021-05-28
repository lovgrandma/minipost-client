import React, { Component } from 'react';
import corsdefault from '../../cors.js';
import currentshopurl from '../../shopurl.js';
import { cookies } from '../../App.js';
import { roundTime } from '../../methods/utility.js';
import { formatAPrice } from '../../methods/ecommerce.js';

export default class Order extends Component {
    constructor(props) {
        super(props);
        this.state = {
            orderId: ""
        }
    }

    componentDidMount() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        let orderId = urlParams.get('o');
        this.setState({ orderId: orderId }, () => {
            this.getOrderInformation();
        });
        
    }

    getOrderInformation() {
        try {
            this.setState({ busy: true });
            setTimeout(() => {
                this.setState({ busy: false });
            }, 25000);
            if (cookies.get('loggedIn') && cookies.get('hash')) {
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                let orderId = this.state.orderId;
                fetch(currentshopurl + "s/getsingleorder", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        username, hash, self, orderId
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    console.log(result);
                    if (result.data.shops && result.data.orderInfo) {
                        this.setState({ shops: result.data.shops, orderInfo: result.data.orderInfo });
                        if (result.data.totals) {
                            this.setState({ totals: result.data.totals });
                        }
                        if (result.data.paymentMethodDetails) {
                            if (result.data.paymentMethodDetails.card && result.data.convertedTime) {
                                this.setState({ cardData: result.data.paymentMethodDetails.card, convertedTime: result.data.convertedTime });
                            }
                        }
                    } else {
                        throw new Error;
                    }
                    this.setState({ busy: false });

                })
                .catch((err) => {
                    this.setState({ busy: false });
                });
            }
        } catch (err) {
            this.setState({ busy: false });
        }
    }

    render() {
        return (
            <div className="fullcheckout-flex max-width-1600 margin0auto">
                <div className={this.state.busy ? "cover-page cover-on" : "cover-page cover-off"}></div>
                <div className="checkout-products-and-btn-container">
                    <div className="margin-bottom-25">
                        <h3>Receipt</h3>
                        <div className="prompt-basic-s2 grey-out">Order number: {this.state.orderId}</div>
                    </div>
                    <div>
                        <div>
                            {
                                this.state.orderInfo && this.state.shops ?
                                    this.state.shops.map((shop) => 
                                        <table className="full-width-table margin-bottom-10">
                                            <tr className="prompt-basic grey-out weight600 margin-bottom-10">{shop.name}</tr>
                                            {
                                                this.state.orderInfo.map((item) => 
                                                    item.shopId == shop.id ?
                                                        <tr className="flex product-receipt-data margin-bottom-5 align-center">
                                                            <td className="prompt-basic-s weight600">{item.name}</td>
                                                            <td className="flex align-center">
                                                                <span className="prompt-basic-s grey-out">Total:&nbsp;</span>
                                                                <div className="prompt-basic-s receipt-total-light-bg weight600">{formatAPrice(item.calculatedTotal)}</div>&nbsp;
                                                                <div className={item.shipped ? "prompt-basic-s weight600" : "prompt-basic-s weight600 grey-out"}>Shipped:&nbsp;<input className="shipped-conf-noedit" type="checkbox" checked={item.shipped}></input></div>
                                                            </td>
                                                        </tr>
                                                        : null
                                                )
                                            }
                                        </table>
                                    )
                                    : null
                            }
                        </div>
                        <div>
                            <table className="totals-container margin-left-auto">
                                <tr className="totals-label-and-price prompt-basic-s">
                                    <td className="grey-out weight600">Subtotal:&nbsp;</td>
                                    <td>{this.state.totals ? this.state.totals.products ? formatAPrice(this.state.totals.products) : null : null}</td>
                                </tr>
                                <tr className="totals-label-and-price prompt-basic-s">
                                    <td className="grey-out weight600">Shipping:&nbsp;</td>
                                    <td>{this.state.totals ? this.state.totals.shipping ? formatAPrice(this.state.totals.shipping) : null : null}</td>
                                </tr>
                                <tr className="totals-label-and-price">
                                    <td className="grey-out weight600">Total:&nbsp;</td>
                                    <td>{this.state.totals ? this.state.totals.total ? formatAPrice(this.state.totals.total) : null : null}</td>
                                </tr>
                            </table>
                        </div>
                        <div className="prompt-basic-s2">{this.state.convertedTime && this.state.cardData && this.state.totals ? this.state.totals.total && this.state.cardData.last4 && this.state.cardData.brand ? `Your ${this.state.cardData.brand} card with last digits ${this.state.cardData.last4} was charged a total of ${formatAPrice(this.state.totals.total)}` : null : null}</div>
                        <div className="prompt-basic-s2 margin-bottom-10">If you notice any problems with your receipt please use the Contact us page or email us at admin@minipost.app</div>
                        <div className="prompt-basic-s2">You cannot access this page while logged off or share this page on the internet. This is for your eyes only.</div>
                    </div>
                </div>
            </div>
        )
    }
}