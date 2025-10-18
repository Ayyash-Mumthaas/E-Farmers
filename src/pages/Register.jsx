import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { allLocations } from '../constants/sriLankanLocations.js';

export default function Register() {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [nic, setNic] = useState('');
    const [location, setLocation] = useState('');
    const [role, setRole] = useState('farmer');
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Location search states
    const [locationSearch, setLocationSearch] = useState('');
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState(allLocations);
    const locationDropdownRef = useRef(null);
    const navigate = useNavigate();

    // Filter locations based on search
    useEffect(() => {
        if (locationSearch.trim() === '') {
            setFilteredLocations(allLocations);
        } else {
            const filtered = allLocations.filter(loc =>
                loc.toLowerCase().includes(locationSearch.toLowerCase())
            );
            setFilteredLocations(filtered);
        }
    }, [locationSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
                setIsLocationDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle location selection
    const handleLocationSelect = (selectedLocation) => {
        setLocation(selectedLocation);
        setLocationSearch(selectedLocation);
        setIsLocationDropdownOpen(false);
    };

    // Handle location search input
    const handleLocationSearchChange = (e) => {
        setLocationSearch(e.target.value);
        setIsLocationDropdownOpen(true);
        if (e.target.value === '') {
            setLocation('');
        }
    };

    // Validation functions
    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        return null;
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return 'Phone number must be exactly 10 digits';
        }
        return null;
    };

    const validateNic = (nic) => {
        const nicRegex = /^\d{12}$/;
        if (!nicRegex.test(nic)) {
            return 'NIC must be exactly 12 digits';
        }
        return null;
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return null;
    };

    const validateForm = () => {
        const errors = {};

        // Name validation
        if (!name.trim()) {
            errors.name = 'Name is required';
        }

        // Email validation
        const emailError = validateEmail(email);
        if (emailError) {
            errors.email = emailError;
        }

        // Password validation
        const passwordError = validatePassword(password);
        if (passwordError) {
            errors.password = passwordError;
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        // Phone validation
        const phoneError = validatePhone(phone);
        if (phoneError) {
            errors.phone = phoneError;
        }

        // NIC validation
        const nicError = validateNic(nic);
        if (nicError) {
            errors.nic = nicError;
        }

        // Location validation
        if (!location) {
            errors.location = 'Please select a location';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        // Client-side validation
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Proceed with registration (Firebase Auth will handle email duplicates)
            await register(email, password, role, { name, phone, nic, location });
            
            // Registration successful - navigate immediately to appropriate dashboard
            if (role === 'farmer') {
                navigate('/home/farmer');
            } else if (role === 'buyer') {
                navigate('/home/buyer');
            } else {
                // Fallback - should not happen with proper role setting
                navigate('/home/buyer');
            }
            
        } catch (e) {
            console.error('Registration error:', e);
            if (e.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists');
            } else if (e.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger password');
            } else if (e.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (e.code === 'auth/operation-not-allowed') {
                setError('Email/password accounts are not enabled. Please contact support.');
            } else if (e.message && e.message.includes('permission')) {
                setError('Registration failed due to permission error. Please check your Firebase configuration.');
            } else {
                setError(e.message || 'Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Account</h2>
            <form onSubmit={onSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            validationErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Full Name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                    {validationErrors.name && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
                    )}
                </div>

                {/* Email Field */}
                <div>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Email" 
                        type="email"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    {validationErrors.email && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            validationErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Password (min 8 characters)" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    {validationErrors.password && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.password}</p>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm Password" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    {validationErrors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.confirmPassword}</p>
                    )}
                </div>

                {/* Phone Field */}
                <div>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Phone Number (10 digits)" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value.replaceAll(/\D/g, ''))}
                        maxLength="10"
                        disabled={isLoading}
                    />
                    {validationErrors.phone && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                    )}
                </div>

                {/* NIC Field */}
                <div>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            validationErrors.nic ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="NIC Number (12 digits)" 
                        value={nic} 
                        onChange={(e) => setNic(e.target.value.replaceAll(/\D/g, ''))}
                        maxLength="12"
                        disabled={isLoading}
                    />
                    {validationErrors.nic && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.nic}</p>
                    )}
                </div>

                {/* Location Field */}
                <div className="relative" ref={locationDropdownRef}>
                    <input
                        type="text"
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            validationErrors.location ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Search and select location..."
                        value={locationSearch}
                        onChange={handleLocationSearchChange}
                        onFocus={() => setIsLocationDropdownOpen(true)}
                        disabled={isLoading}
                    />
                    
                    {/* Dropdown Arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {/* Dropdown List */}
                    {isLocationDropdownOpen && (
                        <div 
                            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                            role="listbox"
                            aria-label="Location options"
                        >
                            {filteredLocations.length > 0 ? (
                                filteredLocations.map((loc) => (
                                    <div
                                        key={loc}
                                        role="option"
                                        tabIndex={0}
                                        aria-selected={location === loc}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        onClick={() => handleLocationSelect(loc)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleLocationSelect(loc);
                                            }
                                        }}
                                    >
                                        {loc}
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                    No locations found
                                </div>
                            )}
                        </div>
                    )}
                    
                    {validationErrors.location && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.location}</p>
                    )}
                </div>

                {/* Role Field */}
                <div>
                    <select 
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isLoading}
                    >
                        <option value="farmer">Farmer</option>
                        <option value="buyer">Buyer</option>
                    </select>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button 
                    className={`w-full py-2 px-4 rounded font-semibold ${
                        isLoading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                    } text-white transition-colors duration-200`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating Account...' : 'Register'}
                </button>
            </form>
            
            <p className="mt-4 text-sm text-gray-600 text-center">
                Have an account? <Link to="/login" className="text-green-700 hover:text-green-800 font-medium">Login</Link>
            </p>
        </div>
    );
}


