/**
 * Shared Rate Limiter utility
 * Provides singleton rate limiters to avoid creating multiple instances
 */

import { RateLimiter as RateLimiterClass } from './metaplex'

// Shared rate limiters by rate
const rateLimiters = new Map()

/**
 * Get or create a shared rate limiter instance
 * @param {number} requestsPerSecond - Requests per second (default: 2)
 * @returns {RateLimiter} Rate limiter instance
 */
export function getRateLimiter(requestsPerSecond = 2) {
  const key = requestsPerSecond.toString()
  
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new RateLimiterClass(requestsPerSecond))
  }
  
  return rateLimiters.get(key)
}

/**
 * Default metadata rate limiter (2 requests per second)
 * Use this for token metadata fetching
 */
export const metadataRateLimiter = getRateLimiter(2)
