# Firebase Setup Guide for Swasthik Enterprises App

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `swasthik-enterprises` (or your preferred name)
4. Accept terms and click **"Continue"**
5. Enable/Disable Google Analytics (optional) and click **"Create project"**
6. Wait for project creation to complete

## Step 2: Create a Web App

1. In the Firebase Console, click the **Web icon** (</>) to add a web app
2. App nickname: `Swasthik Enterprises App`
3. Click **"Register app"**
4. Copy your Firebase configuration

## Step 3: Get Your Firebase Credentials

After clicking "Register app", you'll see a configuration object that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDm1234567890abcdefghijklmnopqrst",
  authDomain: "swasthik-enterprises.firebaseapp.com",
  projectId: "swasthik-enterprises",
  storageBucket: "swasthik-enterprises.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

## Step 4: Configure Your App

1. Open `firebaseConfig.js` in the project root
2. Replace the placeholder values with your actual Firebase credentials
3. Save the file

## Step 5: Enable Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click **"Create database"**
3. Select **"Start in production mode"** (you can update rules later)
4. Choose your region (e.g., `asia-south1` for India)
5. Click **"Create"**

## Step 6: Create Security Rules (Important!)

Replace the default Firestore security rules with these:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow read/write to orders collection for testing
    // In production, implement proper authentication
    match /orders/{document=**} {
      allow read, write: if true;
    }
    
    // Allow read/write to settings collection
    match /settings/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** These are permissive rules for development. For production, implement proper authentication:

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write orders
    match /orders/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Test Your Setup

1. The app is already running at `http://localhost:3000/`
2. Try placing an order:
   - Select items
   - Fill in details
   - Choose payment method
   - Place order
3. Open Admin panel (click ⚙ button in header)
4. Enter PIN: `7777`
5. You should see your order appear in Firebase Firestore

## Step 8: Verify Data in Firebase Console

1. Go to **Firestore Database** in Firebase Console
2. You should see an `orders` collection with your test order
3. Check the document structure to verify all fields are saved correctly

## File Structure

```
event/
├── firebaseConfig.js          # Firebase configuration (UPDATE WITH YOUR CREDENTIALS)
├── src/
│   └── firebaseService.js     # Firebase service functions
├── swasthik_enterprises_app_1.jsx  # Main React app (updated to use Firebase)
├── main.jsx
├── index.html
└── vite.config.js
```

## Firebase Service Functions Available

All functions are in `src/firebaseService.js`:

- `createOrder(orderData)` - Create a new order
- `getAllOrders()` - Fetch all orders
- `getOrdersByPhone(phone)` - Find orders by customer phone
- `updateOrderStatus(orderId, status)` - Update order status
- `updateOrder(orderId, orderData)` - Update entire order
- `deleteOrder(orderId)` - Delete an order
- `saveSettings(settingsData)` - Save admin settings
- `getSettings()` - Get admin settings

## Troubleshooting

### "Firebase Error: Could not read package.json"
- Make sure `firebaseConfig.js` is properly configured
- Check browser console (F12) for detailed error messages

### "Permission denied" errors
- Update your Firestore security rules (Step 6)
- Make sure rules match your authentication setup

### Orders not appearing in Firestore
- Check browser console for errors
- Verify Firebase credentials are correct
- Check Firestore security rules allow write operations

### Module not found errors
- Run `npm install firebase` again
- Clear node_modules and reinstall: `rm -r node_modules && npm install`

## Production Checklist

- [ ] Update Firestore security rules for production
- [ ] Enable authentication (Google, Email, etc.)
- [ ] Set up backup and recovery
- [ ] Configure proper error logging
- [ ] Add rate limiting
- [ ] Enable data encryption
- [ ] Set up monitoring and alerts

## Next Steps

1. **Authentication**: Add user login/signup
2. **Email Notifications**: Send confirmation emails when orders are placed
3. **SMS Notifications**: Alert customers via SMS
4. **Analytics**: Track orders and user behavior
5. **Reports**: Generate sales reports from Firestore data
6. **Cloud Functions**: Automate order processing

## Support

For Firebase documentation: https://firebase.google.com/docs
For help: https://firebase.google.com/support
