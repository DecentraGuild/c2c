<template>
  <div class="min-h-screen bg-primary-bg">
    <NavBar />
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import ToastContainer from './components/ToastContainer.vue'
import { preloadTokenRegistry } from './utils/metaplex'

// Preload token registry early for better performance
onMounted(() => {
  preloadTokenRegistry()
})
</script>
