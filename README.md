# Kismet - The Proactive Community Curation Agent

![Kismet Banner](https://img.shields.io/badge/Kismet-Community%20Curation%20Agent-blue?style=for-the-badge&logo=blockchain&logoColor=white)
![ElizaOS](https://img.shields.io/badge/Built%20with-ElizaOS-green?style=flat-square)
![Sei Blockchain](https://img.shields.io/badge/Powered%20by-Sei%20Blockchain-red?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=flat-square)

## 🌟 Overview

Kismet is an AI agent that lives in Discord and Telegram communities, acting as an autonomous, on-chain curator and treasurer. Instead of waiting for commands, it **proactively identifies** high-quality contributions (art, memes, insightful comments), **instantly rewards** creators with micro-payments on the Sei blockchain, and **dynamically creates** on-chain bounties to steer the community towards collective goals.

**Think of it as the ultimate community manager that's fair, transparent, and works 24/7.**

## 🚀 Key Features

### 🎯 Proactive Micro-Rewards
- **Real-time sentiment analysis** of community content
- **Instant on-chain rewards** for high-quality contributions
- **Sub-second transactions** using Sei's high-performance blockchain
- **Transparent reward announcements** with transaction links

### 🏆 Emergent Bounty Creation
- **Trend detection** algorithm identifies emerging themes
- **Autonomous bounty deployment** with locked on-chain funds
- **Dynamic reward distribution** based on community engagement
- **24-48 hour time-limited competitions**

### 🌐 Cross-Platform Amplification
- **Discord integration** with proactive monitoring
- **Twitter automation** for major announcements
- **Telegram support** (coming soon)
- **Web2 to Web3 bridging** for maximum reach

### 🔧 Advanced Features
- **Multi-platform sentiment analysis**
- **Content type classification** (art, memes, discussions)
- **User wallet management**
- **Comprehensive logging and metrics**
- **Automated milestone celebrations**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Discord Bot   │◄──►│  Kismet Agent   │◄──►│  Sei Blockchain │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                       ┌───────▼───────┐
                       │  ElizaOS Core │
                       └───────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼───────┐    ┌─────────▼─────────┐    ┌───────▼───────┐
│ Sentiment      │    │ Bounty System    │    │ Twitter       │
│ Analysis       │    │ Management       │    │ Integration   │
└───────────────┘    └─────────────────┘    └───────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Discord Application with Bot Token
- Sei wallet with test funds
- (Optional) Twitter Developer Account

### 1. Clone and Install
```bash
git clone <repository-url>
cd kismet-agent
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:

```bash
# Discord Configuration
DISCORD_APPLICATION_ID=your_discord_application_id
DISCORD_API_TOKEN=your_discord_bot_token
DISCORD_MONITOR_CHANNELS=channel_id_1,channel_id_2

# Sei Blockchain Configuration
SEI_PRIVATE_KEY=your_sei_wallet_private_key
SEI_RPC_ENDPOINT=https://rpc.sei-apis.com
SEI_CHAIN_ID=pacific-1
KISMET_WALLET_ADDRESS=your_kismet_wallet_address

# Agent Configuration
KISMET_BUDGET=1000
MICRO_REWARD_AMOUNT=5
SENTIMENT_THRESHOLD=0.7
BOUNTY_MULTIPLIER=20

# Optional: Twitter Integration
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
```

### 3. Build and Run
```bash
npm run build
npm start

# Development mode
npm run dev
```

## 🎮 How It Works

### Step 1: Community Setup
1. Invite Kismet to your Discord server
2. Set monitoring channels in environment variables
3. Fund Kismet's Sei wallet with your budget
4. Community members register their Sei wallet addresses

### Step 2: Proactive Monitoring
```typescript
// Kismet continuously monitors for:
- High sentiment messages (>0.7 threshold)
- Positive community reactions (🔥, 💯, ✨, etc.)
- Content with significant engagement
- Art, memes, and valuable discussions
```

### Step 3: Instant Rewards
When quality content is detected:
```
User posts art → Community reacts positively → Kismet analyzes sentiment → 
Automatic SEI reward → Public announcement with transaction hash
```

### Step 4: Emergent Bounties
When trends emerge:
```
Multiple users post similar themes → Trend detection algorithm triggers → 
Bounty created automatically → Funds locked on-chain → Community notified
```

## 📊 Example Workflows

### Micro-Reward Flow
```
👤 @artist: "Here's my Sei-Chan artwork! 🎨"
💖 Community: 15 reactions (🔥🎨💯✨)
🤖 Kismet: Sentiment = 0.85, Engagement = 0.92
💰 Result: 8.5 SEI sent instantly
📢 Announcement: "Amazing work @artist! 8.5 $SEI sent to sei1abc..."
```

### Bounty Creation Flow
```
📈 Trend Detection: "futuristic helmet" theme appearing 5+ times
🎯 Confidence Score: 0.78
🏆 Auto-Bounty: "Futuristic Helmet Design Challenge"
💰 Prize Pool: 78 SEI (confidence-based)
⏰ Duration: 24 hours
🔗 On-chain: Funds locked in smart contract
```

## 🔧 Configuration Options

### Sentiment Thresholds
```typescript
SENTIMENT_THRESHOLD=0.7  // Minimum sentiment for rewards
ENGAGEMENT_THRESHOLD=0.6 // Minimum engagement score
TREND_THRESHOLD=3        // Minimum mentions for trend detection
```

### Reward Calculation
```typescript
baseReward = 5 SEI
finalReward = baseReward × sentiment × engagement
// Example: 5 × 0.8 × 1.2 = 4.8 SEI
```

### Bounty Parameters
```typescript
baseBountyAmount = 100 SEI
bountyAmount = baseBountyAmount × confidence
winnerCount = Math.floor(confidence × 3)
deadline = confidence > 0.8 ? 24h : 48h
```

## 🎨 Supported Content Types

- **🎨 Art**: Digital art, sketches, illustrations, designs
- **😂 Memes**: Funny images, jokes, humorous content  
- **💬 Discussions**: Insightful comments, analysis, ideas
- **🔗 Links**: Valuable resources, tools, references
- **🎥 Media**: Videos, GIFs, animations

## 📱 Discord Commands

```
!wallet register <sei-address>     # Register wallet for rewards
!wallet balance                    # Check your reward balance
!bounty list                       # View active bounties  
!bounty submit <bounty-id>         # Submit to a bounty
!stats                            # View community metrics
!kismet status                     # Check agent health
```

## 🌐 API Integration

### Sei Blockchain
```typescript
// Micro-payment transaction
const reward = await seiService.sendMicroReward({
  recipientAddress: 'sei1...',
  amount: 5.0,
  memo: 'Community reward for amazing art!'
});
```

### Twitter Amplification
```typescript
// Auto-tweet for major bounties
if (bounty.totalAmount > 50) {
  await twitterService.postBountyAnnouncement(bounty);
}
```

## 📈 Analytics & Metrics

Kismet tracks comprehensive metrics:
- Total rewards distributed
- Unique contributors rewarded
- Average sentiment scores
- Popular content themes
- Engagement rates
- Transaction volumes

## 🔒 Security Features

- **Private key encryption** for blockchain transactions
- **Rate limiting** to prevent spam exploitation
- **Sentiment verification** with multiple algorithms
- **On-chain transparency** for all transactions
- **Wallet validation** for registered addresses

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["npm", "start"]
```

### Production Considerations
- Use environment-specific configurations
- Implement proper logging and monitoring
- Set up database persistence for user data
- Configure backup wallet management
- Enable health checks and auto-restart

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ElizaOS** - Framework for autonomous AI agents
- **Sei Network** - High-performance blockchain infrastructure
- **Discord.js** - Discord API integration
- **Sentiment.js** - Natural language sentiment analysis

## 📞 Support

- 💬 Discord: [Join our community](https://discord.gg/kismet)
- 🐦 Twitter: [@KismetAgent](https://twitter.com/KismetAgent)
- 📧 Email: support@kismet.community
- 📖 Docs: [Full Documentation](https://docs.kismet.community)

---

**Built with ❤️ for the community, by the community.**

*Kismet - Where fair curation meets instant rewards on the blockchain.*
