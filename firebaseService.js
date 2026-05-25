import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// ══════════════════════════════════════════════════════════════════════════
// ORDERS OPERATIONS
// ══════════════════════════════════════════════════════════════════════════

// Add a new order
export async function createOrder(orderData) {
  try {
    const ordersRef = collection(db, "orders");
    const docRef = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

// Get all orders
export async function getAllOrders() {
  try {
    const ordersRef = collection(db, "orders");
    const snapshot = await getDocs(ordersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

// Get orders by phone number
export async function getOrdersByPhone(phone) {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("phone", "==", phone));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching orders by phone:", error);
    throw error;
  }
}

// Update order status
export async function updateOrderStatus(orderId, status) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

// Update entire order
export async function updateOrder(orderId, orderData) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
}

// Delete order
export async function deleteOrder(orderId) {
  try {
    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef);
    return true;
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
}

// Get order by ID
export async function getOrderById(orderId) {
  try {
    const orderRef = doc(db, "orders", orderId);
    const snapshot = await getDocs(query(collection(db, "orders"), where("__name__", "==", orderId)));
    if (snapshot.empty) return null;
    const doc_data = snapshot.docs[0];
    return {
      id: doc_data.id,
      ...doc_data.data()
    };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS / ADMIN OPERATIONS
// ══════════════════════════════════════════════════════════════════════════

export async function saveSettings(settingsData) {
  try {
    const settingsRef = collection(db, "settings");
    const q = query(settingsRef, where("type", "==", "admin"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Create new settings
      await addDoc(settingsRef, {
        type: "admin",
        ...settingsData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Update existing settings
      const docRef = snapshot.docs[0];
      await updateDoc(doc(db, "settings", docRef.id), {
        ...settingsData,
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

export async function getSettings() {
  try {
    const settingsRef = collection(db, "settings");
    const q = query(settingsRef, where("type", "==", "admin"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORT FOR USE IN REACT
// ══════════════════════════════════════════════════════════════════════════

export default {
  createOrder,
  getAllOrders,
  getOrdersByPhone,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrderById,
  saveSettings,
  getSettings
};
