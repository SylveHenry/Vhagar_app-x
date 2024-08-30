'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import styles from '../page.module.css';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import idl from '@/idl/idl.json';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';

// Constants
const programId = new PublicKey('DybDiU1cRQMPJQLEE5xbtMZg1cihaW7g9aPvqyDSAwwg');
const stakingPoolKey = new PublicKey('9QmBeWNKpzzSFZisGf8c3ay6ttnh7N5LFdUsWaGmbpgY');
const stakeAuthority = new PublicKey('BfwdtsDcLLWiTTL8WprXXDEZsZBNHHKcjiKZ8zhvTXgc');
const tokenMint = new PublicKey('EwVMtR3qMpES8uskX4AFWSxLnRjGRLowaYzn6C4ZN48Y');
const stakeVault = new PublicKey('DQPsctR9MT5MBgKhPQE8i8faM6CQU7HRtAn8o9fQ7nwG');
const rewardVault = new PublicKey('DQPsctR9MT5MBgKhPQE8i8faM6CQU7HRtAn8o9fQ7nwG');

// Helper functions
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

async function submitRequest(url, data) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: data
  };

  try {
    if (typeof window !== 'undefined' && window.fetch) {
      return await fetch(url, { ...options, mode: 'no-cors' });
    } else {
      return await axios.post(url, data, {
        headers: options.headers
      });
    }
  } catch (error) {
    console.error('Error submitting request:', error);
    throw error;
  }
}

async function submitToGoogleForm(data) {
  const formUrl = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSdt5zwL9UM9RzOMQaiTBwrzzAL4-FZhhXB2zvIBY00hs3Kz6g/formResponse';
  
  const formData = new URLSearchParams({
    'entry.789225441': data.operation,
    'entry.1422429793': data.userAddress,
    'entry.1258731213': data.amountStaked,
    'entry.241253245': data.stakeTier,
    'entry.932689884': data.stakeDuration,
    'entry.49812710': data.rewardPercentage,
    'entry.35443853': data.stakeStartTime,
    'entry.1389448011': data.unlockTime,
    'entry.1543706863': data.stakeEndTime,
    'entry.710024409': data.lockedRewardAmount,
    'entry.1984049138': data.receivedRewardAmount,
    'entry.744966987': data.durationCompletionCheck
  });

  try {
    await submitRequest(formUrl, formData);
    console.log('Form submitted successfully');
  } catch (error) {
    console.error('Error submitting form:', error);
  }
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
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: 'confirmed',
      });
      const program = new anchor.Program(idl, programId, provider);
      setProgram(program);
    } else {
      setProgram(null);
    }
  }, [wallet.connected]);

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

  const handleInputChange = (name, value) => {
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getRewardPercentage = async (lockTag) => {
    const stakingPool = await program.account.stakingPool.fetch(stakingPoolKey);
    let rewardPercentage;

    switch (lockTag.toLowerCase()) {
      case 'bronze':
        rewardPercentage = stakingPool.bronzeRewardPercentage;
        break;
      case 'silver':
        rewardPercentage = stakingPool.bronzeRewardPercentage.mul(new anchor.BN(3));
        break;
      case 'gold':
        rewardPercentage = stakingPool.bronzeRewardPercentage.mul(new anchor.BN(9));
        break;
      case 'diamond':
        rewardPercentage = stakingPool.bronzeRewardPercentage.mul(new anchor.BN(27));
        break;
      default:
        throw new Error('Invalid lock tag');
    }

    return rewardPercentage.toNumber();
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
        const userAddress = new PublicKey(inputs.userAddress || wallet.publicKey);
        const [userLockInfoKey] = PublicKey.findProgramAddressSync(
          [Buffer.from('user_lock_info'), userAddress.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        try {
          const result = await program.methods.getUserInfo().accounts({
            stakingPool: stakingPoolKey,
            userLockInfo: userLockInfoKey,
            user: userAddress,
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
    userFunctions: {
      stake: async () => {
        const amount = new anchor.BN(parseFloat(inputs.stakeAmount) * 1e9);
        const lockTag = inputs.stakeLockTag;
        const slot = parseInt(inputs.stakeSlot);

        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        const userTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);

        // Check if the user token account exists
        const connection = program.provider.connection;
        const accountInfo = await connection.getAccountInfo(userTokenAccount);
        if (!accountInfo) {
          throw new Error("User token account does not exist. Please initialize it first.");
        }

        const tx = await program.methods.stake(amount, { [lockTag.toLowerCase()]: {} }, slot)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userTokenAccount: userTokenAccount,
            stakeVault: stakeVault,
            userLockInfo: userLockInfoKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
          }).rpc();

        console.log('Stake transaction completed:', tx);

        // Prepare data for Google Form submission
        const currentTime = Math.floor(Date.now() / 1000);
        const rewardPercentage = await getRewardPercentage(lockTag);
        const formData = {
          operation: 'Stake',
          userAddress: wallet.publicKey.toString(),
          amountStaked: formatNumber(amount),
          stakeTier: lockTag,
          stakeDuration: 'N/A', // Not applicable for staking
          rewardPercentage: `${(rewardPercentage / 100).toFixed(2)}%`,
          stakeStartTime: formatTime(currentTime),
          unlockTime: 'N/A', // We don't know the unlock time at this point
          stakeEndTime: 'N/A', // Not applicable for staking
          lockedRewardAmount: 'N/A', // We don't know the reward amount at this point
          receivedRewardAmount: 'N/A', // Not applicable for staking
          durationCompletionCheck: 'N/A' // Not applicable for staking
        };

        // Submit data to Google Form
        await submitToGoogleForm(formData);

        return tx;
      },
      unstake: async () => {
        const lockTag = inputs.unstakeLockTag;
        const slot = parseInt(inputs.unstakeSlot);

        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );
        const userTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);

        // Fetch user lock info before unstaking
        const userLockInfoBefore = await program.account.userLockInfo.fetch(userLockInfoKey);
        const lockInfo = userLockInfoBefore.locks[Object.keys({ [lockTag.toLowerCase()]: {} })[0]][slot];

        const tx = await program.methods.unstake({ [lockTag.toLowerCase()]: {} }, slot)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userTokenAccount: userTokenAccount,
            stakeVault: stakeVault,
            rewardVault: rewardVault,
            userLockInfo: userLockInfoKey,
            stakeAuthority: stakeAuthority,
            tokenProgram: TOKEN_PROGRAM_ID,
          }).rpc();

        console.log('Unstake transaction completed:', tx);

        // Calculate received reward amount
        const currentTime = Math.floor(Date.now() / 1000);
        const stakeDuration = currentTime - lockInfo.lockStartTime.toNumber();
        const fullStakeDuration = lockInfo.unlockTime.toNumber() - lockInfo.lockStartTime.toNumber();
        const halfStakeDuration = fullStakeDuration / 2;
        
        let receivedRewardAmount;
        if (stakeDuration >= fullStakeDuration) {
          receivedRewardAmount = lockInfo.lockedReward.toNumber();
        } else if (stakeDuration >= halfStakeDuration) {
          receivedRewardAmount = Math.floor(lockInfo.lockedReward.toNumber() / 2);
        } else {
          receivedRewardAmount = 0;
        }

        // Prepare data for Google Form submission
        const formData = {
          operation: 'Unstake',
          userAddress: wallet.publicKey.toString(),
          amountStaked: formatNumber(lockInfo.lockedAmount),
          stakeTier: lockTag,
          stakeDuration: formatDuration(stakeDuration),
          rewardPercentage: `${(await getRewardPercentage(lockTag) / 100).toFixed(2)}%`,
          stakeStartTime: formatTime(lockInfo.lockStartTime.toNumber()),
          unlockTime: formatTime(lockInfo.unlockTime.toNumber()),
          stakeEndTime: formatTime(currentTime),
          lockedRewardAmount: formatNumber(lockInfo.lockedReward),
          receivedRewardAmount: formatNumber(receivedRewardAmount),
          durationCompletionCheck: stakeDuration >= fullStakeDuration ? 'Full' : (stakeDuration >= halfStakeDuration ? 'Half' : 'Less than half')
        };

        // Submit data to Google Form
        await submitToGoogleForm(formData);

        return tx;
      },
      autocompound: async () => {
        const lockTag = inputs.autocompoundLockTag;
        const slot = parseInt(inputs.autocompoundSlot);

        const [userLockInfoKey] = await PublicKey.findProgramAddress(
          [Buffer.from('user_lock_info'), wallet.publicKey.toBuffer(), stakingPoolKey.toBuffer()],
          program.programId
        );

        // Fetch user lock info before autocompounding
        const userLockInfoBefore = await program.account.userLockInfo.fetch(userLockInfoKey);
        const lockInfoBefore = userLockInfoBefore.locks[Object.keys({ [lockTag.toLowerCase()]: {} })[0]][slot];

        const tx = await program.methods.autocompound({ [lockTag.toLowerCase()]: {} }, slot)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userLockInfo: userLockInfoKey,
          }).rpc();

        console.log('Autocompound transaction completed:', tx);

        // Fetch user lock info after autocompounding
        const userLockInfoAfter = await program.account.userLockInfo.fetch(userLockInfoKey);
        const newLockInfo = userLockInfoAfter.locks[Object.keys({ [lockTag.toLowerCase()]: {} })[0]][slot];

        // Prepare data for Google Form submission
        const currentTime = Math.floor(Date.now() / 1000);
        const formData = {
          operation: 'Autocompound',
          userAddress: wallet.publicKey.toString(),
          amountStaked: formatNumber(newLockInfo.lockedAmount),
          stakeTier: lockTag,
          stakeDuration: formatDuration(currentTime - lockInfoBefore.lockStartTime.toNumber()),
          rewardPercentage: `${(await getRewardPercentage(lockTag) / 100).toFixed(2)}%`,
          stakeStartTime: formatTime(lockInfoBefore.lockStartTime.toNumber()),
          unlockTime: formatTime(newLockInfo.unlockTime.toNumber()),
          stakeEndTime: formatTime(currentTime),
          lockedRewardAmount: formatNumber(lockInfoBefore.lockedReward),
          receivedRewardAmount: formatNumber(lockInfoBefore.lockedReward),
          durationCompletionCheck: 'Full' // Always 'Full' for autocompound
        };

        // Submit data to Google Form
        await submitToGoogleForm(formData);

        return tx;
      },
    },
    managerFunctions: {
      pause: () => program.methods.pause().accounts({ stakingPool: stakingPoolKey, manager: wallet.publicKey }).rpc(),
      unpause: () => program.methods.unpause().accounts({ stakingPool: stakingPoolKey, manager: wallet.publicKey }).rpc(),
      stakingPause: () => program.methods.stakingPause().accounts({ stakingPool: stakingPoolKey, manager: wallet.publicKey }).rpc(),
      stakingUnpause: () => program.methods.stakingUnpause().accounts({ stakingPool: stakingPoolKey, manager: wallet.publicKey }).rpc(),
      updateRewardPercentage: () => {
        const newPercentage = new anchor.BN(parseFloat(inputs.newRewardPercentage) * 100);
        return program.methods.updateRewardPercentage(newPercentage)
          .accounts({ stakingPool: stakingPoolKey, manager: wallet.publicKey }).rpc();
      },
      updateLockTime: () => {
        const newLockTime = new anchor.BN(parseInt(inputs.newLockTime));
        return program.methods.updateLockTime(newLockTime)
          .accounts({ stakingPool: stakingPoolKey, manager: wallet.publicKey }).rpc();
      },
      depositRewards: async () => {
        const amount = new anchor.BN(parseFloat(inputs.depositAmount) * 1e9);
        const managerTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
        return program.methods.depositRewards(amount)
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
            managerTokenAccount: managerTokenAccount,
            rewardVault: rewardVault,
            tokenProgram: TOKEN_PROGRAM_ID,
          }).rpc();
      },
      withdrawUnassignedRewards: async () => {
        const managerTokenAccount = await getAssociatedTokenAddress(tokenMint, wallet.publicKey);
        return program.methods.withdrawUnassignedRewards()
          .accounts({
            stakingPool: stakingPoolKey,
            manager: wallet.publicKey,
            managerTokenAccount: managerTokenAccount,
            rewardVault: rewardVault,
            stakeAuthority: stakeAuthority,
            tokenProgram: TOKEN_PROGRAM_ID,
          }).rpc();
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
                {name === 'getUserInfo' && (
                  <input
                    type="text"
                    placeholder="User Address (optional)"
                    onChange={(e) => handleInputChange('userAddress', e.target.value)}
                    className={styles.adminInput}
                  />
                )}
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
            {Object.entries(functions.userFunctions).map(([name, func]) => (
              <div key={name} className={styles.adminCard}>
                <h3>{name}</h3>
                {name === 'stake' && (
                  <>
                    <input
                      type="number"
                      placeholder="Amount"
                      onChange={(e) => handleInputChange('stakeAmount', e.target.value)}
                      className={styles.adminInput}
                    />
                    <select
                      onChange={(e) => handleInputChange('stakeLockTag', e.target.value)}
                      className={styles.adminSelect}
                    >
                      <option value="">Select Lock Tag</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Diamond">Diamond</option>
                    </select>
                    <select
                      onChange={(e) => handleInputChange('stakeSlot', e.target.value)}
                      className={styles.adminSelect}
                    >
                      <option value="">Select Slot</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  </>
                )}
                {(name === 'unstake' || name === 'autocompound') && (
                  <>
                    <select
                      onChange={(e) => handleInputChange(`${name}LockTag`, e.target.value)}
                      className={styles.adminSelect}
                    >
                      <option value="">Select Lock Tag</option>
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Diamond">Diamond</option>
                    </select>
                    <select
                      onChange={(e) => handleInputChange(`${name}Slot`, e.target.value)}
                      className={styles.adminSelect}
                    >
                      <option value="">Select Slot</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                    </select>
                  </>
                )}
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
          <h2 className={styles.sectionTitle}>Manager Functions</h2>
          <div className={styles.adminGrid}>
            {Object.entries(functions.managerFunctions).map(([name, func]) => (
              <div key={name} className={styles.adminCard}>
                <h3>{name}</h3>
                {name === 'updateRewardPercentage' && (
                  <input
                    type="number"
                    placeholder="New Percentage"
                    onChange={(e) => handleInputChange('newRewardPercentage', e.target.value)}
                    className={styles.adminInput}
                  />
                )}
                {name === 'updateLockTime' && (
                  <input
                    type="number"
                    placeholder="New Lock Time (seconds)"
                    onChange={(e) => handleInputChange('newLockTime', e.target.value)}
                    className={styles.adminInput}
                  />
                )}
                {name === 'depositRewards' && (
                  <input
                    type="number"
                    placeholder="Amount"
                    onChange={(e) => handleInputChange('depositAmount', e.target.value)}
                    className={styles.adminInput}
                  />
                )}
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
        </div>
    </div>
  );
}