import { Link } from 'react-router-dom';

export default function ProductCard({ product, onOrder }) {
    const { id, name, category, variety, imageUrl, quantity, aiPrice } = product;
    // Use variety as fallback for name and category
    const displayName = name || variety || 'Product';
    const displayCategory = category || variety || 'Rice';
    
    return (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            {imageUrl ? (
                <img src={imageUrl} alt={displayName} className="h-40 w-full object-cover" />
            ) : (
                <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
            )}
            <div className="p-4 space-y-1">
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-600">{displayCategory} • Qty: {quantity}</p>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-800 font-medium">Price: LKR {aiPrice || 'N/A'}</span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                    <Link to={`/products/${id}`} className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">Details</Link>
                    {onOrder && (
                        <button onClick={() => onOrder(product)} className="text-sm px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700">Order</button>
                    )}
                </div>
            </div>
        </div>
    );
}


