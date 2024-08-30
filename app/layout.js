import "bootstrap/dist/css/bootstrap.css";
import BootstrapClient from "./bootstrap";
import Navbar from "./components/Navbar";
import "./globals.css";
import Footer from "./components/Footer";
import 'bootstrap-icons/font/bootstrap-icons.css';
import WalletContextProvider from "./components/WalletContextProvider";

export const metadata = {
  title: "Vhagar Dapp",
  description: "Vhagar on Solana Staking Pool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BootstrapClient />
        <WalletContextProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </WalletContextProvider>
      </body>
    </html>
  );
}