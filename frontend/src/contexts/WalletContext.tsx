"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CLPublicKey } from 'casper-js-sdk';

interface WalletContextType {
  connected: boolean;
  walletAddress: string;
  realBalance: number | null;
  stakedBalance: number;
  cscsprBalance: number;
  pendingUnstakes: { amount: number; unlockDate: string }[];
  exchangeRate: number;
  loading: boolean;
  message: { type: string; text: string } | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  showMessage: (type: string, text: string) => void;
  setStakedBalance: (val: number | ((prev: number) => number)) => void;
  setCscsprBalance: (val: number | ((prev: number) => number)) => void;
  setPendingUnstakes: (val: { amount: number; unlockDate: string }[] | ((prev: { amount: number; unlockDate: string }[]) => { amount: number; unlockDate: string }[])) => void;
  setRealBalance: (val: number | null | ((prev: number | null) => number | null)) => void;
  setLoading: (val: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

declare global {
  interface Window {
    CasperWalletProvider?: () => {
      requestConnection(): Promise<boolean>;
      getActivePublicKey(): Promise<string>;
      sign(deployJson: string, signingPublicKeyHex: string): Promise<{ cancelled: boolean; signature?: Uint8Array; signatureHex?: string }>;
      signMessage(message: string, signingPublicKeyHex: string): Promise<{ cancelled: boolean; signature?: Uint8Array; signatureHex?: string }>;
      disconnectFromSite(): Promise<boolean>;
      isConnected(): Promise<boolean>;
    };
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [cscsprBalance, setCscsprBalance] = useState(0);
  const [pendingUnstakes, setPendingUnstakes] = useState<{ amount: number; unlockDate: string }[]>([]);
  const [exchangeRate] = useState(1.0523);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchBalance = async (publicKeyHex: string) => {
    try {
      const stateResponse = await fetch('/api/casper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'chain_get_state_root_hash', params: [] })
      });
      const stateData = await stateResponse.json();
      const stateRootHash = stateData.result?.state_root_hash;
      if (!stateRootHash) return null;

      const accountResponse = await fetch('/api/casper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'state_get_account_info', params: { public_key: publicKeyHex, block_identifier: null } })
      });
      const accountData = await accountResponse.json();
      const mainPurse = accountData.result?.account?.main_purse;
      if (!mainPurse) return null;

      const balanceResponse = await fetch('/api/casper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'state_get_balance', params: { state_root_hash: stateRootHash, purse_uref: mainPurse } })
      });
      const balanceData = await balanceResponse.json();
      const balanceMotes = balanceData.result?.balance_value;
      if (balanceMotes) {
        const balanceCSPR = parseInt(balanceMotes) / 1_000_000_000;
        setRealBalance(balanceCSPR);
        return balanceCSPR;
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
    return null;
  };

  const connect = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.CasperWalletProvider) {
        const provider = window.CasperWalletProvider();
        const isConnected = await provider.requestConnection();
        if (isConnected) {
          const publicKey = await provider.getActivePublicKey();
          setWalletAddress(publicKey);
          setConnected(true);
          showMessage("success", "✅ Wallet connected!");
          await fetchBalance(publicKey);
          
          // Load saved data from localStorage
          const savedStaked = localStorage.getItem(`staked_${publicKey}`);
          const savedCscspr = localStorage.getItem(`cscspr_${publicKey}`);
          if (savedStaked) setStakedBalance(parseFloat(savedStaked));
          if (savedCscspr) setCscsprBalance(parseFloat(savedCscspr));
        }
      } else {
        showMessage("error", "❌ Please install Casper Wallet extension");
        window.open("https://www.casperwallet.io/", "_blank");
      }
    } catch (error: any) {
      showMessage("error", `❌ ${error.message || "Failed to connect"}`);
    }
    setLoading(false);
  };

  const disconnect = () => {
    setConnected(false);
    setWalletAddress("");
    setRealBalance(null);
    setStakedBalance(0);
    setCscsprBalance(0);
    setPendingUnstakes([]);
    showMessage("success", "Wallet disconnected");
  };

  // Auto-connect on mount
  useEffect(() => {
    const tryAutoConnect = async () => {
      if (typeof window !== 'undefined' && window.CasperWalletProvider) {
        try {
          const provider = window.CasperWalletProvider();
          const isConnected = await provider.isConnected();
          if (isConnected) {
            const publicKey = await provider.getActivePublicKey();
            setWalletAddress(publicKey);
            setConnected(true);
            await fetchBalance(publicKey);
            
            const savedStaked = localStorage.getItem(`staked_${publicKey}`);
            const savedCscspr = localStorage.getItem(`cscspr_${publicKey}`);
            if (savedStaked) setStakedBalance(parseFloat(savedStaked));
            if (savedCscspr) setCscsprBalance(parseFloat(savedCscspr));
          }
        } catch (e) {
          console.log("Auto-connect not available");
        }
      }
    };
    tryAutoConnect();
  }, []);

  // Save balances to localStorage when they change
  useEffect(() => {
    if (walletAddress && stakedBalance > 0) {
      localStorage.setItem(`staked_${walletAddress}`, stakedBalance.toString());
    }
  }, [stakedBalance, walletAddress]);

  useEffect(() => {
    if (walletAddress && cscsprBalance > 0) {
      localStorage.setItem(`cscspr_${walletAddress}`, cscsprBalance.toString());
    }
  }, [cscsprBalance, walletAddress]);

  return (
    <WalletContext.Provider value={{
      connected,
      walletAddress,
      realBalance,
      stakedBalance,
      cscsprBalance,
      pendingUnstakes,
      exchangeRate,
      loading,
      message,
      connect,
      disconnect,
      showMessage,
      setStakedBalance,
      setCscsprBalance,
      setPendingUnstakes,
      setRealBalance,
      setLoading,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}