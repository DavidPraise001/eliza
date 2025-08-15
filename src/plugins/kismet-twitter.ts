import { Plugin } from '@elizaos/core';
import { SocialMediaPost, Platform, Bounty, Reward } from '../types';

export interface TwitterPluginConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken?: string;
}

export interface TweetParams {
  content: string;
  mediaUrls?: string[];
  replyToId?: string;
  quote?: string;
}

export class TwitterService {
  private config: TwitterPluginConfig;
  private isConnected: boolean = false;

  constructor(config: TwitterPluginConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // In production, this would initialize the Twitter API client
      console.log('✅ Twitter service initialized');
      this.isConnected = true;
    } catch (error) {
      console.error('❌ Failed to initialize Twitter service:', error);
      throw error;
    }
  }

  async postTweet(params: TweetParams): Promise<{ success: boolean; tweetId?: string; error?: string }> {
    try {
      // Simulate tweet posting
      const tweetId = 'mock_tweet_' + Date.now();
      
      console.log(`📱 Tweet posted: "${params.content}"`);
      if (params.mediaUrls?.length) {
        console.log(`📷 With media: ${params.mediaUrls.join(', ')}`);
      }

      return {
        success: true,
        tweetId
      };
    } catch (error) {
      console.error('Error posting tweet:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async postBountyAnnouncement(bounty: Bounty): Promise<{ success: boolean; tweetId?: string }> {
    const content = this.generateBountyTweet(bounty);
    
    const result = await this.postTweet({
      content,
      mediaUrls: [] // Could include bounty promotional image
    });

    return result;
  }

  async postBountyCompletion(bounty: Bounty, winners: any[]): Promise<{ success: boolean; tweetId?: string }> {
    const content = this.generateBountyCompletionTweet(bounty, winners);
    
    const result = await this.postTweet({
      content,
      mediaUrls: [] // Could include winner's content
    });

    return result;
  }

  async postMilestoneAchievement(milestone: string, stats: any): Promise<{ success: boolean; tweetId?: string }> {
    const content = this.generateMilestoneTweet(milestone, stats);
    
    const result = await this.postTweet({
      content
    });

    return result;
  }

  private generateBountyTweet(bounty: Bounty): string {
    const emojis = this.getThemeEmojis(bounty.theme);
    const hashtags = this.getThemeHashtags(bounty.theme);
    
    return `${emojis} NEW BOUNTY ALERT! ${emojis}

"${bounty.title}"

💰 ${bounty.totalAmount} $SEI up for grabs
🏆 Top ${bounty.winnerCount} winners
⏰ ${this.formatDeadline(bounty.deadline)}

The community has spoken - ${bounty.theme} is trending! 🔥

Join our Discord to participate! 

${hashtags} #Kismet #SeiBlockchain #CommunityRewards`;
  }

  private generateBountyCompletionTweet(bounty: Bounty, winners: any[]): string {
    const emojis = this.getThemeEmojis(bounty.theme);
    const winnerMentions = winners.map((w, i) => `${i + 1}. @${w.username}`).join('\n');
    
    return `🏆 BOUNTY COMPLETED! 🏆

"${bounty.title}" has concluded!

Winners:
${winnerMentions}

Amazing work from our community! The creativity continues to blow us away ${emojis}

#Kismet #SeiBlockchain #CommunityRewards #Web3Art`;
  }

  private generateMilestoneTweet(milestone: string, stats: any): string {
    return `🎉 MILESTONE ACHIEVED! 🎉

${milestone}

Community Stats:
💰 ${stats.totalRewards || 0} $SEI distributed
👥 ${stats.uniqueContributors || 0} contributors rewarded
🎨 ${stats.totalSubmissions || 0} amazing creations
⚡ ${stats.averageResponse || '< 1min'} average reward time

This is what fair, autonomous curation looks like! 

#Kismet #SeiBlockchain #Web3Community #FairRewards`;
  }

  private getThemeEmojis(theme: string): string {
    const themeEmojis = {
      'sei-chan': '🤖✨',
      'futuristic': '🚀🔮',
      'helmet': '⚔️🛡️',
      'anime': '🎌💫',
      'gaming': '🎮🏆',
      'blockchain': '⛓️💎',
      'art': '🎨🖼️'
    };
    
    return themeEmojis[theme] || '🎯✨';
  }

  private getThemeHashtags(theme: string): string {
    const themeHashtags = {
      'sei-chan': '#SeiChan #Mascot',
      'futuristic': '#Futuristic #SciFi #Cyberpunk',
      'helmet': '#Helmet #Armor #Design',
      'anime': '#Anime #Manga #Japanese',
      'gaming': '#Gaming #GameArt #Esports',
      'blockchain': '#Blockchain #Web3 #DeFi',
      'art': '#Art #Digital #Creative'
    };
    
    return themeHashtags[theme] || '#Creative #Community';
  }

  private formatDeadline(deadline: Date): string {
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const hours = Math.round(timeDiff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours} hours left`;
    } else {
      const days = Math.round(hours / 24);
      return `${days} days left`;
    }
  }

  async scheduleTweet(content: string, scheduledFor: Date): Promise<{ success: boolean; scheduleId?: string }> {
    try {
      // In production, this would schedule the tweet
      const scheduleId = 'schedule_' + Date.now();
      
      console.log(`📅 Tweet scheduled for ${scheduledFor}: "${content}"`);
      
      return {
        success: true,
        scheduleId
      };
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      return {
        success: false
      };
    }
  }

  async getAccountStats(): Promise<any> {
    try {
      // In production, this would fetch real Twitter account metrics
      return {
        followers: 1250,
        following: 300,
        tweets: 450,
        engagement_rate: 0.045
      };
    } catch (error) {
      console.error('Error fetching account stats:', error);
      return null;
    }
  }
}

export const kismetTwitterPlugin: Plugin = {
  name: 'kismet-twitter',
  description: 'Twitter integration for cross-platform amplification',
  
  actions: [
    {
      name: 'POST_TWEET',
      description: 'Post a tweet to Twitter',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.text);
      },
      handler: async (runtime, message, state, options, callback) => {
        try {
          const twitterService = runtime.getService('twitter') as TwitterService;
          const content = message.content as any;
          
          const result = await twitterService.postTweet({
            content: content.text,
            mediaUrls: content.mediaUrls,
            replyToId: content.replyToId
          });

          if (callback) {
            if (result.success) {
              callback({
                text: `✅ Tweet posted successfully! Tweet ID: ${result.tweetId}`,
                data: { success: true, tweetId: result.tweetId }
              });
            } else {
              callback({
                text: `❌ Failed to post tweet: ${result.error}`,
                data: { success: false, error: result.error }
              });
            }
          }

          return result;
        } catch (error) {
          console.error('Error posting tweet:', error);
          if (callback) {
            callback({
              text: `❌ Failed to post tweet: ${error.message}`,
              data: { success: false, error: error.message }
            });
          }
          throw error;
        }
      }
    },
    
    {
      name: 'ANNOUNCE_BOUNTY_ON_TWITTER',
      description: 'Announce a new bounty on Twitter',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.bounty);
      },
      handler: async (runtime, message, state, options, callback) => {
        try {
          const twitterService = runtime.getService('twitter') as TwitterService;
          const content = message.content as any;
          
          const result = await twitterService.postBountyAnnouncement(content.bounty);

          if (callback) {
            if (result.success) {
              callback({
                text: `🐦 Bounty announced on Twitter! Tweet ID: ${result.tweetId}`,
                data: { success: true, tweetId: result.tweetId }
              });
            } else {
              callback({
                text: `❌ Failed to announce bounty on Twitter`,
                data: { success: false }
              });
            }
          }

          return result;
        } catch (error) {
          console.error('Error announcing bounty on Twitter:', error);
          if (callback) {
            callback({
              text: `❌ Failed to announce bounty: ${error.message}`,
              data: { success: false, error: error.message }
            });
          }
          throw error;
        }
      }
    },
    
    {
      name: 'CELEBRATE_BOUNTY_COMPLETION',
      description: 'Celebrate bounty completion on Twitter',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.bounty && content.winners);
      },
      handler: async (runtime, message, state, options, callback) => {
        try {
          const twitterService = runtime.getService('twitter') as TwitterService;
          const content = message.content as any;
          
          const result = await twitterService.postBountyCompletion(content.bounty, content.winners);

          if (callback) {
            if (result.success) {
              callback({
                text: `🎉 Bounty completion celebrated on Twitter! Tweet ID: ${result.tweetId}`,
                data: { success: true, tweetId: result.tweetId }
              });
            } else {
              callback({
                text: `❌ Failed to celebrate bounty completion on Twitter`,
                data: { success: false }
              });
            }
          }

          return result;
        } catch (error) {
          console.error('Error celebrating bounty completion:', error);
          if (callback) {
            callback({
              text: `❌ Failed to celebrate bounty completion: ${error.message}`,
              data: { success: false, error: error.message }
            });
          }
          throw error;
        }
      }
    }
  ],
  
  evaluators: [
    {
      name: 'SHOULD_AMPLIFY_ON_TWITTER',
      description: 'Determine if content should be amplified on Twitter',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.analysis || content.bounty);
      },
      handler: async (runtime, message) => {
        try {
          const content = message.content as any;
          
          // Amplify if:
          // 1. High-value bounty (>50 SEI)
          // 2. Viral content (high engagement score)
          // 3. Major milestone achievement
          
          if (content.bounty && content.bounty.totalAmount > 50) {
            return true;
          }
          
          if (content.analysis && content.analysis.engagementScore > 0.8) {
            return true;
          }
          
          if (content.milestone) {
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Error evaluating Twitter amplification:', error);
          return false;
        }
      }
    }
  ],
  
  providers: []
};

export default kismetTwitterPlugin;