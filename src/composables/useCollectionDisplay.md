# useCollectionDisplay Composable

**Location:** `src/composables/useCollectionDisplay.js`  
**Purpose:** Centralized collection display logic for CollectionCard and CollectionListItem components  
**Created:** January 30, 2026 (Phase 1 Refactoring)

---

## Overview

The `useCollectionDisplay` composable extracts and centralizes all collection display logic that was previously duplicated across multiple components. It handles fee calculations, collection mints processing, royalty calculations, and currency formatting.

### Problem It Solves

Before this composable:
- ❌ CollectionCard and CollectionListItem had ~250 lines of duplicate code
- ❌ Fee calculations were hardcoded in multiple places
- ❌ Collection mints processing logic was duplicated
- ❌ Changes required updating multiple files

After this composable:
- ✅ Single source of truth for collection display logic
- ✅ Fee calculations import from constants
- ✅ Changes only need to be made in one place
- ✅ Consistent behavior across all collection displays

---

## Usage

### Basic Usage

```javascript
import { computed } from 'vue'
import { useCollectionDisplay } from '@/composables/useCollectionDisplay'

export default {
  setup() {
    const collection = ref({
      id: 'collection-id',
      name: 'My Collection',
      collectionMints: [...],
      shopFee: {
        wallet: 'shop-wallet-address',
        makerFlatFee: 0.001,
        takerFlatFee: 0.0005
      }
    })

    // Use the composable
    const {
      getMakerFee,
      getTakerFee,
      getShopFeeDisplay,
      collectionMintsList,
      maxRoyalty,
      acceptedCurrencies,
      formatRoyaltyFee
    } = useCollectionDisplay(computed(() => collection.value))

    return {
      getMakerFee,
      getTakerFee,
      // ... other returns
    }
  }
}
```

### In Template

```vue
<template>
  <div class="collection-card">
    <h3>{{ collection.name }}</h3>
    
    <!-- Display fees -->
    <div class="fees">
      <p>Maker Fee: {{ getMakerFee() }} SOL</p>
      <p>Taker Fee: {{ getTakerFee() }} SOL</p>
      <p>Shop Fee: {{ getShopFeeDisplay() }}</p>
    </div>
    
    <!-- Display royalty -->
    <p v-if="maxRoyalty > 0">
      Max Royalty: {{ maxRoyalty.toFixed(2) }}%
    </p>
    
    <!-- Display accepted currencies -->
    <div class="currencies">
      <div v-for="currency in acceptedCurrencies" :key="currency.mint">
        {{ currency.symbol || currency.name }}
      </div>
    </div>
    
    <!-- Display collection mints -->
    <div v-for="mint in collectionMintsList" :key="mint.mint">
      {{ mint.name || truncateAddress(mint.mint) }}
      <span v-if="mint.royalty > 0">{{ mint.royalty.toFixed(2) }}%</span>
    </div>
  </div>
</template>
```

---

## API Reference

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collection` | `Ref<Object>` | Yes | Reactive collection object |

### Returns

The composable returns an object with the following properties:

#### Fee Functions

##### `getMakerFee()`
Returns the total maker fee (platform + shop fee) as a formatted string.

**Returns:** `string` - Fee amount with trailing zeros removed (e.g., "0.001", "0.0015")

**Example:**
```javascript
const makerFee = getMakerFee()  // "0.001" or "0.002" if shop fee added
```

##### `getTakerFee()`
Returns the total taker fee (platform + shop fee) as a formatted string.

**Returns:** `string` - Fee amount with trailing zeros removed

**Example:**
```javascript
const takerFee = getTakerFee()  // "0.0006" or "0.0011" if shop fee added
```

##### `getShopFeeDisplay()`
Returns a formatted display string for shop fees.

**Returns:** `string` - Formatted fee display or "None"

**Example:**
```javascript
const shopFee = getShopFeeDisplay()  
// Returns: "0.001/0.0005 SOL" or "1/0.5%" or "None"
```

##### `formatRoyaltyFee()`
Formats the royalty fee percentage for display.

**Returns:** `string` - Formatted percentage (e.g., "7%", "0%")

---

#### Computed Properties

##### `collectionMintsList`
Processed and sorted list of collection mints with metadata.

**Type:** `ComputedRef<Array>`

**Returns:** Array of mint objects:
```javascript
[
  {
    mint: string,        // Mint address
    name: string|null,   // Item name (if available)
    royalty: number,     // Royalty percentage (0-100)
    category: string|null // Item category/type
  }
]
```

**Sorting:** First by category, then by name alphabetically

**Example:**
```javascript
import { logDebug } from '@/utils/logger'
collectionMintsList.value.forEach(item => {
  logDebug(`${item.name} - ${item.royalty}% royalty`)
})
```

##### `maxRoyalty`
Maximum royalty percentage from all collection mints.

**Type:** `ComputedRef<number>`

**Returns:** `number` - Maximum royalty (0-100)

**Example:**
```javascript
import { logDebug } from '@/utils/logger'
if (maxRoyalty.value > 0) {
  logDebug(`Highest royalty: ${maxRoyalty.value}%`)
}
```

##### `acceptedCurrencies`
List of accepted currencies with metadata (symbol, name, mint address).

**Type:** `ComputedRef<Array>`

**Returns:** Array of currency objects:
```javascript
[
  {
    mint: string,     // Currency mint address
    name: string,     // Currency full name
    symbol: string,   // Currency symbol (SOL, USDC, etc.)
    isBase: boolean   // Whether it's a base currency
  }
]
```

**Example:**
```javascript
import { logDebug } from '@/utils/logger'
acceptedCurrencies.value.forEach(currency => {
  logDebug(`Accepts: ${currency.symbol}`)
})
```

##### `royaltyFeePercentage`
Maximum royalty fee percentage (same as maxRoyalty, different calculation path).

**Type:** `ComputedRef<number>`

---

#### Re-exported Functions

These functions are re-exported from `useCollectionMetadata` for convenience:

##### `getTokenDisplayName(token)`
Gets the display name for a token (prefers collection item name).

**Parameters:**
- `token` - Token object with mint address

**Returns:** `string` - Display name

##### `getTokenImage(token)`
Gets the image URL for a token (prefers collection item image).

**Parameters:**
- `token` - Token object with mint address

**Returns:** `string|null` - Image URL or null

##### `getMaxRoyaltyFeePercentage()`
Gets the maximum royalty fee percentage (same as `maxRoyalty` computed).

**Returns:** `number` - Maximum royalty percentage

---

## Collection Object Format

The composable handles both old and new collection formats:

### Old Format (String Arrays)
```javascript
{
  collectionMints: [
    "mint-address-1",
    "mint-address-2"
  ]
}
```

### New Format (Object Arrays)
```javascript
{
  collectionMints: [
    {
      mint: "mint-address-1",
      name: "Item Name",
      sellerFeeBasisPoints: 700,  // 7% royalty
      category: "Ships",
      image: "https://..."
    }
  ]
}
```

### Shop Fee Configuration
```javascript
{
  shopFee: {
    wallet: "shop-wallet-address",
    makerFlatFee: 0.001,        // Flat SOL fee for maker (optional)
    takerFlatFee: 0.0005,       // Flat SOL fee for taker (optional)
    makerPercentFee: 1,         // Percentage fee for maker (optional)
    takerPercentFee: 0.5        // Percentage fee for taker (optional)
  }
}
```

---

## Fee Calculation Logic

### Platform Fees (Base)

Imported from `@/utils/constants/fees`:

```javascript
TRANSACTION_COSTS.PLATFORM_MAKER_FEE  // 0.001 SOL
TRANSACTION_COSTS.PLATFORM_TAKER_FEE  // 0.0006 SOL
```

### Total Fee Calculation

**Formula:**
```
Total Fee = Platform Fee + Shop Fee (if configured)
```

**Example:**
- Platform maker fee: 0.001 SOL
- Shop maker flat fee: 0.001 SOL
- **Total maker fee: 0.002 SOL**

### Shop Fee Display

The shop fee display combines flat and percentage fees:

**Format:**
```
"{makerFlat}/{takerFlat} SOL + {makerPercent}/{takerPercent}%"
```

**Examples:**
- `"0.001/0.0005 SOL"` - Only flat fees
- `"1/0.5%"` - Only percentage fees  
- `"0.001/0.0005 SOL + 1/0.5%"` - Both types
- `"None"` - No shop fees configured

---

## Examples

### Example 1: CollectionCard Component

```vue
<script setup>
import { computed } from 'vue'
import { useCollectionDisplay } from '@/composables/useCollectionDisplay'

const props = defineProps({
  collection: {
    type: Object,
    required: true
  }
})

const {
  getMakerFee,
  getTakerFee,
  getShopFeeDisplay,
  collectionMintsList,
  maxRoyalty
} = useCollectionDisplay(computed(() => props.collection))
</script>

<template>
  <div class="card">
    <h3>{{ collection.name }}</h3>
    <div class="fees">
      <p>Maker: {{ getMakerFee() }} SOL</p>
      <p>Taker: {{ getTakerFee() }} SOL</p>
      <p v-if="maxRoyalty > 0">Max Royalty: {{ maxRoyalty.toFixed(2) }}%</p>
    </div>
  </div>
</template>
```

### Example 2: CollectionListItem Component

```vue
<script setup>
import { computed } from 'vue'
import { useCollectionDisplay } from '@/composables/useCollectionDisplay'

const props = defineProps({
  collection: Object,
  expanded: Boolean
})

const {
  getMakerFee,
  getTakerFee,
  acceptedCurrencies,
  collectionMintsList
} = useCollectionDisplay(computed(() => props.collection))
</script>

<template>
  <div class="list-item">
    <div v-if="expanded">
      <!-- Fee details -->
      <div>Maker Fee: {{ getMakerFee() }} SOL</div>
      <div>Taker Fee: {{ getTakerFee() }} SOL</div>
      
      <!-- Currencies -->
      <div v-for="currency in acceptedCurrencies" :key="currency.mint">
        {{ currency.symbol }}
      </div>
      
      <!-- Collection items -->
      <div v-for="item in collectionMintsList" :key="item.mint">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
```

---

## Migration Guide

### Before (Duplicate Code)

```javascript
// In CollectionCard.vue
const getMakerFee = () => {
  const platformFee = 0.001  // ❌ Hardcoded
  if (props.collection.shopFee?.wallet) {
    const shopFee = props.collection.shopFee.makerFlatFee || 0
    return (platformFee + shopFee).toFixed(4).replace(/\.?0+$/, '')
  }
  return platformFee.toFixed(4).replace(/\.?0+$/, '')
}

// Same code duplicated in CollectionListItem.vue
```

### After (Using Composable)

```javascript
// In both CollectionCard.vue and CollectionListItem.vue
import { useCollectionDisplay } from '@/composables/useCollectionDisplay'

const { getMakerFee, getTakerFee } = useCollectionDisplay(
  computed(() => props.collection)
)

// Just call the function - no duplicate code!
const fee = getMakerFee()
```

---

## Testing

### Unit Test Example

```javascript
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useCollectionDisplay } from '@/composables/useCollectionDisplay'

describe('useCollectionDisplay', () => {
  it('calculates maker fee without shop fee', () => {
    const collection = ref({
      id: 'test',
      collectionMints: []
    })
    
    const { getMakerFee } = useCollectionDisplay(collection)
    
    expect(getMakerFee()).toBe('0.001')
  })
  
  it('calculates maker fee with shop fee', () => {
    const collection = ref({
      id: 'test',
      shopFee: {
        wallet: 'test-wallet',
        makerFlatFee: 0.001
      }
    })
    
    const { getMakerFee } = useCollectionDisplay(collection)
    
    expect(getMakerFee()).toBe('0.002')
  })
  
  it('processes collection mints correctly', () => {
    const collection = ref({
      id: 'test',
      collectionMints: [
        {
          mint: 'mint-1',
          name: 'Item 1',
          sellerFeeBasisPoints: 700,
          category: 'Ships'
        }
      ]
    })
    
    const { collectionMintsList, maxRoyalty } = useCollectionDisplay(collection)
    
    expect(collectionMintsList.value).toHaveLength(1)
    expect(collectionMintsList.value[0].royalty).toBe(7)
    expect(maxRoyalty.value).toBe(7)
  })
})
```

---

## Benefits

### Code Quality
- ✅ Single source of truth
- ✅ DRY principle (Don't Repeat Yourself)
- ✅ Easier to test in isolation
- ✅ Consistent behavior across components

### Maintainability
- ✅ Changes in one place affect all components
- ✅ Fee calculations use constants (no hardcoding)
- ✅ Easier to add new features
- ✅ Reduces risk of inconsistencies

### Performance
- ✅ Computed properties cache calculations
- ✅ Only recalculates when collection changes
- ✅ No unnecessary re-renders

---

## Related Files

**Composables:**
- `useCollectionMetadata.js` - Collection metadata operations (used internally)
- `useCollectionNFTs.js` - NFT fetching and management

**Utils:**
- `constants/fees.js` - Fee constants (TRANSACTION_COSTS, FEE_CONFIG)
- `constants/baseCurrencies.js` - Currency helper functions
- `marketplaceFees.js` - Fee calculation service

**Components Using This:**
- `CollectionCard.vue` - Card view in dashboard
- `CollectionListItem.vue` - List view in dashboard

---

## Troubleshooting

### Issue: Fees showing as "0"

**Cause:** Collection object not properly passed as reactive ref

**Solution:**
```javascript
// ❌ Wrong
const { getMakerFee } = useCollectionDisplay(props.collection)

// ✅ Correct
const { getMakerFee } = useCollectionDisplay(computed(() => props.collection))
```

### Issue: Collection mints not sorted

**Cause:** Collection mints missing category/name properties

**Solution:** Ensure collection JSON has proper structure:
```json
{
  "collectionMints": [
    {
      "mint": "...",
      "name": "Item Name",
      "category": "Ships"
    }
  ]
}
```

### Issue: Shop fee not displaying

**Cause:** Shop fee wallet not configured

**Solution:** Collection must have shopFee.wallet property:
```javascript
{
  shopFee: {
    wallet: "shop-wallet-address",  // Required!
    makerFlatFee: 0.001
  }
}
```

---

## Changelog

**v1.0.0 (January 30, 2026)**
- Initial creation during Phase 1 refactoring
- Extracted from CollectionCard and CollectionListItem
- Centralized fee calculations
- Added support for both old and new collection formats
- Integrated with fee constants

---

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Project architecture overview
- [PHASE1_REFACTORING_SUMMARY.md](../../PHASE1_REFACTORING_SUMMARY.md) - Refactoring details
- [useCollectionMetadata.js](./useCollectionMetadata.js) - Metadata operations
- [constants/fees.js](../utils/constants/fees.js) - Fee configuration
