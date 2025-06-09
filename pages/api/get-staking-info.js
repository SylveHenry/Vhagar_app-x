/**
 * SECURITY NOTE: This file handles sensitive cryptographic operations
 * 
 * CRITICAL: The DISPLAY_SIGNER_KEY environment variable contains a private key
 * and must NEVER be exposed to the client-side. This API route runs server-side only.
 * 
 * Security measures in place:
 * 1. Environment variable validation
 * 2. Error message sanitization (no internal details exposed to client)
 * 3. Server-side only execution (Next.js API routes)
 * 4. .env file is git-ignored
 */

import { Connection, Keypair } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import idl from '@/idl/idl.json';
import { config } from '@/app/config';
import bs58 from 'bs58';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variable exists
    if (!process.env.DISPLAY_SIGNER_KEY) {
      console.error('DISPLAY_SIGNER_KEY environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const connection = new Connection(config.rpcEndpoint);
    
    let displaySigner;
    try {
      displaySigner = Keypair.fromSecretKey(bs58.decode(process.env.DISPLAY_SIGNER_KEY));
    } catch (error) {
      console.error('Invalid DISPLAY_SIGNER_KEY format:', error.message);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey: displaySigner.publicKey,
        signTransaction: (tx) => {
          tx.partialSign(displaySigner);
          return Promise.resolve(tx);
        },
        signAllTransactions: (txs) => {
          txs.forEach(tx => tx.partialSign(displaySigner));
          return Promise.resolve(txs);
        },
      },
      { preflightCommitment: 'confirmed' }
    );

    const program = new anchor.Program(idl, config.programId, provider);

    const totalStakedBalance = await program.methods.getTotalStakedBalance()
      .accounts({ stakingPool: config.stakingPoolKey })
      .view();

    const stakeInfo = await program.methods.getStakeInfo()
      .accounts({ stakingPool: config.stakingPoolKey })
      .view();

    // Convert BN to numbers
    const formattedStakeInfo = stakeInfo.map(info => ({
      ...info,
      lockPeriod: info.lockPeriod.toNumber(),
      rewardPercentage: info.rewardPercentage.toNumber()
    }));

    res.status(200).json({
      totalStaked: totalStakedBalance.totalLockedBalance.toNumber() / Math.pow(10, config.tokenDecimals),
      totalClaimable: totalStakedBalance.totalLockedReward.toNumber() / Math.pow(10, config.tokenDecimals),
      stakeInfo: formattedStakeInfo
    });
  } catch (error) {
    console.error('Error fetching staking info:', error);
    // Don't expose internal error details to the client
    res.status(500).json({ error: 'Failed to fetch staking info' });
  }
}