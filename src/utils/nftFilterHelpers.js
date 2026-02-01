/**
 * NFT filter and search helpers for the NFT instance selector.
 * Pure functions for filtering by search query (name, number, mint) and by traits.
 */

/**
 * Normalise attributes to array of { trait_type, value }
 * @param {Array} attrs - Raw attributes (from metadata)
 * @returns {Array<{ trait_type: string, value: string|number }>}
 */
export function normaliseAttributes(attrs) {
  if (!Array.isArray(attrs)) return []
  return attrs
    .map((a) => ({
      trait_type: String(a.trait_type ?? a.traitType ?? ''),
      value: a.value ?? ''
    }))
    .filter((a) => a.trait_type !== '' || a.value !== '')
}

/**
 * Filter NFTs by search query: name (substring), number (#123 or 123 in name), mint (full or prefix)
 * @param {Array<{ name?: string, mint: string }>} nfts - List of NFTs
 * @param {string} query - Search query (trimmed)
 * @returns {Array} Filtered NFTs
 */
export function filterNFTsBySearch(nfts, query) {
  if (!query || !query.trim()) return nfts
  const q = query.trim().toLowerCase()
  if (q.length === 0) return nfts

  const qNum = q.replace(/^#/, '')

  return nfts.filter((nft) => {
    const name = (nft.name ?? '').toLowerCase()
    const mint = (nft.mint ?? '').toLowerCase()

    if (name.includes(q)) return true
    if (mint.includes(q) || mint.startsWith(q)) return true
    // Match #123 or 123 in name
    const numbersInName = name.match(/#?\d+/g) || []
    if (numbersInName.some((num) => num.replace('#', '') === qNum || num === q)) return true
    return false
  })
}

/**
 * Get unique traits from a list of NFTs as { [trait_type]: string[] } (unique values per type)
 * @param {Array<{ attributes?: Array<{ trait_type: string, value: string|number }> }>} nfts - List of NFTs
 * @returns {Object.<string, string[]>} Map of trait_type to array of unique values
 */
export function getUniqueTraits(nfts) {
  const map = /** @type {Object.<string, Set<string>>} */ ({})
  for (const nft of nfts) {
    const attrs = normaliseAttributes(nft.attributes ?? [])
    for (const { trait_type, value } of attrs) {
      if (!trait_type) continue
      if (!map[trait_type]) map[trait_type] = new Set()
      map[trait_type].add(String(value))
    }
  }
  const result = /** @type {Object.<string, string[]>} */ ({})
  for (const [k, set] of Object.entries(map)) {
    result[k] = Array.from(set).sort()
  }
  return result
}

/**
 * Filter NFTs by selected trait filters. NFT must match all selected trait types (AND).
 * selectedTraits: { trait_type: value } (one value per type) or Map/object trait_type -> value
 * @param {Array<{ attributes?: Array<{ trait_type: string, value: string|number }> }>} nfts - List of NFTs
 * @param {Object.<string, string>} selectedTraits - Map of trait_type to selected value
 * @returns {Array} Filtered NFTs
 */
export function filterNFTsByTraits(nfts, selectedTraits) {
  const entries = Object.entries(selectedTraits ?? {}).filter(([, v]) => v != null && v !== '')
  if (entries.length === 0) return nfts

  return nfts.filter((nft) => {
    const attrs = normaliseAttributes(nft.attributes ?? [])
    const attrMap = Object.fromEntries(attrs.map((a) => [a.trait_type, String(a.value)]))

    for (const [traitType, selectedValue] of entries) {
      if (attrMap[traitType] !== selectedValue) return false
    }
    return true
  })
}
