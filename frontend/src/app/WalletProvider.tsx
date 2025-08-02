'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { etherlinkTestnet } from '@/lib/chains';
import { RainbowButton } from '@/components/ui/rainbow-button';

const config = getDefaultConfig({
  appName: 'TimeStone',
  projectId: '7a6e6a1f7934519391a590f1b17504df', // Your WalletConnect project ID
  chains: [etherlinkTestnet],
});

const queryClient = new QueryClient();

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <RainbowButton />
          </div>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
} 