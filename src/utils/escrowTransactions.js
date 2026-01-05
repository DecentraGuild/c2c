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
  TOKEN_PROGRAM_ID,
  createSyncNativeInstruction,
  NATIVE_MINT
} from '@solana/spl-token'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { ESCROW_PROGRAM_ID, CONTRACT_FEE_ACCOUNT, WHITELIST_PROGRAM_ID } from './constants'
import { FEE_CONFIG, FUND_TAKER_COSTS, TRANSACTION_COSTS } from './constants/fees'
import { checkAtaExists, makeAtaInstruction } from './ataUtils'
import idl from '../idl/escrow_service.json'

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
  connection,
  wallet
}) {
  const transaction = new Transaction()
  const programId = new PublicKey(ESCROW_PROGRAM_ID)
  const makerPubkey = maker instanceof PublicKey ? maker : new PublicKey(maker)
  const seedBN = seed instanceof BN ? seed : new BN(seed.toString())
  
  const { auth, vault, escrow } = deriveEscrowAccounts(makerPubkey, seedBN, programId)
  
  const makerAta = getAssociatedTokenAddressSync(
    new PublicKey(depositTokenMint),
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const makerAtaRequest = getAssociatedTokenAddressSync(
    new PublicKey(requestTokenMint),
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const depositTokenPubkey = new PublicKey(depositTokenMint)
  const requestTokenPubkey = new PublicKey(requestTokenMint)
  const feeAccount = new PublicKey(contractFeeAccount || CONTRACT_FEE_ACCOUNT)
  
  // Create ATAs if they don't exist
  if (!(await checkAtaExists(depositTokenPubkey, makerPubkey, connection))) {
    transaction.add(makeAtaInstruction(depositTokenPubkey, makerPubkey, makerPubkey))
  }
  
  if (!(await checkAtaExists(requestTokenPubkey, makerPubkey, connection))) {
    transaction.add(makeAtaInstruction(requestTokenPubkey, makerPubkey, makerPubkey))
  }
  
  // Add platform fee transfer instruction (0.009 SOL to platform wallet)
  // This fee is sent immediately on escrow creation and is non-refundable
  // It represents a platform fee per smart contract trigger, regardless of fill/cancel outcome
  const platformFeeWallet = new PublicKey(FEE_CONFIG.WALLET)
  const platformFeeTransfer = SystemProgram.transfer({
    fromPubkey: makerPubkey,
    toPubkey: platformFeeWallet,
    lamports: FEE_CONFIG.AMOUNT_LAMPORTS
  })
  transaction.add(platformFeeTransfer)
  
  const program = getEscrowProgram(connection, wallet)
  
  const depositAmountBN = depositAmount instanceof BN ? depositAmount : new BN(depositAmount.toString())
  const requestAmountBN = requestAmount instanceof BN ? requestAmount : new BN(requestAmount.toString())
  const expireTimestampBN = expireTimestamp instanceof BN ? expireTimestamp : new BN(expireTimestamp || 0)
  
  // Build instruction accounts - Anchor 0.28.0 requires ALL accounts, even optional ones
  // IMPORTANT: When recipient is null/undefined, pass null (not SystemProgram)
  // The program will handle setting it to SystemProgram internally and set onlyRecipient=false
  // If we pass SystemProgram here, the program might incorrectly set onlyRecipient=true
  const whitelistProgramPubkey = whitelistProgram 
    ? new PublicKey(whitelistProgram) 
    : new PublicKey(WHITELIST_PROGRAM_ID)
  
  // Handle recipient: pass null if not provided, otherwise pass the actual address
  // The program logic: if recipient is null -> sets to SystemProgram and onlyRecipient=false
  //                    if recipient is provided -> uses that address and onlyRecipient=true (if direct)
  let recipientPubkey = null
  if (recipient) {
    recipientPubkey = new PublicKey(recipient)
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
    whitelist: whitelist ? new PublicKey(whitelist) : null,
    entry: entry ? new PublicKey(entry) : null
  }
  
  console.log('Initialize escrow accounts:', {
    recipient: recipientPubkey?.toString() || 'null (public)',
    recipientIsSystemProgram: recipientPubkey?.equals(SystemProgram.programId) || false,
    maker: makerPubkey.toString()
  })
  
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
  const makerPubkey = maker instanceof PublicKey ? maker : new PublicKey(maker)
  
  // Derive PDAs
  const { auth, vault, escrow } = deriveEscrowAccounts(makerPubkey, seedBN, programId)
  
  // Get associated token accounts
  const makerReceiveAta = getAssociatedTokenAddressSync(
    new PublicKey(requestTokenMint),
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const takerPubkey = taker instanceof PublicKey ? taker : new PublicKey(taker)
  const takerAta = getAssociatedTokenAddressSync(
    new PublicKey(requestTokenMint),
    takerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const takerReceiveAta = getAssociatedTokenAddressSync(
    new PublicKey(depositTokenMint),
    takerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const depositTokenPubkey = new PublicKey(depositTokenMint)
  const requestTokenPubkey = new PublicKey(requestTokenMint)
  const feeAccount = new PublicKey(contractFeeAccount || CONTRACT_FEE_ACCOUNT)
  
  // Check if taker ATAs exist and create them if needed
  // If FUND_TAKER_COSTS is true, we could fund from platform wallet
  // For now, taker pays for ATA creation, but we show the cost
  const takerAtaExists = await checkAtaExists(requestTokenPubkey, takerPubkey, connection)
  const takerReceiveAtaExists = await checkAtaExists(depositTokenPubkey, takerPubkey, connection)
  
  // Check if request token is wrapped SOL (native SOL)
  const isWrappedSOL = requestTokenPubkey.equals(NATIVE_MINT)
  
  // Calculate costs that will be incurred
  let totalCostToFund = 0
  if (!takerAtaExists) {
    transaction.add(makeAtaInstruction(requestTokenPubkey, takerPubkey, takerPubkey))
    totalCostToFund += TRANSACTION_COSTS.ATA_CREATION
  }
  if (!takerReceiveAtaExists) {
    transaction.add(makeAtaInstruction(depositTokenPubkey, takerPubkey, takerPubkey))
    totalCostToFund += TRANSACTION_COSTS.ATA_CREATION
  }
  
  // Handle wrapped SOL: if request token is wrapped SOL, we need to wrap native SOL
  if (isWrappedSOL) {
    const wrappedSolAccount = takerAta
    
    // Get request amount in lamports
    let requestAmountLamports
    if (requestAmount) {
      requestAmountLamports = requestAmount instanceof BN ? requestAmount : new BN(requestAmount.toString())
    } else {
      // Fallback: fetch escrow to calculate (less accurate)
      const program = getEscrowProgram(connection, wallet)
      const escrowAccount = await program.account.escrow.fetch(escrow)
      const price = escrowAccount.price
      const amountBN = amount instanceof BN ? amount : new BN(amount.toString())
      // Estimate: this is approximate without exact decimals
      const priceScaled = new BN(Math.floor(price * 1e9))
      requestAmountLamports = amountBN.mul(priceScaled).div(new BN(1e9))
    }
    
    // Rent-exempt amount for wrapped SOL account (0.00203928 SOL = 2,039,280 lamports)
    const rentExemptAmount = new BN(2039280)
    
    // Calculate SOL to transfer:
    // - If account doesn't exist: need request amount + rent (rent will be returned when account closes)
    // - If account exists: check current balance and only transfer what's needed
    let solToTransfer
    if (!takerAtaExists) {
      // New account: transfer request amount + rent
      // Note: The rent will be returned when the account closes after exchange,
      // which causes the confusing balance display, but this is necessary for account creation
      solToTransfer = requestAmountLamports.add(rentExemptAmount)
    } else {
      // Existing account: check current balance
      try {
        const accountInfo = await connection.getAccountInfo(wrappedSolAccount)
        if (accountInfo) {
          // Account exists, check if it has enough balance
          const tokenAccount = await connection.getParsedAccountInfo(wrappedSolAccount)
          const currentBalance = tokenAccount.value?.data?.parsed?.info?.tokenAmount?.uiAmount || 0
          const currentBalanceLamports = new BN(Math.floor(currentBalance * 1e9))
          
          if (currentBalanceLamports.gte(requestAmountLamports)) {
            // Already has enough, no transfer needed
            solToTransfer = new BN(0)
          } else {
            // Need to add more - only transfer the difference
            const needed = requestAmountLamports.sub(currentBalanceLamports)
            solToTransfer = needed
          }
        } else {
          // Account doesn't exist (shouldn't happen if takerAtaExists is true, but handle it)
          solToTransfer = requestAmountLamports.add(rentExemptAmount)
        }
      } catch (err) {
        // If we can't check, transfer the full amount (safer)
        console.warn('Could not check wrapped SOL account balance, transferring full amount:', err)
        solToTransfer = requestAmountLamports.add(rentExemptAmount)
      }
    }
    
    // Only add transfer instruction if we need to transfer SOL
    if (solToTransfer.gt(new BN(0))) {
      // Transfer SOL from user's wallet to wrapped SOL account
      // This must happen BEFORE the exchange instruction
      const transferSolIx = SystemProgram.transfer({
        fromPubkey: takerPubkey,
        toPubkey: wrappedSolAccount,
        lamports: solToTransfer.toNumber()
      })
      transaction.add(transferSolIx)
    }
    
    // Sync native SOL to wrapped SOL
    // This converts the native SOL in the account to wrapped SOL tokens
    // Only needed if we transferred SOL or if account might have native SOL
    if (!takerAtaExists || solToTransfer.gt(new BN(0))) {
      const syncNativeIx = createSyncNativeInstruction(
        wrappedSolAccount,
        TOKEN_PROGRAM_ID
      )
      transaction.add(syncNativeIx)
    }
  }
  
  // Add transaction fee estimate
  totalCostToFund += TRANSACTION_COSTS.TRANSACTION_FEE
  
  // If FUND_TAKER_COSTS is enabled, transfer SOL from platform wallet to taker to cover costs
  // Note: This requires the platform wallet to also sign, which would need server-side support
  // For now, we'll add the transfer instruction but it will need platform wallet signature
  if (FUND_TAKER_COSTS && totalCostToFund > 0) {
    const platformFeeWallet = new PublicKey(FEE_CONFIG.WALLET)
    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const lamportsToTransfer = Math.ceil(totalCostToFund * 1_000_000_000)
    
    // Add transfer from platform wallet to taker
    // NOTE: This requires platform wallet to sign the transaction
    // In a production setup, this would need to be handled server-side
    const costCoverageTransfer = SystemProgram.transfer({
      fromPubkey: platformFeeWallet,
      toPubkey: takerPubkey,
      lamports: lamportsToTransfer
    })
    // Add this instruction first (before exchange)
    // Note: This will fail unless platform wallet signs, so we'll make it optional
    // For now, we'll comment it out and just show the cost to users
    // transaction.add(costCoverageTransfer)
  }
  
  const program = getEscrowProgram(connection, wallet)
  const amountBN = amount instanceof BN ? amount : new BN(amount.toString())
  
  // Build instruction accounts - include optional whitelist accounts
  const whitelistProgramPubkey = whitelistProgram 
    ? new PublicKey(whitelistProgram) 
    : new PublicKey(WHITELIST_PROGRAM_ID)
  
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
    whitelist: whitelist ? new PublicKey(whitelist) : null,
    entry: entry ? new PublicKey(entry) : null
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
  const programId = new PublicKey(ESCROW_PROGRAM_ID)
  
  // Ensure seed is BN
  const seedBN = seed instanceof BN ? seed : new BN(seed.toString())
  
  // Derive PDAs
  const { auth, vault, escrow } = deriveEscrowAccounts(maker, seedBN, programId)
  
  // Get associated token accounts
  const makerPubkey = maker instanceof PublicKey ? maker : new PublicKey(maker)
  const makerAta = getAssociatedTokenAddressSync(
    new PublicKey(depositTokenMint),
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const makerAtaRequest = getAssociatedTokenAddressSync(
    new PublicKey(requestTokenMint),
    makerPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  
  const depositTokenPubkey = new PublicKey(depositTokenMint)
  const requestTokenPubkey = new PublicKey(requestTokenMint)
  
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
    console.error('Failed to fetch escrows:', error)
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
    const escrowPubkey = escrowAddress instanceof PublicKey ? escrowAddress : new PublicKey(escrowAddress)
    
    const escrowAccount = await program.account.escrow.fetch(escrowPubkey)
    
    return {
      publicKey: escrowPubkey,
      account: escrowAccount
    }
  } catch (error) {
    if (error.message && error.message.includes('Account does not exist')) {
      return null
    }
    console.error('Failed to fetch escrow:', error)
    throw error
  }
}
