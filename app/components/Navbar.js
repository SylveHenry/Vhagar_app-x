"use client";

import debounce from "lodash.debounce"; // Importing debounce from lodash
import Image from "next/image";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [navbarClass, setNavbarClass] = useState(
    "navbar navbar-expand-lg navbar-light bg-transparent"
  );
  const [logoSrc, setLogoSrc] = useState("../images/logo_with_word.png");

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
        setLogoSrc("../images/logo_with_word2.png");
      } else {
        setLogoSrc("../images/logo_with_word.png");
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
        <a className="navbar-brand text-light ps-2" href="#">
          <Image src="/logo_with_word.png" width={128} height={77}></Image>
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
          <i className="bi bi-list text-light"></i>
        </button>
        <div
          className="collapse navbar-collapse justify-content-center"
          id="navbarSupportedContent"
        >
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="#about">
                ABOUT
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#tokenomics">
                TOKENOMICS
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#roadmap-container">
                ROADMAP
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#network">
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
          <a
            className="ms-auto nav-item stake-button me-3 stake-small"
            href="https://app.vhagar.finance/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="btn" type="button">
              STAKE VGR
            </button>
          </a>
        </div>
        <a
          className="ms-auto nav-item stake-button me-3 stake-large"
          href="https://app.vhagar.finance/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="btn" type="button">
            STAKE VGR
          </button>
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
