import { createRouter, createWebHistory } from 'vue-router'

// Lazy load routes for better initial bundle size
// These will be loaded on-demand when user navigates to them
const Dashboard = () => import('../views/Dashboard.vue')
const Marketplace = () => import('../views/Marketplace.vue')
const CreateEscrow = () => import('../views/CreateEscrow.vue')
const ManageEscrows = () => import('../views/ManageEscrows.vue')
const EscrowDetail = () => import('../views/EscrowDetail.vue')
const OnboardCollection = () => import('../views/OnboardCollection.vue')

// GitHub Pages SPA redirect handler
// GitHub Pages redirects 404s to 404.html with the path as ?/path
// We need to extract this and redirect to the actual path
if (typeof window !== 'undefined') {
  const search = window.location.search
  if (search && search.includes('?/')) {
    // Extract path from ?/path format
    const pathMatch = search.match(/\?\/?(.+?)(?:&|$)/)
    if (pathMatch) {
      const path = '/' + pathMatch[1].replace(/~and~/g, '&')
      // Extract remaining query params
      const remainingSearch = search.replace(/\?\/?.+?&/, '&').replace(/~and~/g, '&')
      const finalSearch = remainingSearch.startsWith('&') ? remainingSearch.slice(1) : remainingSearch
      const newUrl = path + (finalSearch ? '?' + finalSearch : '') + window.location.hash
      window.history.replaceState({}, '', newUrl)
    }
  }
}

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/marketplace',
    name: 'Marketplace',
    component: Marketplace
  },
  {
    path: '/create',
    name: 'Create',
    component: CreateEscrow
  },
  {
    path: '/manage',
    name: 'Manage',
    component: ManageEscrows
  },
  {
    path: '/escrow/:id',
    name: 'EscrowDetail',
    component: EscrowDetail,
    props: true
  },
  {
    path: '/onboard',
    name: 'OnboardCollection',
    component: OnboardCollection
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Deep link handler - handles URLs like:
// - https://yourapp.com/escrow/ABC123
// - https://yourapp.com/?escrow=ABC123
// - solana-mobile://yourapp.com/escrow/ABC123 (Solana Mobile deep links)
router.beforeEach((to, from, next) => {
  // Handle deep link query parameters
  if (to.query.escrow) {
    // Redirect /?escrow=ABC123 to /escrow/ABC123
    next({ path: `/escrow/${to.query.escrow}`, query: {} })
    return
  }
  
  // Handle share query parameter (from share modal)
  if (to.query.share === 'true' && to.name === 'EscrowDetail') {
    // Keep the share query for the component to handle
    next()
    return
  }
  
  // Handle Solana Mobile deep links
  // Format: solana-mobile://yourapp.com/escrow/ABC123
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    // Check if this is a deep link from Solana Mobile
    if (url.protocol === 'solana-mobile:' || url.searchParams.has('deep_link')) {
      const escrowId = url.pathname.split('/escrow/')[1] || url.searchParams.get('escrow')
      if (escrowId) {
        next({ path: `/escrow/${escrowId}`, query: {} })
        return
      }
    }
  }
  
  next()
})

export default router
