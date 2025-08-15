import { Bounty, BountySubmission, ContentAnalysis, MessageContext, TrendAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class BountyService {
  private activeBounties: Map<string, Bounty> = new Map();
  private contentHistory: Array<{ analysis: ContentAnalysis; context: MessageContext; timestamp: Date }> = [];
  private maxHistorySize: number = 1000;

  constructor() {
    // Initialize with empty state
    // In production, this would load from a database
  }

  async addContentAnalysis(analysis: ContentAnalysis, context: MessageContext): Promise<void> {
    this.contentHistory.push({
      analysis,
      context,
      timestamp: new Date()
    });

    // Maintain history size limit
    if (this.contentHistory.length > this.maxHistorySize) {
      this.contentHistory = this.contentHistory.slice(-this.maxHistorySize);
    }
  }

  async getRecentAnalyses(count: number = 50): Promise<ContentAnalysis[]> {
    return this.contentHistory
      .slice(-count)
      .map(item => item.analysis);
  }

  async createEmergentBounty(theme: string, confidence: number): Promise<Bounty | null> {
    // Check if we already have an active bounty for this theme
    const existingBounty = Array.from(this.activeBounties.values())
      .find(bounty => bounty.theme === theme && bounty.isActive);

    if (existingBounty) {
      console.log(`Bounty for theme "${theme}" already exists`);
      return null;
    }

    // Calculate bounty parameters based on theme popularity and confidence
    const baseAmount = 100; // Base bounty amount in SEI
    const totalAmount = Math.round(baseAmount * confidence);
    const winnerCount = Math.min(5, Math.max(1, Math.floor(confidence * 3)));

    // Create deadline (24-48 hours based on confidence)
    const hoursUntilDeadline = confidence > 0.8 ? 24 : 48;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hoursUntilDeadline);

    const bounty: Bounty = {
      id: uuidv4(),
      title: this.generateBountyTitle(theme),
      description: this.generateBountyDescription(theme),
      theme,
      totalAmount,
      winnerCount,
      deadline,
      submissions: [],
      isActive: true,
      createdAt: new Date()
    };

    // In production, this would create the bounty on-chain
    // For now, we'll just store it in memory
    this.activeBounties.set(bounty.id, bounty);

    console.log(`✅ Created emergent bounty: ${bounty.title} (${totalAmount} SEI)`);
    return bounty;
  }

  async submitToBounty(bountyId: string, submission: Omit<BountySubmission, 'id' | 'submittedAt' | 'votes'>): Promise<BountySubmission | null> {
    const bounty = this.activeBounties.get(bountyId);
    if (!bounty || !bounty.isActive) {
      return null;
    }

    // Check if deadline has passed
    if (new Date() > bounty.deadline) {
      bounty.isActive = false;
      return null;
    }

    const newSubmission: BountySubmission = {
      ...submission,
      id: uuidv4(),
      submittedAt: new Date(),
      votes: 0
    };

    bounty.submissions.push(newSubmission);
    return newSubmission;
  }

  async voteBountySubmission(bountyId: string, submissionId: string, userId: string): Promise<boolean> {
    const bounty = this.activeBounties.get(bountyId);
    if (!bounty) return false;

    const submission = bounty.submissions.find(s => s.id === submissionId);
    if (!submission) return false;

    // In production, track who voted to prevent duplicate votes
    submission.votes++;
    return true;
  }

  async completeBounty(bountyId: string): Promise<BountySubmission[]> {
    const bounty = this.activeBounties.get(bountyId);
    if (!bounty) return [];

    bounty.isActive = false;

    // Sort submissions by votes (descending) and take top winners
    const winners = bounty.submissions
      .sort((a, b) => b.votes - a.votes)
      .slice(0, bounty.winnerCount)
      .map((submission, index) => ({
        ...submission,
        rank: index + 1
      }));

    // Calculate reward distribution
    const totalAmount = bounty.totalAmount;
    const rewardDistribution = this.calculateRewardDistribution(totalAmount, winners.length);

    winners.forEach((winner, index) => {
      // In production, this would trigger SEI transactions
      console.log(`🏆 Bounty winner ${index + 1}: ${winner.userId} - ${rewardDistribution[index]} SEI`);
    });

    return winners;
  }

  async getActiveBounties(): Promise<Bounty[]> {
    return Array.from(this.activeBounties.values())
      .filter(bounty => bounty.isActive && new Date() < bounty.deadline);
  }

  async getBountyById(bountyId: string): Promise<Bounty | null> {
    return this.activeBounties.get(bountyId) || null;
  }

  async analyzeThemeTrends(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<TrendAnalysis[]> {
    const now = new Date();
    const cutoffTime = new Date();
    
    switch (timeframe) {
      case 'hour':
        cutoffTime.setHours(now.getHours() - 1);
        break;
      case 'day':
        cutoffTime.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffTime.setDate(now.getDate() - 7);
        break;
    }

    const recentContent = this.contentHistory.filter(
      item => item.timestamp >= cutoffTime
    );

    const themeStats = new Map<string, {
      frequency: number;
      totalSentiment: number;
      recentMentions: number;
      keywords: Set<string>;
    }>();

    recentContent.forEach(({ analysis }) => {
      analysis.themes.forEach(theme => {
        const current = themeStats.get(theme) || {
          frequency: 0,
          totalSentiment: 0,
          recentMentions: 0,
          keywords: new Set()
        };

        current.frequency++;
        current.totalSentiment += analysis.sentiment;
        current.recentMentions++;
        
        // Add positive words as keywords
        analysis.positiveWords.forEach(word => current.keywords.add(word));

        themeStats.set(theme, current);
      });
    });

    const trends: TrendAnalysis[] = [];

    for (const [theme, stats] of themeStats) {
      const averageSentiment = stats.totalSentiment / stats.frequency;
      const isEmerging = stats.frequency >= 3 && averageSentiment >= 0.6;
      
      trends.push({
        theme,
        frequency: stats.frequency,
        recentMentions: stats.recentMentions,
        averageSentiment,
        isEmerging,
        confidence: Math.min(1, (stats.frequency * averageSentiment) / 5),
        keywords: Array.from(stats.keywords),
        timeframe
      });
    }

    return trends.sort((a, b) => b.confidence - a.confidence);
  }

  private generateBountyTitle(theme: string): string {
    const templates = [
      `${theme.charAt(0).toUpperCase() + theme.slice(1)} Creation Challenge`,
      `Best ${theme.charAt(0).toUpperCase() + theme.slice(1)} Contest`,
      `${theme.charAt(0).toUpperCase() + theme.slice(1)} Innovation Bounty`,
      `Ultimate ${theme.charAt(0).toUpperCase() + theme.slice(1)} Showdown`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateBountyDescription(theme: string): string {
    const descriptions = {
      'sei-chan': 'Create amazing content featuring our beloved mascot Sei-Chan! Show us your unique interpretation.',
      'futuristic': 'Design something that embodies the future! Think cyberpunk, sci-fi, and cutting-edge technology.',
      'helmet': 'Design creative helmets and headgear! From battle armor to space suits, let your imagination run wild.',
      'anime': 'Create anime-inspired content! Manga panels, character designs, or anime-style art welcome.',
      'gaming': 'Gaming-related content! Fan art, memes, or anything that celebrates gaming culture.',
      'blockchain': 'Web3 and blockchain-themed content! Show the future of decentralized technology.',
      'art': 'Pure artistic expression! Any medium, any style, just create something beautiful.'
    };

    return descriptions[theme] || `Create content related to ${theme}! Let the community decide what\'s best.`;
  }

  private calculateRewardDistribution(totalAmount: number, winnerCount: number): number[] {
    if (winnerCount === 1) return [totalAmount];
    if (winnerCount === 2) return [totalAmount * 0.7, totalAmount * 0.3];
    if (winnerCount === 3) return [totalAmount * 0.5, totalAmount * 0.3, totalAmount * 0.2];
    
    // For more winners, use a distribution that favors top positions
    const distribution: number[] = [];
    let remaining = totalAmount;
    
    for (let i = 0; i < winnerCount; i++) {
      const percentage = Math.pow(0.7, i) * 0.5;
      const amount = Math.min(remaining * percentage, remaining * 0.4);
      distribution.push(Math.round(amount * 100) / 100);
      remaining -= amount;
    }

    // Distribute any remaining amount to the last winner
    if (remaining > 0) {
      distribution[distribution.length - 1] += remaining;
    }

    return distribution;
  }

  async getExpiredBounties(): Promise<Bounty[]> {
    const now = new Date();
    return Array.from(this.activeBounties.values())
      .filter(bounty => bounty.isActive && now > bounty.deadline);
  }

  async cleanupExpiredBounties(): Promise<void> {
    const expiredBounties = await this.getExpiredBounties();
    
    for (const bounty of expiredBounties) {
      console.log(`⏰ Processing expired bounty: ${bounty.title}`);
      await this.completeBounty(bounty.id);
    }
  }
}