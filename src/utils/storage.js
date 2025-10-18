import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../firebase/config.js';

export const uploadImage = async (file, userId) => {
    if (!file) throw new Error("No file provided");

    try {
        console.log("Starting image upload for:", file.name);
        console.log("File details:", {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Check if user is authenticated
        if (!auth.currentUser) {
            throw new Error('User must be authenticated to upload images');
        }
        
        console.log('User authenticated:', auth.currentUser.uid);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File size must be less than 10MB');
        }
        
        // Create file path with timestamp and sanitized filename
        const fileName = `${Date.now()}_${file.name.replaceAll(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `images/${fileName}`;
        const fileRef = ref(storage, filePath);
        
        console.log('Uploading to path:', filePath);
        console.log('Storage bucket:', storage.app.options.storageBucket);
        
        // Upload the file with metadata
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploadedBy: auth.currentUser.uid,
                uploadedAt: new Date().toISOString()
            }
        };
        
        const snapshot = await uploadBytes(fileRef, file, metadata);
        console.log('Upload completed:', snapshot.metadata);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("✅ Uploaded successfully:", downloadURL);
        
        return downloadURL;
    } catch (error) {
        console.error('🔥 Upload failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Handle CORS and network errors specifically
        if (error.message.includes('ERR_FAILED') || error.message.includes('CORS')) {
            throw new Error('CORS Error: Please configure Firebase Storage CORS settings. Contact administrator or try again later.');
        }
        
        // Provide more specific error messages
        if (error.code === 'storage/unauthorized') {
            throw new Error('You are not authorized to upload images. Please log in.');
        } else if (error.code === 'storage/canceled') {
            throw new Error('Upload was canceled');
        } else if (error.code === 'storage/unknown') {
            throw new Error('Unknown error occurred during upload');
        } else if (error.code === 'storage/invalid-format') {
            throw new Error('Invalid file format');
        } else if (error.code === 'storage/invalid-checksum') {
            throw new Error('File corruption detected');
        } else if (error.code === 'storage/object-not-found') {
            throw new Error('Storage object not found');
        } else if (error.code === 'storage/bucket-not-found') {
            throw new Error('Storage bucket not found');
        } else if (error.code === 'storage/project-not-found') {
            throw new Error('Firebase project not found');
        }
        
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

export async function deleteImage(imageUrl) {
    try {
        console.log('Deleting image:', imageUrl);
        
        // Extract the path from the URL
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        
        console.log('Image deleted successfully');
    } catch (error) {
        console.error('Error deleting image:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
}
