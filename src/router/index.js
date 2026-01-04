import { createRouter, createWebHistory } from 'vue-router'
import CreateEscrow from '../views/CreateEscrow.vue'
import ManageEscrows from '../views/ManageEscrows.vue'
import EscrowDetail from '../views/EscrowDetail.vue'

const routes = [
  {
    path: '/',
    redirect: '/create'
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
