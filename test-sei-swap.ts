import { seiSwapPlugin } from './sei-swap-plugin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSeiSwapPlugin() {
  try {
    console.log('🚀 Initializing SEI Swap Plugin...');
    
    // Initialize the plugin
    await seiSwapPlugin.init({
      PRIVATE_KEY: process.env.PRIVATE_KEY!,
      RPC_URL: process.env.RPC_URL,
      SLIPPAGE_TOLERANCE: process.env.SLIPPAGE_TOLERANCE
    });
    
    console.log('✅ Plugin initialized successfully');
    
    // Example: Get available tokens
    console.log('\n📋 Available tokens:');
    console.log('- SEI (Native)');
    console.log('- SEIYAN: 0x5f0e07dfee5832faa00c63f2d33a0d79150e8598');
    
    // Example: Check balances (this would require a runtime context)
    console.log('\n💰 To check balances, use the conversational interface:');
    console.log('User: "Check my token balances"');
    
    // Example: Swap tokens (this would require a runtime context)
    console.log('\n🔄 To swap tokens, use the conversational interface:');
    console.log('User: "Swap 1 SEI to SEIYAN"');
    
    // Example: API usage
    console.log('\n🌐 REST API endpoints available:');
    console.log('GET  /api/swap/route?fromToken=...&toToken=...&amountIn=1.0');
    console.log('POST /api/swap/execute');
    console.log('GET  /api/balance');
    
    console.log('\n🎉 Plugin is ready to use!');
    
  } catch (error) {
    console.error('❌ Failed to initialize plugin:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSeiSwapPlugin();
}

export { testSeiSwapPlugin };