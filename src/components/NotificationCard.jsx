import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCard({ notification, onAccept, onReject, showActions, userRole }) {
    const getStatusClasses = (status) => {
        switch (status) {
            case 'Accepted': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const title = userRole === 'farmer' 
        ? `New Order from ${notification.fromUserName || 'A Buyer'}`
        : `Order for ${notification.productName} ${notification.status}`;

    const message = userRole === 'farmer'
        ? `Buyer ${notification.fromUserName || 'A Buyer'} has ordered ${notification.quantity}kg of ${notification.productName}.`
        : `Your order for ${notification.quantity}kg of ${notification.productName} has been ${notification.status.toLowerCase()} by the farmer.`;

    return (
        <div className={`bg-white border rounded-lg p-4 shadow-sm ${!notification.read ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-base mb-1">{title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(notification.status)}`}>
                            {notification.status}
                        </span>
                        <span>{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</span>
                    </div>
                </div>
                {showActions && notification.status === 'Pending' && (
                    <div className="flex flex-col space-y-2 ml-4">
                        <button
                            onClick={() => onAccept(notification.id)}
                            className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => onReject(notification.id)}
                            className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600 transition-colors"
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

NotificationCard.propTypes = {
    notification: PropTypes.shape({
        id: PropTypes.string.isRequired,
        fromUserId: PropTypes.string.isRequired,
        toUserId: PropTypes.string.isRequired,
        productName: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        status: PropTypes.oneOf(['Pending', 'Accepted', 'Rejected']).isRequired,
        timestamp: PropTypes.number.isRequired,
        orderId: PropTypes.string,
        fromUserName: PropTypes.string,
        read: PropTypes.bool
    }).isRequired,
    onAccept: PropTypes.func,
    onReject: PropTypes.func,
    showActions: PropTypes.bool,
    userRole: PropTypes.oneOf(['farmer', 'buyer']).isRequired,
};
