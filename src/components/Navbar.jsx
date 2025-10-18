import { Link, NavLink } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useNotifications } from '../context/NotificationContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function Navbar() {
    const { user, role, logout, dictionary, language } = useAuth();
    const { unreadCount, notifications, markAsRead, refreshNotifications } = useNotifications();
    const t = dictionary[language];
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && notificationRef.current.contains(event.target) === false) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white/70 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
            <div className="container-px mx-auto py-3 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-green-700">E-Farmers</Link>
                <nav className="flex items-center gap-4">
                    {/* Home link - only for unauthenticated users */}
                        {user === null && (
                        <NavLink to="/" className="text-sm text-gray-700 hover:text-green-700">{t.home}</NavLink>
                    )}
                    
                    {/* Dashboard link - specific to user role */}
                    {user && (
                        <>
                            {role === 'farmer' && (
                                <NavLink to="/home/farmer" className="text-sm text-gray-700 hover:text-green-700">{t.dashboard}</NavLink>
                            )}
                            {role === 'buyer' && (
                                <NavLink to="/home/buyer" className="text-sm text-gray-700 hover:text-green-700">{t.dashboard}</NavLink>
                            )}
                        </>
                    )}
                    
                    {/* Products link - for all authenticated users */}
                    {user && (
                        <NavLink to="/products" className="text-sm text-gray-700 hover:text-green-700">Products</NavLink>
                    )}
                    
                    {/* Orders link - for all authenticated users */}
                    {user && (
                        <NavLink to="/orders" className="text-sm text-gray-700 hover:text-green-700">{t.orders}</NavLink>
                    )}
                    
                    {/* Profile link - for all authenticated users */}
                    {user && <NavLink to="/profile" className="text-sm text-gray-700 hover:text-green-700">Profile</NavLink>}
                    
                    {/* Notification Bell - for all authenticated users */}
                    {user && (
                        <div className="relative" ref={notificationRef}>
                            <button 
                                onClick={() => setShowNotifications(showNotifications === false)}
                                className="relative p-1 hover:bg-gray-100 rounded"
                                aria-label="Notifications"
                            >
                                <span className="inline-block w-5 h-5">🔔</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 text-[10px] bg-red-600 text-white rounded-full px-1 min-w-[16px] text-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            
                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-3 border-b flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={refreshNotifications}
                                                className="text-gray-400 hover:text-gray-600 text-sm"
                                                title="Refresh notifications"
                                            >
                                                ↻
                                            </button>
                                            <button 
                                                onClick={() => setShowNotifications(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                <div className="text-2xl mb-2">🔔</div>
                                                <p>No notifications yet</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {notifications.slice(0, 10).map((notification) => (
                                                    <button 
                                                        key={notification.id}
                                                        className={`p-3 hover:bg-gray-50 cursor-pointer w-full text-left ${notification.read ? '' : 'bg-blue-50'}`}
                                                        onClick={() => {
                                                            markAsRead(notification.id);
                                                            setShowNotifications(false);
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {role === 'farmer' 
                                                                        ? `New Order from ${notification.fromUserName || 'A Buyer'}`
                                                                        : `Order for ${notification.productName} ${notification.status}`
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {`${notification.quantity}kg of ${notification.productName}`}
                                                                </p>
                                                                {notification.totalPrice && (
                                                                    <p className="text-xs text-green-600 mt-1 font-medium">
                                                                        Total: LKR {notification.totalPrice.toFixed(2)}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    {new Date(notification.timestamp).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                {notification.read === false && (
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <LanguageSwitcher />
                    {user === null ? (
                        <div className="flex items-center gap-2">
                            <NavLink to="/login" className="text-sm text-gray-700 hover:text-green-700">{t.login}</NavLink>
                            <NavLink to="/register" className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded">{t.register}</NavLink>
                        </div>
                    ) : (
                        <button onClick={logout} className="text-sm text-white bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded">{t.logout}</button>
                    )}
                </nav>
            </div>
        </header>
    );
}


