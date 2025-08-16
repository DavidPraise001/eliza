# SEI Swap Plugin

A comprehensive plugin for swapping SEI tokens using the Symphony protocol. This plugin integrates with the ElizaOS core system and provides both programmatic and conversational interfaces for token swapping.

## Features

- **SEI Token Swapping**: Swap between SEI and SEIYAN tokens using Symphony protocol
- **Balance Checking**: Check token balances for connected wallet
- **Route Discovery**: Get optimal swap routes before execution
- **Slippage Protection**: Configurable slippage tolerance
- **REST API Endpoints**: Programmatic access to swap functionality
- **Conversational Interface**: Natural language processing for swap requests

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sei-swap-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```bash
# Required: Your wallet private key
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Optional: SEI RPC URL (defaults to testnet)
RPC_URL=https://rpc-testnet.sei.io

# Optional: Slippage tolerance (defaults to 1.0%)
SLIPPAGE_TOLERANCE=1.0
```

## Configuration

### Environment Variables

- `PRIVATE_KEY`: Your wallet's private key (required)
- `RPC_URL`: SEI network RPC endpoint (optional, defaults to testnet)
- `SLIPPAGE_TOLERANCE`: Slippage tolerance percentage (optional, defaults to 1.0%)

### Supported Networks

- **Testnet**: `https://rpc-testnet.sei.io` (default)
- **Mainnet**: `https://rpc.sei.io`

## Usage

### Conversational Interface

The plugin responds to natural language requests:

```
User: "Swap 1 SEI to SEIYAN"
Bot: "Successfully swapped 1.0 SEI to 0.95 SEIYAN. Transaction Hash: 0x1234..."

User: "Check my token balances"
Bot: "Your balances:
- SEI: 10.5
- SEIYAN: 25.0"
```

### REST API Endpoints

#### Get Swap Route
```bash
GET /api/swap/route?fromToken=0x...&toToken=0x...&amountIn=1.0
```

#### Execute Swap
```bash
POST /api/swap/execute
Content-Type: application/json

{
  "route": {...},
  "slippageAmount": "1.0"
}
```

#### Check Balances
```bash
GET /api/balance
```

### Programmatic Usage

```typescript
import { seiSwapPlugin } from './sei-swap-plugin';

// Initialize the plugin
await seiSwapPlugin.init({
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  RPC_URL: process.env.RPC_URL,
  SLIPPAGE_TOLERANCE: process.env.SLIPPAGE_TOLERANCE
});

// Get the service
const service = runtime.getService('sei-swap') as SeiSwapService;

// Get swap route
const route = await service.getSwapRoute(
  '0x...', // fromToken
  '0x...', // toToken
  '1.0'    // amountIn
);

// Execute swap
const result = await service.executeSwap(route, '1.0');
console.log(`Swap completed: ${result.transactionHash}`);
```

## Supported Tokens

- **SEI**: Native token (address: `0x...`)
- **SEIYAN**: SEIYAN token (address: `0x5f0e07dfee5832faa00c63f2d33a0d79150e8598`)

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### TypeScript

The project is written in TypeScript with strict type checking enabled.

## Security Considerations

- **Private Key**: Never commit your private key to version control
- **Environment Variables**: Use `.env` files for local development
- **Network Selection**: Use testnet for development and testing
- **Slippage Protection**: Configure appropriate slippage tolerance

## Error Handling

The plugin includes comprehensive error handling for:
- Network connectivity issues
- Insufficient balances
- Failed transactions
- Invalid token addresses
- Configuration errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the documentation
- Review error logs
- Open an issue on GitHub

## Changelog

### v1.0.0
- Initial release
- SEI to SEIYAN swapping
- Balance checking
- REST API endpoints
- Conversational interface
