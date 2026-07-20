import { useState, useEffect, useRef } from "react";

// ── Local Backend API / Standalone Mobile APK Storage ──────────────────────────
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

async function createOrder(orderData) {
  const newOrder = {
    id: Date.now(),
    ...orderData,
  };

  try {
    const res = await fetch("/api/orders", {
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
    console.warn("Backend API unreachable or running standalone APK. Saving order locally.", err);
  }

  // Fallback for mobile APK / standalone offline mode
  const orders = getLocalOrders();
  orders.push(newOrder);
  saveLocalOrders(orders);
  return newOrder;
}

async function getAllOrders() {
  try {
    const res = await fetch("/api/orders", { headers: { "x-admin-pin": ADMIN_PIN } });
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      const data = await res.json();
      if (Array.isArray(data.orders)) return data.orders;
    }
  } catch (err) {
    console.warn("Backend API unreachable. Loading local orders.", err);
  }
  return getLocalOrders();
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-pin": ADMIN_PIN },
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
  const index = orders.findIndex(o => String(o.id) === String(orderId) || String(o.orderNum) === String(orderId));
  if (index !== -1) {
    orders[index].status = status;
    saveLocalOrders(orders);
  }
  return true;
}

async function deleteOrder(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "DELETE",
      headers: { "x-admin-pin": ADMIN_PIN },
    });
    const contentType = res.headers.get("content-type");
    if (res.ok && contentType && contentType.includes("application/json")) {
      return true;
    }
  } catch (err) {
    console.warn("Backend API unreachable. Deleting order locally.", err);
  }

  let orders = getLocalOrders();
  orders = orders.filter(o => String(o.id) !== String(orderId) && String(o.orderNum) !== String(orderId));
  saveLocalOrders(orders);
  return true;
}
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#d97706";        // Sunrise Amber (Matches Logo Center & Stars)
const DEEP = "#0f172a";        // Deep Slate Navy (Matches Logo Text & Dark Mode)
const TEAL = "#0f766e";        // Vibrant Teal (Matches Logo Left Arch)
const ROSE = "#e11d48";        // Ruby Rose (Matches Logo Right Arch)
const BG_PAGE = "#fcfaf6";     // Clean Cream Off-White Background
const BG_CARD_SEL = "#fff7ed"; // Soft Amber Light
const BORDER_NORM = "#cbd5e1"; // Clean Slate Border
const TXT_MAIN = "#0f172a";    // Primary Slate Text
const TXT_MUTED = "#475569";   // Secondary Slate Text

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
const TELEGRAM_BOT_TOKEN = "8867419960:AAErKz2Nntvu5DWTZuETj-_DKWNWPZsYIkM";
const TELEGRAM_CHAT_ID   = "6360146834";

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
    `🎉 *NEW ORDER — Swasthik Event Management*\n` +
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
  const [splashHide, setSplashHide] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [splashPct, setSplashPct] = useState(0);
  const [swipeReady, setSwipeReady] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef(null);

  function triggerSwipeUp() {
    if (splashHide || splashDone) return;
    setSplashHide(true);
    setTimeout(() => setSplashDone(true), 650);
  }

  function handleTouchStart(e) {
    if (!swipeReady || splashHide) return;
    touchStartRef.current = e.touches[0].clientY;
  }

  function handleTouchMove(e) {
    if (!swipeReady || splashHide || touchStartRef.current === null) return;
    const deltaY = touchStartRef.current - e.touches[0].clientY;
    if (deltaY > 0) {
      setSwipeOffset(Math.min(deltaY, 250));
    }
  }

  function handleTouchEnd(e) {
    if (!swipeReady || splashHide || touchStartRef.current === null) return;
    const deltaY = touchStartRef.current - (e.changedTouches ? e.changedTouches[0].clientY : touchStartRef.current);
    touchStartRef.current = null;
    if (deltaY > 40 || swipeOffset > 40) {
      triggerSwipeUp();
    } else {
      setSwipeOffset(0);
    }
  }

  function handleWheel(e) {
    if (!swipeReady || splashHide) return;
    if (e.deltaY > 15) {
      triggerSwipeUp();
    }
  }

  useEffect(() => {
    let n = 0;
    const ticker = setInterval(() => {
      n = Math.min(n + Math.floor(Math.random() * 4) + 1, 100);
      setSplashPct(n);
      if (n >= 100) {
        clearInterval(ticker);
        setSwipeReady(true);
      }
    }, 28);
    return () => clearInterval(ticker);
  }, []);

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
      `🎉 *New Rental Order — Swasthik Event Management*\n\n` +
      `*Order No:* ${num}\n*Name:* ${f.name}\n*Phone:* ${f.phone}${f.phone2 ? " / " + f.phone2 : ""}\n` +
      `*Event Type:* ${f.eventType || "N/A"}\n*Event Date:* ${f.eventDate || "N/A"}\n*Return Date:* ${f.returnDate || "N/A"}\n` +
      `*Venue:* ${f.address || "N/A"}\n*Payment:* ${pm === "cash" ? "Cash on Delivery" : "UPI / Online"}\n\n` +
      `*Items Required:*\n${lines}${f.notes ? "\n*Notes:* " + f.notes : ""}\n\n_Swasthik Event Management Booking App_`;
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
      padding: "14px 0", borderRadius: 8, border: "none", fontFamily: "inherit",
      fontSize: 16, fontWeight: 600, cursor: "pointer", width: "100%",
      background: active ? GOLD : "#f1f5f9", color: active ? "#fff" : TXT_MUTED,
      transition: "all .18s",
    }),
    input: {
      width: "100%", padding: "12px 14px", border: `1.5px solid ${BORDER_NORM}`,
      borderRadius: 8, fontFamily: "inherit", fontSize: 16, outline: "none",
      background: "#fff", color: TXT_MAIN,
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
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=DM+Sans:wght@300;400;500;600&family=Noto+Sans+Kannada:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { background: #080c14; }

        /* SPLASH */
        #sw-splash {
          position:fixed;inset:0;z-index:9999;
          background:radial-gradient(ellipse at 50% 45%,#1e2f50 0%,#080c14 65%);
          display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;
        }
        #sw-splash::before {
          content:'';position:absolute;inset:0;
          background-image:
            radial-gradient(1px 1px at 15% 20%,rgba(201,151,58,.8) 0%,transparent 100%),
            radial-gradient(2px 2px at 60% 70%,rgba(201,151,58,.5) 0%,transparent 100%),
            radial-gradient(1px 1px at 90% 60%,rgba(13,148,136,.7) 0%,transparent 100%),
            radial-gradient(1px 1px at 70% 35%,rgba(255,255,255,.5) 0%,transparent 100%),
            radial-gradient(1px 1px at 30% 80%,rgba(255,255,255,.4) 0%,transparent 100%);
          animation:twinkle 3s ease-in-out infinite alternate;
        }
        @keyframes twinkle{0%{opacity:.4}100%{opacity:1}}
        #sw-splash.hide { animation:splashSwipeUp .65s cubic-bezier(.16,1,.3,1) forwards; pointer-events:none; }
        @keyframes splashSwipeUp{
          0%{transform:translateY(0);opacity:1;}
          100%{transform:translateY(-100vh);opacity:0;}
        }
        .sp-glow{position:absolute;width:320px;height:320px;border-radius:50%;border:1px solid rgba(201,151,58,.15);animation:glowP 2.5s ease-in-out infinite;}
        .sp-glow2{position:absolute;width:420px;height:420px;border-radius:50%;border:1px solid rgba(13,148,136,.1);animation:glowP 2.5s ease-in-out infinite reverse .8s;}
        @keyframes glowP{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.06);opacity:1}}
        .sp-center{display:flex;flex-direction:column;align-items:center;position:relative;z-index:2;}
        .sp-ring{position:relative;width:160px;height:160px;margin-bottom:28px;animation:spPulse 2s ease-in-out infinite;}
        @keyframes spPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        .sp-ring::before,.sp-ring::after{content:'';position:absolute;inset:-14px;border-radius:50%;border:2.5px solid transparent;}
        .sp-ring::before{border-top-color:#c9973a;border-right-color:#c9973a;animation:spinA 1.6s linear infinite;}
        .sp-ring::after{border-bottom-color:#0d9488;border-left-color:#0d9488;animation:spinB 2.2s linear infinite reverse;}
        @keyframes spinA{to{transform:rotate(360deg)}}
        @keyframes spinB{to{transform:rotate(360deg)}}
        .sp-ring-inner{position:absolute;inset:-28px;border-radius:50%;border:1px dashed rgba(201,151,58,.3);animation:spinA 4s linear infinite;}
        .sp-logo{width:160px;height:160px;border-radius:50%;border:4px solid rgba(201,151,58,.5);object-fit:contain;background:#fff;padding:16px;box-shadow:0 0 40px rgba(201,151,58,.25),0 0 80px rgba(201,151,58,.1);}
        .sp-brand{font-family:'Cinzel',serif;font-size:26px;font-weight:900;letter-spacing:5px;text-align:center;margin-bottom:6px;background:linear-gradient(135deg,#c9973a,#f5d07a,#c9973a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:brandGlow 2s ease-in-out infinite alternate;}
        @keyframes brandGlow{0%{filter:drop-shadow(0 0 4px rgba(201,151,58,.3))}100%{filter:drop-shadow(0 0 16px rgba(201,151,58,.8))}}
        .sp-kn{font-family:'Noto Sans Kannada',sans-serif;font-size:15px;color:rgba(255,255,255,.6);text-align:center;margin-bottom:10px;}
        .sp-tag{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(201,151,58,.6);margin-bottom:30px;}
        .sp-bar{width:220px;height:3px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;}
        .sp-progress{height:100%;background:linear-gradient(90deg,#0d9488,#c9973a,#f5d07a);border-radius:3px;box-shadow:0 0 10px rgba(201,151,58,.6);transition:width .05s linear;}
        .sp-pct{margin-top:10px;font-size:11px;font-weight:600;color:rgba(201,151,58,.7);letter-spacing:1px;}

        .sp-swipe-prompt{display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:14px 28px;border-radius:100px;background:rgba(201,151,58,.12);border:1px solid rgba(201,151,58,.4);box-shadow:0 0 25px rgba(201,151,58,.25);animation:promptPulse 2s infinite ease-in-out;transition:all .25s;margin-top:10px;}
        .sp-swipe-prompt:hover{background:rgba(201,151,58,.28);transform:scale(1.05);}
        @keyframes promptPulse{0%,100%{transform:translateY(0);box-shadow:0 0 20px rgba(201,151,58,.2);}50%{transform:translateY(-6px);box-shadow:0 0 35px rgba(201,151,58,.55);}}
        .swipe-chevron{font-size:24px;animation:bounceUp 1.4s infinite ease-in-out;margin-bottom:4px;}
        @keyframes bounceUp{0%,100%{transform:translateY(3px);}50%{transform:translateY(-6px);}}
        .swipe-text{font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:3px;color:#f5d07a;text-align:center;}
        .swipe-sub{font-size:10px;color:rgba(255,255,255,.55);margin-top:3px;letter-spacing:1px;}

        /* PRODUCTION OF ITEMS ON SWIPE UP */
        #sw-app.show .app-header{animation:produceEntrance .65s cubic-bezier(.16,1,.3,1) forwards;}
        #sw-app.show .step-nav-bar{animation:produceEntrance .65s cubic-bezier(.16,1,.3,1) .1s both;}
        #sw-app.show .cat-badge{animation:produceItem .65s cubic-bezier(.16,1,.3,1) both;}
        #sw-app.show .item-card{animation:produceItem .65s cubic-bezier(.34,1.56,.64,1) both;}
        #sw-app.show .item-card:nth-child(1){animation-delay:.15s;}
        #sw-app.show .item-card:nth-child(2){animation-delay:.2s;}
        #sw-app.show .item-card:nth-child(3){animation-delay:.25s;}
        #sw-app.show .item-card:nth-child(4){animation-delay:.3s;}
        #sw-app.show .item-card:nth-child(n+5){animation-delay:.35s;}

        @keyframes produceEntrance{0%{opacity:0;transform:translateY(-25px);}100%{opacity:1;transform:translateY(0);}}
        @keyframes produceItem{0%{opacity:0;transform:translateY(45px) scale(0.9);}100%{opacity:1;transform:translateY(0) scale(1);}}

        /* MAIN APP FADE IN */
        #sw-app{opacity:0;transform:scale(.98);transition:opacity .5s ease,transform .5s ease;}
        #sw-app.show{opacity:1;transform:scale(1);}

        /* HEADER */
        .app-header{
          background:linear-gradient(160deg,#0a1628 0%,#111d35 40%,#0a1628 100%);
          position:relative;overflow:hidden;
        }
        .hdr-glow{position:absolute;top:-60px;left:-40px;width:260px;height:260px;background:radial-gradient(circle,rgba(201,151,58,.18) 0%,transparent 70%);pointer-events:none;}
        .hdr-glow2{position:absolute;bottom:-40px;right:-20px;width:200px;height:200px;background:radial-gradient(circle,rgba(13,148,136,.15) 0%,transparent 70%);pointer-events:none;}
        .brand-cinzel{font-family:'Cinzel',serif;font-size:28px;font-weight:900;text-align:center;line-height:1.1;margin-bottom:8px;}
        .brand-cinzel span{background:linear-gradient(135deg,#c9973a,#f5d07a,#c9973a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .loc-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(201,151,58,.3);padding:4px 16px;border-radius:100px;font-size:10px;color:#c9973a;letter-spacing:2px;text-transform:uppercase;font-weight:600;margin-bottom:10px;}
        .kn-badge{background:linear-gradient(135deg,rgba(201,151,58,.2),rgba(201,151,58,.08));border:1px solid rgba(201,151,58,.4);padding:8px 24px;border-radius:100px;font-family:'Noto Sans Kannada',sans-serif;font-size:16px;font-weight:700;color:#fde68a;margin-bottom:12px;box-shadow:0 4px 16px rgba(0,0,0,.2);}
        .logo-badge-hdr{width:52px;height:52px;border-radius:14px;background:#fff;padding:4px;border:2px solid #c9973a;box-shadow:0 0 0 4px rgba(201,151,58,.15),0 8px 24px rgba(0,0,0,.4);}
        .logo-badge-hdr img{width:100%;height:100%;object-fit:contain;}
        .phone-chip{color:#f5d07a;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.06);padding:6px 14px;border-radius:100px;border:1px solid rgba(255,255,255,.1);transition:all .2s;}
        .phone-chip:hover{background:rgba(201,151,58,.2);border-color:#c9973a;}

        /* STEP NAV */
        .step-nav-bar{display:flex;background:#0d1525;border-top:1px solid rgba(201,151,58,.15);position:sticky;top:0;z-index:50;}
        .step-btn{flex:1;padding:10px 4px;background:none;border:none;border-bottom:2.5px solid transparent;color:rgba(255,255,255,.3);font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;cursor:pointer;text-align:center;transition:all .2s;}
        .step-btn.active{border-bottom-color:#c9973a;color:#c9973a;}
        .step-num{font-size:16px;font-weight:700;margin-bottom:2px;}

        /* CONTENT */
        .content-area{background:#fdfaf4;min-height:100vh;padding:22px 14px 80px;position:relative;}
        .watermark-bg{position:fixed;top:50%;left:50%;transform:translate(-50%,-40%);width:75vw;max-width:320px;opacity:.06;pointer-events:none;z-index:0;}

        /* CATEGORY BADGE */
        .cat-badge{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#0f766e,#0d9488);color:#fff;font-size:12px;font-weight:600;padding:7px 18px;border-radius:100px;margin-bottom:14px;box-shadow:0 4px 14px rgba(13,148,136,.3);letter-spacing:.3px;cursor:default;}

        /* ITEM CARDS */
        .items-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:22px;}
        .item-card{background:#fff;border-radius:16px;padding:14px 12px;border:1.5px solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,.05);transition:all .2s;cursor:pointer;position:relative;overflow:hidden;}
        .item-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#0d9488,#c9973a);opacity:0;transition:opacity .2s;}
        .item-card.selected{border-color:#c9973a;background:linear-gradient(135deg,#fffbeb,#fff7ed);box-shadow:0 4px 20px rgba(201,151,58,.15);}
        .item-card.selected::before{opacity:1;}
        .item-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,.1);}
        .ic-check{position:absolute;top:8px;right:8px;width:18px;height:18px;background:#c9973a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;font-weight:700;}
        .ic-name{font-size:13px;font-weight:600;color:#0f172a;margin-bottom:3px;}
        .ic-kn{font-size:11px;font-weight:700;color:#b45309;background:#fef3c7;padding:2px 8px;border-radius:6px;display:inline-block;margin-bottom:8px;border:1px solid #fde68a;}
        .ic-qty-row{display:flex;align-items:center;gap:6px;}
        .ic-qty-label{font-size:11px;color:#64748b;}
        .ic-qty-input{flex:1;padding:5px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-weight:600;text-align:center;color:#0f172a;background:#f8fafc;outline:none;font-family:'DM Sans',sans-serif;}
        .ic-qty-input:focus{border-color:#c9973a;}

        /* SECTION TITLE */
        .sec-title{font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#0f172a;margin-bottom:4px;}
        .sec-sub{font-size:13px;color:#64748b;margin-bottom:20px;}

        /* FLOAT CART */
        .floating-cart{position:fixed;bottom:22px;right:16px;z-index:99;background:linear-gradient(135deg,#c9973a,#f5d07a);color:#0f172a;font-weight:700;font-size:13px;padding:13px 22px;border-radius:100px;border:none;cursor:pointer;box-shadow:0 8px 30px rgba(201,151,58,.45);display:flex;align-items:center;gap:8px;font-family:'DM Sans',sans-serif;animation:floatBounce 2s ease-in-out infinite;}
        @keyframes floatBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}

        /* CONTINUE BTN */
        .continue-btn{width:100%;padding:16px;border:none;border-radius:14px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 20px rgba(15,23,42,.3);transition:all .2s;position:relative;overflow:hidden;}
        .continue-btn:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(15,23,42,.4);}

        /* FORM */
        input:focus,textarea:focus,select:focus{border-color:#c9973a !important;box-shadow:0 0 0 3px rgba(201,151,58,.1) !important;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:4px;}
        input[type=number]::-webkit-inner-spin-button{opacity:1;}

        /* PAY OPTIONS */
        .pay-opt{border-color:#e2e8f0 !important;background:#fff;border-radius:16px;transition:all .22s;}
        .pay-opt.selected{background:linear-gradient(135deg,#fffbeb,#fff7ed) !important;border-color:#c9973a !important;}
        .pay-opt:hover{border-color:#c9973a !important;transform:translateY(-2px);}
        .pay-sub{color:#64748b !important;}

        /* DESKTOP */
        @media (min-width:768px){
          .app-header{padding:40px 24px 28px !important;}
          .brand-cinzel{font-size:42px !important;}
          .items-grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr)) !important;gap:18px !important;}
          .content-area{max-width:1150px;margin:0 auto;padding:36px 32px 80px !important;}
          .floating-cart{padding:16px 30px !important;font-size:16px !important;bottom:28px !important;right:36px !important;}
          .pay-opt{padding:28px 18px !important;}
        }
      `}</style>


      {/* SPLASH / LOGO SCREEN */}
      {!splashDone && (
        <div 
          id="sw-splash" 
          className={splashHide ? "hide" : ""}
          style={{ transform: !splashHide && swipeOffset > 0 ? `translateY(-${swipeOffset}px)` : undefined, transition: swipeOffset === 0 ? "transform 0.2s ease" : "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div className="sp-glow" />
          <div className="sp-glow2" />
          <div className="sp-center">
            <div className="sp-ring">
              <div className="sp-ring-inner" />
              <img src="logo.png" alt="Swasthik" className="sp-logo" />
            </div>
            <div className="sp-brand">SWASTHIK</div>
            <div className="sp-kn">ಸ್ವಸ್ತಿಕ್ ಇವೆಂಟ್ ಮ್ಯಾನೇಜ್ಮೆಂಟ್</div>
            <div className="sp-tag">Event &amp; Rental Services · Kervashe</div>
            {swipeReady ? (
              <div className="sp-swipe-prompt" onClick={triggerSwipeUp}>
                <div className="swipe-chevron">👆</div>
                <div className="swipe-text">SWIPE UP TO VIEW CATALOG</div>
                <div className="swipe-sub">Swipe or Click here to explore items</div>
              </div>
            ) : (
              <>
                <div className="sp-bar"><div className="sp-progress" style={{ width: `${splashPct}%` }} /></div>
                <div className="sp-pct">{splashPct}%</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MAIN APP */}
      <div id="sw-app" className={splashDone ? "show" : splashHide ? "show" : ""}>

      {/* HEADER */}
      <div className="app-header" style={{ color: "#fff", textAlign: "center", padding: "22px 18px 18px" }}>
        <div className="hdr-glow" />
        <div className="hdr-glow2" />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div className="logo-badge-hdr"><img src="logo.png" alt="Swasthik" /></div>
            <button onClick={() => { setShowPin(true); setPin(""); setPinErr(""); }}
              style={{ background: "rgba(201,151,58,.12)", border: "1px solid rgba(201,151,58,.35)", color: "#c9973a", fontSize: 10, fontWeight: 600, letterSpacing: 1.5, padding: "7px 14px", borderRadius: 100, cursor: "pointer", textTransform: "uppercase", fontFamily: "inherit" }}>
              ⚙ Admin
            </button>
          </div>
          <div className="loc-pill">📍 Swasthik Event Management · Kervashe</div>
          <div className="brand-cinzel">SWASTHIK<br/><span>EVENT MANAGEMENT</span></div>
          <div className="kn-badge">ಸ್ವಸ್ತಿಕ್ ಇವೆಂಟ್ ಮ್ಯಾನೇಜ್ಮೆಂಟ್</div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 12 }}>Serving all your event &amp; rental needs in Kervashe</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <a href="tel:9980535818" className="phone-chip">📞 9980535818</a>
            <a href="tel:9980437899" className="phone-chip">📞 9980437899</a>
          </div>
        </div>
      </div>

      {/* STEP NAV */}
      <div className="step-nav-bar">
        {[["1","Items"],["2","Details"],["3","Payment"],["4","Confirm"]].map(([n, label]) => (
          <button key={n} className={`step-btn${step >= parseInt(n) ? " active" : ""}`}
            onClick={() => parseInt(n) < step && goStep(parseInt(n))}>
            <div className="step-num">{n}</div>{label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="content-area">
        <img src="logo.png" className="watermark-bg" alt="" />
        <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── STEP 1: ITEMS ── */}
        {step === 1 && (
          <div>
            <div className="sec-title">Select Items</div>
            <div className="sec-sub">Type the quantity you need for each item.</div>

            {Object.entries(ITEMS).map(([cat, items], catIdx) => {
              const catStyles = [
                {},
                { background: "linear-gradient(135deg,#9333ea,#7c3aed)", boxShadow: "0 4px 14px rgba(147,51,234,.3)" },
                { background: "linear-gradient(135deg,#be123c,#e11d48)", boxShadow: "0 4px 14px rgba(190,18,60,.3)" },
                { background: "linear-gradient(135deg,#0369a1,#0284c7)", boxShadow: "0 4px 14px rgba(3,105,161,.3)" },
              ];
              return (
                <div key={cat}>
                  <div className="cat-badge" style={catStyles[catIdx] || {}}>{cat}</div>
                  <div className="items-grid">
                    {items.map(item => {
                      const qty = cart[item.id] || 0;
                      return (
                        <div key={item.id} className={`item-card${qty > 0 ? " selected" : ""}`}
                          onClick={() => { if (qty === 0) handleQty(item.id, 1); }}>
                          {qty > 0 && <div className="ic-check">✓</div>}
                          <div className="ic-name">{item.en}</div>
                          <div className="ic-kn">{item.kn}</div>
                          <div className="ic-qty-row">
                            <span className="ic-qty-label">Qty:</span>
                            <input type="number" min="0" placeholder="0" value={qty || ""}
                              className="ic-qty-input"
                              onClick={e => e.stopPropagation()}
                              onChange={e => handleQty(item.id, e.target.value)} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {cartCount > 0 && (
              <button className="floating-cart" onClick={() => goStep(2)}>🛒 {cartCount} items →</button>
            )}
            <button className="continue-btn" onClick={() => goStep(2)}>Continue to Details →</button>
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
                <input type="tel" inputMode="numeric" maxLength={10} placeholder="Mobile number (10 digits)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} style={s.input} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6b5533", marginBottom: 5 }}>Alternate Phone</label>
                <input type="tel" inputMode="numeric" maxLength={10} placeholder="Optional (10 digits)" value={form.phone2} onChange={e => setForm(p => ({ ...p, phone2: e.target.value.replace(/\D/g, "").slice(0, 10) }))} style={s.input} />
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
                <div key={opt.k} className={`pay-opt ${payMode === opt.k ? "selected" : ""}`} onClick={() => setPayMode(opt.k)}
                  style={{ background: payMode === opt.k ? BG_CARD_SEL : "#fff", border: `2px solid ${payMode === opt.k ? GOLD : BORDER_NORM}`, borderRadius: 12, padding: "18px 12px", textAlign: "center", cursor: "pointer", transition: "all .18s" }}>
                  <div className="pay-icon" style={{ fontSize: 30, marginBottom: 8 }}>{opt.icon}</div>
                  <div className="pay-label" style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                  <div className="pay-sub" style={{ fontSize: 11, color: "#6b5533", marginTop: 3 }}>{opt.sub}</div>
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
                  <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "7px 0", borderBottom: ".5px dashed #e0cfa8" }}>
                    <span>{it.en} <span style={{ color: "#6b5533", fontSize: 12 }}>×{it.qty}</span></span>
                    <span style={{ background: "#fef3c7", color: "#b45309", fontWeight: 700, fontSize: 13, padding: "2px 10px", borderRadius: 6, border: "1px solid #fde68a" }}>{it.kn}</span>
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
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>Swasthik Event Management</span>
            </div>
            <button onClick={() => setShowAdmin(false)} style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff", fontSize: 16, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>✕</button>
          </div>

          <div className="admin-container" style={{ maxWidth: 660, margin: "0 auto", padding: "18px 14px 40px" }}>
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
      </div>
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

// ── UPI & PAYMENT QR CONFIGURATION ─────────────────────────────────────────────
// If you have your own QR code image (e.g. from GPay/PhonePe Business app),
// place the image file in the "public" folder (e.g., "qr.png") and set:
// const CUSTOM_QR_IMAGE_URL = "/qr.png";
const CUSTOM_QR_IMAGE_URL = "";

function QRCode({ value, size }) {
  const qrUrl = CUSTOM_QR_IMAGE_URL || `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
  
  return (
    <div style={{ display: "inline-block", position: "relative", width: size, height: size, background: "#fff", borderRadius: 8, border: "1.5px solid #e0cfa8", padding: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden" }}>
      <img 
        src={qrUrl} 
        alt="UPI Payment QR Code" 
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} 
        onError={(e) => {
          e.target.style.display = "none";
          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
        }}
      />
      <div style={{ display: "none", position: "absolute", inset: 0, flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fdf8f0", borderRadius: 6, padding: 10, textAlign: "center", fontSize: 11, color: "#6b5533" }}>
        <span>⚠️ Could not load QR image.</span>
        <strong style={{ color: "#2a1f0a", marginTop: 4, fontSize: 12 }}>madivalswasthik@okicici</strong>
      </div>
    </div>
  );
}