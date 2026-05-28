import { useState, useEffect, useRef } from "react";
import { createOrder, getAllOrders, updateOrderStatus, deleteOrder } from "./firebaseService";

const GOLD = "#C9973A";
const DEEP = "#1a1207";

const ITEMS = {
  "🪑 Furniture & Seating": [
    { id: "chair", en: "Chair", kn: "ಚೇಯರ್" },
    { id: "table", en: "Table", kn: "ಟೇಬಲ್" },
    { id: "bench", en: "Bench", kn: "ಬಾಲ್ಡಿ" },
    { id: "stool", en: "Stool", kn: "ಮಣೆ" },
  ],
  "🍽️ Cookware & Utensils": [
    { id: "idli", en: "Idli Vessel", kn: "ಇಡ್ಲಿ ಪಾತ್ರೆ" },
    { id: "kadayi", en: "Kadayi", kn: "ಕಡಾಯಿ" },
    { id: "jaara", en: "Jaara", kn: "ಜಾರ" },
    { id: "valanka", en: "Valanka", kn: "ವಳಂಕ" },
    { id: "loota", en: "Loota", kn: "ಲೋಟ" },
    { id: "mucchakal", en: "Mucchakal", kn: "ಮುಚ್ಚಳ" },
    { id: "tray", en: "Tray / Tatte", kn: "ತಟ್ಟೆ" },
    { id: "annamarige", en: "Anna Marige", kn: "ಅನ್ನದ ಮರಿಗೆ" },
    { id: "agalasattalu", en: "Wide Pots", kn: "ಅಗಲ ಸತ್ತಾಲು" },
    { id: "uddasattalu", en: "Deep Pots", kn: "ಉದ್ದ ಸತ್ತಾಲು" },
    { id: "sosu", en: "Sosumarige", kn: "ಸೋಸುಮರಿಗೆ" },
    { id: "steelhand", en: "Steel Handle", kn: "ಸ್ಟೀಲ್ ಕೈ ಹೆಂಡೆ" },
  ],
  "🎪 Event Setup": [
    { id: "shamiana", en: "Shamiana", kn: "ಶಾಮಿಯಾನ" },
    { id: "pendal", en: "Pendal Shamiana", kn: "ಪೆಂಡಾಲ್ ಶಾಮಿಯಾನ" },
    { id: "tagadu", en: "Iron Sheet", kn: "ತಗಡು ಶೀಟು" },
    { id: "kabina", en: "Cabin Walls", kn: "ಕಬ್ಬಿಣದ ಬಣಾಲೆ" },
    { id: "jilebi", en: "Jilebi Kavali", kn: "ಜಿಲೇಬಿ ಕಾವಲಿ" },
    { id: "holige", en: "Holige Press", kn: "ಹೊಳಿಗೆ ಹೆಂಚು" },
    { id: "topu", en: "Garden / Topu", kn: "ತೋಪು" },
    { id: "huttu", en: "Huttu", kn: "ಹುಟ್ಟು" },
  ],
  "🔧 Equipment": [
    { id: "chamche", en: "Chamche / Spade", kn: "ಚಮಚೆ (ಸ್ಸೋಟು)" },
    { id: "kabstoo", en: "Iron Stool", kn: "ಕಬ್ಬಿಣದ ಸ್ಟ್ಳ" },
    { id: "sarustu", en: "Saru Stool", kn: "ಸಾರು ಸ್ಟ್ಳಗ" },
    { id: "jagg", en: "Jagg", kn: "ಜಗ್ಗ" },
    { id: "hermane", en: "Hermane", kn: "ಹೇರಮಣೆ" },
    { id: "harivana", en: "Harivana", kn: "ಹರಿವಾಣ" },
    { id: "matchakshi", en: "Matchakshi", kn: "ಮಟ್ಟು/ಕಶ್ತಿ" },
    { id: "neeru", en: "Water Drum", kn: "ನೀರಿನ ಡ್ರಂ" },
    { id: "gas", en: "Gas Stove", kn: "ಗ್ಯಾಸ್ ಒಲೆ" },
    { id: "grinder", en: "Grinder", kn: "ಗ್ರೈಂಡರ್" },
  ],
};

const EVENT_TYPES = ["Wedding / ಮದುವೆ", "Birthday / ಹುಟ್ಟುಹಬ್ಬ", "Housewarming / ಗೃಹಪ್ರವೇಶ", "Pooja / ಪೂಜೆ", "Reception", "Other"];

// ── TELEGRAM LOGIC CONFIGURATION ─────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"; // <-- Put your active bot token here
const TELEGRAM_CHAT_ID   = "YOUR_CHAT_ID_HERE";   // <-- Put your active chat ID here

async function sendTelegramMessage(messageText) {
  if (TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE" || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") {
    console.log("⚠️ Telegram credentials not configured. Skipping notification broadcast.");
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
        parse_mode: "Markdown",
      }),
    });
    console.log("📱 Telegram notification pushed successfully!");
  } catch (error) {
    console.error("❌ Failed to broadcast Telegram update:", error);
  }
}

function buildTelegramOrderTemplate(order) {
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

function buildTelegramStatusTemplate(order, newStatus) {
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
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState({});
  const [form, setForm] = useState({ name: "", phone: "", phone2: "", eventDate: "", returnDate: "", eventType: "", address: "", notes: "" });
  const [payMode, setPayMode] = useState("");
  const [orderNum, setOrderNum] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  const cartCount = Object.keys(cart).length;

  function handleQty(id, val) {
    const n = parseInt(val) || 0;
    setCart(prev => {
      const next = { ...prev };
      if (n > 0) next[id] = n; else delete next[id];
      return next;
    });
  }

  useEffect(() => {
    if (showAdmin) {
      loadOrdersFromFirebase();
    }
  }, [showAdmin]);

  async function loadOrdersFromFirebase() {
    try {
      setLoading(true);
      setFirebaseError(null);
      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders || []);
    } catch (error) {
      console.error("Error loading orders from Firebase:", error);
      setFirebaseError("Failed to load orders. Check Firebase connection.");
    } finally {
      setLoading(false);
    }
  }

  function goStep(n) {
    if (n === 2 && cartCount === 0) { alert("Please select at least one item."); return; }
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitOrder() {
    if (!payMode) { alert("Please select a payment method."); return; }
    if (!form.name.trim()) { alert("Please enter your name."); return; }
    if (!form.phone.trim()) { alert("Please enter your phone number."); return; }
    if (cartCount === 0) { alert("Please select at least one item."); goStep(1); return; }

    setLoading(true);

    const num = "SW-" + Date.now().toString().slice(-5);
    setOrderNum(num);
    const order = {
      orderNum: num,
      ...form,
      payMode,
      status: "pending",
      placedAt: new Date().toLocaleString("en-IN"),
      items: Object.entries(cart).map(([id, qty]) => {
        for (const cat of Object.values(ITEMS)) {
          const found = cat.find(i => i.id === id);
          if (found) return { ...found, qty };
        }
        return { id, en: id, kn: "", qty };
      }),
    };

    createOrder(order)
      .then(() => {
        sendTelegramMessage(buildTelegramOrderTemplate(order));
        setStep(4);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error submitting order:", error);
        alert("Failed to place order. Please try again. Error: " + error.message);
        setLoading(false);
      });
  }

  function sendWhatsApp(num, f, pm, cartItems) {
    const lines = cartItems.map(it => `• ${it.en} (${it.kn}) × ${it.qty}`).join("\n");
    const msg =
      `🎉 *New Rental Order — Swasthik Enterprises*\n\n` +
      `*Order No:* ${num}\n*Name:* ${f.name}\n*Phone:* ${f.phone}${f.phone2 ? " / " + f.phone2 : ""}\n` +
      `*Event Type:* ${f.eventType || "N/A"}\n*Event Date:* ${f.eventDate || "N/A"}\n*Return Date:* ${f.returnDate || "N/A"}\n` +
      `*Venue:* ${f.address || "N/A"}\n*Payment:* ${pm === "cash" ? "Cash on Delivery" : "UPI / Online"}\n\n` +
      `*Items Required:*\n${lines}${f.notes ? "\n*Notes:* " + f.notes : ""}\n\n_Swasthik Enterprises Booking App_`;
    window.open("https://wa.me/919980535818?text=" + encodeURIComponent(msg), "_blank");
  }

  function resetAll() {
    setCart({}); setForm({ name: "", phone: "", phone2: "", eventDate: "", returnDate: "", eventType: "", address: "", notes: "" });
    setPayMode(""); setOrderNum(""); setStep(1);
  }

  function tapPin(k) {
    setPinErr("");
    let next = pin;
    if (k === "del") next = next.slice(0, -1);
    else if (k === "clr") next = "";
    else if (next.length < 4) next += k;
    setPin(next);
    if (next.length === 4) {
      if (next === "7777") {
        setPin(""); setShowPin(false);
        loadOrdersFromFirebase();
        setShowAdmin(true);
      } else {
        setPinErr("Wrong PIN. Try again.");
        setTimeout(() => { setPin(""); setPinErr(""); }, 900);
      }
    }
  }

  function updateStatus(idx, status) {
    const order = orders[orders.length - 1 - idx];
    if (!order.id) {
      alert("Error: Order ID not found");
      return;
    }

    setLoading(true);
    updateOrderStatus(order.id, status)
      .then(() => {
        sendTelegramMessage(buildTelegramStatusTemplate(order, status));
        const updatedOrders = [...orders];
        updatedOrders[orders.length - 1 - idx].status = status;
        setOrders(updatedOrders);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error updating status:", error);
        alert("Failed to update order status. Error: " + error.message);
        setLoading(false);
      });
  }

  const s = {
    gold: { color: GOLD },
    btn: (active) => ({
      padding: "12px 0", borderRadius: 8, border: "none", fontFamily: "inherit",
      fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
      background: active ? GOLD : "#f5e8cc", color: active ? "#fff" : "#8a6520",
      transition: "all .18s",
    }),
    input: {
      width: "100%", padding: "11px 13px", border: "1.5px solid #e0cfa8",
      borderRadius: 8, fontFamily: "inherit", fontSize: 14, outline: "none",
      background: "#fff", color: "#2a1f0a",
    },
  };

  const orderItems = Object.entries(cart).map(([id, qty]) => {
    for (const cat of Object.values(ITEMS)) {
      const found = cat.find(i => i.id === id);
      if (found) return { ...found, qty };
    }
    return { id, en: id, kn: "", qty };
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fdf8f0", minHeight: "100vh", color: "#2a1f0a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${GOLD} !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #e0cfa8; border-radius: 4px; }
        .item-card { transition: all .18s; }
        .item-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(60,30,0,.12); }
        .pay-opt:hover { border-color: ${GOLD} !important; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: DEEP, color: "#fff", textAlign: "center", padding: "24px 16px 16px", position: "relative" }}>
        <button onClick={() => { setShowPin(true); setPin(""); setPinErr(""); }}
          style={{ position: "absolute", top: 14, right: 14, background: "rgba(201,151,58,.15)", border: "1px solid rgba(201,151,58,.4)", color: GOLD, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 100, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontFamily: "inherit" }}>
          ⚙ Admin
        </button>
        <div style={{ display: "inline-block", border: `1.5px solid ${GOLD}`, padding: "3px 16px", borderRadius: 100, fontSize: 11, color: GOLD, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>
          Swasthik Enterprises · Kervaje
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, margin: "0 0 4px" }}>
          ಸ್ವಸ್ತಿಕ್ <span style={{ color: GOLD }}>ಎಂಟರ್‌ಪ್ರೈಸಸ್</span>
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 10 }}>Serving all your event needs</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          <a href="tel:9980535818" style={{ color: GOLD, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>📞 9980535818</a>
          <a href="tel:9980437899" style={{ color: GOLD, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>📞 9980437899</a>
        </div>
      </div>

      {/* STEP NAV */}
      <div style={{ display: "flex", background: DEEP, borderTop: "1px solid rgba(201,151,58,.2)" }}>
        {[["1","Items"],["2","Details"],["3","Payment"],["4","Confirm"]].map(([n, label]) => (
          <button key={n} onClick={() => parseInt(n) < step && goStep(parseInt(n))}
            style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", borderBottom: `2.5px solid ${step >= parseInt(n) ? GOLD : "transparent"}`, color: step >= parseInt(n) ? GOLD : "rgba(255,255,255,.35)", fontFamily: "inherit", fontSize: 11, fontWeight: 500, cursor: parseInt(n) < step ? "pointer" : "default", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{n}</div>{label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "20px 14px 60px" }}>

        {/* ── STEP 1: ITEMS ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 4 }}>Select Items</h2>
            <p style={{ fontSize: 13, color: "#6b5533", marginBottom: 20 }}>Type the quantity you need for each item.</p>

            {Object.entries(ITEMS).map(([cat, items]) => (
              <div key={cat}>
                <div style={{ display: "inline-block", background: "#f5e8cc", color: "#8a6520", fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 100, marginBottom: 12, letterSpacing: .5 }}>{cat}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(145px,1fr))", gap: 10, marginBottom: 20 }}>
                  {items.map(item => {
                    const qty = cart[item.id] || 0;
                    return (
                      <div key={item.id} className="item-card"
                        style={{ background: qty > 0 ? "#f5e8cc" : "#fff", border: `1.5px solid ${qty > 0 ? GOLD : "#e0cfa8"}`, borderRadius: 12, padding: "11px 10px", position: "relative" }}>
                        {qty > 0 && <div style={{ position: "absolute", top: 7, right: 7, width: 17, height: 17, background: GOLD, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</div>}
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{item.en}</div>
                        <div style={{ fontSize: 11, color: "#6b5533", marginBottom: 8 }}>{item.kn}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 11, color: "#6b5533", whiteSpace: "nowrap" }}>Qty:</span>
                          <input type="number" min="0" placeholder="0" value={qty || ""}
                            onChange={e => handleQty(item.id, e.target.value)}
                            style={{ ...s.input, padding: "5px 6px", textAlign: "center", fontSize: 14, fontWeight: 600, width: "100%" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {cartCount > 0 && (
              <div style={{ position: "fixed", bottom: 20, right: 16, background: GOLD, color: "#fff", borderRadius: 50, padding: "11px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(201,151,58,.4)", zIndex: 99, border: "none", fontFamily: "inherit" }} onClick={() => goStep(2)}>
                🛒 {cartCount} items →
              </div>
            )}

            <button style={s.btn(true)} onClick={() => goStep(2)}>Continue to Details →</button>
          </div>
        )}

        {/* ── STEP 2: DETAILS ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 4 }}>Your Details</h2>
            <p style={{ fontSize: 13, color: "#6b5533", marginBottom: 20 }}>Tell us about your event.</p>

            {[
              { label: "Full Name *", id: "name", placeholder: "Your name", type: "text" },
            ].map(f => (
              <div key={f.id} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.id]} onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))} style={s.input} />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Phone *</label>
                <input type="tel" placeholder="Mobile number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={s.input} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Alternate Phone</label>
                <input type="tel" placeholder="Optional" value={form.phone2} onChange={e => setForm(p => ({ ...p, phone2: e.target.value }))} style={s.input} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Event Date *</label>
              <input type="date" value={form.eventDate} onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} style={s.input} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Event Type</label>
                <select value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))} style={s.input}>
                  <option value="">Select type</option>
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Return Date</label>
                <input 
                  type="date" 
                  value={form.returnDate} 
                  min={form.eventDate} 
                  onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} 
                  style={s.input} 
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Venue / Address</label>
              <textarea rows={2} placeholder="Event location" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ ...s.input, resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Notes</label>
              <textarea rows={2} placeholder="Any special requirements..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...s.input, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => goStep(1)} style={{ ...s.btn(false), width: "auto", padding: "12px 22px" }}>← Back</button>
              <button onClick={() => goStep(3)} style={{ ...s.btn(true), marginTop: 0 }}>Payment →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PAYMENT ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 4 }}>Choose Payment</h2>
            <p style={{ fontSize: 13, color: "#6b5533", marginBottom: 20 }}>How would you like to pay?</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { k: "cash", icon: "💵", label: "Cash", sub: "Pay on delivery" },
                { k: "upi", icon: "📲", label: "UPI / Scanner", sub: "Pay online now" },
              ].map(opt => (
                <div key={opt.k} className="pay-opt" onClick={() => setPayMode(opt.k)}
                  style={{ background: payMode === opt.k ? "#f5e8cc" : "#fff", border: `2px solid ${payMode === opt.k ? GOLD : "#e0cfa8"}`, borderRadius: 12, padding: "18px 12px", textAlign: "center", cursor: "pointer", transition: "all .18s" }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "#6b5533", marginTop: 3 }}>{opt.sub}</div>
                </div>
              ))}
            </div>

            {payMode === "upi" && (
              <div style={{ textAlign: "center", background: "#fff", border: "1.5px solid #e0cfa8", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Scan to Pay</p>
                <QRCode value="upi://pay?pa=madivalswasthik@okicici&pn=Swasthik+M&cu=INR" size={180} />
                <p style={{ fontSize: 13, color: "#6b5533", marginTop: 10, lineHeight: 1.6 }}>
                  Scan with GPay, PhonePe, Paytm or any UPI app<br />
                  <strong style={{ color: "#2a1f0a" }}>Swasthik M</strong><br />
                  <span style={{ fontSize: 12 }}>UPI: madivalswasthik@okicici</span>
                </p>
                <p style={{ fontSize: 12, color: "#6b5533", marginTop: 8 }}>After payment, take a screenshot and share it when we contact you.</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => goStep(2)} style={{ ...s.btn(false), width: "auto", padding: "12px 22px" }}>← Back</button>
              <button onClick={submitOrder} style={{ ...s.btn(true), marginTop: 0 }}>Place Order ✓</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: CONFIRM ── */}
        {step === 4 && (
          <div>
            <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
              <div style={{ width: 68, height: 68, background: "#d8f3dc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px" }}>✅</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#2d6a4f", marginBottom: 6 }}>Order Placed!</h2>
              <p style={{ fontSize: 14, color: "#6b5533", lineHeight: 1.6 }}>Thank you! Your rental request has been recorded.<br />Our team will contact you shortly.</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
                <a href="tel:9980535818" style={{ color: GOLD, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>📞 9980535818</a>
                <a href="tel:9980437899" style={{ color: GOLD, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>📞 9980437899</a>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: "#fff", border: "1.5px solid #e0cfa8", borderRadius: 12, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 20px rgba(60,30,0,.08)" }}>
              <div style={{ background: DEEP, color: "#fff", padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15 }}>Order Summary</span>
                <span style={{ color: GOLD, fontSize: 12, fontWeight: 600 }}>{orderNum}</span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                {[
                  ["Customer", form.name],
                  ["Phone", form.phone + (form.phone2 ? " / " + form.phone2 : "")],
                  form.eventDate && ["Event Date", form.eventDate],
                  form.returnDate && ["Return Date", form.returnDate],
                  form.eventType && ["Event Type", form.eventType],
                  form.address && ["Venue", form.address],
                  ["Payment", payMode === "cash" ? "💵 Cash on Delivery" : "📲 UPI / Online"],
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: ".5px solid #e0cfa8", fontSize: 13 }}>
                    <span style={{ color: "#6b5533" }}>{l}</span>
                    <span style={{ fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: ".5px solid #e0cfa8", marginTop: 10, paddingTop: 10, fontSize: 11, fontWeight: 600, color: "#6b5533", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Items Booked</div>
                {orderItems.map(it => (
                  <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: ".5px dashed #e0cfa8" }}>
                    <span>{it.en} <span style={{ color: "#6b5533", fontSize: 12 }}>×{it.qty}</span></span>
                    <span style={{ color: "#6b5533", fontSize: 12 }}>{it.kn}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => sendWhatsApp(orderNum, form, payMode, orderItems)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25d366", color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", width: "100%", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.524 5.847L0 24l6.335-1.509A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.001-1.368l-.358-.214-3.759.896.928-3.653-.234-.374A9.796 9.796 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z"/></svg>
              Send Order via WhatsApp
            </button>
            <button onClick={resetAll} style={{ ...s.btn(false), marginTop: 0 }}>+ New Order</button>
          </div>
        )}
      </div>

      {/* ── PIN OVERLAY ── */}
      {showPin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,7,.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fdf8f0", borderRadius: 16, padding: "28px 24px", width: 280, textAlign: "center", boxShadow: "0 12px 40px rgba(0,0,0,.3)" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 4 }}>🔐 Admin Access</h3>
            <p style={{ fontSize: 13, color: "#6b5533", marginBottom: 18 }}>Enter your 4-digit PIN</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 18 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? GOLD : "#e0cfa8", transition: "background .15s" }} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
              {["1","2","3","4","5","6","7","8","9","del","0","clr"].map(k => (
                <button key={k} onClick={() => tapPin(k)}
                  style={{ padding: "13px 0", border: "1.5px solid #e0cfa8", borderRadius: 10, fontSize: k === "del" || k === "clr" ? 13 : 18, fontWeight: 600, background: "#fff", cursor: "pointer", fontFamily: "inherit", color: "#2a1f0a", transition: "all .15s" }}>
                  {k === "del" ? "⌫" : k === "clr" ? "✕" : k}
                </button>
              ))}
            </div>
            {pinErr && <p style={{ color: "#c0392b", fontSize: 13, margin: "4px 0" }}>{pinErr}</p>}
            <span onClick={() => { setShowPin(false); setPin(""); setPinErr(""); }} style={{ fontSize: 13, color: "#6b5533", cursor: "pointer", marginTop: 8, display: "inline-block" }}>Cancel</span>
          </div>
        </div>
      )}

      {/* ── ADMIN PANEL ── */}
      {showAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "#fdf8f0", zIndex: 150, overflowY: "auto" }}>
          <div style={{ background: DEEP, color: "#fff", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, margin: 0 }}>📋 All Orders</h2>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>Swasthik Enterprises</span>
            </div>
            <button onClick={() => setShowAdmin(false)} style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff", fontSize: 16, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
          </div>

          <div style={{ maxWidth: 660, margin: "0 auto", padding: "18px 14px 40px" }}>
            {/* Error Message */}
            {firebaseError && (
              <div style={{ background: "#fdeaea", border: "1px solid #fc8181", borderRadius: 8, padding: "12px 14px", marginBottom: 18, color: "#c53030", fontSize: 12 }}>
                <strong>⚠ Firebase Error:</strong> {firebaseError}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div style={{ textAlign: "center", padding: "20px", color: "#6b5533", fontSize: 14 }}>
                ⏳ Loading...
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
              {[
                { num: orders.length, lbl: "Total Orders" },
                { num: orders.filter(o => o.status === "pending").length, lbl: "Pending" },
                { num: orders.filter(o => o.status === "delivered").length, lbl: "Delivered" },
              ].map(s => (
                <div key={s.lbl} style={{ background: "#fff", border: "1.5px solid #e0cfa8", borderRadius: 12, padding: "13px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#8a6520" }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: "#6b5533", marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b5533", fontSize: 14 }}>📭 No orders yet.<br />They will appear here once customers place them.</div>
            ) : (
              [...orders].reverse().map((o, ri) => {
                const realIdx = orders.length - 1 - ri;
                return (
                  <div key={o.orderNum} style={{ background: "#fff", border: "1.5px solid #e0cfa8", borderRadius: 12, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ background: "#f5ede0", padding: "9px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e0cfa8" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#8a6520" }}>{o.orderNum}</span>
                      <span style={{ fontSize: 11, color: "#6b5533" }}>{o.placedAt}</span>
                    </div>
                    <div style={{ padding: "11px 13px" }}>
                      {[
                        ["Customer", o.name],
                        ["Phone", o.phone + (o.phone2 ? " / " + o.phone2 : "")],
                        o.eventDate && ["Event Date", o.eventDate],
                        o.returnDate && ["Return Date", o.returnDate],
                        o.eventType && ["Event", o.eventType],
                        o.address && ["Venue", o.address],
                      ].filter(Boolean).map(([l, v]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
                          <span style={{ color: "#6b5533" }}>{l}</span>
                          <span style={{ fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", marginBottom: 8 }}>
                        <span style={{ color: "#6b5533" }}>Payment</span>
                        <span style={{ padding: "2px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: o.payMode === "cash" ? "#fff9e6" : "#e6f7ee", color: o.payMode === "cash" ? "#92700a" : "#1a6640" }}>
                          {o.payMode === "cash" ? "💵 Cash" : "📲 UPI"}
                        </span>
                      </div>

                      <ItemsToggle items={o.items || []} />

                      {/* Status buttons */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {[{ k: "pending", l: "⏳ Pending", bg: "#fff3cd", c: "#856404", bc: "#ffd700" },
                          { k: "confirmed", l: "✅ Confirmed", bg: "#d1ecf1", c: "#0c5460", bc: "#17a2b8" },
                          { k: "delivered", l: "📦 Delivered", bg: "#d4edda", c: "#155724", bc: "#28a745" }
                        ].map(st => (
                          <button key={st.k} onClick={() => updateStatus(realIdx, st.k)}
                            style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${st.bc}`, background: st.bg, color: st.c, opacity: o.status === st.k ? 1 : 0.4, transition: "opacity .15s" }}>
                            {st.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {orders.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button onClick={() => { 
                  if (confirm("Delete ALL orders? This cannot be undone.")) { 
                    setLoading(true);
                    Promise.all(orders.map(o => deleteOrder(o.id)))
                      .then(() => {
                        setOrders([]);
                        setLoading(false);
                        alert("All orders deleted successfully");
                      })
                      .catch((error) => {
                        console.error("Error deleting orders:", error);
                        alert("Failed to delete orders. Error: " + error.message);
                        setLoading(false);
                      });
                  }
                }}
                  style={{ background: "none", border: "none", color: "#c0392b", fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
                  🗑 Clear all orders
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemsToggle({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span onClick={() => setOpen(o => !o)} style={{ fontSize: 12, color: "#8a6520", cursor: "pointer", fontWeight: 600, display: "inline-block", marginBottom: open ? 6 : 0 }}>
        {open ? "▼" : "▶"} {open ? "Hide" : "Show"} {items.length} items
      </span>
      {open && (
        <div>
          {items.map((it, i) => (
            <div key={i} style={{ fontSize: 12, color: "#2a1f0a", padding: "3px 0", borderBottom: ".5px dashed #e0cfa8" }}>
              {it.en} ({it.kn}) × {it.qty}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QRCode({ value, size }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#1a1207";
    ctx.fillRect(0, 0, size, 4); ctx.fillRect(0, size-4, size, 4);
    ctx.fillRect(0, 0, 4, size); ctx.fillRect(size-4, 0, 4, size);
    [[8,8],[size-28,8],[8,size-28]].forEach(([x,y]) => {
      ctx.fillRect(x, y, 20, 20);
      ctx.fillStyle = "#fff"; ctx.fillRect(x+3, y+3, 14, 14);
      ctx.fillStyle = "#1a1207"; ctx.fillRect(x+6, y+6, 8, 8);
    });
    ctx.fillStyle = "#1a1207";
    for(let r=0;r<15;r++) for(let c=0;c<15;c++) {
      if((r+c+r*c)%3===0 && !(r<4&&c<4) && !(r<4&&c>10) && !(r>10&&c<4))
        ctx.fillRect(8+c*12, 8+r*12, 8, 8);
    }
    ctx.fillStyle = "#1a1207";
    ctx.font = "bold 9px DM Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("madivalswasthik@okicici", size/2, size-8);
  }, [value, size]);
  return <canvas ref={ref} width={size} height={size} style={{ borderRadius: 6, border: "1px solid #e0cfa8" }} />;
}