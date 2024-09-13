'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import * as wallets from '@solana/wallet-adapter-wallets';

import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletContextProvider({ children }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_ENDPOINT, []);

  const walletOptions = useMemo(
    () => [
      new wallets.PhantomWalletAdapter(),
      new wallets.SolflareWalletAdapter(),
      new wallets.WalletConnectWalletAdapter(),
      new wallets.AlphaWalletAdapter(),
      new wallets.BitgetWalletAdapter(),
      new wallets.BitpieWalletAdapter(),
      new wallets.CloverWalletAdapter(),
      new wallets.Coin98WalletAdapter(),
      new wallets.CoinhubWalletAdapter(),
      new wallets.AvanaWalletAdapter(),
      new wallets.FractalWalletAdapter(),
      new wallets.HuobiWalletAdapter(),
      new wallets.HyperPayWalletAdapter(),
      new wallets.KeystoneWalletAdapter(),
      new wallets.KrystalWalletAdapter(),
      new wallets.LedgerWalletAdapter(),
      new wallets.MathWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={walletOptions} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}