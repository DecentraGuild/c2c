/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HELIUS_API_KEY?: string
  readonly VITE_HELIUS_RPC?: string
  readonly VITE_NETWORK?: 'mainnet' | 'devnet'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Solana Web3.js Buffer polyfill
declare global {
  interface Window {
    Buffer: typeof Buffer
    global: typeof globalThis
  }
}

export {}
