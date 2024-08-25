import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <div className={styles.contai}>
        <h1 className="text-light text-center pb-3">Vhagar token manager</h1>
        <div className={styles.content}>
          <div className={styles.token}>
            <h2 className="text-light">Vhager token manager</h2>
            <button className="btn text-light stake-button">
              Connect Wallet
            </button>
          </div>
          <div className={styles.firstblock}>
            <div className={styles.stakinfo}>
              <h2 className="text-light">Your staking info</h2>
              <button className="btn fw-bold">
                <h5
                  className="text-light p-3"
                  style={{
                    backgroundColor: "#4e914c",
                    border: "1px solid white",
                  }}
                >
                  Update Info
                </h5>
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
                  class="form-select form-select-lg mb-3 text-light"
                  aria-label="Large select example"
                  style={{ backgroundColor: "#0a194970" }}
                >
                  <option selected>Select Lock Tag</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
                <select
                  class="form-select form-select-lg mb-3 text-light"
                  aria-label="Large select example"
                  style={{ backgroundColor: "#0a194970" }}
                >
                  <option selected>Select Slot</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
                <Link className={styles.link} href="/">
                  <h4
                    className="p-3 border border-light text-center"
                    style={{ backgroundColor: "#63b560" }}
                  >
                    Execute
                  </h4>
                </Link>
              </div>
            </div>
            <div className={styles.cols}>
              <div className="p-3">
                <h3 className="text-light pb-3">UNSTAKE</h3>

        
                  <select
                    class="form-select form-select-lg mb-3 text-light"
                    aria-label="Large select example"
                    style={{ backgroundColor: "#0a194970" }}
                  >
                    <option selected>Select Lock Tag</option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </select>
                
                <select
                  class="form-select form-select-lg mb-3 text-light"
                  aria-label="Large select example"
                  style={{ backgroundColor: "#0a194970" }}
                >
                  <option selected>Select Slot</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
                <h4
                  className="p-3 border border-light text-center"
                  style={{ backgroundColor: "#63b560" }}
                >
                  Execute
                </h4>
              </div>
            </div>
            <div className={styles.cols}>
              <div className="p-3">
                <h3 className="text-light pb-3">AUTOCOMPOUND</h3>

                <select
                  class="form-select form-select-lg mb-3 text-light"
                  aria-label="Large select example"
                  style={{ backgroundColor: "#0a194970" }}
                >
                  <option selected>Select Lock Tag</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
                <select
                  class="form-select form-select-lg mb-3 text-light"
                  aria-label="Large select example"
                  style={{ backgroundColor: "#0a194970" }}
                >
                  <option selected>Select Slot</option>
                  <option value="1">One</option>
                  <option value="2">Two</option>
                  <option value="3">Three</option>
                </select>
                <h4
                  className="p-3 border border-light text-center"
                  style={{ backgroundColor: "#63b560" }}
                >
                  Execute
                </h4>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-center">
            <p className="text-light p-3" style={{ width: "85%" }}>
              <i>Note:</i> Lorem ipsum dolor sit, amet consectetur adipisicing
              elit. Porro commodi praesentium, dolore consequatur alias aliquam
              cupiditate laudantium iste laboriosam ipsum cum quae repellendus
              asperiores accusamus expedita esse non quo excepturi! Lorem ipsum
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
