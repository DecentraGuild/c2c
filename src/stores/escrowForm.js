/**
 * Escrow Form Store
 * Manages escrow creation form state and validation
 * Separated from escrow data management for better organization
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { validateSolanaAddress, validateExpirationDate, validateSlippage, validateAmount } from '@/utils/validators'
import { useWalletBalanceStore } from '@/stores/walletBalance'

export const useEscrowFormStore = defineStore('escrowForm', () => {
  // Form state
  const offerToken = ref(null)
  const offerAmount = ref('0.00')
  const requestToken = ref(null)
  const requestAmount = ref('0.00')
  
  // Settings
  const settings = ref({
    direct: false,
    directAddress: '',
    whitelist: false,
    whitelistAddresses: [],
    expire: false,
    expireDate: null,
    partialFill: false,
    slippage: 1
  })
  
  // Form errors
  const formErrors = ref({})
  
  // Get balance store for balance checks
  const walletBalanceStore = useWalletBalanceStore()
  
  // Computed - Basic validation
  const hasValidOffer = computed(() => {
    return offerToken.value !== null && 
           parseFloat(offerAmount.value) > 0
  })
  
  const hasValidRequest = computed(() => {
    return requestToken.value !== null && 
           parseFloat(requestAmount.value) > 0
  })
  
  const canCreateEscrow = computed(() => {
    return hasValidOffer.value && hasValidRequest.value
  })
  
  const exchangeRate = computed(() => {
    if (!hasValidOffer.value || !hasValidRequest.value) return null
    
    const offer = parseFloat(offerAmount.value)
    const request = parseFloat(requestAmount.value)
    
    if (offer === 0 || request === 0) return null
    
    return {
      offerToRequest: request / offer,
      requestToOffer: offer / request
    }
  })
  
  // Computed - Detailed validation
  const isValidOfferAmount = computed(() => {
    if (!offerToken.value) return false
    const validation = validateAmount(offerAmount.value, {
      min: 0.000001,
      decimals: offerToken.value.decimals,
      balance: offerToken.value?.balance ?? walletBalanceStore.getTokenBalance(offerToken.value.mint)
    })
    return validation.valid
  })
  
  const isValidRequestAmount = computed(() => {
    if (!requestToken.value) return false
    const validation = validateAmount(requestAmount.value, {
      min: 0.000001,
      decimals: requestToken.value.decimals
    })
    return validation.valid
  })
  
  const isValidDirectAddress = computed(() => {
    if (!settings.value.direct || !settings.value.directAddress) return true
    const validation = validateSolanaAddress(settings.value.directAddress)
    return validation.valid
  })
  
  const isValidExpireDate = computed(() => {
    if (!settings.value.expire || !settings.value.expireDate) return true
    const validation = validateExpirationDate(settings.value.expireDate)
    return validation.valid
  })
  
  const isValidSlippage = computed(() => {
    if (!settings.value.partialFill) return true
    const validation = validateSlippage(settings.value.slippage)
    return validation.valid
  })
  
  const isFormValid = computed(() => {
    return hasValidOffer.value && 
           hasValidRequest.value && 
           isValidDirectAddress.value &&
           isValidExpireDate.value &&
           isValidSlippage.value &&
           // Check that offer and request tokens are different
           (offerToken.value?.mint !== requestToken.value?.mint)
  })
  
  const formValidationErrors = computed(() => {
    const errors = {}
    
    if (!offerToken.value) {
      errors.offerToken = 'Please select a token to offer'
    } else if (!isValidOfferAmount.value) {
      const validation = validateAmount(offerAmount.value, {
        min: 0.000001,
        decimals: offerToken.value.decimals,
        balance: offerToken.value?.balance ?? walletBalanceStore.getTokenBalance(offerToken.value.mint)
      })
      errors.offerAmount = validation.error || 'Please enter a valid offer amount'
    }
    
    if (!requestToken.value) {
      errors.requestToken = 'Please select a token to request'
    } else if (!isValidRequestAmount.value) {
      const validation = validateAmount(requestAmount.value, {
        min: 0.000001,
        decimals: requestToken.value.decimals
      })
      errors.requestAmount = validation.error || 'Please enter a valid request amount'
    }
    
    if (offerToken.value && requestToken.value && 
        offerToken.value.mint === requestToken.value.mint) {
      errors.tokens = 'Offer and request tokens must be different'
    }
    
    // Only validate optional settings if they are enabled
    if (settings.value.direct && settings.value.directAddress && !isValidDirectAddress.value) {
      errors.directAddress = validateSolanaAddress(settings.value.directAddress).error
    }
    
    if (settings.value.expire && settings.value.expireDate && !isValidExpireDate.value) {
      errors.expireDate = validateExpirationDate(settings.value.expireDate).error
    }
    
    if (settings.value.partialFill && !isValidSlippage.value) {
      errors.slippage = validateSlippage(settings.value.slippage).error
    }
    
    return errors
  })
  
  // Actions
  /**
   * Set the offer token for the escrow
   * @param {Object|null} token - Token object with mint, decimals, name, symbol, image
   */
  const setOfferToken = (token) => {
    offerToken.value = token
    if (token?.decimals === 0) offerAmount.value = '1'
  }
  
  /**
   * Set the offer amount
   * @param {string|number} amount - Amount to offer (converted to string)
   */
  const setOfferAmount = (amount) => {
    offerAmount.value = typeof amount === 'number' ? amount.toString() : (amount || '0.00')
  }
  
  /**
   * Set the request token for the escrow
   * @param {Object|null} token - Token object with mint, decimals, name, symbol, image
   */
  const setRequestToken = (token) => {
    requestToken.value = token
    if (token?.decimals === 0) requestAmount.value = '1'
  }
  
  /**
   * Set the request amount
   * @param {string|number} amount - Amount to request (converted to string)
   */
  const setRequestAmount = (amount) => {
    requestAmount.value = typeof amount === 'number' ? amount.toString() : (amount || '0.00')
  }
  
  /**
   * Update escrow settings (merge with existing settings)
   * @param {Object} newSettings - Partial settings object to merge
   */
  const updateSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings }
  }
  
  /**
   * Reset the form to default values
   */
  const resetForm = () => {
    offerToken.value = null
    offerAmount.value = '0.00'
    requestToken.value = null
    requestAmount.value = '0.00'
    settings.value = {
      direct: false,
      directAddress: '',
      whitelist: false,
      whitelistAddresses: [],
      partialFill: false,
      slippage: 1,
      expire: false,
      expireDate: null
    }
    formErrors.value = {}
  }
  
  /**
   * Validate the form and set error state
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    formErrors.value = formValidationErrors.value
    return isFormValid.value
  }
  
  /**
   * Clear form validation errors
   */
  const clearFormErrors = () => {
    formErrors.value = {}
  }
  
  /**
   * Set a specific form error
   * @param {string} field - Field name
   * @param {string} message - Error message
   */
  const setFormError = (field, message) => {
    formErrors.value = { ...formErrors.value, [field]: message }
  }
  
  return {
    // State
    offerToken,
    offerAmount,
    requestToken,
    requestAmount,
    settings,
    formErrors,
    
    // Computed
    hasValidOffer,
    hasValidRequest,
    canCreateEscrow,
    exchangeRate,
    isValidOfferAmount,
    isValidRequestAmount,
    isValidDirectAddress,
    isValidExpireDate,
    isValidSlippage,
    isFormValid,
    formValidationErrors,
    
    // Actions
    setOfferToken,
    setOfferAmount,
    setRequestToken,
    setRequestAmount,
    updateSettings,
    resetForm,
    validateForm,
    clearFormErrors,
    setFormError
  }
})
