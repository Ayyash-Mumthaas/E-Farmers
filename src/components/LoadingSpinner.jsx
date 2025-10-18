import React from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <div className="text-lg font-medium text-gray-700">{message}</div>
            <div className="text-sm text-gray-500 mt-2">Please wait while we load your content</div>
        </div>
    );
}