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
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT);
    const displaySigner = Keypair.fromSecretKey(bs58.decode(process.env.DISPLAY_SIGNER_KEY));

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
      totalStaked: totalStakedBalance.totalLockedBalance.toNumber() / 1e9,
      totalClaimable: totalStakedBalance.totalLockedReward.toNumber() / 1e9,
      stakeInfo: formattedStakeInfo
    });
  } catch (error) {
    console.error('Error fetching staking info:', error);
    res.status(500).json({ error: 'Failed to fetch staking info' });
  }
}