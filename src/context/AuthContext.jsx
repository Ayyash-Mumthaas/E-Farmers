import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase/config.js';
import { defaultDictionary } from '../constants/dictionary.js';
import { hashPassword, verifyPassword } from '../utils/passwordUtils.js';
import { AuthContext } from './AuthContext.js';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'farmer' | 'buyer'
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('en');
    const [dictionary] = useState(defaultDictionary);



    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                try {
                    // Fetch user role from Firestore
                    const db = getFirestore();
                    const userDoc = await getDoc(doc(db, 'users', u.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setRole(userData.role || null);
                    } else {
                        setRole(null);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    setRole(null);
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const login = async (email, password) => {
        try {
            // First authenticate with Firebase to get the user ID
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
            
            // Get the user's hashed password from Firestore
            const db = getFirestore();
            const userQuery = await getDoc(doc(db, 'users', userId));
            
            if (!userQuery.exists()) {
                throw new Error('auth/user-not-found');
            }
            
            const userData = userQuery.data();
            
            if (!userData.hashedPassword) {
                throw new Error('auth/invalid-credential');
            }
            
            // Verify the password against our stored hash
            const isPasswordValid = await verifyPassword(password, userData.hashedPassword);
            
            if (!isPasswordValid) {
                // Sign out the user if password verification fails
                await signOut(auth);
                throw new Error('auth/wrong-password');
            }
            
            // Password is valid, user is already authenticated
            // Set the role immediately for instant navigation
            setRole(userData.role || null);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (email, password, chosenRole, extra) => {
        try {
            // Hash the password before storing
            const hashedPassword = await hashPassword(password);
            
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            // Use photoURL to store role; use displayName for Name
            await updateProfile(cred.user, { photoURL: chosenRole, displayName: extra?.name || '' });
            
            // Persist user profile in Firestore with hashed password
            const db = getFirestore();
            await setDoc(doc(db, 'users', cred.user.uid), {
                email: email, // Store email for duplicate checking
                role: chosenRole,
                name: extra?.name || '',
                phone: extra?.phone || '',
                nic: extra?.nic || '',
                location: extra?.location || '',
                hashedPassword: hashedPassword, // Store our bcrypt hashed password
                createdAt: Date.now(),
            }, { merge: true });
            
            // Immediately set the role in state for instant navigation
            setRole(chosenRole);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        await signOut(auth);
        globalThis.location.href = '/login';
    };

    const value = useMemo(() => ({ user, role, loading, login, register, logout, language, setLanguage, dictionary }), [user, role, loading, language, dictionary]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};



