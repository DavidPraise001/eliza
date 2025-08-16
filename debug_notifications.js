const https = require('https');
const http = require('http');

// Debugging script to identify notification issues
async function debugNotificationSystem() {
  console.log('🔍 Starting comprehensive notification system debugging...\n');

  // Step 1: Check environment variables
  console.log('📋 Step 1: Environment Variables Check');
  console.log('=====================================');
  
  const requiredEnvVars = [
    'COINMARKETCAP_API_KEY',
    'TELEGRAM_BOT_TOKEN', 
    'TELEGRAM_CHAT_ID',
    'SEI_REST_URL'
  ];

  const envStatus = {};
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    envStatus[varName] = {
      exists: !!value,
      value: value ? (varName.includes('TOKEN') || varName.includes('KEY') ? 
        `${value.substring(0, 10)}...` : value) : 'NOT_SET'
    };
    console.log(`${envStatus[varName].exists ? '✅' : '❌'} ${varName}: ${envStatus[varName].value}`);
  });

  // Step 2: Test Telegram Bot Token validity
  console.log('\n🤖 Step 2: Telegram Bot Token Validation');
  console.log('==========================================');
  
  if (process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const botInfo = await testTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
      console.log('✅ Bot token is valid');
      console.log(`📝 Bot username: @${botInfo.username}`);
      console.log(`🏷️ Bot name: ${botInfo.first_name}`);
    } catch (error) {
      console.log('❌ Bot token validation failed:', error.message);
    }
  } else {
    console.log('❌ TELEGRAM_BOT_TOKEN not set');
  }

  // Step 3: Test Chat ID validity
  console.log('\n💬 Step 3: Chat ID Validation');
  console.log('==============================');
  
  if (process.env.TELEGRAM_CHAT_ID) {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    console.log(`📍 Chat ID: ${chatId}`);
    
    // Validate format
    if (/^-?\d+$/.test(chatId)) {
      console.log('✅ Chat ID format is valid (numeric)');
    } else if (chatId.startsWith('@')) {
      console.log('✅ Chat ID format is valid (username)');
    } else {
      console.log('❌ Chat ID format is invalid - must be numeric or start with @');
    }

    // Test sending a message
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        await testTelegramMessage(process.env.TELEGRAM_BOT_TOKEN, chatId);
        console.log('✅ Test message sent successfully');
      } catch (error) {
        console.log('❌ Failed to send test message:', error.message);
        
        // Try to get chat info
        try {
          const updates = await getTelegramUpdates(process.env.TELEGRAM_BOT_TOKEN);
          console.log('\n💡 Recent bot updates (to find correct chat_id):');
          if (updates.length > 0) {
            updates.slice(0, 3).forEach((update, i) => {
              const chat = update.message?.chat;
              if (chat) {
                console.log(`${i + 1}. Chat ID: ${chat.id}, Type: ${chat.type}, Title: ${chat.title || chat.first_name || 'N/A'}`);
              }
            });
          } else {
            console.log('No recent messages found. Send a message to your bot first.');
          }
        } catch (updateError) {
          console.log('Could not retrieve updates:', updateError.message);
        }
      }
    }
  } else {
    console.log('❌ TELEGRAM_CHAT_ID not set');
  }

  // Step 4: Test CoinMarketCap API
  console.log('\n💰 Step 4: CoinMarketCap API Test');
  console.log('==================================');
  
  if (process.env.COINMARKETCAP_API_KEY) {
    try {
      const priceData = await testCoinMarketCapAPI(process.env.COINMARKETCAP_API_KEY);
      console.log('✅ CoinMarketCap API is working');
      console.log(`📈 SEI Price: $${priceData.price.toFixed(6)}`);
      console.log(`📊 24h Change: ${priceData.percentChange24h.toFixed(2)}%`);
    } catch (error) {
      console.log('❌ CoinMarketCap API failed:', error.message);
    }
  } else {
    console.log('❌ COINMARKETCAP_API_KEY not set');
  }

  // Step 5: Test SEI REST API
  console.log('\n🌐 Step 5: SEI REST API Test');
  console.log('=============================');
  
  const seiUrl = process.env.SEI_REST_URL || 'https://sei-api.polkachu.com';
  try {
    const proposals = await testSeiAPI(seiUrl);
    console.log('✅ SEI REST API is working');
    console.log(`📋 Found ${proposals.length} proposals`);
  } catch (error) {
    console.log('❌ SEI REST API failed:', error.message);
  }

  // Step 6: Service configuration check
  console.log('\n⚙️ Step 6: Service Configuration');
  console.log('=================================');
  
  const priceInterval = Number(process.env.PRICE_CHECK_INTERVAL) || 60000;
  const proposalInterval = Number(process.env.PROPOSAL_CHECK_INTERVAL) || 300000;
  
  console.log(`⏱️ Price check interval: ${priceInterval / 1000} seconds`);
  console.log(`⏱️ Proposal check interval: ${proposalInterval / 1000} seconds`);
  
  if (priceInterval < 30000) {
    console.log('⚠️ Warning: Price check interval is very short, may hit rate limits');
  }

  console.log('\n🎯 Debugging Summary');
  console.log('====================');
  
  const issues = [];
  if (!process.env.TELEGRAM_BOT_TOKEN) issues.push('TELEGRAM_BOT_TOKEN not set');
  if (!process.env.TELEGRAM_CHAT_ID) issues.push('TELEGRAM_CHAT_ID not set');
  if (!process.env.COINMARKETCAP_API_KEY) issues.push('COINMARKETCAP_API_KEY not set');
  
  if (issues.length === 0) {
    console.log('✅ All basic configuration appears correct');
    console.log('\n💡 Next steps to debug alerts:');
    console.log('1. Check if the notification service is properly started');
    console.log('2. Verify price alerts are actually created');
    console.log('3. Check application logs for any errors');
    console.log('4. Ensure price conditions are realistic (current price vs target)');
  } else {
    console.log('❌ Configuration issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
}

// Helper functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.description || parsed.error || data}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testTelegramBot(token) {
  const url = `https://api.telegram.org/bot${token}/getMe`;
  const response = await makeRequest(url);
  return response.result;
}

async function testTelegramMessage(token, chatId) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = JSON.stringify({
    chat_id: chatId,
    text: '🧪 Debug test message from notification system',
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
    },
    body: payload,
  };
  
  const response = await makeRequest(url, options);
  return response.result;
}

async function getTelegramUpdates(token) {
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=10`;
  const response = await makeRequest(url);
  return response.result;
}

async function testCoinMarketCapAPI(apiKey) {
  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SEI&convert=USD`;
  const options = {
    headers: {
      'X-CMC_PRO_API_KEY': apiKey,
    },
  };
  
  const response = await makeRequest(url, options);
  const seiData = response.data.SEI;
  const quote = seiData.quote.USD;
  
  return {
    price: quote.price,
    marketCap: quote.market_cap,
    volume24h: quote.volume_24h,
    percentChange24h: quote.percent_change_24h,
  };
}

async function testSeiAPI(baseUrl) {
  const url = `${baseUrl}/cosmos/gov/v1beta1/proposals?limit=5`;
  const response = await makeRequest(url);
  return response.proposals || [];
}

// Run the debugging
debugNotificationSystem().catch(console.error);