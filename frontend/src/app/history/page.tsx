"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";

// Contract hashes to identify CasperStake transactions
const CASPERSTAKE_CONTRACTS = [
  "f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85",
  "d08450237b5a4b6db97fb26b4dae6ae4e26262ad39a88e2079c5a9ad01783a83",
  "1260305e8fbadbee64fb4f4107499cd75afd11d786b13f53a496cfdaadfe0720",
];

// WCSPR contract for identifying wrap/unwrap
const WCSPR_CONTRACT = "4f2d1b772147b9ce3706919fe0750af6964249b0931e2115045f97e1e135e80b";

type ActionType = "stake" | "unstake" | "withdraw" | "claim" | "bridge" | "swap" | "deploy" | "init" | "unknown";
type TxStatus = "success" | "failed" | "pending";

// User-facing actions to show in history (swap includes wrap/unwrap)
const USER_FACING_ACTIONS: ActionType[] = ["stake", "unstake", "withdraw", "claim", "bridge", "swap"];

interface Transaction {
  hash: string;
  timestamp: string;
  action: string;
  actionType: ActionType;
  contractHash: string;
  amount: string;
  amountRaw: number;
  cost: string;
  status: TxStatus;
  blockHeight: number;
  entryPointId?: number;
  errorMessage?: string | null;
  isNew?: boolean;
}

interface ApiTransaction {
  deploy_hash?: string;
  deployHash?: string;
  hash?: string;
  timestamp?: string;
  entry_point?: string;
  entryPoint?: string;
  entry_point_name?: string;
  entry_point_id?: number;
  entryPointId?: number;
  contract_entrypoint?: {
    id?: number;
    name?: string;
    entry_point_name?: string;
  } | null;
  contract_hash?: string;
  contractHash?: string;
  contract_package_hash?: string;
  amount?: string;
  args?: {
    amount?: {
      parsed?: number;
    };
    wcspr_hash?: any;
    wcspr_contract_hash?: any;
  };
  cost?: string;
  payment_amount?: string;
  status?: string;
  error_message?: string | null;
  errorMessage?: string | null;
  block_height?: number;
  blockHeight?: number;
  execution_type_id?: number;
}

// FIXED: Better action type detection including wrap/unwrap
function getActionDetails(deploy: ApiTransaction): { name: string; type: ActionType } {
  let entryPoint = "";
  
  if (deploy.contract_entrypoint?.name) {
    entryPoint = deploy.contract_entrypoint.name;
  } else if (deploy.contract_entrypoint?.entry_point_name) {
    entryPoint = deploy.contract_entrypoint.entry_point_name;
  } else if (deploy.entry_point) {
    entryPoint = deploy.entry_point;
  } else if (deploy.entryPoint) {
    entryPoint = deploy.entryPoint;
  } else if (deploy.entry_point_name) {
    entryPoint = deploy.entry_point_name;
  }
  
  const entryPointLower = entryPoint.toLowerCase().trim();
  const contractHash = deploy.contract_hash || deploy.contractHash || deploy.contract_package_hash || "";
  
  // Check for wrap/unwrap by looking at args or contract
  const hasWcsprArg = deploy.args?.wcspr_hash || deploy.args?.wcspr_contract_hash;
  const isWcsprContract = contractHash.toLowerCase().includes(WCSPR_CONTRACT.toLowerCase());
  
  // WASM deploy detection - these are swap operations
  if (entryPointLower === "wasm" || deploy.execution_type_id === 1 || entryPointLower === "call") {
    // If it has WCSPR args or involves WCSPR contract, it's a swap (wrap/unwrap)
    if (hasWcsprArg || isWcsprContract) {
      return { name: "Swap", type: "swap" };
    }
    // Generic WASM deploy - show as swap since that's what user sees
    return { name: "Swap", type: "swap" };
  }
  
  if (entryPointLower === "request_unstake" || entryPointLower === "unstake") {
    return { name: "Unstake", type: "unstake" };
  }
  if (entryPointLower.includes("unstake")) {
    return { name: "Unstake", type: "unstake" };
  }
  if (entryPointLower === "stake") {
    return { name: "Stake", type: "stake" };
  }
  if (entryPointLower.includes("stake") && !entryPointLower.includes("unstake")) {
    return { name: "Stake", type: "stake" };
  }
  if (entryPointLower === "withdraw" || entryPointLower.includes("withdraw")) {
    return { name: "Withdraw", type: "withdraw" };
  }
  if (entryPointLower.includes("claim")) {
    return { name: "Claim Rewards", type: "claim" };
  }
  if (entryPointLower.includes("bridge")) {
    return { name: "Bridge", type: "bridge" };
  }
  if (entryPointLower.includes("swap")) {
    return { name: "Swap", type: "swap" };
  }
  if (entryPointLower === "deposit") {
    return { name: "Swap", type: "swap" };
  }
  if (entryPointLower === "withdraw" && isWcsprContract) {
    return { name: "Swap", type: "swap" };
  }
  if (entryPointLower.includes("init")) {
    return { name: "Initialize", type: "init" };
  }
  if (entryPointLower === "approve") {
    return { name: "Approve", type: "swap" }; // Count approve as part of swap flow
  }
  if (entryPointLower.includes("swap_exact")) {
    return { name: "DEX Swap", type: "swap" };
  }

  if (entryPoint) {
    return { name: entryPoint, type: "unknown" };
  }
  
  return { name: "Contract Call", type: "unknown" };
}

function getStatus(deploy: ApiTransaction): TxStatus {
  const errorMsg = deploy.error_message ?? deploy.errorMessage;
  const status = deploy.status?.toLowerCase();
  
  if (status === "pending" || status === "processing") {
    return "pending";
  }
  if (errorMsg === null || errorMsg === undefined) {
    if (status === "processed" || status === "success" || status === "executed") {
      return "success";
    }
  }
  if (errorMsg) {
    return "failed";
  }
  
  return "pending";
}

// Auto-refresh interval (30 seconds)
const POLL_INTERVAL = 30000;

export default function HistoryPage() {
  const { connected, walletAddress, connect, loading: walletLoading, pendingUnstakes } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | ActionType>("all");
  const [apiError, setApiError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newTxCount, setNewTxCount] = useState(0);
  const [seenHashes, setSeenHashes] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [lastUpdatedText, setLastUpdatedText] = useState("");

  // Mark as mounted (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update "last updated" text every 10 seconds (client-side only)
  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateText = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      
      if (diffSec < 10) setLastUpdatedText("Just now");
      else if (diffSec < 60) setLastUpdatedText(`${diffSec}s ago`);
      else if (diffMin < 60) setLastUpdatedText(`${diffMin}m ago`);
      else setLastUpdatedText(lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    };
    
    updateText();
    const interval = setInterval(updateText, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const parseTransactions = useCallback((data: ApiTransaction[]): Transaction[] => {
    return data.map((deploy: ApiTransaction) => {
      const actionDetails = getActionDetails(deploy);
      const amountRaw = deploy.args?.amount?.parsed || (deploy.amount ? parseInt(deploy.amount) : 0);
      
      return {
        hash: deploy.deploy_hash || deploy.deployHash || deploy.hash || "",
        timestamp: deploy.timestamp || new Date().toISOString(),
        action: actionDetails.name,
        actionType: actionDetails.type,
        contractHash: deploy.contract_hash || deploy.contractHash || deploy.contract_package_hash || "",
        amount: amountRaw > 0 ? (amountRaw / 1_000_000_000).toFixed(2) : "0",
        amountRaw,
        cost: deploy.cost || deploy.payment_amount 
          ? ((parseInt(deploy.cost || deploy.payment_amount || "0")) / 1_000_000_000).toFixed(4) 
          : "0",
        status: getStatus(deploy),
        blockHeight: deploy.block_height || deploy.blockHeight || 0,
        entryPointId: deploy.entry_point_id || deploy.entryPointId,
        errorMessage: deploy.error_message ?? deploy.errorMessage,
      };
    });
  }, []);

  const fetchTransactions = useCallback(async (publicKey: string, isInitial = false, isSilent = false) => {
    if (isInitial) {
      setLoading(true);
    } else if (!isSilent) {
      setIsRefreshing(true);
    }
    
    if (!isSilent) {
      setApiError(false);
    }
    
    try {
      const response = await fetch(`/api/transactions?publicKey=${publicKey}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const txs = parseTransactions(data.data);
          
          // Sort by timestamp descending
          txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          // Filter to user-facing transactions
          const userFacingTxs = txs.filter(tx => USER_FACING_ACTIONS.includes(tx.actionType));
          
          // Check for new transactions (only on silent polls after initial load)
          if (isSilent && seenHashes.size > 0) {
            const newTxs = userFacingTxs.filter(tx => !seenHashes.has(tx.hash));
            if (newTxs.length > 0) {
              setNewTxCount(prev => prev + newTxs.length);
              // Mark new transactions
              userFacingTxs.forEach(tx => {
                if (!seenHashes.has(tx.hash)) {
                  tx.isNew = true;
                }
              });
            }
          }
          
          // Update seen hashes
          const newSeenHashes = new Set(userFacingTxs.map(tx => tx.hash));
          setSeenHashes(newSeenHashes);
          
          setTransactions(userFacingTxs);
          setLastUpdated(new Date());
          
          // Save to localStorage
          localStorage.setItem(`txHistory_${publicKey}`, JSON.stringify(userFacingTxs));
        }
      } else {
        console.log("API unavailable");
        if (!isSilent) {
          setApiError(true);
          loadFromLocalStorage(publicKey);
        }
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      if (!isSilent) {
        setApiError(true);
        loadFromLocalStorage(publicKey);
      }
    }
    
    setLoading(false);
    setIsRefreshing(false);
  }, [parseTransactions, seenHashes]);

  const loadFromLocalStorage = (publicKey: string) => {
    const savedTxs = localStorage.getItem(`txHistory_${publicKey}`);
    if (savedTxs) {
      try {
        const parsed = JSON.parse(savedTxs);
        setTransactions(parsed);
        setSeenHashes(new Set(parsed.map((tx: Transaction) => tx.hash)));
      } catch (e) {
        console.error("Failed to parse saved transactions");
      }
    }
  };

  // Initial fetch
  useEffect(() => {
    if (connected && walletAddress) {
      fetchTransactions(walletAddress, true);
    }
  }, [connected, walletAddress]);

  // Auto-polling every 30 seconds
  useEffect(() => {
    if (!connected || !walletAddress) return;

    const pollInterval = setInterval(() => {
      fetchTransactions(walletAddress, false, true);
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [connected, walletAddress, fetchTransactions]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connected && walletAddress) {
        fetchTransactions(walletAddress, false, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connected, walletAddress, fetchTransactions]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    setNewTxCount(0);
    // Clear "new" flags
    setTransactions(prev => prev.map(tx => ({ ...tx, isNew: false })));
    fetchTransactions(walletAddress, false, false);
  };

  // Clear new count when user sees the page
  const handleViewNewTransactions = () => {
    setNewTxCount(0);
    setTransactions(prev => prev.map(tx => ({ ...tx, isNew: false })));
    setFilter("all");
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter(tx => tx.actionType === filter);
  }, [transactions, filter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = transactions.length;
    const stakes = transactions.filter(t => t.actionType === "stake").length;
    const unstakes = transactions.filter(t => t.actionType === "unstake").length;
    const withdrawals = transactions.filter(t => t.actionType === "withdraw").length;
    const claims = transactions.filter(t => t.actionType === "claim").length;
    const bridges = transactions.filter(t => t.actionType === "bridge").length;
    const swaps = transactions.filter(t => t.actionType === "swap").length;
    const pending = transactions.filter(t => t.status === "pending").length;
    const successful = transactions.filter(t => t.status === "success").length;
    const failed = transactions.filter(t => t.status === "failed").length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    
    const totalStaked = transactions
      .filter(t => t.actionType === "stake" && t.status === "success")
      .reduce((sum, t) => sum + t.amountRaw, 0) / 1_000_000_000;
    
    const totalUnstaked = transactions
      .filter(t => (t.actionType === "unstake" || t.actionType === "withdraw") && t.status === "success")
      .reduce((sum, t) => sum + t.amountRaw, 0) / 1_000_000_000;

    return { total, stakes, unstakes, withdrawals, claims, bridges, swaps, pending, successful, failed, successRate, totalStaked, totalUnstaked };
  }, [transactions]);

  const getActionIcon = (actionType: ActionType) => {
    switch (actionType) {
      case "stake": return "📥";
      case "unstake": return "📤";
      case "withdraw": return "💰";
      case "claim": return "🎁";
      case "bridge": return "🌉";
      case "swap": return "🔄";
      default: return "📋";
    }
  };

  const getActionColor = (actionType: ActionType) => {
    switch (actionType) {
      case "stake": return "text-[#BFFF00]";
      case "unstake": return "text-orange-400";
      case "withdraw": return "text-yellow-400";
      case "claim": return "text-purple-400";
      case "bridge": return "text-blue-400";
      case "swap": return "text-cyan-400";
      default: return "text-gray-400";
    }
  };

  const getStatusColor = (status: TxStatus) => {
    switch (status) {
      case "success": return "text-[#BFFF00]";
      case "failed": return "text-[#FF0032]";
      default: return "text-yellow-400";
    }
  };

  const getStatusBg = (status: TxStatus) => {
    switch (status) {
      case "success": return "bg-[#BFFF00]/10 border-[#BFFF00]/30";
      case "failed": return "bg-[#FF0032]/10 border-[#FF0032]/30";
      default: return "bg-yellow-400/10 border-yellow-400/30";
    }
  };

  const getStatusIcon = (status: TxStatus) => {
    switch (status) {
      case "success": return "✓";
      case "failed": return "✗";
      default: return "◷";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // Filter buttons
  const filterButtons = [
    { key: "all" as const, label: "All", count: stats.total },
    { key: "stake" as const, label: "Stakes", count: stats.stakes, icon: "📥" },
    { key: "unstake" as const, label: "Unstakes", count: stats.unstakes, icon: "📤" },
    { key: "swap" as const, label: "Swaps", count: stats.swaps, icon: "🔄" },
    { key: "withdraw" as const, label: "Withdrawals", count: stats.withdrawals, icon: "💰" },
    { key: "claim" as const, label: "Claims", count: stats.claims, icon: "🎁" },
    { key: "bridge" as const, label: "Bridges", count: stats.bridges, icon: "🌉" },
  ].filter(btn => btn.key === "all" || btn.count > 0);

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <section className="bg-gradient-to-b from-[#FF0032]/10 to-black py-8 md:py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2">
                Transaction <span className="text-[#FF0032]">History</span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-xl">
                Track all your CasperStake transactions including stakes, unstakes, wraps, swaps, and more.
              </p>
            </div>
            {connected && (
              <a 
                href={`https://testnet.cspr.live/account/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-[#BFFF00] text-black font-bold text-sm rounded-lg hover:bg-[#BFFF00]/90 transition-all self-start"
              >
                <span>View on Explorer</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {!connected ? (
          /* Not Connected State */
          <div className="text-center py-16 md:py-24">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-[#FF0032]/10 flex items-center justify-center">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-[#FF0032]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8 text-sm md:text-base">Connect to view your transaction history</p>
            <button 
              onClick={connect} 
              disabled={walletLoading} 
              className="px-8 py-3 bg-[#FF0032] text-white font-bold rounded-lg hover:bg-[#FF0032]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {walletLoading ? "Connecting..." : "Connect Casper Wallet"}
            </button>
          </div>
        ) : loading ? (
          /* Loading State */
          <div className="text-center py-16 md:py-24">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-[#FF0032]/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF0032] animate-spin"></div>
            </div>
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        ) : !mounted ? (
          /* SSR placeholder - prevents hydration mismatch */
          <div className="text-center py-16 md:py-24">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-[#FF0032]/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF0032] animate-spin"></div>
            </div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* New Transactions Banner */}
            {newTxCount > 0 && (
              <button
                onClick={handleViewNewTransactions}
                className="w-full mb-4 py-3 px-4 bg-[#BFFF00]/10 border border-[#BFFF00]/30 rounded-xl flex items-center justify-center gap-2 text-[#BFFF00] font-bold hover:bg-[#BFFF00]/20 transition-all"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BFFF00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#BFFF00]"></span>
                </span>
                <span>{newTxCount} new transaction{newTxCount > 1 ? 's' : ''} found</span>
                <span className="text-sm text-[#BFFF00]/70">— Click to view</span>
              </button>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl">
                <p className="text-gray-500 text-xs md:text-sm mb-1">Total Transactions</p>
                <p className="text-xl md:text-2xl font-black text-white">{stats.total}</p>
              </div>
              
              <div className="bg-[#BFFF00]/5 border border-[#BFFF00]/20 p-3 md:p-4 rounded-xl">
                <p className="text-gray-500 text-xs md:text-sm mb-1">📥 Stakes</p>
                <p className="text-xl md:text-2xl font-black text-[#BFFF00]">{stats.stakes}</p>
                {stats.totalStaked > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{stats.totalStaked.toFixed(2)} CSPR</p>
                )}
              </div>
              
              <div className="bg-orange-500/5 border border-orange-500/20 p-3 md:p-4 rounded-xl">
                <p className="text-gray-500 text-xs md:text-sm mb-1">📤 Unstakes</p>
                <p className="text-xl md:text-2xl font-black text-orange-400">{stats.unstakes}</p>
              </div>
              
              {stats.swaps > 0 && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 p-3 md:p-4 rounded-xl">
                  <p className="text-gray-500 text-xs md:text-sm mb-1">🔄 Swaps</p>
                  <p className="text-xl md:text-2xl font-black text-cyan-400">{stats.swaps}</p>
                </div>
              )}
              
              <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl">
                <p className="text-gray-500 text-xs md:text-sm mb-1">Success Rate</p>
                <p className={`text-xl md:text-2xl font-black ${stats.successRate >= 80 ? "text-[#BFFF00]" : stats.successRate >= 50 ? "text-yellow-400" : "text-[#FF0032]"}`}>
                  {stats.successRate}%
                </p>
              </div>
              
              <div className="bg-[#FF0032]/5 border border-[#FF0032]/20 p-3 md:p-4 rounded-xl">
                <p className="text-gray-500 text-xs md:text-sm mb-1">✗ Failed</p>
                <p className="text-xl md:text-2xl font-black text-[#FF0032]">{stats.failed}</p>
              </div>
            </div>

            {/* Unbonding Section */}
            {pendingUnstakes && pendingUnstakes.length > 0 && (
              <div className="mb-6 bg-purple-500/5 border border-purple-500/20 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-purple-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⏳</span>
                    <div>
                      <p className="font-bold text-purple-400 text-sm">Unbonding Period</p>
                      <p className="text-gray-500 text-xs">CSPR waiting for 7-day unlock</p>
                    </div>
                  </div>
                  <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-1 rounded">
                    {pendingUnstakes.length} pending
                  </span>
                </div>
                <div className="divide-y divide-purple-500/10">
                  {pendingUnstakes.map((unstake, i) => {
                    const daysRemaining = Math.max(1, 7 - i);
                    const progress = ((7 - daysRemaining) / 7) * 100;
                    const isReady = daysRemaining === 0;
                    
                    return (
                      <div key={i} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReady ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                            {isReady ? (
                              <span className="text-green-400 font-bold">✓</span>
                            ) : (
                              <span className="text-purple-400 text-xs font-bold">{daysRemaining}d</span>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-bold">{unstake.amount.toFixed(2)} CSPR</p>
                            <p className="text-gray-500 text-xs">Unlocks: {unstake.unlockDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isReady ? 'bg-green-400' : 'bg-purple-400'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          {isReady ? (
                            <Link 
                              href="/stake"
                              className="px-3 py-1.5 bg-green-500 text-black text-xs font-bold rounded-lg hover:bg-green-400"
                            >
                              Withdraw
                            </Link>
                          ) : (
                            <span className="text-purple-400 text-xs font-medium">
                              {daysRemaining} days left
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Buttons & Refresh */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {filterButtons.map(btn => (
                <button 
                  key={btn.key}
                  onClick={() => setFilter(btn.key)} 
                  className={`px-3 md:px-4 py-2 font-semibold text-xs md:text-sm rounded-lg transition-all flex items-center gap-1.5 ${
                    filter === btn.key 
                      ? btn.key === "all" 
                        ? "bg-[#FF0032] text-white" 
                        : btn.key === "stake"
                          ? "bg-[#BFFF00] text-black"
                          : "bg-white/20 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {btn.icon && <span>{btn.icon}</span>}
                  <span>{btn.label}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${filter === btn.key ? "bg-black/20" : "bg-white/10"}`}>
                    {btn.count}
                  </span>
                </button>
              ))}
              
              {/* Refresh & Last Updated */}
              <div className="ml-auto flex items-center gap-3">
                {lastUpdated && mounted && (
                  <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span>Updated {lastUpdatedText}</span>
                  </div>
                )}
                
                <button 
                  onClick={handleManualRefresh} 
                  disabled={isRefreshing}
                  className="px-3 md:px-4 py-2 bg-white/5 text-gray-400 hover:bg-white/10 font-semibold text-xs md:text-sm rounded-lg disabled:opacity-50 border border-white/10 flex items-center gap-1.5"
                >
                  <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden md:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                </button>
              </div>
            </div>

            {/* Auto-refresh indicator (mobile) */}
            {lastUpdated && mounted && (
              <div className="md:hidden flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
                <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span>Auto-refreshes every 30s • Updated {lastUpdatedText}</span>
              </div>
            )}

            {apiError && transactions.length === 0 ? (
              /* API Error / Empty State */
              <div className="text-center py-16 md:py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#FF0032]/10 flex items-center justify-center">
                  <span className="text-4xl">📭</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  {apiError ? "API Temporarily Unavailable" : "No Transactions Found"}
                </h2>
                <p className="text-gray-400 mb-6 text-sm md:text-base max-w-md mx-auto">
                  {apiError 
                    ? "View your transactions directly on the Casper explorer." 
                    : "Start staking to see your transactions here!"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a 
                    href={`https://testnet.cspr.live/account/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-[#BFFF00] text-black font-bold rounded-lg hover:bg-[#BFFF00]/90 inline-flex items-center justify-center gap-2"
                  >
                    View on CSPR.live
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <Link 
                    href="/stake" 
                    className="px-6 py-3 bg-[#FF0032] text-white font-bold rounded-lg hover:bg-[#FF0032]/90"
                  >
                    Go to Staking →
                  </Link>
                </div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              /* No results for filter */
              <div className="text-center py-16">
                <p className="text-gray-400">No {filter} transactions found</p>
                <button 
                  onClick={() => setFilter("all")} 
                  className="mt-4 text-[#FF0032] hover:underline"
                >
                  View all transactions
                </button>
              </div>
            ) : (
              /* Transaction Table */
              <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/[0.02]">
                  <div className="col-span-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Transaction</div>
                  <div className="col-span-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">Action</div>
                  <div className="col-span-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">Amount</div>
                  <div className="col-span-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">Cost</div>
                  <div className="col-span-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">Time</div>
                  <div className="col-span-1 text-gray-500 text-xs font-semibold uppercase tracking-wider text-right">Status</div>
                </div>

                {/* Transaction Rows */}
                {filteredTransactions.map((tx, i) => {
                  const { date, time } = formatDate(tx.timestamp);
                  return (
                    <div 
                      key={tx.hash || i} 
                      className={`border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors ${tx.isNew ? 'bg-[#BFFF00]/5' : ''}`}
                    >
                      {/* Desktop Row */}
                      <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center">
                        <div className="col-span-3">
                          <div className="flex items-center gap-2">
                            {tx.isNew && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#BFFF00] text-black rounded">NEW</span>
                            )}
                            <a 
                              href={`https://testnet.cspr.live/deploy/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF0032] hover:text-[#FF0032]/80 font-mono text-sm transition-colors"
                            >
                              {tx.hash ? `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}` : "Unknown"}
                            </a>
                          </div>
                          <p className="text-gray-600 text-xs mt-0.5">Block: {tx.blockHeight || "N/A"}</p>
                        </div>
                        
                        <div className="col-span-2">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 ${getActionColor(tx.actionType)}`}>
                            <span>{getActionIcon(tx.actionType)}</span>
                            <span className="font-semibold text-sm">{tx.action}</span>
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          {tx.amount !== "0" && tx.amount !== "0.00" ? (
                            <span className="font-bold text-white">{tx.amount} <span className="text-gray-500">CSPR</span></span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </div>
                        
                        <div className="col-span-2 text-gray-400 text-sm">
                          {tx.cost} CSPR
                        </div>
                        
                        <div className="col-span-2">
                          <p className="text-white text-sm">{date}</p>
                          <p className="text-gray-600 text-xs">{time}</p>
                        </div>
                        
                        <div className="col-span-1 text-right">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border ${getStatusBg(tx.status)} ${getStatusColor(tx.status)} font-bold`}>
                            {getStatusIcon(tx.status)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Row */}
                      <div className={`md:hidden p-4 ${tx.isNew ? 'border-l-4 border-[#BFFF00]' : ''}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {tx.isNew && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#BFFF00] text-black rounded">NEW</span>
                            )}
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 ${getActionColor(tx.actionType)}`}>
                              <span>{getActionIcon(tx.actionType)}</span>
                              <span className="font-semibold text-sm">{tx.action}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${getStatusBg(tx.status)} ${getStatusColor(tx.status)} font-bold text-sm`}>
                            {getStatusIcon(tx.status)}
                          </span>
                        </div>
                        
                        <a 
                          href={`https://testnet.cspr.live/deploy/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF0032] hover:text-[#FF0032]/80 font-mono text-xs block mb-2"
                        >
                          {tx.hash ? `${tx.hash.slice(0, 12)}...${tx.hash.slice(-10)}` : "Unknown"}
                        </a>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            {tx.amount !== "0" && tx.amount !== "0.00" ? (
                              <span className="font-bold text-white">{tx.amount} <span className="text-gray-500">CSPR</span></span>
                            ) : (
                              <span className="text-gray-600">No amount</span>
                            )}
                          </div>
                          <div className="text-gray-500 text-xs text-right">
                            <p>{date}</p>
                            <p>{time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-gray-500">
                          <span>Block: {tx.blockHeight || "N/A"}</span>
                          <span>Cost: {tx.cost} CSPR</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Link */}
            {filteredTransactions.length > 0 && (
              <div className="text-center pt-6 pb-4">
                <a 
                  href={`https://testnet.cspr.live/account/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#FF0032] hover:text-[#FF0032]/80 font-bold transition-colors"
                >
                  <span>View complete history on CSPR.live</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}