# Composables Documentation

This directory contains Vue 3 Composition API composables for reusable reactive logic.

## Export Pattern Standard

All composables follow this standard pattern:

```javascript
/**
 * Composable description
 * @param {Type} param - Parameter description
 * @returns {Object} Return object with reactive state and methods
 */
export function useComposableName(params) {
  // Reactive state
  const state = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // Methods
  const method = () => {
    // Implementation
  }
  
  // Return object with consistent structure
  return {
    // State (always computed for reactivity)
    state: computed(() => state.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Methods
    method
  }
}
```

## Composable Categories

### 1. Transaction Composables
- `useEscrowTransactions` - Escrow transaction operations (initialize, exchange, cancel)
- `useTransactionCosts` - Transaction cost calculations with debouncing

### 2. Wallet Composables
- `useWalletValidation` - Wallet connection and validation
- `useWalletBalances` - Wallet balance fetching
- `useWalletNFTs` - NFT fetching from wallet

### 3. Token Composables
- `useTokenRegistry` - Token registry search and fetching
- `useCollectionMetadata` - Collection metadata fetching
- `useCollectionNFTs` - Collection NFT fetching

### 4. UI Composables
- `useTheme` - Theme access and management
- `useToast` - Toast notification system
- `useErrorDisplay` - Unified error display
- `useConfirmationModal` - Confirmation modal state
- `useShareModal` - Share modal state
- `useViewMode` - View mode state with persistence
- `useClipboard` - Clipboard operations
- `useQRCode` - QR code generation
- `useExplorer` - Blockchain explorer URLs

### 5. Form Composables
- `useDebounce` - Debounced functions with cleanup
- `useDecimalHandling` - Decimal input handling
- `usePercentageButtons` - Percentage button logic
- `useVModel` - v-model helper

### 6. Network Composables
- `useSolanaConnection` - Solana RPC connection
- `useNetworkStatus` - Network status monitoring

### 7. Filter Composables
- `useMarketplaceFilters` - Marketplace filtering logic

## Composable vs Utility Pattern

### When to Use Composables
- Need reactive state (ref, computed)
- Need Vue lifecycle hooks (onMounted, onUnmounted)
- Need to share reactive state across components
- Need automatic cleanup

### When to Use Utilities
- Pure functions (no side effects)
- No reactive state needed
- Can be used outside Vue components
- Stateless operations

### Example Pattern

**Utility (Pure Function):**
```javascript
// utils/transactionCosts.js
export async function calculateEscrowCreationCosts(params) {
  // Pure calculation, no reactivity
  return costBreakdown
}
```

**Composable (Reactive Wrapper):**
```javascript
// composables/useTransactionCosts.js
export function useTransactionCosts({ costCalculator, getParams }) {
  const costBreakdown = ref(null)
  const loadingCosts = ref(false)
  
  const calculateCosts = async () => {
    loadingCosts.value = true
    try {
      costBreakdown.value = await costCalculator(getParams())
    } finally {
      loadingCosts.value = false
    }
  }
  
  return {
    costBreakdown: computed(() => costBreakdown.value),
    loadingCosts: computed(() => loadingCosts.value),
    calculateCosts
  }
}
```

## Return Object Structure

All composables return objects with this structure:

1. **Read-Only State Properties** (computed refs)
   - Use `computed()` for read-only state (loading, error, etc.)
   - Ensures proper reactivity and prevents accidental mutation
   - Naming: `loading`, `error`, `data`, etc.

2. **Writable State Properties** (refs)
   - Use `ref()` directly for writable state (for v-model, user input, etc.)
   - Examples: `viewMode`, `fillAmount`, `searchQuery`
   - These are returned as refs, not computed

3. **Methods** (functions)
   - Clear, descriptive names
   - Async methods return Promises

4. **Computed Properties** (if needed)
   - Derived state from reactive state
   - Already computed, return as-is

## Best Practices

1. **Use `computed()` for read-only state** - Ensures reactivity and prevents mutation
2. **Use `ref()` directly for writable state** - For v-model and user input
3. **Handle errors consistently** - Use centralized error handler (`formatError` from `errorHandler.js`)
4. **Provide loading states** - For async operations
5. **Clean up on unmount** - Use `onUnmounted` when needed (timers, subscriptions, etc.)
6. **Document parameters and return values** - Use JSDoc
7. **Keep composables focused** - Single responsibility principle
8. **Use utilities for pure logic** - Keep composables thin, utilities handle business logic
9. **Consistent naming** - Use `use*` prefix for all composables
10. **Export pattern** - Always use `export function`, never `export const` or `export default`

## Migration Notes

- All composables use `export function` pattern (not `export const`)
- All state is returned as computed properties
- All composables follow consistent naming (`use*`)
- Error handling uses centralized `errorHandler.js`
- Logging uses centralized `logger.js`
