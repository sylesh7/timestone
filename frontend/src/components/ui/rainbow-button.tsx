"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface RainbowButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function RainbowButton({ className, children }: RainbowButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <motion.button
                    onClick={openConnectModal}
                    className={cn(
                      "relative inline-flex h-12 overflow-hidden rounded-xl p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50",
                      className
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#1E293B_50%,#E2E8F0_100%)]" />
                    <span className="absolute inset-[2px] rounded-[10px] bg-gradient-to-r from-purple-600 via-pink-500 via-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-600 bg-[length:400%_400%] animate-gradient-xy" />
                    <span className="relative z-10 inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[10px] bg-black backdrop-blur-sm px-6 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-black/90">
                      {children || (
                        <>
                          <div className="w-4 h-4 mr-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse" />
                          Connect Wallet
                        </>
                      )}
                    </span>
                  </motion.button>
                );
              }

              if (chain.unsupported) {
                return (
                  <motion.button
                    onClick={openChainModal}
                    className={cn(
                      "relative inline-flex h-12 overflow-hidden rounded-xl p-[2px] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-50",
                      className
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FEE2E2_0%,#DC2626_50%,#FEE2E2_100%)]" />
                    <span className="absolute inset-[2px] rounded-[10px] bg-gradient-to-r from-red-600 to-red-400" />
                    <span className="relative z-10 inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[10px] bg-black/90 backdrop-blur-sm px-6 py-2 text-sm font-medium text-white">
                      Wrong network
                    </span>
                  </motion.button>
                );
              }

              return (
                <div className="flex gap-2">
                  <motion.button
                    onClick={openChainModal}
                    className="relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#06B6D4_0%,#3B82F6_50%,#06B6D4_100%)]" />
                    <span className="relative z-10 inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[11px] bg-black/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white">
                      {chain.hasIcon && chain.iconUrl && (
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          className="w-4 h-4 mr-2"
                        />
                      )}
                      {chain.name}
                    </span>
                  </motion.button>

                  <motion.button
                    onClick={openAccountModal}
                    className="relative inline-flex h-12 overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#10B981_0%,#059669_50%,#10B981_100%)]" />
                    <span className="relative z-10 inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[11px] bg-black/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white">
                      <div className="w-2 h-2 mr-2 rounded-full bg-green-400 animate-pulse" />
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </span>
                  </motion.button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
