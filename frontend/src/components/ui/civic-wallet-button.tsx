'use client';

import { UserButton, useUser } from "@civic/auth-web3/react";
import { useAutoConnect } from "@civic/auth-web3/wagmi";
import { useAccount, useBalance } from "wagmi";
import { userHasWallet } from "@civic/auth-web3";

export function CivicWalletButton() {
  const userContext = useUser();
  const { isConnected, address } = useAccount();
  const { data: balance } = useBalance({ address });
  
  // Auto connect when user has wallet
  useAutoConnect();

  // User not logged in - show UserButton which handles sign in
  if (!userContext.user) {
    return (
      <div className="flex items-center justify-end">
        <UserButton />
      </div>
    );
  }

  // User logged in but no wallet yet
  if (!userHasWallet(userContext)) {
    return (
      <div className="flex items-center justify-end gap-2">
        <UserButton />
        <div className="text-xs text-gray-300">Creating wallet...</div>
      </div>
    );
  }

  // User has wallet - show address and XTZ balance
  return (
    <div className="flex items-center justify-end gap-2">
      <UserButton />
      <div className="flex flex-col items-end gap-1">
        <div className="text-xs text-gray-300 font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <div className="text-xs text-green-400 font-mono">
          {balance 
            ? `${(Number(balance.value) / 1e18).toFixed(4)} XTZ`
            : "0.0000 XTZ"
          }
        </div>
        {isConnected && <div className="text-xs text-green-500">● Connected</div>}
      </div>
    </div>
  );
}