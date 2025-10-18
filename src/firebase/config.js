import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - Using environment variables with fallbacks
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYQAv6pYpRRIp3CHLLwgBHuLDROROY4t0",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "paddy-b479b.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "paddy-b479b",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE || "paddy-b479b.appspot.com", // Fixed: Use .appspot.com format
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "949451320997",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:949451320997:web:a721e70a120c2628bfa74c"
};

// Debug logging
// console.log('Firebase Config:', {
//     apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
//     authDomain: firebaseConfig.authDomain ? 'Set' : 'Missing',
//     projectId: firebaseConfig.projectId ? 'Set' : 'Missing',
//     storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Missing',
//     messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Missing',
//     appId: firebaseConfig.appId ? 'Set' : 'Missing'
// });

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase configuration is missing required fields');
    console.error('Current config:', firebaseConfig);
    console.error('Environment variables:', {
        VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID
    });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export the app instance
export default app;


