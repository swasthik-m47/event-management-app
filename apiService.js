// apiService.js — talks to the local Express backend (no Firebase needed)
const BASE = "/api";
const ADMIN_PIN = "7777";

// ── ORDERS ────────────────────────────────────────────────────────────────────

export async function createOrder(orderData) {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create order");
  }
  const data = await res.json();
  return data.order;
}

export async function getAllOrders() {
  const res = await fetch(`${BASE}/orders`, {
    headers: { "x-admin-pin": ADMIN_PIN },
  });
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  return data.orders;
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${BASE}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-pin": ADMIN_PIN,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update order status");
  return true;
}

export async function deleteOrder(orderId) {
  const res = await fetch(`${BASE}/orders/${orderId}`, {
    method: "DELETE",
    headers: { "x-admin-pin": ADMIN_PIN },
  });
  if (!res.ok) throw new Error("Failed to delete order");
  return true;
}

export default { createOrder, getAllOrders, updateOrderStatus, deleteOrder };
