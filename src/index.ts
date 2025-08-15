import dotenv from 'dotenv';
import { Character, createRuntime } from '@elizaos/core';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import winston from 'winston';
import * as cron from 'node-cron';

// Import plugins and services
import kismetSeiPlugin from './plugins/kismet-sei';
import kismetDiscordPlugin from './plugins/kismet-discord';
import kismetTwitterPlugin from './plugins/kismet-twitter';
import { SentimentAnalysisService } from './services/SentimentAnalysisService';
import { BountyService } from './services/BountyService';
import { SeiBlockchainService } from './services/SeiBlockchainService';
import { DiscordService } from './plugins/kismet-discord';
import { TwitterService } from './plugins/kismet-twitter';
import { KismetConfig } from './types';
import characterConfig from '../character.json';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'kismet.log' })
  ]
});

class KismetAgent {
  private runtime: any;
  private config: KismetConfig;
  private services: {
    sentiment: SentimentAnalysisService;
    bounty: BountyService;
    sei: SeiBlockchainService;
    discord?: DiscordService;
    twitter?: TwitterService;
  };

  constructor() {
    this.config = this.loadConfiguration();
    this.services = {
      sentiment: new SentimentAnalysisService(),
      bounty: new BountyService(),
      sei: new SeiBlockchainService({
        privateKey: this.config.sei.privateKey,
        rpcEndpoint: this.config.sei.rpcEndpoint,
        chainId: this.config.sei.chainId,
        gasPrice: '0.1usei',
        defaultGasLimit: 200000
      })
    };
  }

  private loadConfiguration(): KismetConfig {
    const requiredEnvVars = [
      'DISCORD_API_TOKEN',
      'SEI_PRIVATE_KEY',
      'SEI_RPC_ENDPOINT',
      'SEI_CHAIN_ID',
      'KISMET_WALLET_ADDRESS'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    return {
      discord: {
        applicationId: process.env.DISCORD_APPLICATION_ID!,
        token: process.env.DISCORD_API_TOKEN!
      },
      telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN || ''
      },
      sei: {
        privateKey: process.env.SEI_PRIVATE_KEY!,
        rpcEndpoint: process.env.SEI_RPC_ENDPOINT!,
        chainId: process.env.SEI_CHAIN_ID!,
        walletAddress: process.env.KISMET_WALLET_ADDRESS!
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || ''
      },
      twitter: process.env.TWITTER_API_KEY ? {
        apiKey: process.env.TWITTER_API_KEY!,
        apiSecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN!,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!
      } : undefined,
      agent: {
        budget: parseFloat(process.env.KISMET_BUDGET || '1000'),
        microRewardAmount: parseFloat(process.env.MICRO_REWARD_AMOUNT || '5'),
        sentimentThreshold: parseFloat(process.env.SENTIMENT_THRESHOLD || '0.7'),
        bountyMultiplier: parseFloat(process.env.BOUNTY_MULTIPLIER || '20')
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Initializing Kismet Agent...');

      // Initialize Sei blockchain service
      await this.services.sei.initialize();
      logger.info('✅ Sei blockchain service ready');

      // Initialize Discord service
      if (this.config.discord.token) {
        this.services.discord = new DiscordService({
          token: this.config.discord.token,
          applicationId: this.config.discord.applicationId,
          monitorChannels: process.env.DISCORD_MONITOR_CHANNELS?.split(','),
          adminRoles: process.env.DISCORD_ADMIN_ROLES?.split(',')
        });
        await this.services.discord.connect();
        logger.info('✅ Discord service ready');
      }

      // Initialize Twitter service (optional)
      if (this.config.twitter) {
        this.services.twitter = new TwitterService(this.config.twitter);
        await this.services.twitter.initialize();
        logger.info('✅ Twitter service ready');
      }

      // Create ElizaOS runtime
      const character: Character = characterConfig as Character;
      
      this.runtime = createRuntime({
        character,
        plugins: [
          kismetSeiPlugin,
          kismetDiscordPlugin,
          kismetTwitterPlugin
        ].filter(Boolean),
        services: this.services
      });

      // Set up runtime settings
      this.runtime.setSetting('SEI_CONFIG', {
        privateKey: this.config.sei.privateKey,
        rpcEndpoint: this.config.sei.rpcEndpoint,
        chainId: this.config.sei.chainId,
        gasPrice: '0.1usei',
        defaultGasLimit: 200000
      });

      logger.info('✅ ElizaOS runtime initialized');

      // Set up scheduled tasks
      this.setupScheduledTasks();

      logger.info('🎉 Kismet Agent fully initialized and ready!');
      await this.logStartupStats();
    } catch (error) {
      logger.error('❌ Failed to initialize Kismet Agent:', error);
      throw error;
    }
  }

  private setupScheduledTasks(): void {
    // Check for expired bounties every hour
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('🔍 Checking for expired bounties...');
        await this.services.bounty.cleanupExpiredBounties();
      } catch (error) {
        logger.error('Error during bounty cleanup:', error);
      }
    });

    // Log daily community metrics
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('📊 Generating daily community metrics...');
        await this.logDailyMetrics();
      } catch (error) {
        logger.error('Error generating daily metrics:', error);
      }
    });

    // Check wallet balance every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      try {
        const balance = await this.services.sei.getWalletBalance();
        logger.info(`💰 Current wallet balance: ${balance} SEI`);
        
        if (balance < 50) {
          logger.warn('⚠️  Low wallet balance! Consider refunding.');
        }
      } catch (error) {
        logger.error('Error checking wallet balance:', error);
      }
    });

    logger.info('⏰ Scheduled tasks configured');
  }

  private async logStartupStats(): Promise<void> {
    try {
      const balance = await this.services.sei.getWalletBalance();
      const walletAddress = await this.services.sei.getWalletAddress();
      
      logger.info('📊 KISMET STARTUP STATS 📊');
      logger.info(`💰 Wallet Balance: ${balance} SEI`);
      logger.info(`🔗 Wallet Address: ${walletAddress}`);
      logger.info(`🎯 Sentiment Threshold: ${this.config.agent.sentimentThreshold}`);
      logger.info(`💎 Micro Reward Amount: ${this.config.agent.microRewardAmount} SEI`);
      logger.info(`🏆 Budget: ${this.config.agent.budget} SEI`);
      
      if (this.services.discord) {
        logger.info('🤖 Discord: Connected');
      }
      if (this.services.twitter) {
        logger.info('🐦 Twitter: Connected');
      }
    } catch (error) {
      logger.error('Error logging startup stats:', error);
    }
  }

  private async logDailyMetrics(): Promise<void> {
    try {
      const trends = await this.services.bounty.analyzeThemeTrends('day');
      const activeBounties = await this.services.bounty.getActiveBounties();
      
      logger.info('📈 DAILY COMMUNITY METRICS 📈');
      logger.info(`🎨 Active Bounties: ${activeBounties.length}`);
      logger.info(`🔥 Top Trending Themes: ${trends.slice(0, 3).map(t => t.theme).join(', ')}`);
      
      // Post milestone achievements to Twitter
      if (this.services.twitter) {
        const milestone = this.checkMilestones();
        if (milestone) {
          await this.services.twitter.postMilestoneAchievement(milestone, {
            activeBounties: activeBounties.length,
            topThemes: trends.slice(0, 3).map(t => t.theme)
          });
        }
      }
    } catch (error) {
      logger.error('Error logging daily metrics:', error);
    }
  }

  private checkMilestones(): string | null {
    // Check for various milestone achievements
    // This would be more sophisticated in production
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayOfYear % 30 === 0) {
      return 'Monthly Milestone: 30 days of autonomous community curation!';
    }
    
    return null;
  }

  async start(): Promise<void> {
    await this.initialize();
    
    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('🛑 Gracefully shutting down Kismet Agent...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Gracefully shutting down Kismet Agent...');
      await this.shutdown();
      process.exit(0);
    });

    logger.info('🌟 Kismet Agent is now running! Press Ctrl+C to stop.');
  }

  async shutdown(): Promise<void> {
    try {
      if (this.services.discord) {
        await this.services.discord.disconnect();
        logger.info('✅ Discord service disconnected');
      }
      
      logger.info('👋 Kismet Agent shutdown complete');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

// Start the Kismet Agent
async function main() {
  try {
    const kismet = new KismetAgent();
    await kismet.start();
  } catch (error) {
    console.error('Fatal error starting Kismet Agent:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { KismetAgent };
export default KismetAgent;