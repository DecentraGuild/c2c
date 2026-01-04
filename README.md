# dGuild Escrow - DecentraGuild

A multi-tenant escrow service for SPL tokens on Solana, built with Vue.js. Part of the DecentraGuild product line.

## Features

- Create escrow transactions for SPL tokens
- Select offer and request tokens with amounts
- Additional settings:
  - Direct counterparty (single address only)
  - Whitelist counterparty (list of allowed addresses)
  - Expiration date
  - Partial fill support
  - Slippage tolerance
- Real-time price calculation
- Wallet balance preview
- Transaction cost estimation
- Share escrows via QR code or link

## Tech Stack

- Vue 3 with Composition API
- Vite for build tooling
- Tailwind CSS for styling
- Vue Router for navigation
- Pinia for state management
- @iconify/vue for icons
- Solana Web3.js & Anchor for blockchain integration
- Helius RPC for reliable Solana connections

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required for production
VITE_HELIUS_API_KEY=your-helius-api-key-here

# Optional: Network selection (mainnet/devnet)
# VITE_NETWORK=mainnet
```

### Getting a Helius API Key

1. Visit [Helius.dev](https://www.helius.dev/)
2. Sign up for a free account
3. Create a new API key
4. Copy the API key to your `.env` file

**Note:** The API key is required for production builds. Development mode will work without it but may have rate limiting.

## Production Deployment

### Build for Production

```bash
# Set environment variables
export VITE_HELIUS_API_KEY=your-api-key

# Build
npm run build

# The dist/ folder contains the production build
```

### Deployment Checklist

- [ ] Set `VITE_HELIUS_API_KEY` environment variable
- [ ] Test production build locally with `npm run preview`
- [ ] Verify wallet connections work correctly
- [ ] Test transaction flows on mainnet/devnet
- [ ] Check error handling and user feedback
- [ ] Verify all routes work correctly
- [ ] Test on mobile devices
- [ ] Check browser console for errors

### Recommended Hosting

- **Vercel**: Automatic deployments from Git
- **Netlify**: Easy static site hosting
- **Cloudflare Pages**: Fast global CDN
- **GitHub Pages**: Free hosting for public repos

## Project Structure

```
src/
  ├── components/       # Reusable Vue components
  ├── views/           # Page components
  ├── composables/     # Vue composables (hooks)
  ├── stores/          # Pinia state management
  ├── router/          # Vue Router configuration
  ├── utils/           # Utility functions
  │   ├── constants/   # Configuration constants
  │   └── ...          # Other utilities
  ├── idl/            # Anchor program IDL
  ├── App.vue         # Root component
  ├── main.js         # Application entry point
  └── style.css       # Global styles and Tailwind imports
```

## Security Notes

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use `.env` files (already in `.gitignore`)
- **Wallet Security**: Users' private keys never leave their wallets
- **Transaction Validation**: All transactions are validated before submission

## Error Handling

The application includes comprehensive error handling:

- **Anchor Errors**: Program errors are parsed and displayed user-friendly
- **Network Errors**: Network issues are detected and retryable errors identified
- **Wallet Errors**: Wallet-specific errors (rejection, connection) are handled
- **User Feedback**: All errors provide actionable feedback to users

## Performance

- **Code Splitting**: Automatic code splitting for optimal bundle sizes
- **Connection Pooling**: Singleton Solana connection to reduce RPC calls
- **Lazy Loading**: Components loaded on-demand
- **Token Registry Caching**: Token information cached to reduce API calls

## Troubleshooting

### Wallet Connection Issues

- Ensure wallet extension is installed and unlocked
- Check browser console for errors
- Try disconnecting and reconnecting wallet

### Transaction Failures

- Check SOL balance (needed for transaction fees)
- Verify token balances are sufficient
- Check network connection
- Review error messages for specific issues

### Build Errors

- Ensure all environment variables are set
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (recommended: 18+)

## License

[Your License Here]

## Support

For issues and questions, please open an issue on the repository.
