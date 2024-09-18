'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import styles from '../page.module.css';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import idl from '@/idl/idl.json';
import { config } from '../config';

// Use constants from config
const {
  programId,
  stakingPoolKey,
  stakeAuthority,
  tokenMint,
  tokenProgramId,
  stakeVault,
  rewardVault,
  rpcEndpoint
} = config;

const lockTagMap = {
  'bronze': { bronze: {} },
  'silver': { silver: {} },
  'gold': { gold: {} },
  'diamond': { diamond: {} }
};

// Helper functions
function formatNumber(number, decimals = config.tokenDecimals) {
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

function formatDuration(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  seconds %= 24 * 60 * 60;
  const hours = Math.floor(seconds / (60 * 60));
  seconds %= 60 * 60;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}

export default function AdminPage() {
  const wallet = useWallet();
  const [program, setProgram] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    if (wallet.connected) {
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT, 'confirmed');
      const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: 'confirmed',
      });
      const program = new anchor.Program(idl, programId, provider);
      setProgram(program);
    } else {
      setProgram(null);
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
      setResult(formatResult(res, name));
    } catch (err) {
      console.error(`Error executing ${name}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatResult = useCallback((result, functionName) => {
    if (functionName === 'getUserInfo') {
      return (
        <div className={styles.infoGrid}>
          {result.map((lock, index) => (
            <div key={index} className={styles.infoBox}>
              <h3 className={styles.infoBoxTitle}>{lock.tag} - Slot {lock.slot}</h3>
              <p><strong>Locked Amount:</strong> {lock.lockedAmount}</p>
              <p><strong>Locked Reward:</strong> {lock.lockedReward}</p>
              <p><strong>Unlock Time:</strong> {lock.unlockTime}</p>
              <p><strong>Locked Time:</strong> {lock.lockedTime}</p>
            </div>
          ))}
        </div>
      );
    } else if (functionName === 'getApy') {
      return (
        <div className={styles.infoGrid}>
          {result.map((item, index) => (
            <div key={index} className={styles.infoBox}>
              <h3 className={styles.infoBoxTitle}>{Object.keys(item.tag)[0]}</h3>
              <p><strong>APY:</strong> {(item.apy / 10000).toFixed(2)}%</p>
            </div>
          ))}
        </div>
      );
    } else if (functionName === 'getStakeInfo') {
      return (
        <div className={styles.infoGrid}>
          {result.map((item, index) => (
            <div key={index} className={styles.infoBox}>
              <h3 className={styles.infoBoxTitle}>{Object.keys(item.tag)[0]}</h3>
              <p><strong>Lock Period:</strong> {formatDuration(item.lockPeriod)}</p>
              <p><strong>Reward Percentage:</strong> {(item.rewardPercentage / 10000).toFixed(2)}%</p>
            </div>
          ))}
        </div>
      );
    } else if (functionName === 'getTotalStakedBalance') {
      return (
        <div className={styles.infoBox}>
          <h3 className={styles.infoBoxTitle}>Total Staked Balance</h3>
          <p><strong>Total Locked Balance:</strong> {formatNumber(result.totalLockedBalance)} VGR</p>
          <p><strong>Total Locked Reward:</strong> {formatNumber(result.totalLockedReward)} VGR</p>
        </div>
      );
    } else if (functionName === 'getRewardBalance') {
      return (
        <div className={styles.infoBox}>
          <h3 className={styles.infoBoxTitle}>Reward Balance</h3>
          <p><strong>Balance:</strong> {formatNumber(result)} VGR</p>
        </div>
      );
    } else if (functionName === 'getManagerAddress') {
      return (
        <div className={styles.infoBox}>
          <h3 className={styles.infoBoxTitle}>Manager Address</h3>
          <p>{result.toBase58()}</p>
        </div>
      );
    } else if (functionName === 'getProgramPauseStatus' || functionName === 'getStakingPauseStatus') {
      return (
        <div className={styles.infoBox}>
          <h3 className={styles.infoBoxTitle}>{functionName === 'getProgramPauseStatus' ? 'Program Pause Status' : 'Staking Pause Status'}</h3>
          <p><strong>Status:</strong> {result ? 'Paused' : 'Not Paused'}</p>
        </div>
      );
    } else if (typeof result === 'object') {
      return (
        <div className={styles.resultObject}>
          {Object.entries(result).map(([key, value]) => (
            <p key={key}>
              <strong>{key}:</strong> {formatValue(value)}
            </p>
          ))}
        </div>
      );
    } else {
      return <p>{formatValue(result)}</p>;
    }
  }, []);

  const formatValue = (value) => {
    if (typeof value === 'bigint' || value instanceof anchor.BN) {
      return formatNumber(value.toString());
    } else if (Array.isArray(value)) {
      return value.map(formatValue).join(', ');
    } else if (value instanceof PublicKey) {
      return value.toBase58();
    } else if (typeof value === 'boolean') {
      return value.toString();
    } else {
      return value;
    }
  };

  const functions = {
    viewFunctions: {
      getApy: () => program.methods.getApy().accounts({ stakingPool: stakingPoolKey }).view(),
      getStakeInfo: () => program.methods.getStakeInfo().accounts({ stakingPool: stakingPoolKey }).view(),
      getUserInfo: async () => {
        const [userLockInfoKey] = PublicKey.findProgramAddressSync(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        try {
          const result = await program.methods.getUserInfo().accounts({
            stakingPool: stakingPoolKey,
            userLockInfo: userLockInfoKey,
            user: wallet.publicKey,
          }).view();

          const formattedInfo = result.locks.flatMap((tagLocks, tagIndex) => 
            tagLocks.map((lock, slotIndex) => ({
              tag: ['Bronze', 'Silver', 'Gold', 'Diamond'][tagIndex],
              slot: slotIndex,
              lockedAmount: formatNumber(lock.lockedAmount) + ' VGR',
              lockedReward: formatNumber(lock.lockedReward) + ' VGR',
              unlockTime: formatTime(lock.unlockTime),
              lockedTime: formatTime(lock.lockedTime)
            }))
          ).filter(lock => parseFloat(lock.lockedAmount) > 0);

          return formattedInfo;
        } catch (error) {
          if (error.message.includes('Account does not exist')) {
            throw new Error('No staking information found for this address.');
          }
          throw error;
        }
      },
      getTotalStakedBalance: () => program.methods.getTotalStakedBalance().accounts({ stakingPool: stakingPoolKey }).view(),
      getRewardBalance: () => program.methods.getRewardBalance().accounts({ stakingPool: stakingPoolKey }).view(),
      getManagerAddress: () => program.methods.getManagerAddress().accounts({ stakingPool: stakingPoolKey }).view(),
      getProgramPauseStatus: () => program.methods.getProgramPauseStatus().accounts({ stakingPool: stakingPoolKey }).view(),
      getStakingPauseStatus: () => program.methods.getStakingPauseStatus().accounts({ stakingPool: stakingPoolKey }).view(),
    },
    executeFunctions: {
      stake: async () => {
        const { amount, lockTag, slot } = inputs.stake || {};
        if (!amount || !lockTag || slot === undefined) {
          throw new Error('Please provide all required inputs: amount, lockTag, and slot');
        }
        const lamports = new anchor.BN(parseFloat(amount) * Math.pow(10, config.tokenDecimals));
        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        const userTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey, false, tokenProgramId);
        
        const lockTagEnum = lockTagMap[lockTag.toLowerCase()];
        if (!lockTagEnum) {
          throw new Error('Invalid lock tag. Please use Bronze, Silver, Gold, or Diamond.');
        }

        const tx = await program.methods.stake(lamports, lockTagEnum, slot)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userTokenAccount: userTokenAccount,
            stakeVault: stakeVault,
            userLockInfo: userLockInfoKey,
            tokenProgram: tokenProgramId,
          }).rpc();

        return `Staked ${amount} VGR with ${lockTag} lock in slot ${slot}. Transaction: ${tx}`;
      },
      autocompound: async () => {
        const { lockTag, slot } = inputs.autocompound || {};
        if (!lockTag || slot === undefined) {
          throw new Error('Please provide all required inputs: lockTag and slot');
        }
        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        
        const lockTagEnum = lockTagMap[lockTag.toLowerCase()];
        if (!lockTagEnum) {
          throw new Error('Invalid lock tag. Please use Bronze, Silver, Gold, or Diamond.');
        }

        const tx = await program.methods.autocompound(lockTagEnum, slot)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userLockInfo: userLockInfoKey,
          }).rpc();

        console.log('Autocompound transaction completed:', tx);

        return `Autocompounded ${lockTag} lock in slot ${slot}. Transaction: ${tx}`;
      },
      unstake: async () => {
        const { lockTag, slot } = inputs.unstake || {};
        if (!lockTag || slot === undefined) {
          throw new Error('Please provide all required inputs: lockTag and slot');
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

        const tx = await program.methods.unstake(lockTagEnum, slot)
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

        console.log('Unstake transaction completed:', tx);

        return `Unstaked from ${lockTag} lock in slot ${slot}. Transaction: ${tx}`;
      },
      // Management functions
      pause: async () => {
        const tx = await program.methods.pause()
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
          }).rpc();
        return `Program paused. Transaction: ${tx}`;
      },
      unpause: async () => {
        const tx = await program.methods.unpause()
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
          }).rpc();
        return `Program unpaused. Transaction: ${tx}`;
      },
      stakingPause: async () => {
        const tx = await program.methods.stakingPause()
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
          }).rpc();
        return `Staking paused. Transaction: ${tx}`;
      },
      stakingUnpause: async () => {
        const tx = await program.methods.stakingUnpause()
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
          }).rpc();
        return `Staking unpaused. Transaction: ${tx}`;
      },
      updateRewardPercentage: async () => {
        const { newPercentage } = inputs.updateRewardPercentage || {};
        if (!newPercentage) {
          throw new Error('Please provide the new reward percentage');
        }
        const tx = await program.methods.updateRewardPercentage(new anchor.BN(newPercentage * 100))
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
          }).rpc();
        return `Reward percentage updated to ${newPercentage}. Transaction: ${tx}`;
      },
      updateLockTime: async () => {
        const { newLockTime } = inputs.updateLockTime || {};
        if (!newLockTime) {
          throw new Error('Please provide the new lock time');
        }
        const tx = await program.methods.updateLockTime(new anchor.BN(newLockTime))
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
          }).rpc();
        return `Lock time updated to ${newLockTime}. Transaction: ${tx}`;
      },
      depositRewards: async () => {
        const { amount } = inputs.depositRewards || {};
        if (!amount) {
          throw new Error('Please provide the amount to deposit');
        }
        const lamports = new anchor.BN(parseFloat(amount) * Math.pow(10, config.tokenDecimals));
        const managerTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey, false, tokenProgramId);
        const tx = await program.methods.depositRewards(lamports)
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
            managerTokenAccount: managerTokenAccount,
            rewardVault: rewardVault,
            tokenProgram: tokenProgramId,
          }).rpc();
        return `Deposited ${amount} VGR as rewards. Transaction: ${tx}`;
      },
      withdrawUnassignedRewards: async () => {
        const managerTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey, false, tokenProgramId);
        const tx = await program.methods.withdrawUnassignedRewards()
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
            managerTokenAccount: managerTokenAccount,
            rewardVault: rewardVault,
            stakeAuthority: stakeAuthority,
            tokenProgram: tokenProgramId,
          }).rpc();
        return `Withdrew unassigned rewards. Transaction: ${tx}`;
      },
    },
  };

  return (
    <div className={styles.contai}>
      <h1 className={`${styles.cont} ${styles.title}`}>Vhagar Dapp Admin Panel</h1>
      <div className={styles.content}>
        <div className={styles.resultArea}>
          {loading && <p className={styles.loading}>Loading...</p>}
          {error && <p className={styles.error}>{error}</p>}
          {result && result}
        </div>
        
        <div className={styles.adminSection}>
          <h2 className={styles.sectionTitle}>View Functions</h2>
          <div className={styles.adminGrid}>
            {Object.entries(functions.viewFunctions).map(([name, func]) => (
              <div key={name} className={styles.adminCard}>
                <h3>{name}</h3>
                <button 
                  className={styles.executeButton} 
                  onClick={() => executeFunction(func, name)}
                  disabled={!wallet.connected || loading}
                >
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.adminSection}>
          <h2 className={styles.sectionTitle}>User Functions</h2>
          <div className={styles.adminGrid}>
            {['stake', 'autocompound', 'unstake'].map((name) => (
              <div key={name} className={styles.adminCard}>
                <h3>{name}</h3>
                {name === 'stake' && (
                  <input
                    type="number"
                    placeholder="Amount"
                    onChange={(e) => handleInputChange(name, 'amount', e.target.value)}
                    className={styles.adminInput}
                  />
                )}
                <select
                  onChange={(e) => handleInputChange(name, 'lockTag', e.target.value)}
                  className={styles.adminSelect}
                >
                  <option value="">Select Lock Tag</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="diamond">Diamond</option>
                </select>
                <select
                  onChange={(e) => handleInputChange(name, 'slot', parseInt(e.target.value))}
                  className={styles.adminSelect}
                >
                  <option value="">Select Slot</option>
                  <option value="0">Slot 0</option>
                  <option value="1">Slot 1</option>
                </select>
                <button 
                  className={styles.executeButton} 
                  onClick={() => executeFunction(functions.executeFunctions[name], name)}
                  disabled={!wallet.connected || loading}
                >
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.adminSection}>
          <h2 className={styles.sectionTitle}>Management Functions</h2>
          <div className={styles.adminGrid}>
            {['pause', 'unpause', 'stakingPause', 'stakingUnpause'].map((name) => (
              <div key={name} className={styles.adminCard}>
                <h3>{name}</h3>
                <button 
                  className={styles.executeButton} 
                  onClick={() => executeFunction(functions.executeFunctions[name], name)}
                  disabled={!wallet.connected || loading}
                >
                  Execute
                </button>
              </div>
            ))}
            <div className={styles.adminCard}>
              <h3>updateRewardPercentage</h3>
              <input
                type="number"
                placeholder="New Percentage"
                onChange={(e) => handleInputChange('updateRewardPercentage', 'newPercentage', e.target.value)}
                className={styles.adminInput}
              />
              <button 
                className={styles.executeButton} 
                onClick={() => executeFunction(functions.executeFunctions.updateRewardPercentage, 'updateRewardPercentage')}
                disabled={!wallet.connected || loading}
              >
                Execute
              </button>
            </div>
            <div className={styles.adminCard}>
              <h3>updateLockTime</h3>
              <input
                type="number"
                placeholder="New Lock Time (seconds)"
                onChange={(e) => handleInputChange('updateLockTime', 'newLockTime', e.target.value)}
                className={styles.adminInput}
              />
              <button 
                className={styles.executeButton} 
                onClick={() => executeFunction(functions.executeFunctions.updateLockTime, 'updateLockTime')}
                disabled={!wallet.connected || loading}
              >
                Execute
              </button>
            </div>
            <div className={styles.adminCard}>
              <h3>depositRewards</h3>
              <input
                type="number"
                placeholder="Amount to Deposit"
                onChange={(e) => handleInputChange('depositRewards', 'amount', e.target.value)}
                className={styles.adminInput}
              />
              <button 
                className={styles.executeButton} 
                onClick={() => executeFunction(functions.executeFunctions.depositRewards, 'depositRewards')}
                disabled={!wallet.connected || loading}
              >
                Execute
              </button>
            </div>
            <div className={styles.adminCard}>
              <h3>withdrawUnassignedRewards</h3>
              <button 
                className={styles.executeButton} 
                onClick={() => executeFunction(functions.executeFunctions.withdrawUnassignedRewards, 'withdrawUnassignedRewards')}
                disabled={!wallet.connected || loading}
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}