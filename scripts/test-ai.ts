import dotenv from 'dotenv';
import { AIService } from '../src/services/AIService';

// Load environment variables
dotenv.config();

async function testAIServices() {
  console.log('🤖 Testing Kismet AI Services...\n');

  const config = {
    ollama: {
      url: process.env.OLLAMA_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2'
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
    }
  };

  const aiService = new AIService(config);

  try {
    // Test initialization
    console.log('📡 Testing AI service initialization...');
    await aiService.initialize();
    console.log('✅ AI services initialized successfully\n');

    // Test Ollama models
    console.log('🦙 Testing Ollama connection...');
    const models = await aiService.getAvailableOllamaModels();
    console.log(`✅ Available Ollama models: ${models.join(', ')}\n`);

    // Test content analysis with Ollama
    console.log('🔍 Testing local content analysis...');
    const localAnalysis = await aiService.analyzeContentLocal({
      text: "Here's my amazing Sei-Chan artwork! I spent hours working on this digital painting. Hope you all love it! 🎨✨",
      contentType: "art"
    });
    console.log('✅ Local analysis result:', JSON.stringify(localAnalysis, null, 2));
    console.log();

    // Test content analysis with OpenRouter (if API key provided)
    if (config.openrouter.apiKey) {
      console.log('🌐 Testing OpenRouter content analysis...');
      const advancedAnalysis = await aiService.analyzeContentAdvanced({
        text: "This meme is absolutely hilarious! 😂 Perfect representation of the DeFi space right now!",
        contentType: "meme"
      });
      console.log('✅ Advanced analysis result:', JSON.stringify(advancedAnalysis, null, 2));
      console.log();
    } else {
      console.log('⚠️  OpenRouter API key not provided, skipping advanced analysis test\n');
    }

    // Test bounty content generation
    console.log('🏆 Testing bounty content generation...');
    const bountyContent = await aiService.generateBountyContent('sei-chan', 0.8);
    console.log('✅ Generated bounty content:');
    console.log(`  Title: ${bountyContent.title}`);
    console.log(`  Description: ${bountyContent.description}`);
    console.log(`  Announcement: ${bountyContent.announcement}`);
    console.log();

    // Test reward message generation
    console.log('💰 Testing reward message generation...');
    const rewardMessage = await aiService.generateRewardMessage('TestUser', 7.5, 'Amazing artwork!');
    console.log('✅ Generated reward message:', rewardMessage);
    console.log();

    console.log('🎉 All AI service tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('  ✅ Ollama connection');
    console.log('  ✅ Local content analysis');
    console.log(`  ${config.openrouter.apiKey ? '✅' : '⚠️ '} OpenRouter integration`);
    console.log('  ✅ Bounty content generation');
    console.log('  ✅ Reward message generation');

  } catch (error) {
    console.error('❌ AI service test failed:', error);
    
    // Provide troubleshooting hints
    console.log('\n🔧 Troubleshooting:');
    if (error.message.includes('ECONNREFUSED')) {
      console.log('  • Is Ollama running? Try: ollama serve');
      console.log('  • Check OLLAMA_URL in .env file');
    }
    if (error.message.includes('model not found')) {
      console.log(`  • Pull the model: ollama pull ${config.ollama.model}`);
    }
    if (error.message.includes('OpenRouter')) {
      console.log('  • Check OPENROUTER_API_KEY in .env file');
      console.log('  • Verify API key is valid');
    }
    
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAIServices().catch(console.error);
}