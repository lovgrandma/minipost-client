import React, { Component } from 'react';
import corsdefault from '../../cors.js';
import currentshopurl from '../../shopurl.js';
import ShopOrder from './shoporder.js';
import { cookies } from '../../App.js';
import { roundTime } from '../../methods/utility.js';
import { formatAPrice, formatAFee, orderShipped } from '../../methods/ecommerce.js';

export default class ShopOrders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pendingOrders: [], completedOrders: []
        }
    }

    componentDidMount() {
        this.getShopOrders();
    }

    getShopOrders() {
        try {
            this.setState({ busy: true });
            setTimeout(() => { // 25 seconds to do fetch
                this.setState({ busy: false });
            }, 25000);
            if (cookies.get('loggedIn') && cookies.get('hash')) {
                let username = cookies.get('loggedIn');
                let hash = cookies.get('hash');
                let self = true;
                let appendPending = this.state.ordersPending ? this.state.ordersPending.length > 0 ? this.state.ordersPending.length + 50 : 50 : 50;
                let appendCompleted = this.state.ordersCompleted ? this.state.ordersCompleted.length > 0 ? this.state.ordersCompleted.length + 50 : 50 : 50;
                fetch(currentshopurl + "s/getshoporders", {
                    method: "POST",
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: corsdefault,
                    body: JSON.stringify({
                        username, hash, self, appendPending, appendCompleted
                    })
                })
                .then((response) => {
                    return response.json();
                })
                .then((result) => {
                    this.setState({ busy: false});
                    if (result) {
                        let appendPendingRes = result.data.appendPending ? result.data.appendPending : 0;
                        let appendCompletedRes = result.data.appendCompleted ? result.data.appendCompleted : 0;
                        this.setState({
                            shopId: result.data.shopId ? result.data.shopId : null,
                            ordersPending: result.data.ordersPending,
                            appendPending: appendPendingRes,
                            ordersCompleted: result.data.ordersCompleted,
                            appendCompleted: appendCompletedRes
                        })
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

    markAsShipped = async (e, order) => {
        try {
            if (e.target.checked) {
                this.setState({ busy: true });
                setTimeout(() => { // 25 seconds to do fetch
                    this.setState({ busy: false });
                }, 25000);
                // Only run if target is checked
                e.target.checked = false;
                if (cookies.get('loggedIn') && cookies.get('hash')) {
                    let username = cookies.get('loggedIn');
                    let hash = cookies.get('hash');
                    let self = true;
                    let appendPending = this.state.ordersPending ? this.state.ordersPending.length > 0 ? this.state.ordersPending.length : 50 : 50;
                    let appendCompleted = this.state.ordersCompleted ? this.state.ordersCompleted.length > 0 ? this.state.ordersCompleted.length : 50 : 50;
                    let orderId = order.id;
                    let shopId = this.state.shopId;
                    fetch(currentshopurl + "s/markordershipped", {
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        credentials: corsdefault,
                        body: JSON.stringify({
                            username, hash, self, appendPending, appendCompleted, orderId, shopId
                        })
                    })
                    .then((response) => {
                        return response.json();
                    })
                    .then((result) => {
                        this.setState({ busy: false});
                        if (result) {
                            console.log(result);
                            let appendPendingRes = result.data.appendPending ? result.data.appendPending : 0;
                            let appendCompletedRes = result.data.appendCompleted ? result.data.appendCompleted : 0;
                            this.setState({
                                shopId: result.data.shopId ? result.data.shopId: null,
                                ordersPending: result.data.ordersPending,
                                appendPending: appendPendingRes,
                                ordersCompleted: result.data.ordersCompleted,
                                appendCompleted: appendCompletedRes
                            })
                        } else {
                            throw new Error;
                        }
                    }).catch((err) => {
                        this.setState({ busy: false});
                        return false;
                    });
                }
            } else {
                throw new Error;
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
                        <h3>Shop Orders</h3>
                    </div>
                    <div className="prompt-basic-s3 grey-out margin-bottom-5">You are not permitted to communicate with customers for any purpose other than details related to their order or share their information publicly. Attempts to market to them without their consent or advertise new products to their account can result in strikes to your vendor account</div>
                    <div>
                        <h5>Pending</h5>
                        {
                            this.state.ordersPending ?
                                <ShopOrder pending={true}
                                orders={this.state.ordersPending}
                                markAsShipped={this.markAsShipped} />
                                : null
                        }
                        <h5>Completed</h5>
                        {
                            this.state.ordersCompleted ? 
                                <ShopOrder pending={false}
                                orders={this.state.ordersCompleted} />
                                : null
                        }
                    </div>
                </div>
            </div>
        )
    }
}