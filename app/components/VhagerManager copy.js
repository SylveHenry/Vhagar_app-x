'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import idl from '@/idl/idl.json';
import styles from "../page.module.css";

// Constants (replace with actual values)
const programId = new PublicKey('DybDiU1cRQMPJQLEE5xbtMZg1cihaW7g9aPvqyDSAwwg');
const stakingPoolKey = new PublicKey('9QmBeWNKpzzSFZisGf8c3ay6ttnh7N5LFdUsWaGmbpgY');
const stakeAuthority = new PublicKey('BfwdtsDcLLWiTTL8WprXXDEZsZBNHHKcjiKZ8zhvTXgc');
const tokenMint = new PublicKey('EwVMtR3qMpES8uskX4AFWSxLnRjGRLowaYzn6C4ZN48Y');
const tokenProgramId = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const stakeVault = new PublicKey('DQPsctR9MT5MBgKhPQE8i8faM6CQU7HRtAn8o9fQ7nwG');
const rewardVault = new PublicKey('DQPsctR9MT5MBgKhPQE8i8faM6CQU7HRtAn8o9fQ7nwG');

const lockTagMap = {
  'bronze': { bronze: {} },
  'silver': { silver: {} },
  'gold': { gold: {} },
  'diamond': { diamond: {} }
};

export default function VhagerManager({ setUserInfo, setError, setResult }) {
  const wallet = useWallet();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    if (wallet.connected) {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: 'confirmed',
      });
      const program = new anchor.Program(idl, programId, provider);
      setProgram(program);
      getUserInfo();
    } else {
      setProgram(null);
      setUserInfo(null);
    }
  }, [wallet.connected]);

  const handleInputChange = (name, field, value) => {
    setInputs(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        [field]: value
      }
    }));
  };

  const executeFunction = async (func, name) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await func();
      setResult(res);
      getUserInfo();
    } catch (err) {
      console.error(`Error executing ${name}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userLockInfoKey] = await PublicKey.findProgramAddress(
        [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
        program.programId
      );
      const result = await program.methods.getUserInfo().accounts({
        stakingPool: stakingPoolKey,
        userLockInfo: userLockInfoKey,
        user: wallet.publicKey,
      }).view();
      const formattedInfo = result.locks.flatMap((tagLocks, tagIndex) => 
        tagLocks.map((lock) => ({
          tag: ['Bronze', 'Silver', 'Gold', 'Diamond'][tagIndex],
          lockedAmount: formatNumber(lock.lockedAmount) + ' VGR',
          lockedReward: formatNumber(lock.lockedReward) + ' VGR',
          unlockTime: formatTime(lock.unlockTime),
          lockedTime: formatTime(lock.lockedTime)
        }))
      ).filter(lock => parseFloat(lock.lockedAmount) > 0);
      setUserInfo(formattedInfo);
    } catch (err) {
      console.error(`Error fetching user info: ${err.message}`);
      setError(`Error fetching user info: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const functions = {
    stake: {
      func: async () => {
        const { amount, lockTag } = inputs.stake || {};
        if (!amount || !lockTag) {
          throw new Error('Please provide all required inputs: amount and lockTag');
        }
        const lamports = new anchor.BN(parseFloat(amount) * 1e9);
        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        const userTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey, false, tokenProgramId);
        
        const lockTagEnum = lockTagMap[lockTag.toLowerCase()];
        if (!lockTagEnum) {
          throw new Error('Invalid lock tag. Please use Bronze, Silver, Gold, or Diamond.');
        }

        const tx = await program.methods.stake(lamports, lockTagEnum, 0)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userTokenAccount: userTokenAccount,
            stakeVault: stakeVault,
            userLockInfo: userLockInfoKey,
            tokenProgram: tokenProgramId,
          }).rpc();

        return `Staked ${amount} VGR with ${lockTag} lock. Transaction: ${tx}`;
      },
      inputs: ['amount', 'lockTag'],
    },
    unstake: {
      func: async () => {
        const { lockTag } = inputs.unstake || {};
        if (!lockTag) {
          throw new Error('Please provide the required input: lockTag');
        }
        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        const userTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey, false, tokenProgramId);
        
        const lockTagEnum = lockTagMap[lockTag.toLowerCase()];
        if (!lockTagEnum) {
          throw new Error('Invalid lock tag. Please use Bronze, Silver, Gold, or Diamond.');
        }

        const tx = await program.methods.unstake(lockTagEnum, 0)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userTokenAccount: userTokenAccount,
            stakeVault: stakeVault,
            rewardVault: rewardVault,
            userLockInfo: userLockInfoKey,
            stakeAuthority: stakeAuthority,
            tokenProgram: tokenProgramId,
          }).rpc();

        return `Unstaked from ${lockTag} lock. Transaction: ${tx}`;
      },
      inputs: ['lockTag'],
    },
    autocompound: {
      func: async () => {
        const { lockTag } = inputs.autocompound || {};
        if (!lockTag) {
          throw new Error('Please provide the required input: lockTag');
        }
        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        
        const lockTagEnum = lockTagMap[lockTag.toLowerCase()];
        if (!lockTagEnum) {
          throw new Error('Invalid lock tag. Please use Bronze, Silver, Gold, or Diamond.');
        }

        const tx = await program.methods.autocompound(lockTagEnum, 0)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userLockInfo: userLockInfoKey,
          }).rpc();

        return `Autocompounded ${lockTag} lock. Transaction: ${tx}`;
      },
      inputs: ['lockTag'],
    },
  };

  return (
    <div className={styles.column}>
      {Object.entries(functions).map(([name, { func, inputs }]) => (
        <div key={name} className={styles.cols}>
          <div className="p-3">
            <h3 className="text-light pb-3">{name.toUpperCase()}</h3>
            {inputs.map((input) => (
              <div key={input} className="mb-3">
                {input === 'lockTag' ? (
                  <select
                    className={`form-select form-select-lg mb-3 text-light ${styles.customSelect}`}
                    onChange={(e) => handleInputChange(name, input, e.target.value)}
                  >
                    <option value="">Select Tier</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="diamond">Diamond</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    step="0.000000001"
                    placeholder={`Enter ${input}`}
                    className="p-3 w-100"
                    style={{ border: "1px solid #63b560" }}
                    onChange={(e) => handleInputChange(name, input, e.target.value)}
                  />
                )}
              </div>
            ))}
            <button
              className={styles.executeButton}
              onClick={() => executeFunction(func, name)}
              disabled={loading || !wallet.connected}
            >
              Execute
            </button>
          </div>
        </div>
      ))}
      {loading && <p className="text-light">Loading...</p>}
    </div>
  );
}

function formatNumber(number, decimals = 9) {
  const value = Number(number) / Math.pow(10, decimals);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value);
}

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}