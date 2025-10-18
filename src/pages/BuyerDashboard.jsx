import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { listProducts, placeOrder } from '../utils/db.js';

export default function BuyerDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    
    useEffect(() => { listProducts().then(setProducts); }, []);

    const filtered = useMemo(() => {
        const searchTerm = searchQuery.toLowerCase();
        return products.filter((p) => {
            // Handle both old and new product structures
            const name = p.name || p.variety || '';
            const category = p.category || p.variety || '';
            return name.toLowerCase().includes(searchTerm) || category.toLowerCase().includes(searchTerm);
        });
    }, [searchQuery, products]);

    const onOrder = async (product) => {
        const qtyStr = globalThis?.prompt?.(`Enter quantity to order (Available: ${product.quantity}):`, '1');
        const qty = Number(qtyStr || '0');
        if (Number.isNaN(qty) || qty <= 0) return;

        try {
            await placeOrder({ product, qty });
            const productName = product.name || product.variety || 'Product';
            alert(`Order placed successfully for ${productName}!`);
        } catch (error) {
            alert(`Failed to place order: ${error.message}`);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold">Buyer Dashboard</h2>
            <input 
                className="w-full border rounded px-3 py-2" 
                placeholder="Search products" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} onOrder={onOrder} />
                ))}
            </div>
        </div>
    );
}


