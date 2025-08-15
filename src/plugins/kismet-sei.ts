import { Plugin } from '@elizaos/core';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import { Reward, Bounty, KismetConfig } from '../types';
import { SeiBlockchainService } from '../services/SeiBlockchainService';

export interface SeiPluginConfig {
  privateKey: string;
  rpcEndpoint: string;
  chainId: string;
  gasPrice: string;
  defaultGasLimit: number;
}

export const kismetSeiPlugin: Plugin = {
  name: 'kismet-sei',
  description: 'Sei blockchain integration for micro-payments and bounty management',
  
  actions: [
    {
      name: 'SEND_MICRO_REWARD',
      description: 'Send micro-payment to a user wallet on Sei blockchain',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.recipientAddress && content.amount);
      },
      handler: async (runtime, message, state, options, callback) => {
        try {
          const seiService = new SeiBlockchainService(runtime.getSetting('SEI_CONFIG'));
          const content = message.content as any;
          
          const result = await seiService.sendMicroReward({
            recipientAddress: content.recipientAddress,
            amount: content.amount,
            memo: content.memo || 'Kismet community reward'
          });

          if (callback) {
            callback({
              text: `🎉 Micro-reward sent! ${content.amount} $SEI has been transferred to ${content.recipientAddress}. Transaction: ${result.transactionHash}`,
              data: {
                success: true,
                transactionHash: result.transactionHash,
                amount: content.amount,
                recipient: content.recipientAddress
              }
            });
          }

          return result;
        } catch (error) {
          console.error('Error sending micro-reward:', error);
          if (callback) {
            callback({
              text: `❌ Failed to send micro-reward: ${error.message}`,
              data: { success: false, error: error.message }
            });
          }
          throw error;
        }
      }
    },
    
    {
      name: 'CREATE_BOUNTY',
      description: 'Create an on-chain bounty with locked funds',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.title && content.amount && content.deadline);
      },
      handler: async (runtime, message, state, options, callback) => {
        try {
          const seiService = new SeiBlockchainService(runtime.getSetting('SEI_CONFIG'));
          const content = message.content as any;
          
          const result = await seiService.createBounty({
            title: content.title,
            description: content.description,
            theme: content.theme,
            totalAmount: content.amount,
            winnerCount: content.winnerCount || 3,
            deadline: new Date(content.deadline)
          });

          if (callback) {
            callback({
              text: `🚨 BOUNTY CREATED! 🚨\n\n"${content.title}"\n💰 Reward: ${content.amount} $SEI\n⏰ Deadline: ${new Date(content.deadline).toLocaleDateString()}\n🔗 Contract: ${result.contractAddress}`,
              data: {
                success: true,
                bountyId: result.bountyId,
                contractAddress: result.contractAddress,
                transactionHash: result.transactionHash
              }
            });
          }

          return result;
        } catch (error) {
          console.error('Error creating bounty:', error);
          if (callback) {
            callback({
              text: `❌ Failed to create bounty: ${error.message}`,
              data: { success: false, error: error.message }
            });
          }
          throw error;
        }
      }
    },
    
    {
      name: 'DISTRIBUTE_BOUNTY_REWARDS',
      description: 'Distribute bounty rewards to winners',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.bountyId && content.winners && Array.isArray(content.winners));
      },
      handler: async (runtime, message, state, options, callback) => {
        try {
          const seiService = new SeiBlockchainService(runtime.getSetting('SEI_CONFIG'));
          const content = message.content as any;
          
          const result = await seiService.distributeBountyRewards(
            content.bountyId,
            content.winners
          );

          if (callback) {
            const winnerList = content.winners.map((w: any, i: number) => 
              `${i + 1}. ${w.username}: ${w.reward} $SEI`
            ).join('\n');
            
            callback({
              text: `🏆 BOUNTY COMPLETED! 🏆\n\nRewards distributed:\n${winnerList}\n\n🔗 Transaction: ${result.transactionHash}`,
              data: {
                success: true,
                transactionHash: result.transactionHash,
                winners: content.winners
              }
            });
          }

          return result;
        } catch (error) {
          console.error('Error distributing bounty rewards:', error);
          if (callback) {
            callback({
              text: `❌ Failed to distribute bounty rewards: ${error.message}`,
              data: { success: false, error: error.message }
            });
          }
          throw error;
        }
      }
    },
    
    {
      name: 'CHECK_WALLET_BALANCE',
      description: 'Check Kismet wallet balance',
      validate: async (runtime, message) => true,
      handler: async (runtime, message, state, options, callback) => {
        try {
          const seiService = new SeiBlockchainService(runtime.getSetting('SEI_CONFIG'));
          const balance = await seiService.getWalletBalance();

          if (callback) {
            callback({
              text: `💰 Kismet wallet balance: ${balance} $SEI`,
              data: { balance }
            });
          }

          return { balance };
        } catch (error) {
          console.error('Error checking wallet balance:', error);
          if (callback) {
            callback({
              text: `❌ Failed to check wallet balance: ${error.message}`,
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
      name: 'CAN_SEND_REWARD',
      description: 'Check if wallet has sufficient balance for reward',
      validate: async (runtime, message) => {
        const content = message.content as any;
        return !!(content.amount);
      },
      handler: async (runtime, message) => {
        try {
          const seiService = new SeiBlockchainService(runtime.getSetting('SEI_CONFIG'));
          const balance = await seiService.getWalletBalance();
          const amount = parseFloat(message.content as any).amount;
          
          return balance >= amount;
        } catch (error) {
          console.error('Error evaluating reward capability:', error);
          return false;
        }
      }
    }
  ],
  
  providers: []
};

export default kismetSeiPlugin;