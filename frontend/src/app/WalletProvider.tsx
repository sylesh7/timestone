'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";
import { CivicWalletButton } from "@/components/ui/civic-wallet-button";
import { etherlinkTestnet } from '@/lib/chains';
import React from 'react';

const wagmiConfig = createConfig({
  chains: [etherlinkTestnet],
  transports: {
    [etherlinkTestnet.id]: http(),
  },
  connectors: [
    embeddedWallet(),
  ],
});

const queryClient = new QueryClient();

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider initialChain={etherlinkTestnet}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', backgroundColor: 'black' }}>
            <CivicWalletButton />
          </div>
          {children}
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 