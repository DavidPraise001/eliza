export interface KismetConfig {
  discord: {
    applicationId: string;
    token: string;
  };
  telegram: {
    token: string;
  };
  sei: {
    privateKey: string;
    rpcEndpoint: string;
    chainId: string;
    walletAddress: string;
  };
  openai: {
    apiKey: string;
  };
  twitter?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  agent: {
    budget: number;
    microRewardAmount: number;
    sentimentThreshold: number;
    bountyMultiplier: number;
  };
}

export interface ContentAnalysis {
  sentiment: number;
  positiveWords: string[];
  negativeWords: string[];
  emojis: string[];
  reactionCount: number;
  engagementScore: number;
  contentType: ContentType;
  themes: string[];
}

export interface Reward {
  id: string;
  recipientId: string;
  recipientWallet: string;
  amount: number;
  reason: string;
  transactionHash?: string;
  timestamp: Date;
  platform: Platform;
  messageId: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  theme: string;
  totalAmount: number;
  winnerCount: number;
  deadline: Date;
  contractAddress?: string;
  transactionHash?: string;
  submissions: BountySubmission[];
  isActive: boolean;
  createdAt: Date;
}

export interface BountySubmission {
  id: string;
  bountyId: string;
  userId: string;
  messageId: string;
  content: string;
  submittedAt: Date;
  votes: number;
  rank?: number;
}

export interface TrendAnalysis {
  theme: string;
  frequency: number;
  recentMentions: number;
  averageSentiment: number;
  isEmerging: boolean;
  confidence: number;
  keywords: string[];
  timeframe: string;
}

export interface UserProfile {
  id: string;
  platform: Platform;
  walletAddress?: string;
  totalRewards: number;
  contributionCount: number;
  averageSentiment: number;
  preferredThemes: string[];
  lastActive: Date;
}

export interface CommunityMetrics {
  totalRewardsDistributed: number;
  uniqueContributors: number;
  averageSentiment: number;
  activeBounties: number;
  topThemes: TrendAnalysis[];
  engagementRate: number;
}

export enum ContentType {
  ART = 'art',
  MEME = 'meme',
  TEXT = 'text',
  LINK = 'link',
  VIDEO = 'video',
  OTHER = 'other'
}

export enum Platform {
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  TWITTER = 'twitter'
}

export enum RewardTrigger {
  HIGH_SENTIMENT = 'high_sentiment',
  COMMUNITY_REACTION = 'community_reaction',
  BOUNTY_COMPLETION = 'bounty_completion',
  MILESTONE_ACHIEVEMENT = 'milestone_achievement'
}

export interface MessageContext {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  platform: Platform;
  channelId: string;
  reactions?: Reaction[];
  replies?: MessageContext[];
  attachments?: Attachment[];
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface Attachment {
  type: string;
  url: string;
  filename?: string;
}

export interface SocialMediaPost {
  platform: Platform;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduledFor?: Date;
}