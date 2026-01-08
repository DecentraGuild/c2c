# Bundle Optimization Plan

## Current Situation

**Main Bundle**: 4.73 MB (1.21 MB gzipped) ⚠️
**PWA Limit**: Increased to 5MB (works, but not ideal)

## What's Causing the Size?

### 1. Token Registry (~2-3 MB) 🔴 HIGHEST IMPACT
- **Library**: `@solana/spl-token-registry`
- **Current**: Loaded eagerly on app start
- **Problem**: Contains thousands of tokens, loaded even if not searching
- **Solution**: Lazy load when needed

### 2. Date Picker (~200-300 KB) 🟡 MEDIUM IMPACT
- **Library**: `@vuepic/vue-datepicker`
- **Current**: Loaded eagerly
- **Problem**: Only used in AdditionalSettings (collapsed by default)
- **Solution**: Lazy load when AdditionalSettings expands

### 3. QR Code (~100-200 KB) ✅ ALREADY OPTIMIZED
- **Library**: `qrcode`
- **Current**: Already lazy loaded! ✅
- **Status**: Good - no changes needed

### 4. Routes (~500 KB - 1 MB) 🟡 MEDIUM IMPACT
- **Current**: All views loaded upfront
- **Problem**: EscrowDetail, ManageEscrows loaded even on CreateEscrow page
- **Solution**: Lazy load routes

### 5. Iconify (~100-500 KB) 🟢 LOW IMPACT
- **Library**: `@iconify/vue`
- **Current**: All icons bundled
- **Problem**: May include unused icons
- **Solution**: Tree-shake (optional, low priority)

## Downsides of 5MB Bundle

### ❌ Performance Issues:
1. **Initial Load**: 15-30 seconds on 3G mobile (unacceptable)
2. **Gzipped**: 5-10 seconds on 3G (better, but still slow)
3. **Data Usage**: 1.21 MB per visit (expensive on limited plans)
4. **Battery**: More processing = more battery drain
5. **Memory**: Higher memory usage on low-end devices

### ❌ User Experience:
- Users wait too long before app is usable
- Poor mobile experience (especially on slow connections)
- May cause users to leave before app loads

### ❌ Technical Issues:
- May hit browser storage quotas
- Service worker cache limits
- Slower Time to Interactive (TTI)

## Recommendation: Optimize (Not Just Increase Limit)

### Why Optimize?
- ✅ **Better UX**: Faster initial load (critical for mobile)
- ✅ **Lower Costs**: Less data usage
- ✅ **Better Performance**: Faster Time to Interactive
- ✅ **Mobile-Friendly**: Essential for Solana Mobile Dapp Store

### Why Not Just Increase Limit?
- ❌ Doesn't solve the real problem (slow load)
- ❌ Users still wait 15-30 seconds
- ❌ Poor mobile experience
- ❌ May hit other browser limits

## Optimization Strategy

### Phase 1: Quick Wins (30 min) - Reduce to ~3 MB
1. ✅ Lazy load routes (easy, high impact)
2. ✅ Lazy load date picker (easy, medium impact)

### Phase 2: Big Wins (1-2 hours) - Reduce to ~500 KB - 1 MB
3. ✅ Lazy load token registry (harder, highest impact)

### Phase 3: Polish (optional) - Reduce to ~300-500 KB
4. ⚠️ Tree-shake icons (optional, low priority)

## Implementation Priority

### 🔴 **HIGH PRIORITY** (Do This):
1. **Lazy load routes** - Easy, saves ~500 KB - 1 MB
2. **Lazy load token registry** - Harder, saves ~2-3 MB

### 🟡 **MEDIUM PRIORITY** (Should Do):
3. **Lazy load date picker** - Easy, saves ~200-300 KB

### 🟢 **LOW PRIORITY** (Nice to Have):
4. **Tree-shake icons** - Optional, saves ~100-300 KB

## Expected Results

### Before Optimization:
- Initial bundle: **4.73 MB** (1.21 MB gzipped)
- Load time (3G): **15-30 seconds**

### After Phase 1 (Routes + Date Picker):
- Initial bundle: **~3-3.5 MB** (~800 KB - 1 MB gzipped)
- Load time (3G): **~10-15 seconds**

### After Phase 2 (All Optimizations):
- Initial bundle: **~500 KB - 1 MB** (~200-400 KB gzipped)
- Load time (3G): **~3-5 seconds** ✅

## My Recommendation

**Short-term**: Keep 5MB limit (build works)
**Medium-term**: Implement lazy loading (better UX)
**Target**: < 1 MB initial bundle

**Priority**: 
1. Lazy load routes (30 min) - **DO THIS FIRST**
2. Lazy load token registry (1-2 hours) - **BIGGEST WIN**
3. Lazy load date picker (15 min) - **EASY WIN**

Would you like me to implement these optimizations?
