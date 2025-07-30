'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { etherlinkTestnet } from '@/lib/chains';

const config = getDefaultConfig({
  appName: 'TimeStone',
  projectId: '7a6e6a1f7934519391a590f1b17504df', // Your WalletConnect project ID
  chains: [etherlinkTestnet],
});

const queryClient = new QueryClient();

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <ConnectButton />
          </div>
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
} 