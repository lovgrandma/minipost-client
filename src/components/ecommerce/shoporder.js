import { formatAPrice, formatAFee } from '../../methods/ecommerce.js';

function resolveUsername(order) {
    try {
        return order.customer.username ? order.customer.username : null;
    } catch (err) {
        return null;
    }
}

function resolveEmail(order) {
    try {
        return order.customer.email ? order.customer.email : null;
    } catch (err) {
        return null;
    }
}

export default function(props) {
    return (
        <div className={props.pending ? "pending-orders-shop-manage" : "completed-orders-shop-manage"}>
            {
                props.orders.map((order) => 
                    <table className="margin-bottom-5 orders-page-table">
                        <tr className="flex">
                            <td>
                                <div className="prompt-basic-s2 grey-out">Order number: {order.id}</div>
                            </td>
                            <td>
                                <div className="receipt-username-email-container">
                                    <span className="prompt-basic-s2 grey-out">user:&nbsp;</span><span className="prompt-basic-s2 grey-out">{resolveUsername(order)}</span>
                                </div>
                            </td>
                        </tr>
                        {
                            order.cart ?
                                order.cart.map((item) => 
                                    <tr className="flex product-receipt-data margin-bottom-5 align-center">
                                        <td className="prompt-basic-s weight600"><span>{item.name}</span><span className="grey-out">&nbsp;{item.quantity > 1 ? "x" + item.quantity : null}</span></td>
                                        <td className="flex align-center">
                                            <span className="prompt-basic-s grey-out">Total:&nbsp;</span>
                                            <div className="prompt-basic-s receipt-total-light-bg weight600">{formatAPrice(item.calculatedTotal)}</div>&nbsp;
                                        </td>
                                    </tr>
                                )
                                : null
                        }
                        <div>
                            <div className="margin-bottom-10">
                                <table className="totals-container margin-left-auto">
                                    <tr className="totals-label-and-price shop-manage-totals-label-price prompt-basic-s">
                                        <td><span className="grey-out weight600">Subtotal:&nbsp;</span>
                                        <span className="margin-right-5">{order.userChargedTotalsForShop ? order.userChargedTotalsForShop.orderSubtotal ? formatAPrice(order.userChargedTotalsForShop.orderSubtotal) : null : null}</span></td>
                                        <td><span className="grey-out weight600">Shipping:&nbsp;</span>
                                        <span>{order.userChargedTotalsForShop ? order.userChargedTotalsForShop.orderShipping ? formatAPrice(order.userChargedTotalsForShop.orderShipping) : null : null}</span></td>
                                        <td><span className="grey-out weight600">Total:&nbsp;</span>
                                        <span>{order.userChargedTotalsForShop ? order.userChargedTotalsForShop.orderTotal ? formatAPrice(order.userChargedTotalsForShop.orderTotal) : null : null}</span></td>
                                        <td><span className="grey-out weight600">Referral Fee:&nbsp;</span>
                                        <span>{order.adjustedTotal && order.completeTotal ? formatAFee(order.adjustedTotal, order.completeTotal) : null}</span></td>
                                    </tr>
                                </table>
                                <table className="shop-manage-totals-payout-container flex">
                                    <tr>
                                        <td>
                                            <div className={props.pending ? "prompt-basic-s weight600" : "prompt-basic-s weight600 grey-out"}>{props.pending ? "Mark As Shipped:" : "Shipped:"}<span>&nbsp;</span>
                                            {
                                                props.pending ?
                                                    <input className="shipped-conf-noedit" type="checkbox" defaultChecked="" onClick={(e) => {props.markAsShipped(e, order)}}></input>
                                                    : <input className="shipped-conf-noedit" type="checkbox" checked="true" ></input>
                                            }
                                            </div>
                                        </td>
                                        <td className="total-payout-label"><span className="grey-out weight600">Total Payout:&nbsp;</span>
                                        <span className="payout-shop-order">{order.adjustedTotal ? formatAPrice(order.adjustedTotal) : null}</span></td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </table>
                )
            }
        </div>
    )
}