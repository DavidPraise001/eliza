import Sentiment from 'sentiment';
import { ContentAnalysis, ContentType, MessageContext, Reaction } from '../types';
import { AIService, ContentAnalysisRequest } from './AIService';

export class SentimentAnalysisService {
  private sentiment: Sentiment;
  private positiveEmojis: Set<string>;
  private negativeEmojis: Set<string>;
  private contentTypeKeywords: Map<ContentType, string[]>;
  private aiService?: AIService;

  constructor(aiService?: AIService) {
    this.sentiment = new Sentiment();
    this.aiService = aiService;
    this.initializeEmojiSets();
    this.initializeContentTypeKeywords();
  }

  private initializeEmojiSets(): void {
    this.positiveEmojis = new Set([
      '😍', '🔥', '💯', '🚀', '⭐', '✨', '🎨', '👏', '💖', '🥰',
      '😻', '🤩', '👍', '💪', '🙌', '🎉', '🏆', '💎', '⚡', '🌟'
    ]);

    this.negativeEmojis = new Set([
      '😢', '😞', '👎', '💔', '😡', '😠', '🤮', '💩', '😴', '🙄',
      '😬', '😑', '😤', '🚫', '❌', '😕', '😰', '😨', '🤢', '😖'
    ]);
  }

  private initializeContentTypeKeywords(): void {
    this.contentTypeKeywords = new Map([
      [ContentType.ART, ['art', 'drawing', 'artwork', 'illustration', 'sketch', 'design', 'creative', 'painted', 'digital art']],
      [ContentType.MEME, ['meme', 'funny', 'lol', 'haha', 'hilarious', 'joke', 'humor', 'comedy', 'laughing']],
      [ContentType.TEXT, ['analysis', 'opinion', 'thought', 'idea', 'insight', 'discussion', 'comment']],
      [ContentType.LINK, ['http', 'https', 'www', 'link', 'url', 'check this out', 'found this']],
      [ContentType.VIDEO, ['video', 'watch', 'clip', 'footage', 'animation', 'gif', 'recording']]
    ]);
  }

  public async analyzeContent(message: MessageContext): Promise<ContentAnalysis> {
    const text = message.content.toLowerCase();
    
    // Try AI-enhanced analysis first if available
    if (this.aiService && text.length > 10) {
      try {
        const aiAnalysis = await this.aiService.analyzeContent({
          text: message.content,
          contentType: this.determineContentType(text, message.attachments || []),
          metadata: {
            reactions: message.reactions,
            attachments: message.attachments,
            platform: message.platform
          }
        });
        
        // Combine AI analysis with traditional analysis
        return await this.combineAnalyses(message, aiAnalysis);
      } catch (error) {
        console.warn('AI analysis failed, falling back to traditional analysis:', error.message);
      }
    }
    
    // Fallback to traditional sentiment analysis
    return this.performTraditionalAnalysis(message);
  }

  private async combineAnalyses(message: MessageContext, aiAnalysis: any): Promise<ContentAnalysis> {
    const text = message.content.toLowerCase();
    const sentimentResult = this.sentiment.analyze(text);
    
    // Analyze emojis
    const emojiAnalysis = this.analyzeEmojis(text);
    
    // Analyze reactions if available
    const reactionAnalysis = this.analyzeReactions(message.reactions || []);
    
    // Determine content type
    const contentType = this.determineContentType(text, message.attachments || []);
    
    // Combine AI themes with traditional theme extraction
    const traditionalThemes = this.extractThemes(text);
    const combinedThemes = [...new Set([...aiAnalysis.themes, ...traditionalThemes])];
    
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(
      aiAnalysis.sentiment,
      emojiAnalysis.score,
      reactionAnalysis.score,
      message.reactions?.length || 0,
      message.replies?.length || 0
    );

    // Weight AI sentiment with traditional factors
    const finalSentiment = Math.min(1, Math.max(0, 
      (aiAnalysis.sentiment * 0.6) + 
      (emojiAnalysis.score * 0.2) + 
      (reactionAnalysis.score * 0.2)
    ));

    return {
      sentiment: finalSentiment,
      positiveWords: sentimentResult.positive,
      negativeWords: sentimentResult.negative,
      emojis: emojiAnalysis.emojis,
      reactionCount: message.reactions?.reduce((sum, r) => sum + r.count, 0) || 0,
      engagementScore,
      contentType,
      themes: combinedThemes
    };
  }

  private async performTraditionalAnalysis(message: MessageContext): Promise<ContentAnalysis> {
    const text = message.content.toLowerCase();
    const sentimentResult = this.sentiment.analyze(text);
    
    // Calculate base sentiment score (normalized to 0-1)
    const baseSentiment = this.normalizeSentiment(sentimentResult.score, text.split(' ').length);
    
    // Analyze emojis
    const emojiAnalysis = this.analyzeEmojis(text);
    
    // Analyze reactions if available
    const reactionAnalysis = this.analyzeReactions(message.reactions || []);
    
    // Determine content type
    const contentType = this.determineContentType(text, message.attachments || []);
    
    // Extract themes and keywords
    const themes = this.extractThemes(text);
    
    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(
      baseSentiment,
      emojiAnalysis.score,
      reactionAnalysis.score,
      message.reactions?.length || 0,
      message.replies?.length || 0
    );

    // Final sentiment score combining all factors
    const finalSentiment = Math.min(1, Math.max(0, 
      (baseSentiment * 0.4) + 
      (emojiAnalysis.score * 0.3) + 
      (reactionAnalysis.score * 0.3)
    ));

    return {
      sentiment: finalSentiment,
      positiveWords: sentimentResult.positive,
      negativeWords: sentimentResult.negative,
      emojis: emojiAnalysis.emojis,
      reactionCount: message.reactions?.reduce((sum, r) => sum + r.count, 0) || 0,
      engagementScore,
      contentType,
      themes
    };
  }

  private normalizeSentiment(score: number, wordCount: number): number {
    // Normalize sentiment score based on word count to prevent bias toward longer texts
    const normalizedScore = wordCount > 0 ? score / Math.sqrt(wordCount) : 0;
    return Math.min(1, Math.max(0, (normalizedScore + 5) / 10)); // Convert to 0-1 scale
  }

  private analyzeEmojis(text: string): { score: number; emojis: string[] } {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];
    
    let score = 0.5; // Neutral baseline
    let positiveCount = 0;
    let negativeCount = 0;

    emojis.forEach(emoji => {
      if (this.positiveEmojis.has(emoji)) {
        positiveCount++;
      } else if (this.negativeEmojis.has(emoji)) {
        negativeCount++;
      }
    });

    if (emojis.length > 0) {
      score = Math.min(1, Math.max(0, 0.5 + (positiveCount - negativeCount) * 0.2));
    }

    return { score, emojis };
  }

  private analyzeReactions(reactions: Reaction[]): { score: number } {
    if (reactions.length === 0) return { score: 0.5 };

    let positiveReactions = 0;
    let negativeReactions = 0;
    let totalReactions = 0;

    reactions.forEach(reaction => {
      totalReactions += reaction.count;
      if (this.positiveEmojis.has(reaction.emoji)) {
        positiveReactions += reaction.count;
      } else if (this.negativeEmojis.has(reaction.emoji)) {
        negativeReactions += reaction.count;
      }
    });

    const score = totalReactions > 0 
      ? Math.min(1, Math.max(0, 0.5 + (positiveReactions - negativeReactions) / totalReactions))
      : 0.5;

    return { score };
  }

  private determineContentType(text: string, attachments: any[]): ContentType {
    // Check attachments first
    if (attachments.length > 0) {
      const attachment = attachments[0];
      if (attachment.type?.includes('image') || attachment.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return ContentType.ART;
      }
      if (attachment.type?.includes('video') || attachment.filename?.match(/\.(mp4|mov|avi|gif)$/i)) {
        return ContentType.VIDEO;
      }
    }

    // Check for URLs
    if (text.includes('http') || text.includes('www.')) {
      return ContentType.LINK;
    }

    // Analyze text content
    for (const [type, keywords] of this.contentTypeKeywords) {
      const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount >= 1) {
        return type;
      }
    }

    return ContentType.TEXT;
  }

  private extractThemes(text: string): string[] {
    const themes: string[] = [];
    const themeKeywords = new Map([
      ['sei-chan', ['sei-chan', 'sei chan', 'seichan', 'mascot']],
      ['futuristic', ['futuristic', 'future', 'sci-fi', 'cyberpunk', 'tech']],
      ['helmet', ['helmet', 'headgear', 'headpiece', 'armor']],
      ['anime', ['anime', 'manga', 'kawaii', 'otaku', 'waifu']],
      ['gaming', ['game', 'gaming', 'gamer', 'play', 'level']],
      ['blockchain', ['blockchain', 'crypto', 'web3', 'defi', 'sei']],
      ['art', ['art', 'drawing', 'sketch', 'painting', 'design']]
    ]);

    for (const [theme, keywords] of themeKeywords) {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes;
  }

  private calculateEngagementScore(
    sentiment: number,
    emojiScore: number,
    reactionScore: number,
    reactionCount: number,
    replyCount: number
  ): number {
    const baseScore = (sentiment + emojiScore + reactionScore) / 3;
    const engagementBonus = Math.min(0.3, (reactionCount * 0.05) + (replyCount * 0.1));
    return Math.min(1, baseScore + engagementBonus);
  }

  public isRewardWorthy(analysis: ContentAnalysis, threshold: number = 0.7): boolean {
    return analysis.sentiment >= threshold && analysis.engagementScore >= threshold;
  }

  public shouldCreateBounty(
    recentAnalyses: ContentAnalysis[],
    themeThreshold: number = 3,
    sentimentThreshold: number = 0.6
  ): { shouldCreate: boolean; theme?: string; confidence: number } {
    const themeFrequency = new Map<string, { count: number; totalSentiment: number }>();

    // Analyze recent content for trending themes
    recentAnalyses.forEach(analysis => {
      analysis.themes.forEach(theme => {
        const current = themeFrequency.get(theme) || { count: 0, totalSentiment: 0 };
        themeFrequency.set(theme, {
          count: current.count + 1,
          totalSentiment: current.totalSentiment + analysis.sentiment
        });
      });
    });

    // Find the most promising theme
    let bestTheme: string | undefined;
    let bestScore = 0;

    for (const [theme, data] of themeFrequency) {
      if (data.count >= themeThreshold) {
        const averageSentiment = data.totalSentiment / data.count;
        if (averageSentiment >= sentimentThreshold) {
          const score = data.count * averageSentiment;
          if (score > bestScore) {
            bestScore = score;
            bestTheme = theme;
          }
        }
      }
    }

    return {
      shouldCreate: bestTheme !== undefined,
      theme: bestTheme,
      confidence: bestScore / (themeThreshold * 1.0) // Normalized confidence score
    };
  }
}