import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { useAuth } from '../hooks/useAuth.js';

const NotificationContext = createContext();

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    const refreshNotifications = useCallback(async () => {
        if (!user) return;
        
        try {
            const notificationsQuery = query(
                collection(db, 'notifications'),
                where('toUserId', '==', user.uid),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            
            const snapshot = await getDocs(notificationsQuery);
            const fetchedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setNotifications(fetchedNotifications);
            
            const unread = fetchedNotifications.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        let unsubscribe = null;
        let retryCount = 0;
        const maxRetries = 3;
        let refreshInterval = null;

        const setupListener = () => {
            try {
                // Listen for notifications for the current user
                const notificationsQuery = query(
                    collection(db, 'notifications'),
                    where('toUserId', '==', user.uid),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );

                unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
                    const newNotifications = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    setNotifications(newNotifications);
                    
                    // Count unread notifications
                    const unread = newNotifications.filter(n => !n.read).length;
                    setUnreadCount(unread);
                    
                    // Reset retry count on successful connection
                    retryCount = 0;
                }, (error) => {
                    console.error('Error in notification listener:', error);
                    
                    // Retry connection if it fails
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`Retrying notification listener (${retryCount}/${maxRetries})`);
                        setTimeout(() => {
                            if (unsubscribe) {
                                unsubscribe();
                            }
                            setupListener();
                        }, 2000 * retryCount); // Exponential backoff
                    }
                });
            } catch (error) {
                console.error('Error setting up notification listener:', error);
            }
        };

        setupListener();

        // Set up periodic refresh as backup (every 30 seconds)
        refreshInterval = setInterval(() => {
            if (user) {
                refreshNotifications();
            }
        }, 30000);

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [user, refreshNotifications]);

    const markAsRead = async (notificationId) => {
        try {
            // Update in Firestore
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
            
            // Also update local state immediately for better UX
            setNotifications(prev => 
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Fallback: update local state even if Firestore fails, to ensure UI consistency
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
        }
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        refreshNotifications,
        markAsRead,
        markAllAsRead
    }), [notifications, unreadCount, refreshNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}
