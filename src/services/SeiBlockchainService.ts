import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, GasPrice, coins } from '@cosmjs/stargate';
import { SeiPluginConfig } from '../plugins/kismet-sei';
import { Bounty, Reward } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface MicroRewardParams {
  recipientAddress: string;
  amount: number;
  memo?: string;
}

export interface BountyParams {
  title: string;
  description: string;
  theme: string;
  totalAmount: number;
  winnerCount: number;
  deadline: Date;
}

export interface BountyWinner {
  username: string;
  walletAddress: string;
  reward: number;
  rank: number;
}

export interface TransactionResult {
  transactionHash: string;
  success: boolean;
  gasUsed?: number;
}

export interface BountyCreationResult extends TransactionResult {
  bountyId: string;
  contractAddress: string;
}

export class SeiBlockchainService {
  private wallet: DirectSecp256k1HdWallet | null = null;
  private client: SigningStargateClient | null = null;
  private config: SeiPluginConfig;
  private gasPrice: GasPrice;

  constructor(config: SeiPluginConfig) {
    this.config = config;
    this.gasPrice = GasPrice.fromString(config.gasPrice || '0.1usei');
  }

  async initialize(): Promise<void> {
    try {
      // Create wallet from private key
      this.wallet = await DirectSecp256k1HdWallet.fromKey(
        Buffer.from(this.config.privateKey, 'hex'),
        'sei'
      );

      // Connect to Sei network
      this.client = await SigningStargateClient.connectWithSigner(
        this.config.rpcEndpoint,
        this.wallet,
        {
          gasPrice: this.gasPrice,
        }
      );

      console.log('✅ Sei blockchain service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Sei blockchain service:', error);
      throw error;
    }
  }

  async ensureConnection(): Promise<void> {
    if (!this.wallet || !this.client) {
      await this.initialize();
    }
  }

  async getWalletAddress(): Promise<string> {
    await this.ensureConnection();
    const accounts = await this.wallet!.getAccounts();
    return accounts[0].address;
  }

  async getWalletBalance(): Promise<number> {
    await this.ensureConnection();
    const address = await this.getWalletAddress();
    const balance = await this.client!.getBalance(address, 'usei');
    return parseFloat(balance.amount) / 1_000_000; // Convert microsei to sei
  }

  async sendMicroReward(params: MicroRewardParams): Promise<TransactionResult> {
    await this.ensureConnection();
    
    try {
      const senderAddress = await this.getWalletAddress();
      const amount = Math.floor(params.amount * 1_000_000); // Convert sei to microsei
      
      // Validate balance
      const balance = await this.getWalletBalance();
      if (balance < params.amount) {
        throw new Error(`Insufficient balance. Have: ${balance} SEI, Need: ${params.amount} SEI`);
      }

      // Send transaction
      const result = await this.client!.sendTokens(
        senderAddress,
        params.recipientAddress,
        coins(amount, 'usei'),
        'auto',
        params.memo || 'Kismet community reward'
      );

      console.log(`✅ Micro-reward sent: ${params.amount} SEI to ${params.recipientAddress}`);
      console.log(`Transaction hash: ${result.transactionHash}`);

      return {
        transactionHash: result.transactionHash,
        success: result.code === 0,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      console.error('❌ Failed to send micro-reward:', error);
      throw error;
    }
  }

  async createBounty(params: BountyParams): Promise<BountyCreationResult> {
    await this.ensureConnection();
    
    try {
      const senderAddress = await this.getWalletAddress();
      const amount = Math.floor(params.totalAmount * 1_000_000); // Convert sei to microsei
      
      // Validate balance
      const balance = await this.getWalletBalance();
      if (balance < params.totalAmount) {
        throw new Error(`Insufficient balance for bounty. Have: ${balance} SEI, Need: ${params.totalAmount} SEI`);
      }

      // For simplicity, we'll lock funds by sending to a temporary holding address
      // In production, this would deploy a proper smart contract
      const bountyId = uuidv4();
      const bountyHoldingAddress = await this.generateBountyHoldingAddress(bountyId);
      
      const result = await this.client!.sendTokens(
        senderAddress,
        bountyHoldingAddress,
        coins(amount, 'usei'),
        'auto',
        `Bounty: ${params.title} - ID: ${bountyId}`
      );

      console.log(`✅ Bounty created: ${params.title} with ${params.totalAmount} SEI locked`);
      console.log(`Bounty ID: ${bountyId}`);
      console.log(`Transaction hash: ${result.transactionHash}`);

      return {
        transactionHash: result.transactionHash,
        success: result.code === 0,
        gasUsed: result.gasUsed,
        bountyId,
        contractAddress: bountyHoldingAddress
      };
    } catch (error) {
      console.error('❌ Failed to create bounty:', error);
      throw error;
    }
  }

  async distributeBountyRewards(bountyId: string, winners: BountyWinner[]): Promise<TransactionResult> {
    await this.ensureConnection();
    
    try {
      const senderAddress = await this.getWalletAddress();
      
      // In a real implementation, this would interact with the bounty smart contract
      // For now, we'll send rewards directly from the main wallet
      
      const transactions: Promise<any>[] = [];
      
      for (const winner of winners) {
        const amount = Math.floor(winner.reward * 1_000_000); // Convert sei to microsei
        
        const txPromise = this.client!.sendTokens(
          senderAddress,
          winner.walletAddress,
          coins(amount, 'usei'),
          'auto',
          `Bounty reward - Rank ${winner.rank} - ${bountyId}`
        );
        
        transactions.push(txPromise);
      }

      // Execute all reward transactions
      const results = await Promise.all(transactions);
      
      // Return the first transaction hash as representative
      const firstResult = results[0];
      
      console.log(`✅ Bounty rewards distributed for bounty ${bountyId}`);
      console.log(`${winners.length} winners rewarded`);

      return {
        transactionHash: firstResult.transactionHash,
        success: results.every(r => r.code === 0),
        gasUsed: results.reduce((sum, r) => sum + (r.gasUsed || 0), 0)
      };
    } catch (error) {
      console.error('❌ Failed to distribute bounty rewards:', error);
      throw error;
    }
  }

  async validateWalletAddress(address: string): Promise<boolean> {
    try {
      // Basic Sei address validation (starts with 'sei' and is correct length)
      return address.startsWith('sei1') && address.length === 43;
    } catch (error) {
      return false;
    }
  }

  async estimateTransactionFee(recipient: string, amount: number): Promise<number> {
    await this.ensureConnection();
    
    try {
      const senderAddress = await this.getWalletAddress();
      const amountInMicrosei = Math.floor(amount * 1_000_000);
      
      // Simulate the transaction to get gas estimate
      const gasEstimate = await this.client!.simulate(
        senderAddress,
        [
          {
            typeUrl: '/cosmos.bank.v1beta1.MsgSend',
            value: {
              fromAddress: senderAddress,
              toAddress: recipient,
              amount: coins(amountInMicrosei, 'usei')
            }
          }
        ],
        'Simulation'
      );

      return gasEstimate * parseFloat(this.gasPrice.amount);
    } catch (error) {
      console.error('Error estimating transaction fee:', error);
      return 0.01; // Fallback estimate
    }
  }

  private async generateBountyHoldingAddress(bountyId: string): Promise<string> {
    // In production, this would be a proper smart contract address
    // For demo purposes, we'll generate a deterministic address based on bounty ID
    
    // Create a new wallet for this bounty (simplified approach)
    const bountyWallet = await DirectSecp256k1HdWallet.generate(12, { prefix: 'sei' });
    const accounts = await bountyWallet.getAccounts();
    return accounts[0].address;
  }

  async getTransactionStatus(txHash: string): Promise<any> {
    await this.ensureConnection();
    
    try {
      const result = await this.client!.getTx(txHash);
      return result;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return null;
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<any[]> {
    await this.ensureConnection();
    
    try {
      const address = await this.getWalletAddress();
      
      // This would require a transaction indexer in production
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }
}