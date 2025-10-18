import { useMemo, useState } from 'react';
import ReviewCard from '../components/ReviewCard.jsx';

export default function Reviews() {
    const [reviews] = useState([
        { id: 'r1', author: 'Buyer A', rating: 4, comment: 'Quality produce!', date: Date.now() - 86400000 },
        { id: 'r2', author: 'Buyer B', rating: 5, comment: 'Great price and delivery', date: Date.now() },
    ]);

    const average = useMemo(() => {
        if (!reviews.length) return 0;
        return (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1);
    }, [reviews]);

    return (
        <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Reviews</h2>
                <div className="text-sm text-gray-700">Average Rating: {average} / 5</div>
            </div>
            <div className="grid gap-3">
                {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                ))}
            </div>
        </div>
    );
}


