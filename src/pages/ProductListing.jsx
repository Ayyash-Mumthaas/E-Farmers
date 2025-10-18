import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { listProducts } from '../utils/db.js';

export default function ProductListing() {
    const [products, setProducts] = useState([]);
    useEffect(() => {
        listProducts().then(setProducts);
    }, []);

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">All Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </div>
    );
}


