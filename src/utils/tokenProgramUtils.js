/**
 * Token program detection and validation for escrow
 * Escrow supports only legacy SPL Token mints; rejects Token-2022 and MPL Core
 */

import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { TOKEN_2022_PROGRAM_ID_PK, MPL_CORE_PROGRAM_ID_PK } from '@/utils/constants/tokens'
import { logError } from '@/utils/logger'

/**
 * Validate mint is legacy SPL Token and return TOKEN_PROGRAM_ID
 * Throws with a user-facing message if mint is Token-2022, MPL Core, or unknown
 * @param {import('@solana/web3.js').Connection} connection - Solana connection
 * @param {PublicKey|string} mint - Mint public key
 * @param {string} [role='deposit'] - 'deposit' or 'request' for error message
 * @returns {Promise<PublicKey>} TOKEN_PROGRAM_ID
 */
export async function getTokenProgramIdForMint(connection, mint, role = 'deposit') {
  const mintPubkey = mint instanceof PublicKey ? mint : new PublicKey(mint)
  const accountInfo = await connection.getAccountInfo(mintPubkey)
  if (!accountInfo) {
    logError('getTokenProgramIdForMint', new Error(`Mint account not found: ${mintPubkey.toBase58()}`))
    throw new Error(`Mint account not found: ${mintPubkey.toBase58()}`)
  }
  const owner = accountInfo.owner
  if (owner.equals(TOKEN_PROGRAM_ID)) {
    return TOKEN_PROGRAM_ID
  }
  if (owner.equals(TOKEN_2022_PROGRAM_ID_PK)) {
    throw new Error(
      `This ${role} token uses Token-2022. Our escrow currently supports only legacy SPL Token.`
    )
  }
  if (owner.equals(MPL_CORE_PROGRAM_ID_PK)) {
    throw new Error(
      `This ${role} NFT uses MPL Core (Metaplex Core). Our escrow currently supports only legacy SPL Token NFTs.`
    )
  }
  throw new Error(
    `This ${role} token is not a legacy SPL Token (mint owner: ${owner.toBase58()}). Our escrow supports only legacy SPL Token.`
  )
}
