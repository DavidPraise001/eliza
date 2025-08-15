# Kismet Setup Guide

This guide will walk you through setting up Kismet, the Proactive Community Curation Agent, from scratch.

## 📋 Prerequisites

### Required
- **Node.js 18+** and npm
- **Discord Application** with Bot Token
- **Sei Wallet** with test funds
- **Git** for cloning the repository

### Optional
- **Twitter Developer Account** for social media amplification
- **Docker** for containerized deployment
- **PostgreSQL** for persistent data storage

## 🎯 Step 1: Discord Bot Setup

### 1.1 Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "Kismet"
3. Navigate to "Bot" section
4. Click "Add Bot"
5. Copy the **Bot Token** (you'll need this later)

### 1.2 Configure Bot Permissions
Required permissions:
- ✅ Read Messages
- ✅ Send Messages
- ✅ Use Slash Commands
- ✅ Read Message History
- ✅ Add Reactions
- ✅ Embed Links
- ✅ Attach Files

### 1.3 Invite Bot to Server
1. Go to "OAuth2" → "URL Generator"
2. Select "bot" scope
3. Select the permissions listed above
4. Copy the generated URL and invite bot to your server

## ⛓️ Step 2: Sei Blockchain Setup

### 2.1 Create Sei Wallet
```bash
# Using Sei CLI (recommended)
seid keys add kismet-wallet

# Or use a wallet interface like Keplr, Fin, or Compass
```

### 2.2 Fund Wallet
1. Get your wallet address: `seid keys show kismet-wallet -a`
2. Fund with testnet SEI from [Sei Faucet](https://faucet.sei-apis.com/)
3. For mainnet, transfer SEI from your personal wallet

### 2.3 Export Private Key
```bash
# Export private key (keep this secure!)
seid keys export kismet-wallet --unarmored-hex --unsafe
```

## 🚀 Step 3: Application Setup

### 3.1 Clone Repository
```bash
git clone <repository-url>
cd kismet-agent
npm install
```

### 3.2 Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
# Discord Configuration
DISCORD_APPLICATION_ID=1234567890123456789
DISCORD_API_TOKEN=YOUR_BOT_TOKEN_HERE
DISCORD_MONITOR_CHANNELS=123456789,987654321

# Sei Blockchain Configuration
SEI_PRIVATE_KEY=your_exported_private_key_hex
SEI_RPC_ENDPOINT=https://rpc.sei-apis.com
SEI_CHAIN_ID=pacific-1
KISMET_WALLET_ADDRESS=sei1abcdef...

# Agent Configuration
KISMET_BUDGET=1000
MICRO_REWARD_AMOUNT=5
SENTIMENT_THRESHOLD=0.7
BOUNTY_MULTIPLIER=20

# Logging
LOG_LEVEL=info
```

### 3.3 Channel Configuration
Get Discord channel IDs for monitoring:
1. Enable Developer Mode in Discord
2. Right-click on channels you want to monitor
3. Select "Copy ID"
4. Add to `DISCORD_MONITOR_CHANNELS` (comma-separated)

## 🐦 Step 4: Twitter Integration (Optional)

### 4.1 Twitter Developer Account
1. Apply for [Twitter Developer Account](https://developer.twitter.com/)
2. Create a new app in Twitter Developer Portal
3. Generate API keys and access tokens

### 4.2 Configure Twitter
Add to your `.env`:
```bash
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

## 🏃‍♂️ Step 5: Running Kismet

### 5.1 Development Mode
```bash
npm run dev
```

### 5.2 Production Mode
```bash
npm run build
npm start
```

### 5.3 Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f kismet
```

## 👥 Step 6: Community Onboarding

### 6.1 User Wallet Registration
Community members need to register their Sei wallets:
```
!wallet register sei1abcdef1234567890...
```

### 6.2 Test the System
1. Post some art or memes in monitored channels
2. Add positive reactions (🔥, 💯, ✨)
3. Watch Kismet analyze and potentially reward
4. Check if trends emerge and bounties are created

## 📊 Step 7: Monitoring & Maintenance

### 7.1 Check Agent Status
```bash
# View logs
tail -f kismet.log

# Check wallet balance
# (Kismet will log balance every 6 hours)

# View active bounties
# Use Discord commands: !bounty list
```

### 7.2 Refund Wallet
When balance gets low:
```bash
# Send more SEI to Kismet's wallet address
seid tx bank send your-wallet kismet-wallet-address 500usei
```

## 🔧 Troubleshooting

### Common Issues

#### Bot Not Responding
- ✅ Check bot token is correct
- ✅ Verify bot has required permissions
- ✅ Ensure bot is online in Discord
- ✅ Check `DISCORD_MONITOR_CHANNELS` configuration

#### Blockchain Connection Issues
- ✅ Verify RPC endpoint is accessible
- ✅ Check private key format (hex without 0x prefix)
- ✅ Ensure wallet has sufficient balance
- ✅ Confirm chain ID matches network

#### Sentiment Analysis Not Working
- ✅ Check message content has enough text
- ✅ Verify sentiment threshold settings
- ✅ Ensure users have registered wallets
- ✅ Check rate limiting isn't blocking requests

### Debug Mode
Enable verbose logging:
```bash
LOG_LEVEL=debug npm start
```

### Health Checks
```bash
# Check if services are running
curl http://localhost:3000/health

# View real-time metrics
npm run metrics
```

## 🛡️ Security Best Practices

### Private Key Security
- ❌ Never commit private keys to git
- ✅ Use environment variables
- ✅ Restrict file permissions (600)
- ✅ Consider hardware security modules for production

### Access Control
- ✅ Limit Discord bot permissions to minimum required
- ✅ Use separate wallets for different environments
- ✅ Implement rate limiting for user interactions
- ✅ Monitor for unusual activity patterns

### Backup Strategy
- ✅ Backup wallet private keys securely
- ✅ Export user registration data regularly
- ✅ Monitor transaction history on-chain
- ✅ Set up alerts for low balances

## 📈 Performance Tuning

### Scaling Considerations
- **High Activity Servers**: Increase sentiment analysis cache
- **Multiple Communities**: Use separate Kismet instances
- **Large Bounties**: Implement multi-signature wallets
- **Global Communities**: Consider CDN for media assets

### Optimization Tips
```bash
# Increase memory for large communities
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Enable clustering for high throughput
npm run start:cluster

# Use Redis for distributed caching
REDIS_URL=redis://localhost:6379 npm start
```

## 🆘 Support

### Getting Help
- 📚 Read the full [README.md](README.md)
- 💬 Join our [Discord Community](https://discord.gg/kismet)
- 🐛 Report issues on [GitHub](https://github.com/kismet/issues)
- 📧 Email support: support@kismet.community

### Contributing
- 🔧 Check [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
- 🎯 Pick up issues labeled "good first issue"
- 📝 Improve documentation
- 🧪 Add tests for new features

---

**Congratulations! 🎉 Kismet is now ready to curate your community.**

Your agent will work 24/7 to identify amazing content, reward creators instantly, and foster positive community engagement through fair, transparent, on-chain curation.