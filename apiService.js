// apiService.js — talks to the local Express backend (no Firebase needed)
const BASE = "/api";
const ADMIN_PIN = "7777";

const LOCAL_STORAGE_KEY = "swasthik_orders_db";

function getLocalOrders() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save orders to localStorage:", e);
  }
}

// ── ORDERS ────────────────────────────────────────────────────────────────────

export async function createOrder(orderData) {
  const newOrder = { id: Date.now(), ...orderData };
  try {
    const res = await fetch(`${BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      const data = await res.json();
      return data.order || newOrder;
    }
  } catch (err) {
    console.warn("Backend API unreachable. Saving locally.", err);
  }
  const orders = getLocalOrders();
  orders.push(newOrder);
  saveLocalOrders(orders);
  return newOrder;
}

export async function getAllOrders() {
  try {
    const res = await fetch(`${BASE}/orders`, {
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.orders)) return data.orders;
    }
  } catch (err) {
    console.warn("Backend API unreachable. Loading locally.", err);
  }
  return getLocalOrders();
}

export async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`${BASE}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": ADMIN_PIN,
      },
      body: JSON.stringify({ status }),
    });
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      return true;
    }
  } catch (err) {
    console.warn("Backend API unreachable. Updating status locally.", err);
  }
  const orders = getLocalOrders();
  const idx = orders.findIndex(o => String(o.id) === String(orderId) || String(o.orderNum) === String(orderId));
  if (idx !== -1) {
    orders[idx].status = status;
    saveLocalOrders(orders);
  }
  return true;
}

export async function deleteOrder(orderId) {
  try {
    const res = await fetch(`${BASE}/orders/${orderId}`, {
      method: "DELETE",
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      return true;
    }
  } catch (err) {
    console.warn("Backend API unreachable. Deleting locally.", err);
  }
  let orders = getLocalOrders();
  orders = orders.filter(o => String(o.id) !== String(orderId) && String(o.orderNum) !== String(orderId));
  saveLocalOrders(orders);
  return true;
}

export default { createOrder, getAllOrders, updateOrderStatus, deleteOrder };
