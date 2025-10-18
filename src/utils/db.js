import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';

// Products
export async function listProducts() {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addProduct(product) {
    const user = auth.currentUser;
    console.log('addProduct called with:', product);
    console.log('Current user:', user?.uid);
    console.log('User authenticated:', !!user);

    if (!user) {
        throw new Error('User must be authenticated to add products');
    }

    const productData = {
        ...product,
        ownerUid: user.uid,
        createdAt: Date.now(),
    };

    // Ensure we have the required fields for Firestore rules
    // Map variety to name if name is not provided
    if (!productData.name && productData.variety) {
        productData.name = productData.variety;
    }
    // Map variety to category if category is not provided
    if (!productData.category && productData.variety) {
        productData.category = productData.variety;
    }

    // Validate required fields for Firestore rules
    const requiredFields = ['variety', 'quantity', 'location', 'ownerUid', 'createdAt'];
    const missingFields = requiredFields.filter(field => !(field in productData));
    
    if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        console.error('Product data:', productData);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate field types
    if (typeof productData.variety !== 'string' || productData.variety.length === 0) {
        throw new Error('Variety must be a non-empty string');
    }
    if (typeof productData.quantity !== 'number' || productData.quantity < 0) {
        throw new Error('Quantity must be a non-negative number');
    }
    if (typeof productData.location !== 'string' || productData.location.length < 2) {
        throw new Error('Location must be a string with at least 2 characters');
    }
    
    // Handle imageUrl field - remove if null/undefined to avoid validation issues
    if (!productData.imageUrl || productData.imageUrl === null || productData.imageUrl === '') {
        delete productData.imageUrl;
    }

    console.log('Product data to be saved:', productData);
    console.log('All required fields present:', requiredFields.every(field => field in productData));

    try {
        const docRef = await addDoc(collection(db, 'products'), productData);
        console.log('Product added with ID:', docRef.id);
        return docRef;
    } catch (error) {
        console.error('Error adding product:', error);
        console.error('Product data that failed:', productData);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
    }
}

export async function getProduct(id) {
    const ref = doc(db, 'products', id);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateProduct(id, data) {
    await updateDoc(doc(db, 'products', id), data);
}

export async function removeProduct(id) {
    await deleteDoc(doc(db, 'products', id));
}

// Orders
export async function listOrdersForUser(uid) {
    const q = query(collection(db, 'orders'), where('userUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function listOrdersForFarmer(uid) {
    const q = query(collection(db, 'orders'), where('farmerUid', '==', uid));
    const snap = await getDocs(q);
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // console.log(`Found ${orders.length} orders for farmer ${uid}:`, orders);
    return orders;
}

// Debug function to check all orders
export async function listAllOrders() {
    const snap = await getDocs(collection(db, 'orders'));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // console.log('All orders in database:', orders);
    return orders;
}

export async function placeOrder({ product, qty }) {
    const user = auth.currentUser;

    // Check if requested quantity is available
    if (product.quantity < qty) {
        throw new Error(`Insufficient quantity. Available: ${product.quantity}, Requested: ${qty}`);
    }

    // Try to resolve farmer's display name at order time to avoid later cross-user reads
    let farmerName = null;
    try {
        if (product?.ownerUid) {
            const farmerSnap = await getDoc(doc(db, 'users', product.ownerUid));
            if (farmerSnap.exists()) {
                const data = farmerSnap.data();
                farmerName = data?.name || data?.displayName || null;
            }
        }
    } catch (error) {
        console.warn('Could not fetch farmer name:', error);
    }

    const orderRef = await addDoc(collection(db, 'orders'), {
        productId: product.id,
        productName: product.name || product.variety || 'Product',
        category: product.category || product.variety || '',
        qty,
        unitPrice: product.aiPrice || 0, // Use only aiPrice
        totalPrice: (product.aiPrice || 0) * qty,
        userUid: user?.uid || null,
        farmerUid: product.ownerUid || null,
        farmerName: farmerName,
        status: 'Pending',
        createdAt: Date.now(),
    });


    // Create notification for the farmer using the new notification system
    if (product.ownerUid && user?.uid) {
        const productName = product.name || product.variety || 'Product';
        
        try {
            await createNotification({
                fromUserId: user.uid,
                toUserId: product.ownerUid,
                productName: productName,
                quantity: qty,
                totalPrice: (product.aiPrice || 0) * qty,
                status: 'Pending',
                orderId: orderRef.id
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
        }
    }

    return orderRef;
}

export async function updateOrderStatus(id, status) {
    const orderRef = doc(db, 'orders', id);

    // Get the order details first
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
        throw new Error('Order not found');
    }
    
    const orderData = orderSnap.data();
    const productId = orderData.productId;
    const orderQuantity = orderData.qty;

    // If confirming the order, reduce product quantity (not for rejected orders)
    if (status === 'Confirmed' || status === 'Delivered') {
        if (productId && orderQuantity) {
            // Get the product details
            const productRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                const productData = productSnap.data();
                const currentQuantity = productData.quantity || 0;
                const newQuantity = Math.max(0, currentQuantity - orderQuantity);

                // Update product quantity
                await updateDoc(productRef, { quantity: newQuantity });
                // console.log(`Reduced product ${productId} quantity from ${currentQuantity} to ${newQuantity}`);
            }
        }
    }

    // Update the order status
    await updateDoc(orderRef, { status });

    // Create notification for buyer when farmer accepts/rejects/delivers order
    if (orderData.userUid && (status === 'Confirmed' || status === 'Rejected' || status === 'Delivered')) {
        const productName = orderData.productName || 'Product';
        const farmerName = orderData.farmerName || 'Farmer';
        
        let notificationTitle = '';
        let notificationMessage = '';
        
        if (status === 'Confirmed') {
            notificationTitle = 'Order Confirmed!';
            notificationMessage = `Your order for ${orderQuantity}kg of ${productName} has been confirmed by ${farmerName}.`;
        } else if (status === 'Rejected') {
            notificationTitle = 'Order Rejected';
            notificationMessage = `Your order for ${orderQuantity}kg of ${productName} has been rejected by ${farmerName}.`;
        } else if (status === 'Delivered') {
            notificationTitle = 'Order Delivered!';
            notificationMessage = `Your order for ${orderQuantity}kg of ${productName} has been delivered by ${farmerName}.`;
        }

        try {
            await addDoc(collection(db, 'notifications'), {
                userId: orderData.userUid,
                type: 'order_update',
                title: notificationTitle,
                message: notificationMessage,
                data: {
                    orderId: id,
                    productId: productId,
                    status: status,
                    quantity: orderQuantity,
                    farmerName: farmerName
                },
                read: false,
                createdAt: Date.now()
            });
        } catch (error) {
            console.error('Failed to create buyer notification:', error);
        }
    }
}

export async function cancelOrder(id) {
    const orderRef = doc(db, 'orders', id);

    // Get order details before deleting
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
        const orderData = orderSnap.data();

        // If order was confirmed/delivered, restore product quantity (not for rejected orders)
        if (orderData.status === 'Confirmed' || orderData.status === 'Delivered') {
            const productId = orderData.productId;
            const orderQuantity = orderData.qty;

            if (productId && orderQuantity) {
                const productRef = doc(db, 'products', productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    const productData = productSnap.data();
                    const currentQuantity = productData.quantity || 0;
                    const restoredQuantity = currentQuantity + orderQuantity;

                    // Restore product quantity
                    await updateDoc(productRef, { quantity: restoredQuantity });
                    // console.log(`Restored product ${productId} quantity from ${currentQuantity} to ${restoredQuantity}`);
                }
            }
        }
    }

    // Delete the order
    await deleteDoc(orderRef);
}

// Function specifically for buyer cancellations - always restores quantity if order was confirmed
export async function cancelOrderByBuyer(id) {
    // console.log('cancelOrderByBuyer called with ID:', id);
    // console.log('Current user:', auth.currentUser?.uid);

    const orderRef = doc(db, 'orders', id);

    try {
        // Get order details before deleting
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
            throw new Error('Order not found');
        }

        const orderData = orderSnap.data();
        // console.log('Order data:', orderData);

        // Check if current user is the buyer
        if (auth.currentUser?.uid !== orderData.userUid) {
            throw new Error('You can only cancel your own orders');
        }

        // Always restore quantity if order was confirmed/delivered (buyer cancellation)
        if (orderData.status === 'Confirmed' || orderData.status === 'Delivered') {
            const productId = orderData.productId;
            const orderQuantity = orderData.qty;

            // console.log('Restoring quantity for product:', productId, 'quantity:', orderQuantity);

            if (productId && orderQuantity) {
                const productRef = doc(db, 'products', productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    const productData = productSnap.data();
                    const currentQuantity = productData.quantity || 0;
                    const restoredQuantity = currentQuantity + orderQuantity;

                    // Restore product quantity
                    await updateDoc(productRef, { quantity: restoredQuantity });
                    // console.log(`Buyer cancelled order - Restored product ${productId} quantity from ${currentQuantity} to ${restoredQuantity}`);
                } else {
                    console.warn('Product not found:', productId);
                }
            }
        }

        // Delete the order
        await deleteDoc(orderRef);
        // console.log('Order deleted successfully');

    } catch (error) {
        console.error('Error in cancelOrderByBuyer:', error);
        throw error;
    }
}

// Reviews
export async function addReview({ productId, rating, comment }) {
    const user = auth.currentUser;
    return await addDoc(collection(db, 'reviews'), {
        productId,
        rating,
        comment,
        authorUid: user?.uid || null,
        createdAt: Date.now(),
    });
}

export async function listReviews(productId) {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// User validation functions
export async function checkEmailExists(email) {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    return !snap.empty;
}

export async function checkPhoneExists(phone) {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snap = await getDocs(q);
    return !snap.empty;
}

export async function checkNicExists(nic) {
    const q = query(collection(db, 'users'), where('nic', '==', nic));
    const snap = await getDocs(q);
    return !snap.empty;
}

// Notification functions for real-time communication
export async function createNotification({ fromUserId, toUserId, productName, quantity, status = 'Pending', orderId = null, totalPrice = null }) {
    try {
        // Get buyer name for farmer notifications
        let fromUserName = null;
        if (fromUserId) {
            try {
                const userSnap = await getDoc(doc(db, 'users', fromUserId));
                if (userSnap.exists()) {
                    fromUserName = userSnap.data().name || 'Unknown User';
                }
            } catch (error) {
                console.warn('Could not fetch user name:', error);
            }
        }

        const notificationData = {
            fromUserId,
            toUserId,
            productName,
            quantity,
            status,
            timestamp: Date.now(),
            orderId,
            fromUserName,
            read: false
        };

        // Add totalPrice if provided
        if (totalPrice !== null) {
            notificationData.totalPrice = totalPrice;
        }

        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        return docRef;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}

export async function updateNotificationStatus(notificationId, status) {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            status,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error updating notification status:', error);
        throw error;
    }
}

export async function markNotificationAsRead(notificationId) {
    try {
        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

export async function getUserNotifications(userId) {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('toUserId', '==', userId),
            orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        throw error;
    }
}

export async function getUnreadNotificationCount(userId) {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('toUserId', '==', userId),
            where('read', '==', false)
        );
        const snap = await getDocs(q);
        return snap.docs.length;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}