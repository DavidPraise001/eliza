#!/usr/bin/env node

// Simple demo script to test the SEI swap plugin
import { seiSwapPlugin } from './dist/sei-swap-plugin.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function demo() {
  try {
    console.log('🚀 SEI Swap Plugin Demo');
    console.log('========================');
    
    // Check if required environment variables are set
    if (!process.env.PRIVATE_KEY) {
      console.log('❌ PRIVATE_KEY not set in .env file');
      console.log('💡 Please create a .env file with your private key');
      return;
    }
    
    console.log('✅ Environment variables loaded');
    console.log('🔗 RPC URL:', process.env.RPC_URL || 'https://rpc-testnet.sei.io (default)');
    console.log('📊 Slippage:', process.env.SLIPPAGE_TOLERANCE || '1.0% (default)');
    
    // Initialize the plugin
    console.log('\n🔧 Initializing plugin...');
    if (seiSwapPlugin.init) {
      await seiSwapPlugin.init({
        PRIVATE_KEY: process.env.PRIVATE_KEY,
        RPC_URL: process.env.RPC_URL || 'https://rpc-testnet.sei.io',
        SLIPPAGE_TOLERANCE: process.env.SLIPPAGE_TOLERANCE || '1.0'
      });
      console.log('✅ Plugin initialized successfully');
    }
    
    console.log('\n📋 Plugin Information:');
    console.log('- Name:', seiSwapPlugin.name);
    console.log('- Description:', seiSwapPlugin.description);
    console.log('- Services:', seiSwapPlugin.services?.length || 0);
    console.log('- Actions:', seiSwapPlugin.actions?.length || 0);
    console.log('- Routes:', seiSwapPlugin.routes?.length || 0);
    
    console.log('\n🎯 Available Actions:');
    if (seiSwapPlugin.actions) {
      seiSwapPlugin.actions.forEach((action, index) => {
        console.log(`${index + 1}. ${action.name}: ${action.description}`);
      });
    }
    
    console.log('\n🌐 Available API Routes:');
    if (seiSwapPlugin.routes) {
      seiSwapPlugin.routes.forEach((route, index) => {
        console.log(`${index + 1}. ${route.type} ${route.path} - ${route.name}`);
      });
    }
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Use the conversational interface to swap tokens');
    console.log('2. Call the REST API endpoints');
    console.log('3. Integrate with your ElizaOS agent');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the demo
demo().catch(console.error);