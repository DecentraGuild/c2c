/**
 * Route path constants
 * Single source of truth for path strings; use in router, links, and route checks.
 */

export const ROUTE_PATHS = {
  HOME: '/',
  MARKETPLACE: '/marketplace',
  CREATE: '/create',
  MANAGE: '/manage',
  ESCROW_PREFIX: '/escrow/',
  ESCROW_ID: '/escrow/:id',
  ONBOARD: '/onboard',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  SHOPOWNER_AGREEMENT: '/shopowner-agreement'
}

/** Paths that use storefront theme (marketplace, create, manage, escrow detail) */
export const STOREFRONT_ROUTE_PATHS = [
  ROUTE_PATHS.MARKETPLACE,
  ROUTE_PATHS.CREATE,
  ROUTE_PATHS.MANAGE
]

/**
 * Build escrow detail path
 * @param {string} escrowId - Escrow public key or id
 * @returns {string}
 */
export function getEscrowPath(escrowId) {
  return `${ROUTE_PATHS.ESCROW_PREFIX}${escrowId}`
}

/**
 * Build marketplace path with optional storefront query
 * @param {string} [storefrontId] - Storefront id for query
 * @returns {{ path: string, query?: object }}
 */
export function getMarketplaceRoute(storefrontId) {
  if (!storefrontId) {
    return { path: ROUTE_PATHS.MARKETPLACE }
  }
  return { path: ROUTE_PATHS.MARKETPLACE, query: { storefront: storefrontId } }
}
