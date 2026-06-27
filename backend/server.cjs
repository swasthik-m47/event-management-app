const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");
const https   = require("https");

const app      = express();
const PORT     = 4000;
const DB_FILE  = path.join(__dirname, "db.json");

// ─────────────────────────────────────────────────────────────────────────────
//  TELEGRAM CONFIG  ← paste your values here after following setup guide
// ─────────────────────────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8867419960:AAErKz2Nntvu5DWTZuETj-_DKWNWPZsYIkM";
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || "6360146834";
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_PIN = "7777";

app.use(cors());
app.use(express.json());

// ── JSON file DB ──────────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const init = { orders: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { orders: [] }; }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ── Telegram sender ───────────────────────────────────────────────────────────
function sendTelegram(message) {
  if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" ||
      TELEGRAM_CHAT_ID   === "YOUR_CHAT_ID_HERE") {
    console.log("⚠️  Telegram not configured. Skipping notification.");
    return;
  }

  const body = JSON.stringify({
    chat_id:    TELEGRAM_CHAT_ID,
    text:       message,
    parse_mode: "Markdown",
  });

  const options = {
    hostname: "api.telegram.org",
    path:     `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    method:   "POST",
    headers:  { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      const parsed = JSON.parse(data);
      if (parsed.ok) {
        console.log(`📱 Telegram notification sent for order`);
      } else {
        console.error("❌ Telegram error:", parsed.description);
      }
    });
  });
  req.on("error", e => console.error("❌ Telegram request failed:", e.message));
  req.write(body);
  req.end();
}

// ── Build Telegram message ────────────────────────────────────────────────────
function buildOrderMessage(order) {
  const itemLines = order.items
    .map(it => `  • ${it.en} (${it.kn}) × ${it.qty}`)
    .join("\n");

  return (
    `🎉 *NEW ORDER — Swasthik Enterprises*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔖 *Order No:* \`${order.orderNum}\`\n` +
    `👤 *Name:* ${order.name}\n` +
    `📞 *Phone:* ${order.phone}${order.phone2 ? " / " + order.phone2 : ""}\n` +
    `📅 *Event Date:* ${order.eventDate || "N/A"}\n` +
    `🔄 *Return Date:* ${order.returnDate || "N/A"}\n` +
    `🎊 *Event Type:* ${order.eventType || "N/A"}\n` +
    `📍 *Venue:* ${order.address || "N/A"}\n` +
    `💳 *Payment:* ${order.payMode === "cash" ? "💵 Cash on Delivery" : "📲 UPI / Online"}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 *Items Ordered:*\n${itemLines}\n` +
    (order.notes ? `━━━━━━━━━━━━━━━━━━━━\n📝 *Notes:* ${order.notes}\n` : "") +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🕐 ${order.placedAt}`
  );
}

function buildStatusMessage(order, newStatus) {
  const emoji = { pending: "⏳", confirmed: "✅", delivered: "📦" };
  return (
    `${emoji[newStatus] || "🔄"} *Order Status Updated*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🔖 *Order:* \`${order.orderNum}\`\n` +
    `👤 *Customer:* ${order.name}\n` +
    `📞 *Phone:* ${order.phone}\n` +
    `🔄 *New Status:* *${newStatus.toUpperCase()}*`
  );
}

// ── Admin auth ────────────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  if (req.headers["x-admin-pin"] !== ADMIN_PIN)
    return res.status(401).json({ error: "Unauthorized" });
  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status:   "ok",
    message:  "Swasthik Enterprises API running",
    telegram: TELEGRAM_BOT_TOKEN !== "YOUR_BOT_TOKEN_HERE" ? "configured ✅" : "not configured ⚠️",
  });
});

// POST /api/orders — place new order
app.post("/api/orders", (req, res) => {
  const { name, phone, phone2, eventDate, returnDate,
          eventType, address, notes, payMode, items } = req.body;

  if (!name || !phone || !payMode || !items || items.length === 0)
    return res.status(400).json({ error: "Missing required fields: name, phone, payMode, items" });

  const db    = readDB();
  const order = {
    id:         Date.now(),
    orderNum:   "SW-" + Date.now().toString().slice(-5),
    name, phone, phone2: phone2 || "",
    eventDate:  eventDate  || "",
    returnDate: returnDate || "",
    eventType:  eventType  || "",
    address:    address    || "",
    notes:      notes      || "",
    payMode,
    status:    "pending",
    placedAt:  new Date().toLocaleString("en-IN"),
    items,
  };

  db.orders.push(order);
  writeDB(db);

  // 🔔 Send Telegram notification
  sendTelegram(buildOrderMessage(order));

  console.log(`✅ New order: ${order.orderNum} — ${name} (${phone})`);
  res.status(201).json({ success: true, order });
});

// GET /api/orders — all orders (admin)
app.get("/api/orders", adminAuth, (req, res) => {
  const db = readDB();
  res.json({ orders: db.orders });
});

// PATCH /api/orders/:id/status — update status (admin)
app.patch("/api/orders/:id/status", adminAuth, (req, res) => {
  const { status } = req.body;
  if (!["pending", "confirmed", "delivered"].includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const db    = readDB();
  const order = db.orders.find(o => String(o.id) === String(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = status;
  writeDB(db);

  // 🔔 Notify status change
  sendTelegram(buildStatusMessage(order, status));

  console.log(`📦 ${order.orderNum} → ${status}`);
  res.json({ success: true, order });
});

// DELETE /api/orders/:id — delete one (admin)
app.delete("/api/orders/:id", adminAuth, (req, res) => {
  const db  = readDB();
  const idx = db.orders.findIndex(o => String(o.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Order not found" });
  db.orders.splice(idx, 1);
  writeDB(db);
  res.json({ success: true });
});

// DELETE /api/orders — clear all (admin)
app.delete("/api/orders", adminAuth, (req, res) => {
  const db  = readDB();
  db.orders = [];
  writeDB(db);
  res.json({ success: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Swasthik Enterprises API`);
  console.log(`   URL:      http://localhost:${PORT}`);
  console.log(`   Database: ${DB_FILE}`);
  console.log(`   Telegram: ${TELEGRAM_BOT_TOKEN !== "YOUR_BOT_TOKEN_HERE" ? "✅ configured" : "⚠️  not configured (see README)"}`);
  console.log(`   Admin PIN: ${ADMIN_PIN}\n`);
});
