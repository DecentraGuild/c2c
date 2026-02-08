import { createRouter, createWebHistory } from 'vue-router'
import { applyGitHubPagesRedirect, getRedirectFromRoute } from './redirectHelpers'
import { ROUTE_PATHS } from '@/utils/constants'

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
  { path: ROUTE_PATHS.HOME, name: 'Dashboard', component: Dashboard },
  { path: ROUTE_PATHS.MARKETPLACE, name: 'Marketplace', component: Marketplace },
  { path: ROUTE_PATHS.CREATE, name: 'Create', component: CreateEscrow },
  { path: ROUTE_PATHS.MANAGE, name: 'Manage', component: ManageEscrows },
  { path: ROUTE_PATHS.ESCROW_ID, name: 'EscrowDetail', component: EscrowDetail, props: true },
  { path: ROUTE_PATHS.ONBOARD, name: 'OnboardCollection', component: OnboardCollection },
  { path: ROUTE_PATHS.TERMS, name: 'TermsOfService', component: TermsOfService },
  { path: ROUTE_PATHS.PRIVACY, name: 'PrivacyPolicy', component: PrivacyPolicy },
  { path: ROUTE_PATHS.SHOPOWNER_AGREEMENT, name: 'ShopownerAgreement', component: ShopownerAgreement }
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
