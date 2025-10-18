import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct, listReviews, addReview } from '../utils/db.js';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../firebase/config.js';

export default function ProductDetails() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [isDelivered, setIsDelivered] = useState(false);

    useEffect(() => {
        (async () => {
            const p = await getProduct(id);
            setProduct(p);
            const r = await listReviews(id);
            setReviews(r);
            // Check if current user has a Delivered order for this product
            const db = getFirestore();
            const uid = auth.currentUser?.uid;
            if (uid) {
                const q = query(collection(db, 'orders'), where('userUid', '==', uid), where('productId', '==', id), where('status', '==', 'Delivered'));
                const snap = await getDocs(q);
                setIsDelivered(!snap.empty);
            }
        })();
    }, [id]);

    const onAddReview = async (e) => {
        e.preventDefault();
        await addReview({ productId: id, rating: Number(newReview.rating), comment: newReview.comment });
        setNewReview({ rating: 5, comment: '' });
        const r = await listReviews(id);
        setReviews(r);
    };

    if (!product) return null;
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-2 bg-white border rounded p-4">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-60 object-cover rounded" />
                ) : null}
                <h2 className="text-2xl font-semibold">{product.name}</h2>
                <p>Category: {product.category}</p>
                {product.location && <p>Location: {product.location}</p>}
                <p>Quantity: {product.quantity}</p>
                {/* Price removed per requirement */}
                {product.aiPrice ? <p>AI Price: LKR {product.aiPrice}</p> : null}
            </div>

            <div className="bg-white border rounded p-4">
                <h3 className="font-semibold mb-2">Add Review</h3>
                {!isDelivered ? (
                    <div className="text-sm text-gray-600">You can leave feedback after this order is marked delivered.</div>
                ) : (
                    <form onSubmit={onAddReview} className="flex items-center gap-2">
                        <select className="border rounded px-2 py-1" value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <input className="flex-1 border rounded px-3 py-2" placeholder="Comment" value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} />
                        <button className="bg-green-600 text-white px-3 py-2 rounded">Submit</button>
                    </form>
                )}
            </div>

            <div className="space-y-2">
                <h3 className="font-semibold">Reviews</h3>
                {reviews.map(r => (
                    <div key={r.id} className="border rounded p-3 bg-white">
                        <div className="text-yellow-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                        {r.comment && <div className="text-sm mt-1">{r.comment}</div>}
                    </div>
                ))}
                {!reviews.length && <div className="text-sm text-gray-500">No reviews yet.</div>}
            </div>
        </div>
    );
}


