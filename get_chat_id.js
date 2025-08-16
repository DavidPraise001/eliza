const https = require('https');

// Script to help get your Telegram chat ID
async function getChatId() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8269681663:AAFLGN65T_gT9S25byRU4IDGI86I8Qgew5Q';
  
  console.log('🔍 Getting your Telegram Chat ID...\n');
  console.log('📱 Step 1: Send a message to your bot first!');
  console.log(`   Open Telegram and send any message to @seitip_bot\n`);
  
  function makeRequest(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.description || data}`));
            }
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      }).on('error', reject);
    });
  }

  try {
    // Get bot info first
    const botUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
    const botInfo = await makeRequest(botUrl);
    console.log(`✅ Connected to bot: @${botInfo.result.username}`);
    
    // Get recent messages
    const updatesUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=10`;
    const updates = await makeRequest(updatesUrl);
    
    console.log('\n📬 Recent messages to your bot:');
    console.log('================================');
    
    if (updates.result.length === 0) {
      console.log('❌ No messages found!');
      console.log('\n💡 To get your chat ID:');
      console.log('1. Open Telegram');
      console.log('2. Search for @seitip_bot');
      console.log('3. Send any message (like "hello")');
      console.log('4. Run this script again');
      return;
    }
    
    const uniqueChats = new Map();
    updates.result.forEach(update => {
      const chat = update.message?.chat;
      if (chat && !uniqueChats.has(chat.id)) {
        uniqueChats.set(chat.id, chat);
      }
    });
    
    console.log(`Found ${uniqueChats.size} unique chat(s):\n`);
    
    uniqueChats.forEach((chat, index) => {
      console.log(`Chat ${index + 1}:`);
      console.log(`  💬 Chat ID: ${chat.id}`);
      console.log(`  👤 Type: ${chat.type}`);
      console.log(`  🏷️ Name: ${chat.first_name || chat.title || 'N/A'}`);
      if (chat.username) {
        console.log(`  📝 Username: @${chat.username}`);
      }
      console.log('');
    });
    
    if (uniqueChats.size === 1) {
      const chatId = uniqueChats.keys().next().value;
      console.log(`🎯 Use this as your TELEGRAM_CHAT_ID: ${chatId}`);
      
      // Test sending a message
      console.log('\n🧪 Testing message sending...');
      const testUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const payload = JSON.stringify({
        chat_id: chatId,
        text: '✅ Success! Your Telegram notifications are now configured correctly.',
      });
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
        },
      };
      
      await new Promise((resolve, reject) => {
        const req = https.request(testUrl, options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ Test message sent successfully!');
                resolve(parsed);
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${parsed.description || data}`));
              }
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${data}`));
            }
          });
        });
        
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getChatId();