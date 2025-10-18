export default function ReviewCard({ review }) {
    const { author, rating, comment, date } = review;
    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{author}</div>
                <div className="text-yellow-500">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</div>
            </div>
            {comment && <p className="mt-2 text-sm text-gray-700">{comment}</p>}
            {date && <p className="mt-1 text-xs text-gray-500">{new Date(date).toLocaleDateString()}</p>}
        </div>
    );
}


