import axios from 'axios';
import { Ollama } from 'ollama';

export interface AIServiceConfig {
  ollama: {
    url: string;
    model: string;
  };
  openrouter: {
    apiKey: string;
    model: string;
  };
}

export interface ContentAnalysisRequest {
  text: string;
  contentType?: string;
  metadata?: any;
}

export interface ContentAnalysisResponse {
  sentiment: number;
  themes: string[];
  contentQuality: number;
  isSpam: boolean;
  reasoning: string;
}

export interface TextGenerationRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  context?: string;
}

export interface TextGenerationResponse {
  text: string;
  reasoning?: string;
}

export class AIService {
  private ollama: Ollama;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.ollama = new Ollama({ 
      host: config.ollama.url 
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test Ollama connection
      await this.ollama.list();
      console.log('✅ Ollama service connected');
      
      // Test OpenRouter connection
      await this.testOpenRouterConnection();
      console.log('✅ OpenRouter service connected');
    } catch (error) {
      console.error('❌ Failed to initialize AI service:', error);
      throw error;
    }
  }

  private async testOpenRouterConnection(): Promise<void> {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.config.openrouter.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`OpenRouter API returned status ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouter API key');
      }
      throw error;
    }
  }

  /**
   * Analyze content using Ollama for fast, local processing
   */
  async analyzeContentLocal(request: ContentAnalysisRequest): Promise<ContentAnalysisResponse> {
    try {
      const prompt = this.buildAnalysisPrompt(request);
      
      const response = await this.ollama.generate({
        model: this.config.ollama.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9
        }
      });

      return this.parseAnalysisResponse(response.response);
    } catch (error) {
      console.error('Error in local content analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze content using OpenRouter for advanced analysis
   */
  async analyzeContentAdvanced(request: ContentAnalysisRequest): Promise<ContentAnalysisResponse> {
    try {
      const prompt = this.buildAdvancedAnalysisPrompt(request);
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.config.openrouter.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert content analyst for community curation. Analyze content for quality, sentiment, and themes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAnalysisResponse(aiResponse);
    } catch (error) {
      console.error('Error in advanced content analysis:', error);
      throw error;
    }
  }

  /**
   * Generate text using Ollama for local generation
   */
  async generateTextLocal(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const response = await this.ollama.generate({
        model: this.config.ollama.model,
        prompt: request.prompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 150
        }
      });

      return {
        text: response.response.trim()
      };
    } catch (error) {
      console.error('Error in local text generation:', error);
      throw error;
    }
  }

  /**
   * Generate text using OpenRouter for advanced generation
   */
  async generateTextAdvanced(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const messages = [];
      
      if (request.context) {
        messages.push({
          role: 'system',
          content: request.context
        });
      }
      
      messages.push({
        role: 'user',
        content: request.prompt
      });

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.config.openrouter.model,
          messages,
          max_tokens: request.maxTokens || 150,
          temperature: request.temperature || 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.openrouter.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        text: response.data.choices[0].message.content.trim()
      };
    } catch (error) {
      console.error('Error in advanced text generation:', error);
      throw error;
    }
  }

  /**
   * Analyze content with fallback (try local first, then advanced)
   */
  async analyzeContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResponse> {
    try {
      // Try local analysis first for speed
      return await this.analyzeContentLocal(request);
    } catch (error) {
      console.warn('Local analysis failed, falling back to OpenRouter:', error.message);
      try {
        return await this.analyzeContentAdvanced(request);
      } catch (fallbackError) {
        console.error('Both AI services failed:', fallbackError);
        // Return default analysis
        return this.getDefaultAnalysis();
      }
    }
  }

  /**
   * Generate bounty descriptions and announcements
   */
  async generateBountyContent(theme: string, confidence: number): Promise<{
    title: string;
    description: string;
    announcement: string;
  }> {
    try {
      const prompt = `Generate content for a community bounty with theme "${theme}" and confidence ${confidence}.
      
Please provide:
1. A catchy title (max 50 chars)
2. An engaging description (max 200 chars) 
3. An exciting announcement message (max 300 chars)

Format as JSON with keys: title, description, announcement`;

      const response = await this.generateTextAdvanced({
        prompt,
        maxTokens: 200,
        temperature: 0.8,
        context: 'You are Kismet, an enthusiastic community curation AI that creates exciting bounties and rewards.'
      });

      try {
        const parsed = JSON.parse(response.text);
        return {
          title: parsed.title || `${theme.charAt(0).toUpperCase() + theme.slice(1)} Challenge`,
          description: parsed.description || `Create amazing ${theme} content!`,
          announcement: parsed.announcement || `New ${theme} bounty is live! 🎯`
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Creation Challenge`,
          description: `Show us your best ${theme} content! Let the community decide what's most impressive.`,
          announcement: `🚨 NEW BOUNTY ALERT! 🚨\n\nA ${theme} trend has emerged! Time to showcase your creativity! 🎨✨`
        };
      }
    } catch (error) {
      console.error('Error generating bounty content:', error);
      // Return fallback content
      return {
        title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Challenge`,
        description: `Create content related to ${theme}!`,
        announcement: `New bounty: ${theme} challenge is now live! 🎯`
      };
    }
  }

  /**
   * Generate reward messages
   */
  async generateRewardMessage(username: string, amount: number, reason: string): Promise<string> {
    try {
      const prompt = `Generate an enthusiastic reward message for user ${username} who received ${amount} SEI for: ${reason}. 
      
Keep it under 100 characters, include emojis, and make it feel personal and exciting.`;

      const response = await this.generateTextLocal({
        prompt,
        maxTokens: 50,
        temperature: 0.8
      });

      return response.text || `🎉 Amazing work @${username}! ${amount} SEI sent your way! Keep creating! ✨`;
    } catch (error) {
      console.error('Error generating reward message:', error);
      return `🎉 Great work @${username}! ${amount} SEI reward sent! Keep it up! ✨`;
    }
  }

  private buildAnalysisPrompt(request: ContentAnalysisRequest): string {
    return `Analyze this content for a community curation system:

Content: "${request.text}"
Type: ${request.contentType || 'unknown'}

Please provide analysis in this exact format:
SENTIMENT: [0.0-1.0 score]
THEMES: [comma-separated themes]
QUALITY: [0.0-1.0 score]
SPAM: [true/false]
REASONING: [brief explanation]

Focus on:
- Creativity and effort
- Community value
- Positive engagement potential
- Spam/low-effort detection`;
  }

  private buildAdvancedAnalysisPrompt(request: ContentAnalysisRequest): string {
    return `Analyze this community content for curation:

"${request.text}"

Respond with JSON format:
{
  "sentiment": 0.8,
  "themes": ["art", "creative"],
  "contentQuality": 0.7,
  "isSpam": false,
  "reasoning": "High-effort creative content with positive community value"
}

Consider:
- Artistic/creative merit
- Community engagement potential  
- Effort and originality
- Spam or low-value indicators`;
  }

  private parseAnalysisResponse(response: string): ContentAnalysisResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: Math.max(0, Math.min(1, parsed.sentiment || 0.5)),
          themes: Array.isArray(parsed.themes) ? parsed.themes : [],
          contentQuality: Math.max(0, Math.min(1, parsed.contentQuality || 0.5)),
          isSpam: Boolean(parsed.isSpam),
          reasoning: parsed.reasoning || 'Analysis completed'
        };
      }

      // Fallback to regex parsing
      const sentimentMatch = response.match(/SENTIMENT:\s*([\d.]+)/i);
      const themesMatch = response.match(/THEMES:\s*([^\n]+)/i);
      const qualityMatch = response.match(/QUALITY:\s*([\d.]+)/i);
      const spamMatch = response.match(/SPAM:\s*(true|false)/i);
      const reasoningMatch = response.match(/REASONING:\s*([^\n]+)/i);

      return {
        sentiment: sentimentMatch ? Math.max(0, Math.min(1, parseFloat(sentimentMatch[1]))) : 0.5,
        themes: themesMatch ? themesMatch[1].split(',').map(t => t.trim()) : [],
        contentQuality: qualityMatch ? Math.max(0, Math.min(1, parseFloat(qualityMatch[1]))) : 0.5,
        isSpam: spamMatch ? spamMatch[1].toLowerCase() === 'true' : false,
        reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'Analysis completed'
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getDefaultAnalysis();
    }
  }

  private getDefaultAnalysis(): ContentAnalysisResponse {
    return {
      sentiment: 0.5,
      themes: [],
      contentQuality: 0.5,
      isSpam: false,
      reasoning: 'Default analysis due to AI service unavailability'
    };
  }

  async getAvailableOllamaModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map(model => model.name);
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }

  async pullOllamaModel(modelName: string): Promise<void> {
    try {
      console.log(`📥 Pulling Ollama model: ${modelName}`);
      await this.ollama.pull({ model: modelName });
      console.log(`✅ Model ${modelName} pulled successfully`);
    } catch (error) {
      console.error(`❌ Failed to pull model ${modelName}:`, error);
      throw error;
    }
  }
}