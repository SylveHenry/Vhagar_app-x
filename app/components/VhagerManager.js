'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import axios from 'axios';
import idl from '@/idl/idl.json';
import styles from "../page.module.css";
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

export default function VhagerManager({ setUserInfo }) {
  const wallet = useWallet();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({});
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

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
      setUserInfo(null);
    }
  }, [wallet.connected, setUserInfo]);

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

  const getUserInfo = useCallback(async () => {
    if (!program || !wallet.connected) {
      setError("Wallet not connected or program not initialized");
      return;
    }
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
  }, [program, wallet.connected, wallet.publicKey, setUserInfo]);

  useEffect(() => {
    window.getUserInfo = getUserInfo;
    return () => {
      delete window.getUserInfo;
    };
  }, [getUserInfo]);

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

  const functions = {
    stake: {
      func: async () => {
        const { amount, lockTag } = inputs.stake || {};
        if (!amount || !lockTag) {
          throw new Error('Please provide all required inputs: amount and lockTag');
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

        // Fetch user lock info before autocompounding
        const userLockInfoBefore = await program.account.userLockInfo.fetch(userLockInfoKey);
        const lockInfoBefore = userLockInfoBefore.locks[Object.keys(lockTagMap).indexOf(lockTag.toLowerCase())][0];

        const tx = await program.methods.autocompound(lockTagEnum, 0)
          .accounts({
            stakingPool: stakingPoolKey,
            user: wallet.publicKey,
            userLockInfo: userLockInfoKey,
          }).rpc();

        console.log('Autocompound transaction completed:', tx);

        // Fetch user lock info after autocompounding
        const userLockInfoAfter = await program.account.userLockInfo.fetch(userLockInfoKey);
        const newLockInfo = userLockInfoAfter.locks[Object.keys(lockTagMap).indexOf(lockTag.toLowerCase())][0];

        const currentTime = Math.floor(Date.now() / 1000);
        const stakeDuration = currentTime - lockInfoBefore.lockStartTime.toNumber();

        // Prepare data for Google Form submission
        const formData = {
          operation: 'Autocompound',
          userAddress: wallet.publicKey.toString(),
          amountStaked: formatNumber(newLockInfo.lockedAmount),
          stakeTier: lockTag,
          stakeDuration: formatDuration(stakeDuration),
          rewardPercentage: `${(await getRewardPercentage(lockTag) / 100).toFixed(2)}%`,
          stakeStartTime: formatTime(lockInfoBefore.lockStartTime.toNumber()),
          unlockTime: formatTime(lockInfoBefore.unlockTime.toNumber()),
          stakeEndTime: formatTime(currentTime),
          lockedRewardAmount: formatNumber(lockInfoBefore.lockedReward),
          receivedRewardAmount: formatNumber(lockInfoBefore.lockedReward),
          durationCompletionCheck: 'Full' // Always 'Full' for autocompound
        };

        // Submit data to Google Form
        await submitToGoogleForm(formData);

        return `Autocompounded ${lockTag} lock. Transaction: ${tx}`;
      },
      inputs: ['lockTag'],
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

        // Fetch user lock info before unstaking
        const userLockInfoBefore = await program.account.userLockInfo.fetch(userLockInfoKey);
        const lockInfo = userLockInfoBefore.locks[Object.keys(lockTagMap).indexOf(lockTag.toLowerCase())][0];

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

        // Determine duration completion check
        let durationCompletionCheck;
        if (stakeDuration >= fullStakeDuration) {
          durationCompletionCheck = 'Full';
        } else if (stakeDuration >= halfStakeDuration) {
          durationCompletionCheck = 'Half';
        } else {
          durationCompletionCheck = 'Less than half';
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
          durationCompletionCheck: durationCompletionCheck
        };

        // Submit data to Google Form
        await submitToGoogleForm(formData);

        return `Unstaked from ${lockTag} lock. Transaction: ${tx}`;
      },
      inputs: ['lockTag'],
    },
  };

  return (
    <>
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
                      step={`1e-${config.tokenDecimals}`}
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
      </div>
      <div className={styles.displayArea}>
        {loading && <p className="text-info">Loading...</p>}
        {error && <p className="text-danger">{error}</p>}
        {result && <p className="text-success">{result}</p>}
      </div>
    </>
  );
}