# Firestore Database Schema for Swasthik Enterprises

## Collections

### 1. `orders` Collection

Stores all customer rental orders.

**Document Structure:**
```javascript
{
  id: "auto-generated",                    // Firestore auto-generated ID
  orderNum: "SW-12345",                    // Human-readable order number
  name: "Rajesh Kumar",                    // Customer name
  phone: "9980535818",                     // Primary phone
  phone2: "9980437899",                    // Alternate phone (optional)
  eventDate: "2026-05-30",                 // Event date
  returnDate: "2026-06-02",                // Return date
  eventType: "Wedding / ಮದುವೆ",          // Type of event
  address: "123 Main St, Bangalore",       // Event venue
  notes: "Please deliver by 10 AM",        // Special requirements
  payMode: "cash" or "upi",                // Payment method
  status: "pending" or "confirmed" or "delivered",  // Order status
  
  // Items array
  items: [
    {
      id: "chair",                         // Item ID
      en: "Chair",                         // English name
      kn: "ಚೇಯರ್",                        // Kannada name
      qty: 10                              // Quantity
    },
    {
      id: "table",
      en: "Table",
      kn: "ಟೇಬಲ್",
      qty: 2
    }
  ],
  
  // Metadata
  placedAt: "2026-05-24 3:45 PM",         // Order placement time
  createdAt: "2026-05-24T10:15:30.000Z",  // Firestore timestamp
  updatedAt: "2026-05-24T10:15:30.000Z"   // Last update timestamp
}
```

**Indexes:**
- `phone` (for quick customer lookup)
- `status` (for filtering by order status)
- `createdAt` (for chronological queries)

**Query Examples:**
```javascript
// Get all orders
const orders = await getAllOrders();

// Get pending orders
const q = query(collection(db, "orders"), where("status", "==", "pending"));

// Get orders by customer phone
const customerOrders = await getOrdersByPhone("9980535818");

// Get orders placed today
const today = new Date().toLocaleDateString('en-IN');
const q = query(collection(db, "orders"), where("eventDate", "==", today));
```

---

### 2. `settings` Collection

Stores admin settings and configurations.

**Document Structure:**
```javascript
{
  id: "auto-generated",
  type: "admin",                           // Type identifier
  businessName: "Swasthik Enterprises",    // Business name
  whatsappNumber: "919980535818",          // WhatsApp business number
  email: "info@swasthik.com",              // Business email
  address: "Kervashe, Karnataka",           // Business address
  
  // Configuration
  defaultPaymentMethod: "cash",            // Default payment option
  allowUPI: true,                          // Enable UPI payments
  upiID: "9980535818@upi",                 // UPI ID
  
  // Order settings
  maxOrdersPerDay: 100,                    // Daily order limit
  minAdvanceHours: 24,                     // Minimum advance booking
  
  // Customization
  theme: {
    primary: "#C9973A",                    // Primary color (gold)
    dark: "#1a1207",                       // Dark color
    accent: "#25d366"                      // Accent color (WhatsApp green)
  },
  
  // Contact
  phones: [
    "9980535818",
    "9980437899"
  ],
  
  // Metadata
  updatedAt: "2026-05-24T10:15:30.000Z"    // Last update
}
```

---

## Data Validation Rules

### Order Document Validation
```
- name: required, min 2 chars, max 100 chars
- phone: required, must be valid 10-digit number
- phone2: optional, must be 10-digit if provided
- eventDate: required, must be future date
- returnDate: optional, must be after eventDate
- eventType: required, must be from predefined list
- payMode: required, either "cash" or "upi"
- items: required, array of at least 1 item
- status: required, one of ["pending", "confirmed", "delivered"]
```

---

## Firestore Security Rules (Production)

```firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read for orders (production: restrict this)
    match /orders/{document=**} {
      allow read: if true;
      allow create: if 
        request.resource.data.name != null &&
        request.resource.data.phone != null &&
        request.resource.data.payMode != null &&
        request.resource.data.items is list &&
        request.resource.data.items.size() > 0;
      allow update, delete: if request.auth != null;
    }
    
    // Settings - only admins
    match /settings/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Example CRUD Operations

### Create Order
```javascript
import { createOrder } from './src/firebaseService';

const orderData = {
  name: "Rajesh Kumar",
  phone: "9980535818",
  eventDate: "2026-05-30",
  payMode: "cash",
  items: [
    { id: "chair", en: "Chair", kn: "ಚೇಯರ್", qty: 10 }
  ],
  status: "pending"
};

const result = await createOrder(orderData);
console.log("Order created:", result.id);
```

### Read Orders
```javascript
import { getAllOrders, getOrdersByPhone } from './src/firebaseService';

// Get all orders
const allOrders = await getAllOrders();

// Get orders for specific customer
const customerOrders = await getOrdersByPhone("9980535818");
```

### Update Order Status
```javascript
import { updateOrderStatus } from './src/firebaseService';

await updateOrderStatus("firestore-document-id", "confirmed");
```

### Delete Order
```javascript
import { deleteOrder } from './src/firebaseService';

await deleteOrder("firestore-document-id");
```

---

## Backup & Export

### Backup to JSON
```javascript
async function backupOrders() {
  const orders = await getAllOrders();
  const json = JSON.stringify(orders, null, 2);
  // Save json to file or send to backup service
}
```

### Export to CSV
```javascript
async function exportToCSV() {
  const orders = await getAllOrders();
  const csv = orders.map(o => 
    `${o.orderNum},${o.name},${o.phone},${o.eventDate},${o.status}`
  ).join('\n');
  // Download or send csv
}
```

---

## Performance Tips

1. **Index frequently queried fields**: status, phone, eventDate
2. **Use pagination** for large datasets:
   ```javascript
   const limit = 10;
   const first = await getDocs(query(collection(db, "orders"), limit(limit)));
   ```
3. **Archive old orders** to a separate collection after 6 months
4. **Cache frequently accessed data** in React state
5. **Use real-time listeners** for live order updates (optional)

---

## Monitoring & Analytics

### Useful Queries
```javascript
// Get today's orders count
const today = new Date().toLocaleDateString('en-IN');
const todayOrders = orders.filter(o => o.eventDate === today);

// Get pending orders
const pending = orders.filter(o => o.status === 'pending');

// Get total revenue (for cash orders)
const revenue = orders
  .filter(o => o.payMode === 'cash' && o.status === 'delivered')
  .length;

// Get popular items
const itemCounts = {};
orders.forEach(o => {
  o.items.forEach(item => {
    itemCounts[item.id] = (itemCounts[item.id] || 0) + item.qty;
  });
});
```

---

## Migration from LocalStorage

If you have existing orders in localStorage, migrate them:

```javascript
async function migrateFromLocalStorage() {
  const oldOrders = JSON.parse(localStorage.getItem("sw_orders") || "[]");
  for (const order of oldOrders) {
    await createOrder(order);
  }
  console.log(`Migrated ${oldOrders.length} orders to Firebase`);
  localStorage.removeItem("sw_orders");
}
```

Call this once during app startup to migrate existing data.
