# SEI Notification Plugin Setup Guide

## 🚨 **Issue Resolution: "I don't receive any alerts"**

This guide will help you properly configure the SEI notification plugin so you receive alerts.

## 🔍 **Why Alerts Might Not Work**

Based on the debugging, the main issues are:

1. **❌ Invalid `TELEGRAM_CHAT_ID`**: Using `"client_chat"` instead of a numeric chat ID
2. **❌ Missing `COINMARKETCAP_API_KEY`**: Required for price monitoring
3. **❌ Service not properly started**: Environment variables not set before service initialization

## 📋 **Required Environment Variables**

You need these 4 environment variables set:

```bash
TELEGRAM_BOT_TOKEN=8269681663:AAFLGN65T_gT9S25byRU4IDGI86I8Qgew5Q
TELEGRAM_CHAT_ID=YOUR_NUMERIC_CHAT_ID  # ← This is the key fix!
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
SEI_REST_URL=https://sei-api.polkachu.com  # Optional, has default
```

## 🔧 **Step-by-Step Setup**

### Step 1: Get Your Correct Telegram Chat ID

**The bot token is already working**, but you need your correct chat ID:

1. **Send a message to your bot first:**
   - Open Telegram
   - Search for `@seitip_bot`
   - Send any message (like "hello")

2. **Run the chat ID finder script:**
   ```bash
   cd /workspace
   node get_chat_id.js
   ```

3. **Copy the numeric chat ID** (example: `123456789` or `-123456789`)

### Step 2: Get CoinMarketCap API Key

1. Visit [CoinMarketCap API](https://coinmarketcap.com/api/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier allows 333 calls/day (sufficient for monitoring)

### Step 3: Set Environment Variables

Set these in your environment **before starting the service**:

```bash
# Option 1: Export in terminal
export TELEGRAM_BOT_TOKEN="8269681663:AAFLGN65T_gT9S25byRU4IDGI86I8Qgew5Q"
export TELEGRAM_CHAT_ID="YOUR_NUMERIC_CHAT_ID"  # Replace with actual ID
export COINMARKETCAP_API_KEY="your_api_key_here"
export SEI_REST_URL="https://sei-api.polkachu.com"

# Option 2: Create .env file
echo 'TELEGRAM_BOT_TOKEN=8269681663:AAFLGN65T_gT9S25byRU4IDGI86I8Qgew5Q' > .env
echo 'TELEGRAM_CHAT_ID=YOUR_NUMERIC_CHAT_ID' >> .env
echo 'COINMARKETCAP_API_KEY=your_api_key_here' >> .env
echo 'SEI_REST_URL=https://sei-api.polkachu.com' >> .env
```

### Step 4: Test Your Configuration

Run the debugging script to verify everything works:

```bash
node debug_notifications.js
```

You should see all ✅ green checkmarks.

## 🎯 **Quick Test Commands**

### Test Telegram Connection:
```bash
TELEGRAM_BOT_TOKEN=8269681663:AAFLGN65T_gT9S25byRU4IDGI86I8Qgew5Q \
TELEGRAM_CHAT_ID=YOUR_NUMERIC_CHAT_ID \
node get_chat_id.js
```

### Test Full System:
```bash
TELEGRAM_BOT_TOKEN=8269681663:AAFLGN65T_gT9S25byRU4IDGI86I8Qgew5Q \
TELEGRAM_CHAT_ID=YOUR_NUMERIC_CHAT_ID \
COINMARKETCAP_API_KEY=your_api_key \
node debug_notifications.js
```

## 🚀 **Starting the Service**

After setting environment variables, start your service. The enhanced logging will show:

```
✅ Chat ID validation passed: 123456789
✅ Telegram bot connection successful
✅ CoinMarketCap API working - SEI price: $0.322593
🎉 Notification service initialized successfully
⏱️ Price monitoring interval: 60s
⏱️ Proposal monitoring interval: 300s
✅ Price monitoring started
```

## 📊 **Creating Price Alerts**

Once the service is running with correct environment variables:

```javascript
// Example: Alert when SEI goes above $0.35
runtime.getService('notification').addPriceAlert(
  'SEI',
  0.35,
  'above',
  'YOUR_NUMERIC_CHAT_ID',  // Use your actual chat ID
  'user123'
);
```

## 🐛 **Debugging Logs**

The enhanced service now logs:
- ✅ Environment variable validation
- ✅ Chat ID format validation  
- ✅ API connectivity tests
- ✅ Alert creation details
- ✅ Price check cycles
- ✅ Alert triggering events

## 🔍 **Common Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid chat_id format" | Using `"client_chat"` | Use numeric chat ID from `get_chat_id.js` |
| "COINMARKETCAP_API_KEY not set" | Missing API key | Get free key from CoinMarketCap |
| "No messages found" | Haven't messaged bot | Send message to `@seitip_bot` first |
| "Telegram connection failed" | Wrong bot token | Verify bot token is correct |
| "No price alerts active" | Alerts not created | Check environment vars before creating alerts |

## ✅ **Verification Checklist**

- [ ] Sent message to `@seitip_bot`
- [ ] Got numeric chat ID from `get_chat_id.js`
- [ ] Set `TELEGRAM_CHAT_ID` to numeric value
- [ ] Got CoinMarketCap API key
- [ ] Set all 4 environment variables
- [ ] Ran `debug_notifications.js` with all ✅
- [ ] Service started with success messages
- [ ] Created test price alert
- [ ] Received test message in Telegram

## 📞 **Still Need Help?**

If you're still not receiving alerts after following this guide:

1. **Check the logs** - The enhanced service provides detailed logging
2. **Verify environment variables** are set in the same process as the service
3. **Test with realistic price targets** - Set alerts slightly above/below current price
4. **Confirm service is running** - Check that monitoring intervals are active

---

**🎉 Once properly configured, you'll receive real-time SEI price alerts in Telegram!**