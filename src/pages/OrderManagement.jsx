import { useEffect, useState } from 'react';
import { auth } from '../firebase/config.js';
import { listOrdersForUser, listOrdersForFarmer, cancelOrder, cancelOrderByBuyer, updateOrderStatus, createNotification } from '../utils/db.js';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth.js';

export default function OrderManagement() {
    const { role } = useAuth();
    const [orders, setOrders] = useState([]);
    const [farmerNames, setFarmerNames] = useState({});
    const [buyerNames, setBuyerNames] = useState({});

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (uid) {
            if (role === 'farmer') {
                console.log('Loading orders for farmer UID:', uid);
                listOrdersForFarmer(uid).then(orders => {
                    console.log('Farmer orders loaded:', orders);
                    setOrders(orders);
                });
            } else {
                console.log('Loading orders for buyer UID:', uid);
                listOrdersForUser(uid).then(orders => {
                    console.log('Buyer orders loaded:', orders);
                    setOrders(orders);
                });
            }
        }
    }, [role]);

    useEffect(() => {
        const loadFarmerNames = async () => {
            if (!orders.length) return;

            // Get all unique farmer UIDs from orders
            const farmerUids = Array.from(new Set(
                orders.map(o => o.farmerUid).filter(Boolean)
            ));

            if (!farmerUids.length) return;

            const db = getFirestore();
            const nameMap = {};

            // Fetch farmer names from users collection
            await Promise.all(farmerUids.map(async (uid) => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        nameMap[uid] = userData.name || userData.displayName || 'Unknown Farmer';
                    } else {
                        nameMap[uid] = 'Unknown Farmer';
                    }
                } catch (error) {
                    console.warn(`Failed to fetch farmer name for UID ${uid}:`, error);
                    nameMap[uid] = 'Unknown Farmer';
                }
            }));

            setFarmerNames(nameMap);
        };

        loadFarmerNames();
    }, [orders]);

    // Fetch buyer names for farmers
    useEffect(() => {
        const loadBuyerNames = async () => {
            if (!orders.length || role !== 'farmer') return;

            // Get all unique buyer UIDs from orders
            const buyerUids = Array.from(new Set(
                orders.map(o => o.userUid).filter(Boolean)
            ));

            if (!buyerUids.length) return;

            const db = getFirestore();
            const nameMap = {};

            // Fetch buyer names from users collection
            await Promise.all(buyerUids.map(async (uid) => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        nameMap[uid] = userData.name || userData.displayName || 'Unknown Buyer';
                    } else {
                        nameMap[uid] = 'Unknown Buyer';
                    }
                } catch (error) {
                    console.warn(`Failed to fetch buyer name for UID ${uid}:`, error);
                    nameMap[uid] = 'Unknown Buyer';
                }
            }));

            setBuyerNames(nameMap);
        };

        loadBuyerNames();
    }, [orders, role]);

    const onCancel = async (id) => {
        const order = orders.find(o => o.id === id);
        if (!order) {
            console.error('Order not found:', id);
            alert('Order not found');
            return;
        }

        let confirmMessage = 'Are you sure you want to cancel this order?';
        if (role === 'buyer' && (order.status === 'Confirmed' || order.status === 'Delivered')) {
            confirmMessage = 'Are you sure you want to cancel this order? The farmer\'s product quantity will be restored.';
        }

        if (!globalThis.confirm(confirmMessage)) return;

        try {
            console.log('Attempting to cancel order:', id, 'Role:', role, 'Status:', order.status);

            if (role === 'buyer') {
                await cancelOrderByBuyer(id);
            } else {
                await cancelOrder(id);
            }

            setOrders(prev => prev.filter(o => o.id !== id));
            alert('Order cancelled successfully');
        } catch (error) {
            console.error('Failed to cancel order:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                orderId: id,
                role: role,
                orderStatus: order.status
            });
            alert(`Failed to cancel order: ${error.message}`);
        }
    };

    const onUpdateStatus = async (id, newStatus) => {
        try {
            await updateOrderStatus(id, newStatus);
            // Update the local state
            setOrders(prev => prev.map(o =>
                o.id === id ? { ...o, status: newStatus } : o
            ));
            alert(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Failed to update order status');
        }
    };

    const onAcceptOrder = async (id) => {
        try {
            await onUpdateStatus(id, 'Confirmed');
            
            // Create notification for the buyer
            const order = orders.find(o => o.id === id);
            if (order?.userUid) {
                await createNotification({
                    fromUserId: auth.currentUser.uid,
                    toUserId: order.userUid,
                    productName: order.productName,
                    quantity: order.qty,
                    totalPrice: order.totalPrice,
                    status: 'Accepted',
                    orderId: order.id
                });
            }
        } catch (error) {
            console.error('Error accepting order:', error);
            alert('Failed to accept order. Please try again.');
        }
    };

    const onRejectOrder = async (id) => {
        try {
            await onUpdateStatus(id, 'Rejected');
            
            // Create notification for the buyer
            const order = orders.find(o => o.id === id);
            if (order?.userUid) {
                await createNotification({
                    fromUserId: auth.currentUser.uid,
                    toUserId: order.userUid,
                    productName: order.productName,
                    quantity: order.qty,
                    totalPrice: order.totalPrice,
                    status: 'Rejected',
                    orderId: order.id
                });
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            alert('Failed to reject order. Please try again.');
        }
    };


    // Get status badge classes
    const getStatusClasses = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Confirmed': return 'bg-blue-100 text-blue-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate order statistics for farmers
    const orderStats = role === 'farmer' ? {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        confirmed: orders.filter(o => o.status === 'Confirmed').length,
        delivered: orders.filter(o => o.status === 'Delivered').length,
        rejected: orders.filter(o => o.status === 'Rejected').length,
    } : null;

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">
                {role === 'farmer' ? 'Order Management' : 'My Orders'}
            </h2>

            {/* Debug info - remove this in production */}


            {/* Order statistics for farmers */}
            {role === 'farmer' && orderStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white border rounded p-3 text-center">
                        <div className="text-2xl font-bold text-gray-800">{orderStats.total}</div>
                        <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="bg-white border rounded p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="bg-white border rounded p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">{orderStats.confirmed}</div>
                        <div className="text-sm text-gray-600">Confirmed</div>
                    </div>
                    <div className="bg-white border rounded p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
                        <div className="text-sm text-gray-600">Delivered</div>
                    </div>
                    <div className="bg-white border rounded p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{orderStats.rejected}</div>
                        <div className="text-sm text-gray-600">Rejected</div>
                    </div>
                </div>
            )}
            <div className="space-y-3">
                {orders.map((o) => (
                    <div key={o.id} className="border rounded p-4 bg-white">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="font-medium">{o.productName}</div>
                                <div className="text-sm text-gray-600">Category: {o.category}</div>
                                <div className="text-sm text-gray-600">Location: {o.location}</div>

                                {/* Show farmer name for buyers */}
                                {role === 'buyer' && o.farmerUid && (
                                    <div className="text-sm text-gray-600">
                                        Farmer: {farmerNames[o.farmerUid] || o.farmerName || 'Loading...'}
                                    </div>
                                )}

                                {/* Show buyer name for farmers */}
                                {role === 'farmer' && o.userUid && (
                                    <div className="text-sm text-gray-600">
                                        Buyer: {buyerNames[o.userUid] || 'Loading...'}
                                    </div>
                                )}

                                <div className="text-sm text-gray-600">Quantity: {o.qty}</div>
                                {o.unitPrice != null && (
                                    <div className="text-sm text-gray-600">Unit Price: LKR {o.unitPrice}</div>
                                )}
                                {o.totalPrice != null && (
                                    <div className="text-sm text-gray-800 font-medium">Total: LKR {o.totalPrice}</div>
                                )}

                                {/* Show order date */}
                                <div className="text-xs text-gray-500">
                                    Ordered: {new Date(o.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <span className={`text-sm px-2 py-1 rounded border ${getStatusClasses(o.status)}`}>
                                    {o.status}
                                </span>

                                {/* Farmer actions */}
                                {role === 'farmer' && o.status === 'Pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                            onClick={() => onAcceptOrder(o.id)}
                                        >
                                            Accept
                                        </button>
                                        <button
                                            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                            onClick={() => onRejectOrder(o.id)}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {role === 'farmer' && o.status === 'Confirmed' && (
                                    <button
                                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                        onClick={() => onUpdateStatus(o.id, 'Delivered')}
                                    >
                                        Mark Delivered
                                    </button>
                                )}

                                {/* Buyer actions */}
                                {role === 'buyer' && (o.status === 'Pending' || o.status === 'Confirmed') && (
                                    <div className="flex flex-col items-end gap-1">
                                        <button
                                            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                            onClick={() => onCancel(o.id)}
                                        >
                                            Cancel
                                        </button>
                                        {o.status === 'Confirmed' && (
                                            <span className="text-xs text-gray-500">Will restore quantity</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {!orders.length && <div className="text-sm text-gray-500">No orders yet.</div>}
            </div>
        </div>
    );
}


