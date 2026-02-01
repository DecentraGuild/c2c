/**
 * Helius DAS (Digital Asset Standard) API utilities
 * Fetches ALL wallet assets (fungible tokens + NFTs) from any token program.
 * Used for complete balance display (industry practice: Tensor, etc. use DAS for full coverage).
 */

import { logError, logDebug } from './logger'
import { SEARCH_LIMITS } from './constants/ui'

const DAS_PAGE_LIMIT = 1000

/**
 * Get Helius RPC URL for DAS calls (same as connection)
 */
function getHeliusRpcUrl() {
  const apiKey = import.meta.env.VITE_HELIUS_API_KEY
  if (!apiKey) return null
  const rpcUrl = import.meta.env.VITE_HELIUS_RPC || ''
  const isDevnet = rpcUrl.includes('devnet')
  return isDevnet
    ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
    : `https://mainnet.helius-rpc.com/?api-key=${apiKey}`
}

/**
 * Fetch ALL assets by owner via Helius DAS getAssetsByOwner.
 * Returns NFTs, compressed NFTs, and fungible tokens from ALL token programs
 * (standard Token Program, Token-2022, and custom programs - including "spam").
 *
 * @param {string} ownerAddress - Wallet public key (base58)
 * @returns {Promise<Array<{ id: string, interface: string, content?: object, token_info?: object, ownership?: object }>>}
 */
export async function getAssetsByOwner(ownerAddress) {
  const heliusRpcUrl = getHeliusRpcUrl()
  if (!heliusRpcUrl) {
    throw new Error('Helius API key not configured')
  }

  const allItems = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const body = {
      jsonrpc: '2.0',
      id: 'helius-das-assets-by-owner',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress,
        page,
        limit: DAS_PAGE_LIMIT
      }
    }

    const response = await fetch(heliusRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const text = await response.text()
      logError(`DAS getAssetsByOwner error ${response.status}: ${text}`)
      throw new Error(`DAS API error: ${response.status}`)
    }

    const data = await response.json()
    if (data.error) {
      logError('DAS getAssetsByOwner RPC error:', data.error.message || data.error)
      throw new Error(data.error.message || 'DAS getAssetsByOwner failed')
    }

    const result = data.result
    if (!result || !Array.isArray(result.items)) {
      break
    }

    const items = result.items
    allItems.push(...items)
    logDebug(`DAS getAssetsByOwner page ${page}: ${items.length} items (total so far: ${allItems.length})`)

    hasMore = items.length === DAS_PAGE_LIMIT && (result.total == null || allItems.length < result.total)
    page++

    if (allItems.length >= SEARCH_LIMITS.NFT_FETCH_LIMIT) {
      logDebug(`DAS getAssetsByOwner reached safety limit ${SEARCH_LIMITS.NFT_FETCH_LIMIT}`)
      break
    }
  }

  return allItems
}

/**
 * Map a DAS asset item to our balance format { mint, symbol, name, decimals, balance, balanceRaw, isNative }.
 * Handles both fungible (FungibleToken, FungibleAsset) and non-fungible (V1_NFT, etc.) assets.
 *
 * @param {object} asset - DAS asset from getAssetsByOwner
 * @returns {object|null} Balance object or null if zero/skip
 */
export function dasAssetToBalance(asset) {
  if (!asset || !asset.id) return null

  const interfaceType = asset.interface || ''
  const isFungible =
    interfaceType === 'FungibleToken' ||
    interfaceType === 'FungibleAsset' ||
    (asset.token_info != null)

  const content = asset.content || {}
  const metadata = content.metadata || content.json || {}
  const tokenInfo = asset.token_info || {}

  let decimals = 0
  let balance = 0
  let balanceRaw = '0'

  if (isFungible && tokenInfo) {
    decimals = tokenInfo.decimals ?? 0
    const amount = tokenInfo.balance ?? tokenInfo.amount ?? tokenInfo.supply
    if (amount != null) {
      const amountNum = typeof amount === 'string' ? Number(amount) : amount
      balance = decimals > 0 ? amountNum / Math.pow(10, decimals) : amountNum
      balanceRaw = typeof amount === 'string' ? amount : String(amount)
    }
    if (balance <= 0) return null
  } else {
    decimals = 0
    balance = 1
    balanceRaw = '1'
  }

  const mint = asset.mint ?? asset.id
  return {
    mint,
    symbol: metadata.symbol ?? tokenInfo.symbol ?? null,
    name: metadata.name ?? tokenInfo.name ?? null,
    decimals,
    balance,
    balanceRaw,
    isNative: false,
    image: content.files?.[0]?.uri ?? content.files?.[0]?.cdn_uri ?? metadata.image ?? null
  }
}

/**
 * Fetch all token balances for a wallet using Helius DAS getAssetsByOwner.
 * Includes every token program (standard, Token-2022, custom) and NFTs.
 * Falls back to empty array on DAS failure (caller can use RPC fallback).
 *
 * @param {string} walletAddress - Wallet public key (base58)
 * @returns {Promise<Array<{ mint, symbol, name, decimals, balance, balanceRaw, isNative, image? }>>}
 */
export async function fetchAllTokenBalancesFromDAS(walletAddress) {
  try {
    const items = await getAssetsByOwner(walletAddress)
    const balances = []
    for (const asset of items) {
      const b = dasAssetToBalance(asset)
      if (b) balances.push(b)
    }
    logDebug(`DAS returned ${items.length} assets → ${balances.length} non-zero balances`)
    return balances
  } catch (err) {
    logError('fetchAllTokenBalancesFromDAS failed:', err)
    throw err
  }
}
