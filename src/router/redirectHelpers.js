/**
 * Router redirect helpers: GitHub Pages SPA redirect and route guard redirects.
 * Used by router/index.js at module load (GitHub Pages) and in beforeEach (deep links).
 */

/**
 * GitHub Pages redirect: 404s serve 404.html with path as ?/path.
 * Normalise to /path so the SPA router can handle it.
 * Call once at module load when window is defined.
 */
export function applyGitHubPagesRedirect() {
  if (typeof window === 'undefined') return
  const search = window.location.search
  if (!search || !search.includes('?/')) return
  const pathMatch = search.match(/\?\/?(.+?)(?:&|$)/)
  if (!pathMatch) return
  const path = '/' + pathMatch[1].replace(/~and~/g, '&')
  const remainingSearch = search.replace(/\?\/?.+?&/, '&').replace(/~and~/g, '&')
  const finalSearch = remainingSearch.startsWith('&') ? remainingSearch.slice(1) : remainingSearch
  const newUrl = path + (finalSearch ? '?' + finalSearch : '') + window.location.hash
  window.history.replaceState({}, '', newUrl)
}

/**
 * Returns a redirect for Vue Router beforeEach if the route should be redirected (escrow query or Solana Mobile deep link).
 * @param {import('vue-router').RouteLocationNormalized} to - The target route
 * @returns {{ path: string, query: object } | null} - Redirect object or null
 */
export function getRedirectFromRoute(to) {
  if (to.query.escrow) {
    return { path: `/escrow/${to.query.escrow}`, query: {} }
  }
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    if (url.protocol === 'solana-mobile:' || url.searchParams.has('deep_link')) {
      const escrowId = url.pathname.split('/escrow/')[1] || url.searchParams.get('escrow')
      if (escrowId) {
        return { path: `/escrow/${escrowId}`, query: {} }
      }
    }
  }
  return null
}
