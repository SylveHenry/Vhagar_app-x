import Image from "next/image";

const Footer = () => {
  return (
    <footer>
      <div className="containerr">
        <div className="column first">
          <div className="footer text-center">
            <a href="/">
              <Image src="/logo_icon2.png" width={220} height={210} alt="Logo Icon" />
            </a>
          </div>
        </div>
        <div className="column">
          <h4 className="fw-bold">
            <a href="/">
              <Image src="/logo_with_word.png" width={160} height={80} alt="Logo with Word" />
            </a>
          </h4>
          <ul className="list-unstyled">
            <li className="coll">Vhagar on Solana</li>
            <li className="coll">Not just a token</li>
          </ul>
        </div>
        <div className="column">
          <h4 className="fw-bold">
            <a
              href="https://raydium.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Raydium
            </a>
          </h4>
          <ul className="list-unstyled">
            <li className="coll">
              <a href="https://vhagar.finance/#about" 
              target="_blank"
              rel="noopener noreferrer">About</a>
            </li>
            <li className="coll">
              <a href="https://vhagar.finance/#tokenomics" 
              target="_blank"
              rel="noopener noreferrer">Tokenomics</a>
            </li>
            <li className="coll">
              <a href="https://vhagar.finance/#roadmap-container" 
              target="_blank"
              rel="noopener noreferrer">RoadMap</a>
            </li>
          </ul>
        </div>
        <div className="column co-serve">
          <h4 className="fw-bold">
            <a
              href="https://dexscreener.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dex Screener
            </a>
          </h4>
          <ul className="list-unstyled">
            <li className="coll">
              <a href="https://jup.ag/">Jupiter Dex</a>
            </li>
            <li className="coll">
              <a
                href="https://coinmarketcap.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Coinmarketcap
              </a>
            </li>
            <li className="coll">
              <a
                href="https://birdeye.so/"
                target="_blank"
                rel="noopener noreferrer"
              >
                BirdEye
              </a>
            </li>
          </ul>
        </div>
        <div className="co-cont">
          <div className="d-flex justify-content-center align-items-center pt-4">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="pe-2"
            >
              <Image src="/discord.png" width={50} height={50} alt="Discord" className="social-icon" />
            </a>
            <a
              href="https://telegram.org"
              target="_blank"
              rel="noopener noreferrer"
              className="pe-2"
            >
              <Image src="/telegram.png" width={50} height={50} alt="Telegram" className="social-icon" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-light"
            >
              <Image src="/x1.png" width={50} height={50} alt="X" className="social-icon" />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-divider"></div>
      <p className="text-center opp p-2">
        <i className="bi bi-c-circle" style={{ color: "#5ee616" }}></i>
        &nbsp;2024. &nbsp;All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;