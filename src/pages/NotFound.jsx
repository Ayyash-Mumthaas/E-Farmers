import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">404 - Not Found</h2>
            <p className="mt-2 text-gray-600">The page you requested does not exist.</p>
            <Link to="/" className="inline-block mt-4 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Go Home</Link>
        </div>
    );
}


