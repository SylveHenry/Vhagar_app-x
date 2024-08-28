"use client";

import debounce from "lodash.debounce";
import Image from "next/image";
import { useEffect, useState } from "react";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import styles from "../page.module.css";

const Navbar = () => {
  const [navbarClass, setNavbarClass] = useState(
    "navbar navbar-expand-lg navbar-light bg-transparent"
  );
  const [logoSrc, setLogoSrc] = useState("/logo_with_word.png");

  useEffect(() => {
    const handleScroll = debounce(() => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 0) {
        setNavbarClass(
          "navbar navbar-expand-lg navbar-light bg-scrolled shadow-sm"
        );
      } else {
        setNavbarClass("navbar navbar-expand-lg navbar-light bg-transparent");
      }
    }, 100);

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleResize = debounce(() => {
      if (window.innerWidth < 992) {
        setLogoSrc("/logo_with_word2.png");
      } else {
        setLogoSrc("/logo_with_word.png");
      }
    }, 100);

    handleResize(); // Call handler once to set initial state

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <nav className={navbarClass}>
      <div className="container-fluid p-2">
        <a className="navbar-brand text-light ps-2" href="https://vhagar.finance/">
          <Image src={logoSrc} width={128} height={77} alt="Logo" />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <h2><i className="bi bi-list text-light"></i></h2>
        </button>
        <div
          className="collapse navbar-collapse justify-content-center"
          id="navbarSupportedContent"
        >
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="https://vhagar.finance/#about" 
                target="_blank"
                rel="noopener noreferrer">
                ABOUT
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://vhagar.finance/#tokenomics" 
                target="_blank"
                rel="noopener noreferrer">
                TOKENOMICS
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://vhagar.finance/#roadmap-container" 
                target="_blank"
                rel="noopener noreferrer">
                ROADMAP
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://vhagar.finance/#network" 
                target="_blank"
                rel="noopener noreferrer">
                COMMUNITY
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                href="https://docs.vhagar.finance/"
                target="_blank"
                rel="noopener noreferrer"
              >
                GREENPAPER
              </a>
            </li>
          </ul>
        </div>
        <div className="ms-auto">
          <style jsx global>{`
            .wallet-adapter-dropdown {
              background-color: #0a194970 !important;
              border: 2px solid #63b560 !important;
              border-radius: 10px !important;
            }
            .wallet-adapter-dropdown-list-item {
              background-color: transparent !important;
              color: white !important;
            }
            .wallet-adapter-dropdown-list-item:hover {
              background-color: #63b560 !important;
            }
          `}</style>
          <WalletMultiButton className={styles.walletButton} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;