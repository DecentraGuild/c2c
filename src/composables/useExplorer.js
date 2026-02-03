/**
 * Composable for blockchain explorer URLs
 */

import { RPC_ENDPOINTS, NETWORKS } from '@/utils/constants'

export function useExplorer(network = NETWORKS.MAINNET) {
  const getSolscanUrl = (address, type = 'account') => {
    if (!address) return ''
    
    const baseUrl = RPC_ENDPOINTS[network]?.explorer
    if (!baseUrl) return ''
    
    return `${baseUrl}/${type}/${address}`
  }

  const getTransactionUrl = (signature) => {
    return getSolscanUrl(signature, 'tx')
  }

  return {
    getSolscanUrl,
    getTransactionUrl
  }
}
