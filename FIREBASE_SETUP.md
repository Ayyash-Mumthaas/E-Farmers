# Firebase Setup Guide for Farming Shop

## 🔥 Firebase Firestore Security Rules

### How to Apply These Rules:

1. **Go to Firebase Console**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Go to the "Rules" tab

3. **Replace the Rules**
   - Copy the contents from `firestore.rules` file
   - Paste them into the rules editor
   - Click "Publish"

### 📋 Rule Breakdown:

#### **Users Collection (`/users/{userId}`)**
- ✅ Users can read/write their own profile data
- ✅ Other authenticated users can read basic info (name, role) for farmer names
- ❌ Users cannot access other users' private data (phone, NIC, etc.)

#### **Products Collection (`/products/{productId}`)**
- ✅ All authenticated users can read products
- ✅ Farmers can create products (must include required fields)
- ✅ Farmers can update/delete their own products
- ❌ Users cannot modify other farmers' products

#### **Orders Collection (`/orders/{orderId}`)**
- ✅ Buyers can read their own orders
- ✅ Farmers can read orders for their products
- ✅ Buyers can create orders
- ✅ Both buyers and farmers can update orders (for status changes)
- ✅ Buyers can cancel their own orders
- ❌ Users cannot access orders they're not involved in

#### **Reviews Collection (`/reviews/{reviewId}`)**
- ✅ All authenticated users can read reviews
- ✅ Users can create reviews for products they've ordered
- ✅ Users can edit/delete their own reviews
- ❌ Users cannot modify others' reviews

### 🛡️ Security Features:

1. **Authentication Required**: All operations require user authentication
2. **Data Validation**: Required fields are enforced during creation
3. **Ownership Control**: Users can only modify their own data
4. **Role-Based Access**: Different permissions for farmers vs buyers
5. **Data Integrity**: Prevents unauthorized access to sensitive information

### 🔧 Environment Variables Setup:

Create a `.env` file in your project root:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE=your_project.appspot.com
VITE_FIREBASE_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 📊 Database Structure:

```
users/
  {userId}/
    - name: string
    - role: "farmer" | "buyer"
    - phone: string
    - nic: string
    - location: string
    - createdAt: timestamp

products/
  {productId}/
    - name: string
    - category: string
    - quantity: number
    - location: string
    - ownerUid: string
    - aiPrice: number
    - createdAt: timestamp

orders/
  {orderId}/
    - productId: string
    - productName: string
    - category: string
    - qty: number
    - userUid: string
    - farmerUid: string
    - farmerName: string
    - status: "Pending" | "Delivered" | "Cancelled"
    - createdAt: timestamp

reviews/
  {reviewId}/
    - productId: string
    - rating: number (1-5)
    - comment: string
    - authorUid: string
    - createdAt: timestamp
```

### 🚀 Testing the Rules:

1. **Deploy the rules** to your Firebase project
2. **Test with different user roles** (farmer/buyer)
3. **Verify access controls** work as expected
4. **Check browser console** for any permission errors

### ⚠️ Important Notes:

- These rules assume you're using Firebase Authentication
- Make sure your app properly handles authentication state
- Test thoroughly before deploying to production
- Consider adding more specific validation rules based on your needs

### 🔍 Troubleshooting:

If you encounter permission errors:
1. Check if the user is properly authenticated
2. Verify the user has the correct role
3. Ensure the document structure matches the rules
4. Check Firebase console for detailed error logs
