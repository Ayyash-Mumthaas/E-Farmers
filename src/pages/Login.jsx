import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
    const { login, user, role, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const navigate = useNavigate();

    // Handle navigation after successful login
    useEffect(() => {
        if (user && role && !loading) {
            if (role === 'farmer') {
                navigate('/home/farmer');
            } else if (role === 'buyer') {
                navigate('/home/buyer');
            } else {
                // Fallback - redirect to buyer dashboard if role is undefined
                navigate('/home/buyer');
            }
        }
    }, [user, role, loading, navigate]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        
        try {
            await login(email, password);
            // Navigation will be handled by useEffect when role is available
            setIsLoggingIn(false);
        } catch (e) {
            console.error('Login error:', e);
            if (e.code === 'auth/user-not-found') {
                setError('No account found with this email address');
            } else if (e.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else if (e.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (e.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later');
            } else {
                setError(e.message || 'Login failed');
            }
            setIsLoggingIn(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="max-w-md mx-auto bg-white border rounded-lg p-6">
                <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Loading...</div>
                    <div className="text-sm text-gray-600">Please wait while we verify your account</div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login</h2>
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <input 
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300" 
                        placeholder="Email" 
                        type="email"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoggingIn}
                        required
                    />
                </div>
                <div>
                    <input 
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 border-gray-300" 
                        placeholder="Password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoggingIn}
                        required
                    />
                </div>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                <button 
                    className={`w-full py-2 px-4 rounded font-semibold transition-colors duration-200 ${
                        isLoggingIn 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                    disabled={isLoggingIn}
                >
                    {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p className="mt-4 text-sm text-gray-600 text-center">
                Don't have an account? <Link to="/register" className="text-green-700 hover:text-green-800 font-medium">Register here</Link>
            </p>
        </div>
    );
}


