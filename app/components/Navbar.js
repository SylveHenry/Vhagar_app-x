"use client";

import debounce from "lodash.debounce";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [navbarClass, setNavbarClass] = useState(
    `navbar navbar-expand-lg navbar-light ${styles.navbar} ${styles.bgTransparent}`
  );
  const [logoSrc, setLogoSrc] = useState("/logo_with_word.png");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = useCallback(debounce(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 0) {
      setNavbarClass(
        `navbar navbar-expand-lg navbar-light ${styles.navbar} ${styles.bgScrolled} shadow-sm`
      );
    } else {
      setNavbarClass(`navbar navbar-expand-lg navbar-light ${styles.navbar} ${styles.bgTransparent}`);
    }
  }, 100), []);

  const handleResize = useCallback(debounce(() => {
    if (window.innerWidth < 992) {
      setLogoSrc("/logo_with_word2.png");
    } else {
      setLogoSrc("/logo_with_word.png");
    }
  }, 100), []);

  useEffect(() => {
    handleResize();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const navbar = document.getElementById("navbarSupportedContent");
      const navbarToggler = document.querySelector(`.${styles.navbarToggler}`);
      if (isMenuOpen && !navbar.contains(event.target) && !navbarToggler.contains(event.target)) {
        setIsMenuOpen(false);
        navbar.classList.remove("show");
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={navbarClass}>
      <div className="container-fluid p-2">
        <a className="navbar-brand text-light ps-2" href="https://vhagar.finance/">
          <Image src={logoSrc} width={128} height={77} alt="Logo" />
        </a>
        <div className="d-flex d-lg-none align-items-center">
          <div className="me-2">
            <WalletMultiButton className={`${styles.walletAdapterButton} ${styles.walletButton}`} />
          </div>
          <button
            className={`${styles.navbarToggler} ${isMenuOpen ? styles.navbarTogglerActive : ''}`}
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            onClick={toggleMenu}
          >
            <div className={styles.menuIcon}>
              <span className={styles.menuIconBar}></span>
              <span className={styles.menuIconBar}></span>
              <span className={styles.menuIconBar}></span>
            </div>
          </button>
        </div>
        <div
          className="collapse navbar-collapse justify-content-center"
          id="navbarSupportedContent"
        >
          <ul className="navbar-nav">
            {['ABOUT', 'TOKENOMICS', 'ROADMAP', 'COMMUNITY', 'TOOLS', 'GREENPAPER'].map((item, index) => (
              <li key={item} className={`nav-item ${styles.navItem}`}>
                <a 
                  className={`nav-link ${styles.navLink}`} 
                  href={index < 4 ? `https://vhagar.finance/#${item.toLowerCase()}` : 
                        item === 'TOOLS' ? 'https://TOOLs.vhagar.finance/' : 
                        'https://docs.vhagar.finance/'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="d-none d-lg-block">
          <WalletMultiButton className={`${styles.walletAdapterButton} ${styles.walletButton}`} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;