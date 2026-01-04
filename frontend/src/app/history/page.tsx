"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const CONTRACTS = {
  CASPER_STAKE: "f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85",
  CS_CSPR_TOKEN: "0151186fd048db71838f7d54458489145528c5d277e67264529a94f3a2a873",
};

interface Transaction {
  hash: string;
  blockHeight?: number;
  timestamp: string;
  action: string;
  amount?: string | number;
  cost?: string;
  status: 'success' | 'failed' | 'pending';
  isStakingTx?: boolean;
  contractHash?: string;
}

type CasperWalletProviderType = () => {
  requestConnection(): Promise<boolean>;
  getActivePublicKey(): Promise<string>;
  isConnected(): Promise<boolean>;
  sign(deployJson: string, signingPublicKeyHex: string): Promise<{ cancelled: boolean; signature?: Uint8Array; signatureHex?: string }>;
  signMessage(message: string, signingPublicKeyHex: string): Promise<{ cancelled: boolean; signature?: Uint8Array; signatureHex?: string }>;
  disconnectFromSite(): Promise<boolean>;
};

export default function HistoryPage() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<'all' | 'staking'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { checkConnection(); }, []);
  useEffect(() => { if (walletAddress) fetchTransactions(); }, [walletAddress, page]);

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).CasperWalletProvider) {
        const provider = ((window as any).CasperWalletProvider as CasperWalletProviderType)();
        const isConnected = await provider.isConnected();
        if (isConnected) {
          const publicKey = await provider.getActivePublicKey();
          setWalletAddress(publicKey);
          setConnected(true);
        }
      }
    } catch (err) { console.error("Connection check failed:", err); }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).CasperWalletProvider) {
        const provider = ((window as any).CasperWalletProvider as CasperWalletProviderType)();
        const connected = await provider.requestConnection();
        if (connected) {
          const publicKey = await provider.getActivePublicKey();
          setWalletAddress(publicKey);
          setConnected(true);
        }
      } else {
        setError("Please install Casper Wallet extension");
        window.open("https://www.casperwallet.io/", "_blank");
      }
    } catch (err: any) { setError(err.message || "Failed to connect"); }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/transactions?publicKey=${walletAddress}&page=${page}&limit=20`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const txs = parseExtendedDeploys(result.data);
          setTransactions(txs);
          setTotalPages(Math.ceil((result.itemCount || txs.length) / 20));
        } else { throw new Error(result.error || 'Failed to fetch'); }
      } else { throw new Error('API request failed'); }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Failed to load transactions. View your full history on CSPR.live");
      setTransactions([]);
    }
    setLoading(false);
  };

  const parseExtendedDeploys = (deploys: any[]): Transaction[] => {
    return deploys.map(deploy => {
      let action = deploy.entry_point || 'WASM';
      let amount: string | number | undefined;
      if (deploy.amount) amount = deploy.amount;
      else if (deploy.args?.amount) {
        try { const p = JSON.parse(deploy.args.amount); amount = p.parsed || p; } catch { amount = deploy.args.amount; }
      } else if (deploy.execution_results?.[0]?.transfers?.[0]?.amount) {
        amount = deploy.execution_results[0].transfers[0].amount;
      }
      const contractHash = deploy.contract_hash || deploy.contract_package_hash || '';
      const isStakingTx = contractHash.toLowerCase().includes(CONTRACTS.CASPER_STAKE.toLowerCase());
      if (['stake', 'request_unstake', 'unstake', 'claim'].includes(action)) {
        action = action.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      }
      return {
        hash: deploy.deploy_hash,
        blockHeight: deploy.block_height,
        timestamp: deploy.timestamp,
        action,
        amount: amount ? formatMotes(amount) : undefined,
        cost: deploy.cost ? formatMotes(deploy.cost) : undefined,
        status: deploy.status === 'success' || deploy.status === true ? 'success' : deploy.status === 'failure' || deploy.status === false ? 'failed' : 'pending',
        isStakingTx,
        contractHash
      };
    });
  };

  const formatMotes = (motes: string | number): string => {
    try {
      const m = typeof motes === 'string' ? BigInt(motes) : BigInt(Math.floor(Number(motes)));
      return (Number(m) / 1_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
    } catch { return String(motes); }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const d = new Date(timestamp), now = new Date();
    const ms = now.getTime() - d.getTime();
    const mins = Math.floor(ms / 60000), hrs = Math.floor(ms / 3600000), days = Math.floor(ms / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    if (hrs < 24) return `${hrs} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  const formatAddress = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "";
  const filteredTransactions = filter === 'staking' ? transactions.filter(tx => tx.isStakingTx || ['Stake', 'Request Unstake', 'Unstake', 'Claim'].includes(tx.action)) : transactions;
  const getActionColor = (a: string) => { const l = a.toLowerCase(); return l === 'stake' ? 'text-green-400' : l.includes('unstake') ? 'text-orange-400' : l === 'claim' ? 'text-blue-400' : 'text-gray-400'; };
  const getStatusIcon = (s: string) => s === 'success' ? '✅' : s === 'failed' ? '❌' : '⏳';

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      <header className="flex justify-between items-center px-4 md:px-8 py-4 md:py-6 border-b border-white/10">
        <Link href="/" className="text-xl md:text-3xl font-black tracking-tight">casper<span className="text-red-500">stake</span></Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-red-500">Home</Link>
          <Link href="/#stake" className="hover:text-red-500">Stake</Link>
          <span className="text-red-500 border-b-2 border-red-500 pb-1">History</span>
          <Link href="/#contracts" className="hover:text-red-500">Contracts</Link>
        </nav>
        <div className="flex gap-2 items-center">
          {connected && <span className="text-xs md:text-sm text-gray-400 hidden sm:block">{formatAddress(walletAddress)}</span>}
          {!connected && <button onClick={handleConnect} disabled={loading} className="px-4 py-2 md:px-6 md:py-3 font-bold text-xs md:text-sm bg-[#CDFF00] text-black hover:bg-[#b8e600] disabled:opacity-50">{loading ? "..." : "Connect"}</button>}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-b border-white/10 px-4 py-4 space-y-3">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">Home</Link>
          <Link href="/#stake" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">Stake</Link>
          <span className="block py-2 text-red-500">History</span>
          <Link href="/#contracts" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">Contracts</Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black">Transaction <span className="text-red-500">History</span></h1>
            <p className="text-gray-400 mt-2 text-sm">Real on-chain transactions from Casper Testnet</p>
          </div>
          {connected && (
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-bold transition-colors ${filter === 'all' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}>All</button>
              <button onClick={() => setFilter('staking')} className={`px-4 py-2 text-sm font-bold transition-colors ${filter === 'staking' ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>Staking</button>
              <button onClick={fetchTransactions} disabled={loading} className="px-4 py-2 text-sm font-bold bg-[#CDFF00] text-black hover:bg-[#b8e600] disabled:opacity-50">{loading ? '...' : '↻'}</button>
            </div>
          )}
        </div>

        {!connected ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-black mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">View your on-chain transaction history</p>
            <button onClick={handleConnect} disabled={loading} className="px-8 py-4 bg-[#CDFF00] text-black font-bold text-lg hover:bg-[#b8e600] disabled:opacity-50">{loading ? "Connecting..." : "Connect Casper Wallet"}</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg"><p className="text-gray-400 text-xs uppercase">Total</p><p className="text-2xl font-black text-white">{transactions.length}</p></div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg"><p className="text-gray-400 text-xs uppercase">Staking</p><p className="text-2xl font-black text-green-400">{transactions.filter(tx => tx.isStakingTx || ['Stake', 'Request Unstake'].includes(tx.action)).length}</p></div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg"><p className="text-gray-400 text-xs uppercase">Success</p><p className="text-2xl font-black text-blue-400">{transactions.filter(tx => tx.status === 'success').length}</p></div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg"><p className="text-gray-400 text-xs uppercase">Failed</p><p className="text-2xl font-black text-red-400">{transactions.filter(tx => tx.status === 'failed').length}</p></div>
            </div>

            {error && <div className="bg-red-600/20 border border-red-600/50 text-red-400 px-4 py-3 rounded-lg mb-6">{error}</div>}
            {loading && <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-400 mt-4">Loading...</p></div>}

            {!loading && filteredTransactions.length > 0 && (
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs text-gray-500 uppercase border-b border-white/10">
                  <div className="col-span-3">Hash</div><div className="col-span-2">Block</div><div className="col-span-2">Age</div><div className="col-span-2">Action</div><div className="col-span-2 text-right">Amount</div><div className="col-span-1 text-right">Link</div>
                </div>
                {filteredTransactions.map((tx, i) => (
                  <div key={tx.hash || i} className="bg-white/5 border border-white/10 hover:border-red-500/50 rounded-lg p-4">
                    <div className="md:hidden space-y-3">
                      <div className="flex justify-between items-start">
                        <div><span className={`text-sm font-bold ${getActionColor(tx.action)}`}>{getStatusIcon(tx.status)} {tx.action}</span><p className="text-xs text-gray-500 mt-1">{formatTimeAgo(tx.timestamp)}</p></div>
                        {tx.amount && <p className="text-sm font-bold text-white">{tx.amount} CSPR</p>}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-mono text-xs text-gray-400">{tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}</p>
                        <a href={`https://testnet.cspr.live/deploy/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                      </div>
                    </div>
                    <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-3"><p className="font-mono text-sm text-gray-300">{getStatusIcon(tx.status)} {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}</p></div>
                      <div className="col-span-2"><p className="text-sm text-gray-400">{tx.blockHeight?.toLocaleString() || '-'}</p></div>
                      <div className="col-span-2"><p className="text-sm text-gray-400">{formatTimeAgo(tx.timestamp)}</p></div>
                      <div className="col-span-2"><span className={`text-sm font-bold ${getActionColor(tx.action)}`}>{tx.action}</span>{tx.isStakingTx && <span className="ml-2 text-xs bg-red-600/30 text-red-400 px-2 py-0.5 rounded">CasperStake</span>}</div>
                      <div className="col-span-2 text-right">{tx.amount ? <p className="text-sm font-bold text-white">{tx.amount} <span className="text-gray-500">CSPR</span></p> : <p className="text-sm text-gray-500">-</p>}{tx.cost && <p className="text-xs text-gray-500">Fee: {tx.cost}</p>}</div>
                      <div className="col-span-1 text-right"><a href={`https://testnet.cspr.live/deploy/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full" title="View on CSPR.live"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredTransactions.length === 0 && !error && <div className="text-center py-16 bg-white/5 rounded-lg"><div className="text-4xl mb-4">📭</div><p className="text-gray-400">{filter === 'staking' ? 'No staking transactions' : 'No transactions found'}</p></div>}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="px-4 py-2 bg-white/10 text-white font-bold disabled:opacity-50 hover:bg-white/20">← Prev</button>
                <span className="px-4 py-2 text-gray-400">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="px-4 py-2 bg-white/10 text-white font-bold disabled:opacity-50 hover:bg-white/20">Next →</button>
              </div>
            )}

            <div className="text-center mt-8 pt-8 border-t border-white/10">
              <a href={`https://testnet.cspr.live/account/${walletAddress}`} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 font-bold inline-flex items-center gap-2">View full account on CSPR.live <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="text-lg font-black">casper<span className="text-red-500">stake</span></span>
          <p className="text-gray-500 text-xs">Casper Hackathon 2026 • Real on-chain data</p>
        </div>
      </footer>
    </main>
  );
}
