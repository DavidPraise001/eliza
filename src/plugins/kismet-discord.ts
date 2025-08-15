import { Plugin } from '@elizaos/core';
import { Client, GatewayIntentBits, Message, TextChannel, EmbedBuilder } from 'discord.js';
import { SentimentAnalysisService } from '../services/SentimentAnalysisService';
import { BountyService } from '../services/BountyService';
import { MessageContext, Platform, ContentAnalysis } from '../types';

export interface DiscordPluginConfig {
  token: string;
  applicationId: string;
  guildIds?: string[];
  monitorChannels?: string[];
  adminRoles?: string[];
}

export class DiscordService {
  private client: Client;
  private config: DiscordPluginConfig;
  private sentimentService: SentimentAnalysisService;
  private bountyService: BountyService;
  private isConnected: boolean = false;

  constructor(config: DiscordPluginConfig) {
    this.config = config;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
      ]
    });
    
    this.sentimentService = new SentimentAnalysisService();
    this.bountyService = new BountyService();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      console.log(`✅ Kismet Discord bot connected as ${this.client.user?.tag}`);
      this.isConnected = true;
    });

    this.client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;
      
      try {
        await this.processMessage(message);
      } catch (error) {
        console.error('Error processing Discord message:', error);
      }
    });

    this.client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      
      try {
        await this.processReaction(reaction, user, 'add');
      } catch (error) {
        console.error('Error processing Discord reaction:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      await this.client.login(this.config.token);
    } catch (error) {
      console.error('Failed to connect to Discord:', error);
      throw error;
    }
  }

  private async processMessage(message: Message): Promise<void> {
    // Skip if not in monitored channels
    if (this.config.monitorChannels && 
        !this.config.monitorChannels.includes(message.channel.id)) {
      return;
    }

    const messageContext = await this.convertToMessageContext(message);
    const analysis = await this.sentimentService.analyzeContent(messageContext);

    // Check if content deserves a micro-reward
    if (this.sentimentService.isRewardWorthy(analysis)) {
      await this.handleRewardEligibleContent(message, analysis);
    }

    // Store analysis for trend detection
    await this.bountyService.addContentAnalysis(analysis, messageContext);

    // Check if we should create a bounty based on recent trends
    await this.checkAndCreateBounties();
  }

  private async processReaction(reaction: any, user: any, action: 'add' | 'remove'): Promise<void> {
    // Re-analyze the message with updated reactions
    const message = reaction.message;
    if (message.author.bot) return;

    // Wait a bit for other reactions to potentially come in
    setTimeout(async () => {
      const messageContext = await this.convertToMessageContext(message);
      const analysis = await this.sentimentService.analyzeContent(messageContext);

      if (this.sentimentService.isRewardWorthy(analysis)) {
        await this.handleRewardEligibleContent(message, analysis);
      }
    }, 2000); // 2 second delay to batch reactions
  }

  private async handleRewardEligibleContent(message: Message, analysis: ContentAnalysis): Promise<void> {
    try {
      // Check if user has a registered wallet
      const userWallet = await this.getUserWallet(message.author.id);
      if (!userWallet) {
        await this.promptWalletRegistration(message);
        return;
      }

      // Send micro-reward
      const rewardAmount = this.calculateRewardAmount(analysis);
      
      // This would trigger the Sei plugin action
      const rewardResult = await this.sendMicroReward({
        userId: message.author.id,
        walletAddress: userWallet,
        amount: rewardAmount,
        messageId: message.id,
        reason: this.generateRewardReason(analysis)
      });

      if (rewardResult.success) {
        await this.announceReward(message, rewardAmount, rewardResult.transactionHash);
      }
    } catch (error) {
      console.error('Error handling reward-eligible content:', error);
    }
  }

  private async checkAndCreateBounties(): Promise<void> {
    const recentAnalyses = await this.bountyService.getRecentAnalyses(50); // Last 50 messages
    const bountyDecision = this.sentimentService.shouldCreateBounty(recentAnalyses);

    if (bountyDecision.shouldCreate && bountyDecision.theme) {
      const bounty = await this.bountyService.createEmergentBounty(
        bountyDecision.theme,
        bountyDecision.confidence
      );

      if (bounty) {
        await this.announceBounty(bounty);
      }
    }
  }

  private async announceReward(message: Message, amount: number, txHash: string): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🎉 Community Reward!')
      .setDescription(`<@${message.author.id}>, the community loves your contribution!`)
      .addFields(
        { name: '💰 Reward', value: `${amount} $SEI`, inline: true },
        { name: '⚡ Transaction', value: `[View on Explorer](https://seitrace.com/tx/${txHash})`, inline: true },
        { name: '🎯 Reason', value: 'High community engagement detected!', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Kismet - Fair & Transparent Curation' });

    await message.reply({ embeds: [embed] });
  }

  private async announceBounty(bounty: any): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('🚨 NEW BOUNTY ALERT! 🚨')
      .setDescription(`A **${bounty.theme}** trend has emerged! Time to create!`)
      .addFields(
        { name: '💰 Total Reward', value: `${bounty.totalAmount} $SEI`, inline: true },
        { name: '🏆 Winners', value: `Top ${bounty.winnerCount}`, inline: true },
        { name: '⏰ Deadline', value: bounty.deadline.toLocaleDateString(), inline: true },
        { name: '📝 How to Participate', value: 'Post your content with the trending theme and let the community react!', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Funds locked on-chain for transparency' });

    // Send to all monitored channels
    for (const channelId of this.config.monitorChannels || []) {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (channel) {
        await channel.send({ embeds: [embed] });
      }
    }
  }

  private async promptWalletRegistration(message: Message): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🔗 Wallet Registration Required')
      .setDescription('To receive rewards, please register your Sei wallet address!')
      .addFields(
        { name: '📝 How to Register', value: 'Use the command: `!wallet register <your-sei-address>`', inline: false },
        { name: '💡 Pro Tip', value: 'Make sure your address starts with `sei1`', inline: false }
      )
      .setFooter({ text: 'Your wallet address is kept secure and only used for rewards' });

    await message.reply({ embeds: [embed] });
  }

  private async convertToMessageContext(message: Message): Promise<MessageContext> {
    const reactions = message.reactions.cache.map(reaction => ({
      emoji: reaction.emoji.name || reaction.emoji.toString(),
      count: reaction.count,
      users: reaction.users.cache.map(user => user.id)
    }));

    const attachments = message.attachments.map(attachment => ({
      type: attachment.contentType || 'unknown',
      url: attachment.url,
      filename: attachment.name
    }));

    return {
      id: message.id,
      userId: message.author.id,
      username: message.author.username,
      content: message.content,
      timestamp: message.createdAt,
      platform: Platform.DISCORD,
      channelId: message.channel.id,
      reactions,
      attachments
    };
  }

  private calculateRewardAmount(analysis: ContentAnalysis): number {
    const baseReward = 5; // Base 5 SEI
    const sentimentMultiplier = analysis.sentiment;
    const engagementMultiplier = Math.min(2, analysis.engagementScore * 2);
    
    return Math.round(baseReward * sentimentMultiplier * engagementMultiplier * 100) / 100;
  }

  private generateRewardReason(analysis: ContentAnalysis): string {
    if (analysis.contentType === 'art') return 'Amazing artwork!';
    if (analysis.contentType === 'meme') return 'Hilarious content!';
    if (analysis.reactionCount > 10) return 'Viral community favorite!';
    return 'High-quality contribution!';
  }

  private async getUserWallet(userId: string): Promise<string | null> {
    // This would query the database for user's registered wallet
    // For now, return null to prompt registration
    return null;
  }

  private async sendMicroReward(params: any): Promise<any> {
    // This would trigger the Sei plugin action
    // For now, return a mock success
    return {
      success: true,
      transactionHash: 'mock_tx_hash_' + Date.now()
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.isConnected = false;
    }
  }
}

export const kismetDiscordPlugin: Plugin = {
  name: 'kismet-discord',
  description: 'Discord integration for proactive community monitoring',
  
  actions: [
    {
      name: 'SEND_DISCORD_MESSAGE',
      description: 'Send a message to a Discord channel',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.channelId && content.message);
      },
      handler: async (runtime, message, state, options, callback) => {
        try {
          const discordService = runtime.getService('discord') as DiscordService;
          const content = message.content as any;
          
          const channel = discordService.client.channels.cache.get(content.channelId) as TextChannel;
          if (channel) {
            await channel.send(content.message);
            
            if (callback) {
              callback({
                text: `✅ Message sent to Discord channel`,
                data: { success: true }
              });
            }
          }
        } catch (error) {
          console.error('Error sending Discord message:', error);
          if (callback) {
            callback({
              text: `❌ Failed to send Discord message: ${error.message}`,
              data: { success: false, error: error.message }
            });
          }
        }
      }
    }
  ],
  
  evaluators: [],
  providers: []
};

export default kismetDiscordPlugin;