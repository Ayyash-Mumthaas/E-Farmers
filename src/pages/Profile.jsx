import { useEffect, useState } from 'react';
import { auth } from '../firebase/config.js';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { allLocations } from '../constants/sriLankanLocations.js';

const db = getFirestore();

export default function Profile() {
    const user = auth.currentUser;
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [nic, setNic] = useState('');
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [originalData, setOriginalData] = useState({});

    useEffect(() => {
        if (!user) return;
        (async () => {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) {
                const data = snap.data();
                setLocation(data.location || '');
                setPhone(data.phone || '');
                setNic(data.nic || '');
                setDisplayName(data.name || '');
                
                // Store original data for cancel functionality
                setOriginalData({
                    name: data.name || '',
                    phone: data.phone || '',
                    nic: data.nic || '',
                    location: data.location || ''
                });
            }
        })();
    }, [user]);

    const handleEdit = () => {
        setIsEditing(true);
        setStatus('');
    };

    const handleCancel = () => {
        // Restore original values
        setDisplayName(originalData.name);
        setPhone(originalData.phone);
        setNic(originalData.nic);
        setLocation(originalData.location);
        setIsEditing(false);
        setStatus('');
    };

    const onSave = async (e) => {
        e.preventDefault();
        if (!user) return;
        
        try {
            // Persist all editable fields to users collection only (email/password excluded)
            await setDoc(doc(db, 'users', user.uid), { 
                location, 
                phone, 
                nic, 
                name: displayName 
            }, { merge: true });
            
            // Update original data with new values
            setOriginalData({
                name: displayName,
                phone: phone,
                nic: nic,
                location: location
            });
            
            setStatus('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setStatus('Error updating profile. Please try again.');
            setTimeout(() => setStatus(''), 3000);
        }
    };

    if (!user) return null;
    
    return (
        <div className="max-w-md mx-auto bg-white border rounded-lg p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Profile</h2>
                {!isEditing && (
                    <button 
                        onClick={handleEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            <form onSubmit={onSave} className="space-y-4">
                {/* Name Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Full Name" 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={!isEditing}
                    />
                </div>

                {/* Email Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                        className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-gray-600" 
                        placeholder="Email" 
                        value={user?.email || ''} 
                        disabled 
                    />
                </div>

                {/* Phone Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="Phone Number" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                    />
                </div>

                {/* NIC Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number</label>
                    <input 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                        }`}
                        placeholder="NIC Number" 
                        value={nic} 
                        onChange={(e) => setNic(e.target.value)}
                        disabled={!isEditing}
                    />
                </div>

                {/* Location Field */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select 
                        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                            isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
                        }`}
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={!isEditing}
                    >
                        <option value="">Select Location</option>
                        {allLocations.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex space-x-3 pt-4">
                        <button 
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            Save Changes
                        </button>
                        <button 
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </form>

            {/* Status Message */}
            {status && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                    status.includes('Error') 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                    {status}
                </div>
            )}
        </div>
    );
}
