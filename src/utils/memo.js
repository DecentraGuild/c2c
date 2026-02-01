/**
 * SPL Memo program helpers
 * Used to attach a human-readable message to transactions so wallets can show context
 * (e.g. token names) during confirmation when the token mint is not in the wallet's list.
 */

import { TransactionInstruction, PublicKey } from '@solana/web3.js'

/** SPL Memo program ID (MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr) */
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

/**
 * Create a memo instruction for inclusion in a transaction.
 * Many wallets display the memo in the confirmation screen.
 * @param {string} text - UTF-8 memo text (e.g. "Create escrow: 50 USDC for 1.5 SOL")
 * @returns {TransactionInstruction}
 */
export function createMemoInstruction(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Memo text must be a non-empty string')
  }
  const data = Buffer.from(text, 'utf8')
  return new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data
  })
}
