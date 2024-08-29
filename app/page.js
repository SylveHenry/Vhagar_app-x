'use client';

import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import VhagerManager from "./components/VhagerManager";
import { useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const wallet = useWallet();

  useEffect(() => {
    // Load user info from localStorage on component mount
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      setUserInfo(JSON.parse(savedUserInfo));
    }
  }, []);

  useEffect(() => {
    if (wallet.connected) {
      animateValue(setTotalStaked, 0, 1338429516, 2000);
      animateValue(setTotalClaimable, 0, 761037824, 2000);
    } else {
      setTotalStaked(0);
      setTotalClaimable(0);
    }
  }, [wallet.connected]);

  const handleSetUserInfo = (info) => {
    setUserInfo(info);
    // Save user info to localStorage whenever it's updated
    localStorage.setItem('userInfo', JSON.stringify(info));
  };

  const animateValue = (setter, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setter(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  return (
    <>
      <div className={styles.contai}>
        <h1 className={`${styles.cont} ${styles.title}`}>Vhagar Reward Pool</h1>
        <p className={`text-light text-center ${styles.subtitle}`}>Vhagar on Solana Staking Pool</p>
        <div className={styles.content}>
          <div className={styles.block}>
            <div className={styles.totstake}>
              <div>Total Staked: {totalStaked.toLocaleString()} VGR</div>
              <div>Total Claimable: {totalClaimable.toLocaleString()} VGR</div>
            </div>
            <div className={styles.bloco}>
              <li className={`${styles.blocli} ${styles.headerItem}`}>Tier</li>
              <li className={`${styles.blocli} ${styles.tierItem}`}>Bronze</li>
              <li className={`${styles.blocli} ${styles.tierItem}`}>Silver</li>
              <li className={`${styles.blocli} ${styles.tierItem}`}>Gold</li>
              <li className={`${styles.blocli} ${styles.tierItem}`}>Diamond</li>
              <li className={`${styles.blocli} ${styles.headerItem}`}>Lock Period</li>
              <li className={styles.blocli}>15 Days</li>
              <li className={styles.blocli}>30 Days</li>
              <li className={styles.blocli}>60 Days</li>
              <li className={styles.blocli}>-- Days</li>
              <li className={`${styles.blocli} ${styles.headerItem}`}>Reward Percentage</li>
              <li className={styles.blocli}>10.00 %</li>
              <li className={styles.blocli}>30.00 %</li>
              <li className={styles.blocli}>90.00 %</li>
              <li className={styles.blocli}>-- . -- %</li>
            </div>
          </div>
          <div className={styles.firstblock}>
            <div className={styles.stakinfo}>
              <h2 className="text-light">Your Staking Info</h2>
              <button className={`${styles.updateInfoButton} ${styles.updateInfoButtonDesktop}`} onClick={() => {
                if (window.getUserInfo) {
                  window.getUserInfo();
                }
              }}>
                Update Info
              </button>
            </div>
            <div className={`p-4 ${styles.stakingInfoContainer}`}>
              {userInfo ? (
                <div className={styles.infoGrid}>
                  {userInfo.map((lock, index) => (
                    <div key={index} className={styles.infoBox}>
                      <h3 className={styles.infoBoxTitle}>{lock.tag}</h3>
                      <p><strong>Locked Amount:</strong> {lock.lockedAmount}</p>
                      <p><strong>Locked Reward:</strong> {lock.lockedReward}</p>
                      <p><strong>Unlock Time:</strong> {lock.unlockTime}</p>
                      <p><strong>Locked Time:</strong> {lock.lockedTime}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.info}>Connect your wallet to view your staking info.</p>
              )}
            </div>
            <button className={`${styles.updateInfoButton} ${styles.updateInfoButtonMobile}`} onClick={() => {
              if (window.getUserInfo) {
                window.getUserInfo();
              }
            }}>
              Update Info
            </button>
          </div>
          <VhagerManager setUserInfo={handleSetUserInfo} setError={setError} setResult={setResult} />
          <div className={`${styles.noteContainer} d-flex flex-column flex-md-row align-items-center justify-content-center`}>
            <div className={`${styles.exclamationImageContainer} d-none d-md-block`}>
              <Image 
                src="/exclamation.png" 
                alt="Exclamation Mark" 
                width={70} 
                height={112} 
                style={{width: '100%', height: 'auto'}}
              />
            </div>
            <div className={styles.noteText}>
              <p className={`p-3 ${styles.dullYellowText}`}>
                <i>Note:</i> If you unstake or unlock your funds before reaching the halfway point of the lock-up period or duration, you will lose all of your allocated rewards.
                <br/>
                If you unstake or unlock after the halfway point but before the end of the lock-up period or duration, you will forfeit 50% of your allocated rewards.
                <br/>
                If you unstake or unlock after the full lock-up period or duration has ended, you will receive 100% of your allocated rewards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}