import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function Home() {
    const { user, role, loading } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return <LoadingSpinner message="Loading..." />;
    }

    // If user is authenticated and has a defined role, redirect to their dashboard
    if (user && role) {
        if (role === 'farmer') {
            return <Navigate to="/home/farmer" replace />;
        } else if (role === 'buyer') {
            return <Navigate to="/home/buyer" replace />;
        }
    }

    // Only show home page content for unauthenticated users or users with undefined roles
    return (
        <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="text-center py-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to the E-Farmers</h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Connect farmers with buyers, get AI-powered price suggestions, and manage orders seamlessly. 
                    Your one-stop platform for agricultural commerce.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link 
                        to="/register" 
                        className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 font-semibold"
                    >
                        Get Started
                    </Link>
                    <Link 
                        to="/login" 
                        className="px-6 py-3 rounded-lg border border-green-600 text-green-600 hover:bg-green-50 transition-colors duration-200 font-semibold"
                    >
                        Login
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl mb-4">🌾</div>
                    <h3 className="text-xl font-semibold mb-2">For Farmers</h3>
                    <p className="text-gray-600">
                        List your products, get AI price suggestions, and manage orders from buyers directly.
                    </p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl mb-4">🛒</div>
                    <h3 className="text-xl font-semibold mb-2">For Buyers</h3>
                    <p className="text-gray-600">
                        Browse products, compare prices, and place orders with farmers across Sri Lanka.
                    </p>
                </div>
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-xl font-semibold mb-2">AI Pricing</h3>
                    <p className="text-gray-600">
                        Get intelligent price suggestions based on market trends and product quality.
                    </p>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="bg-gray-50 rounded-lg p-8 mb-12">
                <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
                        <h4 className="font-semibold mb-2">Sign Up</h4>
                        <p className="text-sm text-gray-600">Create your account as a farmer or buyer</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
                        <h4 className="font-semibold mb-2">List/Browse</h4>
                        <p className="text-sm text-gray-600">Farmers list products, buyers browse offerings</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">3</div>
                        <h4 className="font-semibold mb-2">Connect</h4>
                        <p className="text-sm text-gray-600">Place orders and communicate directly</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">4</div>
                        <h4 className="font-semibold mb-2">Deliver</h4>
                        <p className="text-sm text-gray-600">Complete transactions and manage orders</p>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="text-center py-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                <p className="text-gray-600 mb-6">Join thousands of farmers and buyers already using our platform</p>
                <Link 
                    to="/register" 
                    className="inline-block px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 font-semibold text-lg"
                >
                    Create Your Account
                </Link>
            </section>
        </div>
    );
}


