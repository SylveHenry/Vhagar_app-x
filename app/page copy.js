'use client';

import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import VhagerManager from "./components/VhagerManager";
import { useState } from "react";

export default function Home() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  return (
    <>
      <div className={styles.contai}>
        <h1 className={`${styles.cont} ${styles.title}`}>Vhagar Reward Pool</h1>
        <p className={`text-light text-center ${styles.subtitle}`}>Vhagar on Solana Staking Pool</p>
        <div className={styles.content}>
          <div className={styles.block}>
            <div className={styles.totstake}>
              <div>Total Staked: 80 000 000 VGR</div>
              <div>Total Claimable Reward: 30 000 000 VGR</div>
            </div>
            <div className={styles.bloco}>
              <li className={styles.blocli}>Tier</li>
              <li className={styles.blocli}>Bronze</li>
              <li className={styles.blocli}>Silver</li>
              <li className={styles.blocli}>Gold</li>
              <li className={styles.blocli}>Diamond</li>
              <li className={styles.blocli}>Lock Period</li>
              <li className={styles.blocli}>15 Days</li>
              <li className={styles.blocli}>30 Days</li>
              <li className={styles.blocli}>60 Days</li>
              <li className={styles.blocli}>120 Days</li>
              <li className={styles.blocli}>Reward Percentage</li>
              <li className={styles.blocli}>15.77%</li>
              <li className={styles.blocli}>30.45%</li>
              <li className={styles.blocli}>56.76%</li>
              <li className={styles.blocli}>10.51%</li>
            </div>
          </div>
          <div className={styles.firstblock}>
            <div className={styles.stakinfo}>
              <h2 className="text-light">Your staking info</h2>
            </div>
            <div className="p-4">
              {userInfo ? (
                <div className={styles.info}>
                  {userInfo.map((lock, index) => (
                    <div key={index}>
                      <p><strong>Tag:</strong> {lock.tag}</p>
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
          </div>
          <VhagerManager setUserInfo={setUserInfo} setError={setError} setResult={setResult} />
          <div className={styles.displayArea}>
            {error && <p className="text-danger">{error}</p>}
            {result && <p className="text-success">{result}</p>}
          </div>
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