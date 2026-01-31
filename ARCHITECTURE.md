# Architecture Documentation

**Project:** dGuild Escrow - P2P Multitenant Marketplace  
**Framework:** Vue 3 (Composition API) + Solana  
**Last Updated:** January 30, 2026

---

## Overview

This is a peer-to-peer multitenant marketplace built on Solana blockchain. The application allows users to create and fill escrow transactions for SPL tokens, with support for NFT collections and marketplace customization.

---

## Architecture Principles

### 1. Separation of Concerns

- **Stores (Pinia):** Global state management
- **Composables:** Reusable reactive logic for components
- **Utils:** Pure functions, no reactivity
- **Components:** UI presentation and user interaction

### 2. Single Source of Truth

- **Constants:** All configuration in `src/utils/constants/`
- **Error Handling:** Unified `errorHandler.js`
- **Logging:** Centralized `logger.js`
- **Wallet Validation:** Single `useWalletValidation` composable

### 3. Code Organization

```
src/
├── components/     # Vue components (UI)
├── composables/   # Vue composables (reactive logic)
├── stores/        # Pinia stores (global state)
├── utils/         # Pure functions and utilities
│   ├── constants/ # Configuration constants
│   └── ...
├── views/         # Page components
└── router/        # Vue Router configuration
```

---

## State Management

### Stores (Pinia)

**Purpose:** Global application state that needs to persist or be shared across components.

**Stores:**
- `escrow.js` - Escrow creation and management state
- `token.js` - Token registry and wallet balances
- `theme.js` - Theme configuration and customization
- `collection.js` - NFT collection management

**When to Use Stores:**
- Data shared across multiple components
- State that needs persistence (localStorage)
- Complex state with multiple related properties

### Composables

**Purpose:** Reusable reactive logic that can be used in components.

**Categories:**
- Transaction composables (escrow operations, costs)
- Wallet composables (validation, balances, NFTs)
- Token composables (registry, metadata)
- **Collection composables** (`useCollectionDisplay`, `useCollectionMetadata`, `useCollectionNFTs`)
- UI composables (theme, toast, modals)
- Form composables (debounce, decimal handling)

**When to Use Composables:**
- Need reactive state (ref, computed)
- Need Vue lifecycle hooks
- Logic reusable across components
- Component-specific state management

### Utilities

**Purpose:** Pure functions with no reactivity or side effects.

**When to Use Utilities:**
- Pure calculations
- Data transformations
- Validation logic
- No reactive state needed
- Can be used outside Vue components

---

## Error Handling

### Unified Error System

All errors go through `src/utils/errorHandler.js`:

```javascript
import { formatError } from '@/utils/errorHandler'

try {
  // operation
} catch (err) {
  const errorMsg = formatError(err, 'operation context', 'Default message')
  // Handle error
}
```

### Error Types

- `TRANSACTION` - Blockchain/Anchor errors
- `WALLET` - Wallet connection/validation errors
- `NETWORK` - RPC/network errors
- `VALIDATION` - Input validation errors
- `FORM` - Form-specific errors

### Error Display

Use `useErrorDisplay` composable for consistent error display:

```javascript
const { displayError } = useErrorDisplay({ 
  txError, 
  errorTypes: ['transaction', 'form'] 
})
```

---

## Constants Management

All constants are centralized in `src/utils/constants/`:

- `ui.js` - UI constants (debounce delays, cache config, search limits)
- `escrow.js` - Escrow program constants
- `fees.js` - Fee configuration
- `tokens.js` - Token constants
- `networks.js` - Network configuration

**Rule:** No magic numbers in code - all values come from constants.

---

## Logging

All logging uses centralized logger (`src/utils/logger.js`):

```javascript
import { logDebug, logWarning, logError } from '@/utils/logger'

logDebug('Debug message')
logWarning('Warning message')
logError('Error message', error)
```

**Rule:** Never use `console.log` directly - always use the logger.

---

## Wallet Management

### Wallet Validation

Single source of truth: `useWalletValidation` composable

```javascript
const { validateWallet, isWalletReady } = useWalletValidation()

// Validate before transaction
const { anchorWallet } = validateWallet('perform transaction')
```

### Wallet Connection

Uses `solana-wallets-vue` library with automatic Wallet Standard detection.

---

## Transaction Building

### Pattern

1. **Utility Functions** (`escrowTransactions.js`) - Build transaction objects
2. **Composable** (`useEscrowTransactions`) - Orchestrate transaction flow
   - Wallet validation
   - Transaction building
   - Sending and confirmation
   - Error handling

### Fee Handling

Shop fees handled by `marketplaceFees.js` service:
- Base platform fees: 0.001 SOL (maker), 0.0006 SOL (taker)
- Shop fee calculation (flat fees and/or percentage fees)
- Fee transfer instructions (shops keep 100% of their fees)

---

## Caching Strategy

### Token Metadata Cache

- **Location:** `src/utils/cacheManager.js`
- **Storage:** localStorage
- **TTL:** 30 days
- **Max Entries:** 1000 tokens

### Token Registry Cache

- **Location:** Module-level singleton in `tokenRegistry.js`
- **TTL:** 24 hours
- **Lazy Loading:** Registry loads on-demand

---

## Collection Display Pattern

### useCollectionDisplay Composable

Centralizes collection display logic for card and list views:

```javascript
import { useCollectionDisplay } from '@/composables/useCollectionDisplay'

// In component
const {
  getMakerFee,           // Platform + shop maker fee
  getTakerFee,           // Platform + shop taker fee
  getShopFeeDisplay,     // Formatted shop fee display
  collectionMintsList,   // Processed & sorted mints
  maxRoyalty,            // Maximum royalty percentage
  acceptedCurrencies,    // Collection currencies with metadata
  formatRoyaltyFee       // Format royalty for display
} = useCollectionDisplay(computed(() => collection))
```

**Benefits:**
- Single source of truth for collection display
- Handles both old (string array) and new (object array) formats
- Consistent calculations across components
- Easy to test and maintain

### Fee Constants (CRITICAL)

**Rule:** Never hardcode fee values - always import from constants.

```javascript
import { TRANSACTION_COSTS, FEE_CONFIG } from '@/utils/constants/fees'

// Correct ✅
const makerFee = TRANSACTION_COSTS.PLATFORM_MAKER_FEE  // 0.001
const takerFee = TRANSACTION_COSTS.PLATFORM_TAKER_FEE  // 0.0006

// Wrong ❌
const makerFee = 0.001  // Don't hardcode!
const takerFee = 0.0006 // Don't hardcode!
```

**Fee Structure:**
- `TRANSACTION_COSTS.PLATFORM_MAKER_FEE` - Base maker fee (0.001 SOL)
- `TRANSACTION_COSTS.PLATFORM_TAKER_FEE` - Base taker fee (0.0006 SOL)
- `FEE_CONFIG.WALLET` - Platform fee wallet address
- Shop fees calculated via `marketplaceFees.js`

### Shared Scrollbar Styles

Custom scrollbars are now in global CSS (`style.css`):

```html
<!-- In component template -->
<div class="collection-scroll-container max-h-48 overflow-y-auto">
  <div class="collection-scroll-content">
    <!-- Your scrollable content -->
  </div>
</div>
```

**Features:**
- RTL container for right-side scrollbar
- Theme-aware colors
- Webkit and Firefox support
- Consistent styling across app

### Debounce Pattern

**Rule:** Import debounce from the correct location.

```javascript
// For utilities and composables ✅
import { debounce } from '@/utils/debounce'

// For Vue components (with auto-cleanup) ✅
import { useDebounce } from '@/composables/useDebounce'

// Wrong ❌
import { debounce } from '@/utils/formatters'  // Removed!
```

---

## Code Patterns

### Composable Pattern

```javascript
export function useComposableName(params) {
  // Reactive state
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)
  
  // Methods
  const fetchData = async () => {
    loading.value = true
    try {
      data.value = await utilityFunction(params)
    } catch (err) {
      error.value = formatError(err, 'context')
    } finally {
      loading.value = false
    }
  }
  
  return {
    // Read-only state (computed)
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    data: computed(() => data.value),
    
    // Methods
    fetchData
  }
}
```

### Utility Pattern

```javascript
/**
 * Pure function description
 * @param {Type} param - Parameter description
 * @returns {Type} Return description
 */
export function utilityFunction(param) {
  // Pure logic, no reactivity
  return result
}
```

### Store Pattern

```javascript
export const useStoreName = defineStore('storeName', () => {
  // State
  const data = ref([])
  const loading = ref(false)
  
  // Computed
  const filteredData = computed(() => {
    return data.value.filter(/* ... */)
  })
  
  // Actions
  const fetchData = async () => {
    // Implementation
  }
  
  return {
    data,
    loading,
    filteredData,
    fetchData
  }
})
```

---

## File Naming Conventions

- **Components:** PascalCase (`EscrowCard.vue`)
- **Composables:** camelCase with `use` prefix (`useEscrowTransactions.js`)
- **Stores:** camelCase (`escrow.js`, `token.js`)
- **Utils:** camelCase (`escrowTransactions.js`, `errorHandler.js`)
- **Constants:** camelCase (`escrow.js`, `fees.js`)

---

## Import Patterns

### Absolute Imports (Preferred)

```javascript
import { formatError } from '@/utils/errorHandler'
import { useEscrowStore } from '@/stores/escrow'
```

### Relative Imports (Within Same Directory)

```javascript
import { debounce } from './debounce'
```

---

## Testing Strategy

### Unit Tests (Future)

- **Utils:** Test pure functions
- **Composables:** Test reactive behavior
- **Stores:** Test state management

### Integration Tests (Future)

- **Transaction Flow:** End-to-end escrow creation/fill
- **Wallet Integration:** Wallet connection and validation

---

## Performance Considerations

### Code Splitting

- Routes are lazy-loaded
- Token registry is lazy-loaded (~2-3 MB)
- Large dependencies loaded on-demand

### Caching

- Token metadata cached in localStorage
- Registry cached at module level
- Cache invalidation on errors

### Debouncing

- Search operations debounced (300ms default)
- Cost calculations debounced
- All debounce delays in constants

---

## Security

### API Keys

- Never logged, even in dev mode
- Stored in environment variables
- Validated at build time

### Input Validation

- All user inputs validated
- Address validation before use
- Amount validation with balance checks

### Transaction Safety

- All transactions validated before sending
- Fee calculations verified
- Error handling for all operations

---

## Multi-Tenant Architecture

### Collection System

- Collections loaded from JSON files (`public/Collections/`)
- Each collection can have:
  - Custom theme/colors
  - Custom fees
  - Custom logo/branding
  - Collection-specific NFTs/tokens

### Marketplace Fees

- Collections can enable marketplace fees
- Fees split 50/50 between marketplace and platform
- Fee-free option for collections

---

## Future Enhancements

### Planned Improvements

1. **Backend API Integration**
   - Replace JSON file loading with API calls
   - Collection registration API
   - Escrow indexing service

2. **Testing**
   - Unit tests for utilities
   - Component tests
   - Integration tests

3. **Performance**
   - Virtual scrolling for large lists
   - Image lazy loading
   - Service worker caching

4. **Features**
   - Escrow history
   - Advanced filtering
   - Collection analytics

---

## Development Guidelines

### Adding New Features

1. **Determine Location:**
   - Component? → `src/components/`
   - Composable? → `src/composables/`
   - Utility? → `src/utils/`
   - Store? → `src/stores/`

2. **Follow Patterns:**
   - Use existing patterns as templates
   - Follow naming conventions
   - Add JSDoc documentation

3. **Error Handling:**
   - Use `formatError` from `errorHandler.js`
   - Provide user-friendly messages
   - Log errors appropriately

4. **Constants:**
   - Add magic numbers to constants files
   - Use existing constants when possible
   - Document constant values

5. **Testing:**
   - Test utilities thoroughly
   - Test composables with reactive state
   - Test error cases

---

## Code Review Checklist

- [ ] Uses centralized error handling
- [ ] Uses centralized logger (no console.log)
- [ ] Constants extracted (no magic numbers)
- [ ] Follows composable patterns
- [ ] Proper JSDoc documentation
- [ ] Error handling for async operations
- [ ] Loading states provided
- [ ] No dead/commented code
- [ ] Consistent naming conventions
- [ ] Proper import organization

---

## Resources

- **Vue 3 Docs:** https://vuejs.org/
- **Pinia Docs:** https://pinia.vuejs.org/
- **Solana Web3.js:** https://solana-labs.github.io/solana-web3.js/
- **Anchor Framework:** https://www.anchor-lang.com/

---

**Maintained By:** dGuild Development Team  
**Status:** Production Ready
