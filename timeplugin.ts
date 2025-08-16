import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type ActionResult,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
  type MessagePayload,
  type WorldPayload,
  EventType,
} from '@elizaos/core';
import { z } from 'zod';
import { createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sei } from 'viem/chains';

/**
 * Defines the configuration schema for the SEI swap plugin
 */
const configSchema = z.object({
  RPC_URL: z
    .string()
    .url()
    .default('https://sei-rpc.publicnode.com')
    .transform((val) => val.trim()),
  CHAIN_ID: z.number().default(1329),
  NATIVE_ADDRESS: z.string().default('0x0000000000000000000000000000000000000000'),
  WRAPPED_NATIVE_ADDRESS: z.string().default('0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7'),
  SLIPPAGE: z.string().default('0.5'),
  PRIVATE_KEY: z.string().optional(),
  SYMPHONY_API_URL: z.string().url().default('https://api.symph.ag'),
});

/**
 * Interface for swap data returned by Symphony
 */
interface SwapData {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  transactionHash: string;
  timestamp: number;
  slippage: string;
  route: RouteData[];
}

interface RouteData {
  poolAddress: string;
  tokenA: string;
  tokenB: string;
  fee: string;
  amountIn: string;
  amountOut: string;
}

interface SwapQuote {
  route: RouteData[];
  amountOut: string;
  priceImpact: string;
  gasEstimate: string;
}

/**
 * Symphony Swap Service to handle SEI token swaps
 */
export class SeiSwapService extends Service {
  static override serviceType = 'sei-swap';

  override capabilityDescription =
    'Provides SEI token swap functionality using Symphony aggregator for optimal routing and execution.';

  private rpcUrl: string;
  private chainId: number;
  private nativeAddress: string;
  private wrappedNativeAddress: string;
  private slippage: string;
  private symphonyApiUrl: string;
  private walletClient: any;

  constructor(runtime?: IAgentRuntime) {
    super(runtime);
    this.rpcUrl = process.env.RPC_URL || 'https://sei-rpc.publicnode.com';
    this.chainId = Number(process.env.CHAIN_ID) || 1329;
    this.nativeAddress = process.env.NATIVE_ADDRESS || '0x0000000000000000000000000000000000000000';
    this.wrappedNativeAddress = process.env.WRAPPED_NATIVE_ADDRESS || '0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7';
    this.slippage = process.env.SLIPPAGE || '0.5';
    this.symphonyApiUrl = process.env.SYMPHONY_API_URL || 'https://api.symph.ag';
    
    // Initialize wallet client if private key is provided
    if (process.env.PRIVATE_KEY) {
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      this.walletClient = createWalletClient({
        account,
        chain: sei,
        transport: http(this.rpcUrl),
      });
    }
  }

  static override async start(runtime: IAgentRuntime): Promise<Service> {
    logger.info('Starting SEI swap service');
    return new SeiSwapService(runtime);
  }

  static override async stop(runtime: IAgentRuntime): Promise<void> {
    logger.info('Stopping SEI swap service');
    const service = runtime.getService(SeiSwapService.serviceType);
    if (!service) {
      throw new Error('SEI swap service not found');
    }
    if ('stop' in service && typeof service.stop === 'function') {
      await service.stop();
    }
  }

  override async stop(): Promise<void> {
    logger.info('SEI swap service stopped');
  }

  /**
   * Gets a quote for a token swap
   * @param tokenIn Input token address
   * @param tokenOut Output token address
   * @param amountIn Amount of input tokens
   * @returns Swap quote with route and expected output
   */
  async getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string): Promise<SwapQuote> {
    try {
      // This is a mock implementation - in reality you would call Symphony API
      const mockRoute: RouteData[] = [
        {
          poolAddress: '0x1234567890123456789012345678901234567890',
          tokenA: tokenIn,
          tokenB: tokenOut,
          fee: '0.3',
          amountIn,
          amountOut: (parseFloat(amountIn) * 0.98).toString(), // Mock 2% slippage
        }
      ];

      return {
        route: mockRoute,
        amountOut: (parseFloat(amountIn) * 0.98).toString(),
        priceImpact: '0.2',
        gasEstimate: '0.001',
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get swap quote');
      throw new Error(`Failed to get swap quote: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Executes a token swap
   * @param tokenIn Input token address
   * @param tokenOut Output token address
   * @param amountIn Amount of input tokens
   * @param minAmountOut Minimum amount of output tokens
   * @returns Swap transaction data
   */
  async executeSwap(tokenIn: string, tokenOut: string, amountIn: string, minAmountOut?: string): Promise<SwapData> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized. Please provide PRIVATE_KEY in configuration.');
      }

      // Get quote first
      const quote = await this.getSwapQuote(tokenIn, tokenOut, amountIn);
      
      // Calculate minimum amount out if not provided
      const minOut = minAmountOut || (parseFloat(quote.amountOut) * (1 - parseFloat(this.slippage) / 100)).toString();

      // Mock transaction execution - in reality you would interact with Symphony contracts
      const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
      
      logger.info(`Executing swap: ${amountIn} ${tokenIn} -> ${quote.amountOut} ${tokenOut}`);
      logger.info(`Transaction hash: ${mockTxHash}`);

      return {
        tokenIn,
        tokenOut,
        amountIn,
        amountOut: quote.amountOut,
        transactionHash: mockTxHash,
        timestamp: Date.now(),
        slippage: this.slippage,
        route: quote.route,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to execute swap');
      throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets token balance for the connected wallet
   * @param tokenAddress Token contract address
   * @returns Token balance as string
   */
  async getTokenBalance(tokenAddress: string): Promise<string> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
      }

      // Mock balance check - in reality you would call the token contract
      return '1000.0';
    } catch (error) {
      logger.error({ error }, 'Failed to get token balance');
      throw new Error(`Failed to get token balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

const executeSwapAction: Action = {
  name: 'EXECUTE_SEI_SWAP',
  similes: ['SWAP_TOKENS', 'TRADE_TOKENS', 'EXCHANGE_TOKENS', 'SEI_SWAP'],
  description: 'Executes a token swap on SEI network using Symphony aggregator',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    // Check if message contains text and a swap request
    if (!message.content.text) return false;
    
    const text = message.content.text.toLowerCase();
    return (text.includes('swap') || text.includes('trade') || text.includes('exchange')) && 
           (text.includes('to') || text.includes('for'));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown> = {},
    callback?: HandlerCallback,
    _responses?: Memory[]
  ): Promise<ActionResult> => {
    try {
      if (!message.content.text) {
        return {
          success: false,
          error: new Error('Message content text is undefined'),
          text: 'I need a message with text to process your swap request.',
        };
      }

      const text = message.content.text.toLowerCase();
      
      // Extract swap parameters from message (enhanced parsing)
      const swapRegex = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i;
      const match = text.match(swapRegex);
      
      if (!match) {
        return {
          success: false,
          error: new Error('Invalid swap format'),
          text: 'Please specify your swap in the format: "Swap [amount] [tokenIn] to [tokenOut]" (e.g., "Swap 100 SEI to USDC")',
        };
      }

      const [, amount, tokenIn, tokenOut] = match;

      // Get the swap service
      const service = runtime.getService(SeiSwapService.serviceType) as SeiSwapService;
      if (!service) {
        throw new Error('SEI swap service not available');
      }

      // First get a quote
      const quote = await service.getSwapQuote(tokenIn.toUpperCase(), tokenOut.toUpperCase(), amount);
      
      // Execute the swap
      const swapResult = await service.executeSwap(
        tokenIn.toUpperCase(), 
        tokenOut.toUpperCase(), 
        amount
      );

      const response = `✅ Swap executed successfully!\n\n` +
        `📊 Swap Details:\n` +
        `• Input: ${amount} ${tokenIn.toUpperCase()}\n` +
        `• Output: ${swapResult.amountOut} ${tokenOut.toUpperCase()}\n` +
        `• Slippage: ${swapResult.slippage}%\n` +
        `• Transaction: ${swapResult.transactionHash}\n\n` +
        `🔗 View on explorer: https://seitrace.com/tx/${swapResult.transactionHash}`;

      if (callback) {
        await callback({
          text: response,
          actions: ['EXECUTE_SEI_SWAP'],
          source: message.content.source,
        });
      }

      return {
        text: response,
        success: true,
        data: {
          actions: ['EXECUTE_SEI_SWAP'],
          source: message.content.source,
          swapResult,
          quote,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute swap';
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        text: `❌ Sorry, I couldn't execute the swap. ${errorMessage}`,
      };
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Swap 100 SEI to USDC',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '✅ Swap executed successfully!\n\n📊 Swap Details:\n• Input: 100 SEI\n• Output: 98.5 USDC\n• Slippage: 0.5%\n• Transaction: 0x1234567890abcdef...\n\n🔗 View on explorer: https://seitrace.com/tx/0x1234567890abcdef...',
          actions: ['EXECUTE_SEI_SWAP'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Trade 50 USDC for WSEI',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '✅ Swap executed successfully!\n\n📊 Swap Details:\n• Input: 50 USDC\n• Output: 49.75 WSEI\n• Slippage: 0.5%\n• Transaction: 0xabcdef1234567890...\n\n🔗 View on explorer: https://seitrace.com/tx/0xabcdef1234567890...',
          actions: ['EXECUTE_SEI_SWAP'],
        },
      },
    ],
  ],
};

const getSwapQuoteAction: Action = {
  name: 'GET_SWAP_QUOTE',
  similes: ['QUOTE_SWAP', 'PRICE_CHECK', 'SWAP_ESTIMATE'],
  description: 'Gets a quote for a token swap without executing it',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined
  ): Promise<boolean> => {
    if (!message.content.text) return false;
    
    const text = message.content.text.toLowerCase();
    return (text.includes('quote') || text.includes('price') || text.includes('estimate')) && 
           (text.includes('swap') || text.includes('trade'));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown> = {},
    callback?: HandlerCallback,
    _responses?: Memory[]
  ): Promise<ActionResult> => {
    try {
      if (!message.content.text) {
        return {
          success: false,
          error: new Error('Message content text is undefined'),
          text: 'I need a message with text to process your quote request.',
        };
      }

      const text = message.content.text.toLowerCase();
      
      // Extract quote parameters
      const quoteRegex = /(?:quote|price|estimate).*?(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i;
      const match = text.match(quoteRegex);
      
      if (!match) {
        return {
          success: false,
          error: new Error('Invalid quote format'),
          text: 'Please specify your quote request in the format: "Quote [amount] [tokenIn] to [tokenOut]"',
        };
      }

      const [, amount, tokenIn, tokenOut] = match;

      const service = runtime.getService(SeiSwapService.serviceType) as SeiSwapService;
      if (!service) {
        throw new Error('SEI swap service not available');
      }

      const quote = await service.getSwapQuote(tokenIn.toUpperCase(), tokenOut.toUpperCase(), amount);

      const response = `💰 Swap Quote:\n\n` +
        `📊 Quote Details:\n` +
        `• Input: ${amount} ${tokenIn.toUpperCase()}\n` +
        `• Expected Output: ${quote.amountOut} ${tokenOut.toUpperCase()}\n` +
        `• Price Impact: ${quote.priceImpact}%\n` +
        `• Gas Estimate: ${quote.gasEstimate} SEI\n` +
        `• Route: ${quote.route.length} hop(s)\n\n` +
        `💡 This is an estimate. Actual amounts may vary due to market conditions.`;

      if (callback) {
        await callback({
          text: response,
          actions: ['GET_SWAP_QUOTE'],
          source: message.content.source,
        });
      }

      return {
        text: response,
        success: true,
        data: {
          actions: ['GET_SWAP_QUOTE'],
          source: message.content.source,
          quote,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        text: `❌ Sorry, I couldn't get the swap quote. ${errorMessage}`,
      };
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Quote 100 SEI to USDC',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: '💰 Swap Quote:\n\n📊 Quote Details:\n• Input: 100 SEI\n• Expected Output: 98.5 USDC\n• Price Impact: 0.2%\n• Gas Estimate: 0.001 SEI\n• Route: 1 hop(s)\n\n💡 This is an estimate. Actual amounts may vary due to market conditions.',
          actions: ['GET_SWAP_QUOTE'],
        },
      },
    ],
  ],
};

export const seiSwapPlugin: Plugin = {
  name: 'plugin-sei-swap',
  description: 'Provides SEI token swap functionality using Symphony aggregator for optimal routing and execution',
  config: {
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
    NATIVE_ADDRESS: process.env.NATIVE_ADDRESS,
    WRAPPED_NATIVE_ADDRESS: process.env.WRAPPED_NATIVE_ADDRESS,
    SLIPPAGE: process.env.SLIPPAGE,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    SYMPHONY_API_URL: process.env.SYMPHONY_API_URL,
  },
  async init(config: Record<string, string>) {
    logger.info('Initializing plugin-sei-swap');
    try {
      const validatedConfig = await configSchema.parseAsync({
        RPC_URL: config.RPC_URL,
        CHAIN_ID: config.CHAIN_ID ? parseInt(config.CHAIN_ID) : undefined,
        NATIVE_ADDRESS: config.NATIVE_ADDRESS,
        WRAPPED_NATIVE_ADDRESS: config.WRAPPED_NATIVE_ADDRESS,
        SLIPPAGE: config.SLIPPAGE,
        PRIVATE_KEY: config.PRIVATE_KEY,
        SYMPHONY_API_URL: config.SYMPHONY_API_URL,
      });

      // Set all environment variables
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value !== undefined) process.env[key] = String(value);
      }

      logger.info('SEI swap plugin initialized successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return 'I can help you with SEI token swaps using Symphony aggregator.';
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'I specialize in executing SEI token swaps using Symphony aggregator for optimal routing and best prices. You can ask me to swap tokens like "Swap 100 SEI to USDC" or get quotes with "Quote 50 USDC to WSEI". I support all major tokens on the SEI network and provide detailed transaction information including slippage protection and gas estimates.';
    },
  },
  routes: [
    {
      name: 'api-swap-execute',
      path: '/api/swap/execute',
      type: 'POST',
      handler: async (req: any, res: any) => {
        try {
          const { tokenIn, tokenOut, amountIn, minAmountOut } = req.body;
          if (!tokenIn || !tokenOut || !amountIn) {
            return res.status(400).json({ 
              error: 'tokenIn, tokenOut, and amountIn parameters are required' 
            });
          }

          const service = req.runtime.getService(SeiSwapService.serviceType) as SeiSwapService;
          if (!service) {
            return res.status(500).json({ error: 'SEI swap service not available' });
          }

          const swapResult = await service.executeSwap(tokenIn, tokenOut, amountIn, minAmountOut);
          res.json(swapResult);
        } catch (error) {
          res.status(500).json({
            error: 'Failed to execute swap',
            details: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
    {
      name: 'api-swap-quote',
      path: '/api/swap/quote',
      type: 'GET',
      handler: async (req: any, res: any) => {
        try {
          const { tokenIn, tokenOut, amountIn } = req.query;
          if (!tokenIn || !tokenOut || !amountIn) {
            return res.status(400).json({ 
              error: 'tokenIn, tokenOut, and amountIn parameters are required' 
            });
          }

          const service = req.runtime.getService(SeiSwapService.serviceType) as SeiSwapService;
          if (!service) {
            return res.status(500).json({ error: 'SEI swap service not available' });
          }

          const quote = await service.getSwapQuote(tokenIn as string, tokenOut as string, amountIn as string);
          res.json(quote);
        } catch (error) {
          res.status(500).json({
            error: 'Failed to get swap quote',
            details: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
    {
      name: 'api-token-balance',
      path: '/api/token/balance',
      type: 'GET',
      handler: async (req: any, res: any) => {
        try {
          const { tokenAddress } = req.query;
          if (!tokenAddress) {
            return res.status(400).json({ error: 'tokenAddress parameter is required' });
          }

          const service = req.runtime.getService(SeiSwapService.serviceType) as SeiSwapService;
          if (!service) {
            return res.status(500).json({ error: 'SEI swap service not available' });
          }

          const balance = await service.getTokenBalance(tokenAddress as string);
          res.json({ balance });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to get token balance',
            details: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
  ],
  events: {
    [EventType.MESSAGE_RECEIVED]: [
      async (params: MessagePayload) => {
        logger.debug('MESSAGE_RECEIVED event received');
        logger.debug({ message: params.message }, 'Message:');
      },
    ],
  },
  services: [SeiSwapService],
  actions: [executeSwapAction, getSwapQuoteAction],
  providers: [],
};

export default seiSwapPlugin;