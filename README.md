# SEI Swap Plugin

A comprehensive SEI token swap plugin for ElizaOS using Symphony aggregator for optimal routing and execution on the SEI network.

## Features

- 🔄 **Token Swaps**: Execute seamless token swaps on SEI network
- 💰 **Quote System**: Get accurate swap quotes before execution
- 🛡️ **Slippage Protection**: Configurable slippage tolerance
- 🔗 **Symphony Integration**: Uses Symphony aggregator for best prices
- 📊 **Detailed Analytics**: Comprehensive swap details and transaction tracking
- 🌐 **REST API**: Full HTTP API for programmatic access
- 💼 **Wallet Integration**: Secure wallet management with private key support

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in your `.env` file:
```env
# SEI Network Configuration
RPC_URL=https://sei-rpc.publicnode.com
CHAIN_ID=1329
NATIVE_ADDRESS=0x0000000000000000000000000000000000000000
WRAPPED_NATIVE_ADDRESS=0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7

# Swap Configuration
SLIPPAGE=0.5
SYMPHONY_API_URL=https://api.symph.ag

# Wallet Configuration (Optional - for executing swaps)
PRIVATE_KEY=your_private_key_here
```

## Usage

### Text Commands

The plugin supports natural language commands for swapping tokens:

#### Execute Swaps
```
"Swap 100 SEI to USDC"
"Trade 50 USDC for WSEI"
"Exchange 25 SEI to USDT"
```

#### Get Quotes
```
"Quote 100 SEI to USDC"
"Price check 50 USDC to WSEI"
"Estimate 25 SEI to USDT"
```

### REST API

#### Execute Swap
```http
POST /api/swap/execute
Content-Type: application/json

{
  "tokenIn": "SEI",
  "tokenOut": "USDC",
  "amountIn": "100",
  "minAmountOut": "98.5"
}
```

#### Get Quote
```http
GET /api/swap/quote?tokenIn=SEI&tokenOut=USDC&amountIn=100
```

#### Get Token Balance
```http
GET /api/token/balance?tokenAddress=0x...
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | SEI network RPC endpoint | `https://sei-rpc.publicnode.com` |
| `CHAIN_ID` | SEI network chain ID | `1329` |
| `NATIVE_ADDRESS` | Native SEI token address | `0x0000000000000000000000000000000000000000` |
| `WRAPPED_NATIVE_ADDRESS` | Wrapped SEI token address | `0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7` |
| `SLIPPAGE` | Default slippage tolerance (%) | `0.5` |
| `SYMPHONY_API_URL` | Symphony API endpoint | `https://api.symph.ag` |
| `PRIVATE_KEY` | Wallet private key (optional) | - |

### Plugin Configuration

```typescript
import { seiSwapPlugin } from './timeplugin';

// Initialize with custom config
await seiSwapPlugin.init({
  RPC_URL: 'https://custom-sei-rpc.com',
  SLIPPAGE: '1.0',
  // ... other config options
});
```

## Architecture

### Services

- **SeiSwapService**: Core service handling swap operations, quotes, and balance checks

### Actions

- **EXECUTE_SEI_SWAP**: Executes token swaps with comprehensive error handling
- **GET_SWAP_QUOTE**: Provides swap quotes without execution

### API Routes

- **POST /api/swap/execute**: Execute token swaps
- **GET /api/swap/quote**: Get swap quotes
- **GET /api/token/balance**: Check token balances

## Security

- Private keys are optional and only used for executing transactions
- All transactions include slippage protection
- Comprehensive error handling and validation
- Input sanitization for all user inputs

## Error Handling

The plugin includes robust error handling for:

- Invalid swap formats
- Insufficient balances
- Network connectivity issues
- Transaction failures
- Invalid token addresses

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Symphony Integration

This plugin integrates with Symphony's aggregation protocol to provide:

- **Optimal Routing**: Best prices across all DEXs on SEI
- **Low Slippage**: Minimal price impact for trades
- **Gas Optimization**: Efficient transaction execution
- **Multi-hop Swaps**: Complex routing when beneficial

## Supported Tokens

The plugin supports all major tokens on the SEI network including:

- SEI (Native)
- WSEI (Wrapped SEI)
- USDC
- USDT
- And other ERC-20 tokens on SEI

## Examples

### Basic Swap
```typescript
// Text input: "Swap 100 SEI to USDC"
// Response: Detailed swap execution with transaction hash

✅ Swap executed successfully!

📊 Swap Details:
• Input: 100 SEI
• Output: 98.5 USDC
• Slippage: 0.5%
• Transaction: 0x1234567890abcdef...

🔗 View on explorer: https://seitrace.com/tx/0x1234567890abcdef...
```

### Quote Request
```typescript
// Text input: "Quote 100 SEI to USDC"
// Response: Detailed quote information

💰 Swap Quote:

📊 Quote Details:
• Input: 100 SEI
• Expected Output: 98.5 USDC
• Price Impact: 0.2%
• Gas Estimate: 0.001 SEI
• Route: 1 hop(s)

💡 This is an estimate. Actual amounts may vary due to market conditions.
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Open an issue on GitHub
- Check the Symphony documentation at [docs.symph.ag](https://docs.symph.ag)
- Review the ElizaOS documentation

## Roadmap

- [ ] Real Symphony SDK integration
- [ ] Advanced routing algorithms
- [ ] Multi-chain support
- [ ] Limit orders
- [ ] Portfolio tracking
- [ ] Price alerts
- [ ] Historical analytics
