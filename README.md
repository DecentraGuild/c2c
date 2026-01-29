# dGuild Escrow - P2P Token Exchange

A decentralized peer-to-peer escrow service for SPL tokens on Solana. Create secure token exchanges with customizable settings.

## Contract Information

**Program ID:** `esccxeEDYUXQaeMwq1ZwWAvJaHVYfsXNva13JYb2Chs`

**Network:** Solana Mainnet

## Pricing

### Transaction Fees
- **Maker Fee:** 0.01 SOL per trade (non-recoverable)
- **Taker Fee:** 0.0006 SOL per trade (non-recoverable)

### Solana Rent Accounts
- **Rent per Account:** 0.00022 SOL per account (recoverable, minimal 2 per escrow)

### Monthly Subscriptions (Coming Soon)
- **$5/month:** 5 escrows free, 20% discount on rest
- **$10/month:** 10 escrows free, 50% discount on rest
- **$25/month:** unlimited escrows free

**Note:** Transaction costs may vary based on network conditions and account creation requirements.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- A Solana wallet (Phantom, Solflare, etc.)
- Helius API key (for production)

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Helius API Key (required for production)
# Get your API key from https://www.helius.dev/
VITE_HELIUS_API_KEY=your_helius_api_key_here

# Alternative: Full Helius RPC URL (optional, if not using VITE_HELIUS_API_KEY)
# VITE_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=your_api_key_here

# Network (optional, defaults to mainnet)
# Options: mainnet, devnet
# VITE_NETWORK=mainnet
```

**Important:** Never commit your `.env` file to version control. The `.env` file should be in `.gitignore`.


## Features

- Create escrow transactions for any SPL tokens
- Direct counterparty or whitelist support
- Expiration dates
- Partial fill support
- Slippage tolerance
- Real-time price calculation
- Transaction cost estimation
- Share escrows via QR code or link

## Usage

1. **Create Escrow:**
   - Select offer token and amount
   - Select request token and amount
   - Configure additional settings (optional)
   - Review transaction costs
   - Submit transaction

2. **Fill Escrow:**
   - Open escrow link or scan QR code
   - Review escrow details
   - Confirm exchange
   - Submit transaction

3. **Manage Escrows:**
   - View all your created escrows
   - Cancel or modify escrows
   - Track escrow status

## Tech Stack

- Vue 3 (Composition API)
- Vite
- Tailwind CSS
- Solana Web3.js & Anchor
- Helius RPC

## Deployment

Build the production bundle:

```bash
npm run build
```

Deploy the `dist/` folder to any static hosting service:
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## Security

- Never commit API keys to version control
- Wallet private keys never leave your wallet
- All transactions are validated before submission
- Use environment variables for sensitive configuration

## Support

For issues and questions, please open an issue on the repository.
