import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { buildCustomRoute } from "next/dist/server/lib/router-utils/filesystem";

export default function Home() {
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
              <button className={styles.updateInfoButton}>
                Update Info
              </button>
            </div>
            <div className="p-4">
              <p className={styles.info}>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quas
                recusandae atque cupiditate reiciendis minus! Quia ut nemo
                maxime aspernatur iure ducimus alias, architecto aut quisquam
                adipisci hic, corrupti optio ad?
              </p>
            </div>
          </div>
          <div className={styles.column}>
            <div className={styles.cols}>
              <div className="p-3">
                <h3 className="text-light pb-3">STAKE</h3>
                <p className="p-3" style={{ border: "1px solid #63b560" }}>
                  amount
                </p>
                <select
                  className={`form-select form-select-lg mb-3 text-light ${styles.customSelect}`}
                  aria-label="Large select example"
                >
                  <option selected>Select Tier</option>
                  <option value="1">Bronze</option>
                  <option value="2">Silver</option>
                  <option value="3">Gold</option>
                  <option value="4">Diamond</option>
                </select>
                <button className={styles.executeButton}>
                  Execute
                </button>
              </div>
            </div>
            <div className={styles.cols}>
              <div className="p-3">
                <h3 className="text-light pb-3">AUTOCOMPOUND</h3>
                <select
                  className={`form-select form-select-lg mb-3 text-light ${styles.customSelect}`}
                  aria-label="Large select example"
                >
                  <option selected>Select Tier</option>
                  <option value="1">Bronze</option>
                  <option value="2">Silver</option>
                  <option value="3">Gold</option>
                  <option value="4">Diamond</option>
                </select>
                <button className={styles.executeButton}>
                  Execute
                </button>
              </div>
            </div>
            <div className={styles.cols}>
              <div className="p-3">
                <h3 className="text-light pb-3">UNSTAKE</h3>
                <select
                  className={`form-select form-select-lg mb-3 text-light ${styles.customSelect}`}
                  aria-label="Large select example"
                >
                  <option selected>Select Tier</option>
                  <option value="1">Bronze</option>
                  <option value="2">Silver</option>
                  <option value="3">Gold</option>
                  <option value="4">Diamond</option>
                </select>
                <button className={styles.executeButton}>
                  Execute
                </button>
              </div>
            </div>
          </div>
          <div className={`${styles.noteContainer} d-flex flex-column flex-md-row align-items-center justify-content-center`}>
            <div className={`${styles.exclamationImageContainer} d-none d-md-block`}>
              <Image 
                src="/exclamation.png" 
                alt="Exclamation Mark" 
                width={70} 
                height={112} 
                layout="responsive"
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