import { createRouter, createWebHistory } from 'vue-router'
import { applyGitHubPagesRedirect, getRedirectFromRoute } from './redirectHelpers'

// Lazy load routes for better initial bundle size
const Dashboard = () => import('../views/Dashboard.vue')
const Marketplace = () => import('../views/Marketplace.vue')
const CreateEscrow = () => import('../views/CreateEscrow.vue')
const ManageEscrows = () => import('../views/ManageEscrows.vue')
const EscrowDetail = () => import('../views/EscrowDetail.vue')
const OnboardCollection = () => import('../views/OnboardCollection.vue')
const TermsOfService = () => import('../views/TermsOfService.vue')
const PrivacyPolicy = () => import('../views/PrivacyPolicy.vue')
const ShopownerAgreement = () => import('../views/ShopownerAgreement.vue')

applyGitHubPagesRedirect()

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
  },
  {
    path: '/terms',
    name: 'TermsOfService',
    component: TermsOfService
  },
  {
    path: '/privacy',
    name: 'PrivacyPolicy',
    component: PrivacyPolicy
  },
  {
    path: '/shopowner-agreement',
    name: 'ShopownerAgreement',
    component: ShopownerAgreement
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
  const redirect = getRedirectFromRoute(to)
  if (redirect) {
    next(redirect)
    return
  }
  if (to.query.share === 'true' && to.name === 'EscrowDetail') {
    next()
    return
  }
  next()
})

export default router
