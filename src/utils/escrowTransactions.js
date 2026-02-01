/**
 * Escrow Transaction Builder
 * Handles building transactions for escrow operations
 */

import { 
  Transaction, 
  SystemProgram, 
  PublicKey
} from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { getTokenProgramIdForMint } from './tokenProgramUtils'
import {
  isWrappedSol,
  getWrappedSolAccount,
  getRequestAmountLamports,
  calculateSolToTransfer,
  addWrappedSolInstructions
} from './wrappedSolHelpers'
import {
  getExchangeATAs,
  prepareTakerATAs
} from './transactionBuilders'
import { toPublicKey, toBN } from './solanaUtils'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { ESCROW_PROGRAM_ID, CONTRACT_FEE_ACCOUNT, WHITELIST_PROGRAM_ID } from './constants'
import { FEE_CONFIG, FUND_TAKER_COSTS, TRANSACTION_COSTS } from './constants/fees'
import { addMakerFeeInstructions, calculateTakerFee } from './marketplaceFees'
import { checkAtaExists, makeAtaInstruction } from './ataUtils'
import { createMemoInstruction } from './memo'
import idl from '../idl/escrow_service.json'
import { logDebug, logError } from './logger'

/**
 * Validate and return Anchor-compatible wallet
 * @param {Object} walletAdapter - Wallet adapter from useAnchorWallet()
 * @returns {Object} Wallet object compatible with Anchor
 */
export function createAnchorWallet(walletAdapter) {
  if (!walletAdapter) {
    throw new Error('Wallet adapter is required')
  }
  
  // Validate wallet has required Anchor-compatible properties
  if (!walletAdapter.publicKey || !(walletAdapter.publicKey instanceof PublicKey)) {
    throw new Error('Invalid wallet: publicKey must be a PublicKey instance')
  }
  
  if (!walletAdapter.publicKey._bn) {
    throw new Error('Invalid wallet: publicKey was not properly constructed')
  }
  
  if (!walletAdapter.signTransaction || typeof walletAdapter.signTransaction !== 'function') {
    throw new Error('Invalid wallet: signTransaction function is required')
  }
  
  // Wallet from useAnchorWallet() is already Anchor-compatible
  return walletAdapter
}

/**
 * Get the Anchor program instance
 * @param {Connection} connection - Solana connection
 * @param {Object} walletAdapter - Wallet adapter from solana-wallets-vue
 * @returns {Program} Anchor program instance
 */
export function getEscrowProgram(connection, walletAdapter) {
  if (!walletAdapter) {
    throw new Error('Wallet adapter is required')
  }
  
  const wallet = createAnchorWallet(walletAdapter)
  
  if (!wallet?.publicKey || !wallet.signTransaction) {
    throw new Error('Invalid wallet: missing required properties')
  }
  
  if (!(wallet.publicKey instanceof PublicKey) || !wallet.publicKey._bn) {
    throw new Error('Invalid wallet: publicKey is not a valid PublicKey instance')
  }
  
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed'
  })
  
  if (!idl || typeof idl !== 'object') {
    throw new Error('IDL is not loaded or invalid')
  }
  
  const programIdPubkey = new PublicKey(ESCROW_PROGRAM_ID)
  
  // For Anchor 0.28.0: IDL has accounts but NO types array - Anchor handles accounts internally
  const idlWithAddress = JSON.parse(JSON.stringify(idl))
  idlWithAddress.address = ESCROW_PROGRAM_ID
  
  // Remove empty types array if it exists
  if (idlWithAddress.types && idlWithAddress.types.length === 0) {
    delete idlWithAddress.types
  }
  
  // Create Program using 3-argument form: new Program(idl, programId, provider)
  return new Program(idlWithAddress, programIdPubkey, provider)
}

/**
 * Derive PDA accounts for escrow
 * @param {PublicKey} maker - Maker's public key
 * @param {BN} seed - Seed for escrow (must be anchor.BN)
 * @param {PublicKey} programId - Program ID
 * @returns {Object} PDA accounts (auth, vault, escrow)
 */
export function deriveEscrowAccounts(maker, seed, programId) {
  // Derive escrow PDA first (using reversed seed bytes)
  const [escrow] = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), maker.toBuffer(), seed.toArrayLike(Buffer).reverse()],
    programId
  )
  
  // Derive auth and vault PDAs (depend on escrow)
  const [auth] = PublicKey.findProgramAddressSync(
    [Buffer.from('auth'), escrow.toBuffer()],
    programId
  )
  
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), escrow.toBuffer()],
    programId
  )
  
  return { auth, vault, escrow }
}

/**
 * Build initialize escrow transaction
 * 
 * @param {Object} params - Initialize parameters
 * @param {PublicKey|string} params.maker - Maker's public key
 * @param {PublicKey|string} params.depositTokenMint - Deposit token mint
 * @param {PublicKey|string} params.requestTokenMint - Request token mint
 * @param {BN|string|number} params.depositAmount - Deposit amount (in token's smallest unit)
 * @param {BN|string|number} params.requestAmount - Request amount (in token's smallest unit)
 * @param {BN} params.seed - Seed for escrow (must be anchor.BN)
 * @param {BN|number} params.expireTimestamp - Expiration timestamp (Unix timestamp in seconds, i64)
 * @param {boolean} params.allowPartialFill - Allow partial fill
 * @param {boolean} params.onlyWhitelist - Only whitelist addresses
 * @param {number} params.slippage - Slippage tolerance (f32)
 * @param {PublicKey|string|null} params.recipient - Optional recipient address
 * @param {PublicKey|string|null} params.whitelistProgram - Optional whitelist program
 * @param {PublicKey|string|null} params.whitelist - Optional whitelist account
 * @param {PublicKey|string|null} params.entry - Optional whitelist entry
 * @param {PublicKey|string} params.contractFeeAccount - Contract's fee account (REQUIRED)
 * @param {string|null} [params.memo] - Optional memo text for wallet display (e.g. "Create escrow: 50 USDC for 1.5 SOL")
 * @param {Connection} params.connection - Solana connection
 * @param {Object} params.wallet - Wallet adapter from solana-wallets-vue
 * @returns {Promise<Transaction>} Built transaction
 */
export async function buildInitializeTransaction({
  maker,
  depositTokenMint,
  requestTokenMint,
  depositAmount,
  requestAmount,
  seed,
  expireTimestamp,
  allowPartialFill,
  onlyWhitelist,
  slippage,
  recipient = null,
  whitelistProgram = null,
  whitelist = null,
  entry = null,
  contractFeeAccount = CONTRACT_FEE_ACCOUNT,
  shopFee = null, // Shop fee configuration: { wallet, makerFlatFee, takerFlatFee, makerPercentFee, takerPercentFee }
  tradeValue = 0, // Trade value in SOL (for percentage fees, optional)
  memo = null,
  connection,
  wallet
}) {
  const transaction = new Transaction()
  if (memo && memo.trim()) {
    transaction.add(createMemoInstruction(memo.trim()))
  }
  const programId = toPublicKey(ESCROW_PROGRAM_ID)
  const makerPubkey = toPublicKey(maker)
  const seedBN = toBN(seed)
  
  const { auth, vault, escrow } = deriveEscrowAccounts(makerPubkey, seedBN, programId)

  const depositTokenPubkey = toPublicKey(depositTokenMint)
  const requestTokenPubkey = toPublicKey(requestTokenMint)

  // Validate both mints are legacy SPL Token (rejects Token-2022 and MPL Core with clear error)
  await getTokenProgramIdForMint(connection, depositTokenPubkey, 'deposit')
  await getTokenProgramIdForMint(connection, requestTokenPubkey, 'request')

  const makerAta = getAssociatedTokenAddressSync(
    depositTokenPubkey,
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  const makerAtaRequest = getAssociatedTokenAddressSync(
    requestTokenPubkey,
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  const feeAccount = toPublicKey(contractFeeAccount || CONTRACT_FEE_ACCOUNT)

  // Create ATAs if they don't exist (escrow supports only legacy SPL Token)
  if (!(await checkAtaExists(depositTokenPubkey, makerPubkey, connection))) {
    transaction.add(makeAtaInstruction(depositTokenPubkey, makerPubkey, makerPubkey))
  }

  if (!(await checkAtaExists(requestTokenPubkey, makerPubkey, connection))) {
    transaction.add(makeAtaInstruction(requestTokenPubkey, makerPubkey, makerPubkey))
  }
  
  // Handle fees using centralized shop fee service
  addMakerFeeInstructions({
    maker: makerPubkey,
    shopFee,
    transaction,
    tradeValue
  })
  
  const program = getEscrowProgram(connection, wallet)
  
  const depositAmountBN = toBN(depositAmount)
  const requestAmountBN = toBN(requestAmount)
  const expireTimestampBN = toBN(expireTimestamp || 0)
  
  // Build instruction accounts - Anchor 0.28.0 requires ALL accounts, even optional ones
  // IMPORTANT: When recipient is null/undefined, pass null (not SystemProgram)
  // The program will handle setting it to SystemProgram internally and set onlyRecipient=false
  // If we pass SystemProgram here, the program might incorrectly set onlyRecipient=true
  const whitelistProgramPubkey = whitelistProgram 
    ? toPublicKey(whitelistProgram) 
    : toPublicKey(WHITELIST_PROGRAM_ID)
  
  // Handle recipient: pass null if not provided, otherwise pass the actual address
  // The program logic: if recipient is null -> sets to SystemProgram and onlyRecipient=false
  //                    if recipient is provided -> uses that address and onlyRecipient=true (if direct)
  let recipientPubkey = null
  if (recipient) {
    recipientPubkey = toPublicKey(recipient)
    // Validate it's not SystemProgram
    if (recipientPubkey.equals(SystemProgram.programId)) {
      throw new Error('Cannot use SystemProgram as recipient. Use null for public escrows or a valid wallet address for direct escrows.')
    }
  }
  
  const accounts = {
    maker: makerPubkey,
    makerAta,
    recipient: recipientPubkey, // null for public escrows, actual address for direct escrows
    depositToken: depositTokenPubkey,
    requestToken: requestTokenPubkey,
    auth,
    vault,
    escrow,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    fee: feeAccount,
    whitelistProgram: whitelistProgramPubkey,
    whitelist: whitelist ? toPublicKey(whitelist) : null,
    entry: entry ? toPublicKey(entry) : null
  }
  
  
  const initializeIx = await program.methods
    .initialize(seedBN, depositAmountBN, requestAmountBN, expireTimestampBN, allowPartialFill, onlyWhitelist, slippage)
    .accounts(accounts)
    .instruction()
  
  transaction.add(initializeIx)
  return transaction
}

/**
 * Build exchange (fill) escrow transaction
 * 
 * NOTE: The contract fee account is required and must be provided by the contract developer.
 * This account receives the contract's standard fee. Our own fee (0.01 SOL) is collected
 * separately in a prior instruction.
 * 
 * @param {Object} params - Exchange parameters
 * @param {PublicKey|string} params.maker - Maker's public key
 * @param {PublicKey|string} params.taker - Taker's public key (signer)
 * @param {PublicKey|string} params.depositTokenMint - Deposit token mint
 * @param {PublicKey|string} params.requestTokenMint - Request token mint
 * @param {number} params.amount - Amount to exchange (in token's smallest unit)
 * @param {number} params.seed - Seed for escrow
 * @param {PublicKey|string} params.contractFeeAccount - Contract's fee account (REQUIRED)
 * @param {PublicKey|string|null} params.whitelistProgram - Optional whitelist program
 * @param {PublicKey|string|null} params.whitelist - Optional whitelist account
 * @param {PublicKey|string|null} params.entry - Optional whitelist entry
 * @param {Connection} params.connection - Solana connection
 * @param {Object} params.wallet - Wallet adapter from solana-wallets-vue
 * @returns {Promise<Transaction>} Built transaction
 */
export async function buildExchangeTransaction({
  maker,
  taker,
  depositTokenMint,
  requestTokenMint,
  amount,
  seed,
  requestAmount = null, // Optional: request amount in lamports (for wrapped SOL)
  contractFeeAccount = CONTRACT_FEE_ACCOUNT,
  whitelistProgram = null,
  whitelist = null,
  entry = null,
  connection,
  wallet
}) {
  const transaction = new Transaction()
  const programId = new PublicKey(ESCROW_PROGRAM_ID)
  
  // Ensure seed is BN
  const seedBN = seed instanceof BN ? seed : new BN(seed.toString())
  
  // Convert maker to PublicKey if it's a string
  const makerPubkey = toPublicKey(maker)
  
  // Derive PDAs
  const { auth, vault, escrow } = deriveEscrowAccounts(makerPubkey, seedBN, programId)
  
  // Get all ATAs needed for exchange
  const { makerReceiveAta, takerAta, takerReceiveAta } = getExchangeATAs({
    maker: makerPubkey,
    taker,
    depositTokenMint,
    requestTokenMint
  })
  
  const takerPubkey = toPublicKey(taker)
  const depositTokenPubkey = toPublicKey(depositTokenMint)
  const requestTokenPubkey = toPublicKey(requestTokenMint)
  const feeAccount = toPublicKey(contractFeeAccount || CONTRACT_FEE_ACCOUNT)
  
  // Prepare taker ATAs (check existence and add creation instructions if needed)
  const { takerAtaExists, takerReceiveAtaExists, totalCost: ataCost } = await prepareTakerATAs({
    transaction,
    requestTokenMint: requestTokenPubkey,
    depositTokenMint: depositTokenPubkey,
    taker: takerPubkey,
    connection
  })
  
  let totalCostToFund = ataCost
  
  // Handle wrapped SOL: if request token is wrapped SOL, we need to wrap native SOL
  if (isWrappedSol(requestTokenMint)) {
    const wrappedSolAccount = getWrappedSolAccount(takerPubkey)
    
    // Get request amount in lamports
    const requestAmountLamports = await getRequestAmountLamports({
      requestAmount,
      fetchEscrowAccount: async () => {
        const program = getEscrowProgram(connection, wallet)
        return await program.account.escrow.fetch(escrow)
      },
      amountBN: amount
    })
    
    // Calculate SOL to transfer
    const solToTransfer = await calculateSolToTransfer({
      wrappedSolAccount,
      requestAmountLamports,
      accountExists: takerAtaExists,
      connection
    })
    
    // Add wrapped SOL instructions to transaction
    addWrappedSolInstructions({
      transaction,
      takerPubkey,
      wrappedSolAccount,
      solToTransfer,
      accountExists: takerAtaExists
    })
  }
  
  // Add transaction fee estimate
  totalCostToFund += TRANSACTION_COSTS.TRANSACTION_FEE
  
  // Note: Funding taker costs from platform wallet would require platform wallet signature
  // This feature is not currently implemented as it requires server-side support
  // Takers are responsible for covering their own transaction costs
  
  const program = getEscrowProgram(connection, wallet)
  const amountBN = toBN(amount)
  
  // Build instruction accounts - include optional whitelist accounts
  const whitelistProgramPubkey = whitelistProgram 
    ? toPublicKey(whitelistProgram) 
    : toPublicKey(WHITELIST_PROGRAM_ID)
  
  const accounts = {
    maker: makerPubkey,
    makerReceiveAta,
    depositToken: depositTokenPubkey,
    taker: takerPubkey,
    takerAta,
    takerReceiveAta,
    requestToken: requestTokenPubkey,
    auth,
    vault,
    escrow,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    fee: feeAccount,
    whitelistProgram: whitelistProgramPubkey,
    whitelist: whitelist ? toPublicKey(whitelist) : null,
    entry: entry ? toPublicKey(entry) : null
  }
  
  // Note: The exchange instruction doesn't have a recipient account in the IDL.
  // The program reads and validates the recipient from the escrow account itself.
  // If recipient is SystemProgram (1111...1111) and onlyRecipient is true,
  // the program may incorrectly validate this, causing error 6004.
  
  const exchangeIx = await program.methods
    .exchange(amountBN)
    .accounts(accounts)
    .instruction()
  
  transaction.add(exchangeIx)
  
  return transaction
}

/**
 * Build cancel escrow transaction
 * @param {Object} params - Cancel parameters
 * @param {PublicKey} params.maker - Maker's public key (signer)
 * @param {PublicKey} params.depositTokenMint - Deposit token mint
 * @param {PublicKey} params.requestTokenMint - Request token mint
 * @param {number} params.seed - Seed for escrow
 * @param {Connection} params.connection - Solana connection
 * @param {Wallet} params.wallet - Wallet adapter
 * @returns {Promise<Transaction>} Built transaction
 */
export async function buildCancelTransaction({
  maker,
  depositTokenMint,
  requestTokenMint,
  seed,
  connection,
  wallet
}) {
  const transaction = new Transaction()
  const programId = toPublicKey(ESCROW_PROGRAM_ID)
  
  // Ensure seed is BN
  const seedBN = toBN(seed)
  
  // Derive PDAs
  const makerPubkey = toPublicKey(maker)
  const { auth, vault, escrow } = deriveEscrowAccounts(makerPubkey, seedBN, programId)
  
  // Get associated token accounts
  const makerAta = getAssociatedTokenAddressSync(
    toPublicKey(depositTokenMint),
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const makerAtaRequest = getAssociatedTokenAddressSync(
    toPublicKey(requestTokenMint),
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const depositTokenPubkey = toPublicKey(depositTokenMint)
  const requestTokenPubkey = toPublicKey(requestTokenMint)
  
  const program = getEscrowProgram(connection, wallet)
  
  const accounts = {
    maker: makerPubkey,
    makerAta,
    depositToken: depositTokenPubkey,
    makerAtaRequest,
    makerTokenRequest: requestTokenPubkey,
    auth,
    vault,
    escrow,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId
  }
  
  const cancelIx = await program.methods
    .cancel()
    .accounts(accounts)
    .instruction()
  
  transaction.add(cancelIx)
  
  return transaction
}

/**
 * Get read-only Anchor program instance (for fetching accounts without wallet)
 * @param {Connection} connection - Solana connection
 * @returns {Program} Anchor program instance
 */
export function getEscrowProgramReadOnly(connection) {
  if (!idl || typeof idl !== 'object') {
    throw new Error('IDL is not loaded or invalid')
  }
  
  const programIdPubkey = new PublicKey(ESCROW_PROGRAM_ID)
  
  // Create a dummy wallet for read-only operations
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs
  }
  
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed'
  })
  
  // For Anchor 0.28.0: IDL has accounts but NO types array - Anchor handles accounts internally
  const idlWithAddress = JSON.parse(JSON.stringify(idl))
  idlWithAddress.address = ESCROW_PROGRAM_ID
  
  // Remove empty types array if it exists
  if (idlWithAddress.types && idlWithAddress.types.length === 0) {
    delete idlWithAddress.types
  }
  
  // Create Program using 3-argument form: new Program(idl, programId, provider)
  return new Program(idlWithAddress, programIdPubkey, provider)
}

/**
 * Fetch all escrows from the blockchain
 * @param {Connection} connection - Solana connection
 * @param {PublicKey|null} makerFilter - Optional maker public key to filter by
 * @returns {Promise<Array>} Array of escrow accounts
 */
export async function fetchAllEscrows(connection, makerFilter = null) {
  try {
    const program = getEscrowProgramReadOnly(connection)
    
    // Fetch all escrow accounts
    const escrows = await program.account.escrow.all()
    
    // Filter by maker if provided
    if (makerFilter) {
      const makerPubkey = makerFilter instanceof PublicKey ? makerFilter : new PublicKey(makerFilter)
      return escrows.filter(escrow => 
        escrow.account.maker.toString() === makerPubkey.toString()
      )
    }
    
    return escrows
  } catch (error) {
    logError('Failed to fetch escrows:', error)
    throw error
  }
}

/**
 * Fetch a single escrow by its public key address
 * @param {Connection} connection - Solana connection
 * @param {PublicKey|string} escrowAddress - Escrow account public key
 * @returns {Promise<Object|null>} Escrow account data or null if not found
 */
export async function fetchEscrowByAddress(connection, escrowAddress) {
  try {
    const program = getEscrowProgramReadOnly(connection)
    const escrowPubkey = toPublicKey(escrowAddress)
    
    const escrowAccount = await program.account.escrow.fetch(escrowPubkey)
    
    return {
      publicKey: escrowPubkey,
      account: escrowAccount
    }
  } catch (error) {
    if (error.message && error.message.includes('Account does not exist')) {
      return null
    }
    logError('Failed to fetch escrow:', error)
    throw error
  }
}
