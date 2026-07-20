# 📱 Telegram Bot Setup — Swasthik Enterprises
Get instant order notifications on your phone for FREE in 5 minutes.

---

## Step 1 — Create your Telegram Bot

1. Open Telegram on your phone
2. Search for **@BotFather** (official blue tick bot)
3. Tap **START**
4. Send this message:
   ```
   /newbot
   ```
5. BotFather asks for a name — type:
   ```
   Swasthik Enterprises
   ```
6. BotFather asks for a username — type something unique like:
   ```
   swasthik_orders_bot
   ```
7. BotFather replies with your **Bot Token** — it looks like:
   ```
   7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ✅ **Copy and save this token!**

---

## Step 2 — Get your Chat ID

1. In Telegram, search for your new bot (e.g. `@swasthik_orders_bot`)
2. Tap **START**
3. Send any message to it (e.g. `hello`)
4. Now open this URL in your browser (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
   Example:
   ```
   https://api.telegram.org/bot7123456789:AAFxxx.../getUpdates
   ```
5. You'll see JSON — look for `"id"` inside `"chat"`:
   ```json
   {"message":{"chat":{"id": 987654321, ...}}}
   ```
   ✅ **That number is your Chat ID — copy it!**

---

## Step 3 — Add to server.js

Open `server.js` and find these two lines near the top:

```js
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "YOUR_BOT_TOKEN_HERE";
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || "YOUR_CHAT_ID_HERE";
```

Replace with your actual values:

```js
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7123456789:AAFxxxxxxxxxxxxxxxx";
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || "987654321";
```

Save the file and restart the server:
```bash
node server.js
```

---

## Step 4 — Test it!

Place a test order through the app. Within seconds you should get a Telegram message like:

```
🎉 NEW ORDER — Swasthik Enterprises
━━━━━━━━━━━━━━━━━━━━
🔖 Order No: SW-12345
👤 Name: Ramesh Kumar
📞 Phone: 9876543210
📅 Event Date: 2026-06-20
🔄 Return Date: 2026-06-21
🎊 Event Type: Wedding / ಮದುವೆ
📍 Venue: Kervashe Village
💳 Payment: 💵 Cash on Delivery
━━━━━━━━━━━━━━━━━━━━
📦 Items Ordered:
  • Chair (ಚೇಯರ್) × 50
  • Shamiana (ಶಾಮಿಯಾನ) × 2
━━━━━━━━━━━━━━━━━━━━
🕐 24/5/2026, 11:30:00 am
```

You also get a notification when order status changes:
```
✅ Order Status Updated
━━━━━━━━━━━━━━━━━━━━
🔖 Order: SW-12345
👤 Customer: Ramesh Kumar
📞 Phone: 9876543210
🔄 New Status: CONFIRMED
```

---

## Bonus — Group notifications (optional)

Want all family members to get notified?

1. Create a Telegram **Group** (e.g. "Swasthik Orders")
2. Add your bot to the group
3. Send a message in the group
4. Visit the getUpdates URL again — the Chat ID will now be a **negative number** like `-987654321`
5. Use that negative number as your `TELEGRAM_CHAT_ID`

Now everyone in the group gets notified instantly! 🎉

---

## Environment variables (recommended for hosting)

Instead of putting your token in the code, use environment variables:

```bash
# On your computer / server
export TELEGRAM_BOT_TOKEN="7123456789:AAFxxx..."
export TELEGRAM_CHAT_ID="987654321"
node server.js
```

Or create a `.env` file (if you add `dotenv` package).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No message received | Make sure you sent `/start` to the bot first |
| `401 Unauthorized` | Bot token is wrong — re-copy from BotFather |
| `chat not found` | Chat ID is wrong — redo Step 2 |
| Server says `not configured` | Check you replaced both placeholder values |

---

**That's it! Completely free, works forever.** 🚀
