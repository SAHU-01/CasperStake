"use client";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function SwapPage() {
  const { connected, realBalance, cscsprBalance, connect, showMessage, loading: walletLoading } = useWallet();

  const [swapFrom, setSwapFrom] = useState("CSPR");
  const [swapTo, setSwapTo] = useState("csCSPR");
  const [swapAmount, setSwapAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const tokens = [
    { symbol: "CSPR", name: "Casper", icon: "🔴", rate: 1 },
    { symbol: "csCSPR", name: "CasperStake LST", icon: "🟢", rate: 1.0523 },
    { symbol: "stCSPR", name: "StakeVue LST", icon: "🔵", rate: 1.0489 },
    { symbol: "lCSPR", name: "Casper Liquid LST", icon: "🟣", rate: 1.0501 },
  ];

  const getRate = (from: string, to: string) => {
    const fromToken = tokens.find(t => t.symbol === from);
    const toToken = tokens.find(t => t.symbol === to);
    if (!fromToken || !toToken) return 1;
    return toToken.rate / fromToken.rate;
  };

  const getBalance = (symbol: string) => {
    if (symbol === "CSPR") return realBalance || 0;
    if (symbol === "csCSPR") return cscsprBalance;
    return 0; // Other tokens not held
  };

  const handleSwap = async () => {
    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      showMessage("error", "❌ Enter valid amount");
      return;
    }
    
    setLoading(true);
    showMessage("success", `🔄 Swapping ${swapAmount} ${swapFrom} for ${(parseFloat(swapAmount) * getRate(swapFrom, swapTo)).toFixed(4)} ${swapTo}...`);
    
    // Simulate swap
    setTimeout(() => {
      showMessage("success", `✅ Swap completed! Received ${(parseFloat(swapAmount) * getRate(swapFrom, swapTo)).toFixed(4)} ${swapTo}`);
      setSwapAmount("");
      setLoading(false);
    }, 2000);
  };

  const switchTokens = () => {
    const temp = swapFrom;
    setSwapFrom(swapTo);
    setSwapTo(temp);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-blue-900/20 to-black py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            LST <span className="text-blue-500">Swap</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Swap between all liquid staking tokens instantly. Trade csCSPR, stCSPR, lCSPR with low fees and minimal slippage.
          </p>
        </div>
      </section>

      {/* Supported Tokens */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tokens.map((token) => (
            <div key={token.symbol} className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{token.icon}</span>
                <span className="font-bold">{token.symbol}</span>
              </div>
              <p className="text-gray-400 text-xs">{token.name}</p>
              <p className="text-sm mt-1">Rate: {token.rate.toFixed(4)} CSPR</p>
            </div>
          ))}
        </div>
      </section>

      {/* Swap Interface */}
      <section className="max-w-lg mx-auto px-4 md:px-8 py-8">
        <div className="bg-white text-black p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🔄</span>
            <h2 className="text-xl font-black">Swap Tokens</h2>
          </div>

          {/* From Token */}
          <div className="mb-2">
            <label className="text-sm font-bold text-gray-600 block mb-1">From</label>
            <div className="flex border-2 border-black rounded overflow-hidden">
              <select
                value={swapFrom}
                onChange={(e) => setSwapFrom(e.target.value)}
                className="bg-gray-100 px-4 py-3 font-bold border-r-2 border-black"
              >
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.icon} {token.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-4 py-3 text-xl font-bold focus:outline-none"
              />
            </div>
            {connected && (
              <p className="text-xs text-gray-500 mt-1">
                Balance: {getBalance(swapFrom).toFixed(4)} {swapFrom}
                <button
                  onClick={() => setSwapAmount(getBalance(swapFrom).toString())}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  MAX
                </button>
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-2">
            <button
              onClick={switchTokens}
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-600 block mb-1">To</label>
            <div className="flex border-2 border-black rounded overflow-hidden">
              <select
                value={swapTo}
                onChange={(e) => setSwapTo(e.target.value)}
                className="bg-gray-100 px-4 py-3 font-bold border-r-2 border-black"
              >
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.icon} {token.symbol}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={swapAmount ? (parseFloat(swapAmount) * getRate(swapFrom, swapTo)).toFixed(4) : ""}
                readOnly
                placeholder="0.0"
                className="flex-1 px-4 py-3 text-xl font-bold bg-gray-50"
              />
            </div>
            {connected && (
              <p className="text-xs text-gray-500 mt-1">
                Balance: {getBalance(swapTo).toFixed(4)} {swapTo}
              </p>
            )}
          </div>

          {/* Swap Details */}
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Exchange Rate:</span>
              <span className="font-bold">1 {swapFrom} = {getRate(swapFrom, swapTo).toFixed(4)} {swapTo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price Impact:</span>
              <span className="font-bold text-green-600">&lt;0.01%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Swap Fee:</span>
              <span className="font-bold">0.1%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Route:</span>
              <span className="font-bold">{swapFrom} → {swapTo}</span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={connected ? handleSwap : connect}
            disabled={loading || walletLoading || !swapAmount}
            className="w-full py-4 bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 disabled:opacity-50 rounded"
          >
            {loading ? "⏳ Swapping..." : connected ? `Swap ${swapFrom} → ${swapTo}` : "Connect Wallet"}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
          <h3 className="font-bold text-blue-400 mb-2">💡 Why use the LST DEX?</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Swap between ALL liquid staking tokens in one place</li>
            <li>• Lowest fees (0.1%) compared to general DEXs</li>
            <li>• Optimized routing for LST pairs</li>
            <li>• No need to unstake - instant liquidity</li>
          </ul>
        </div>
      </section>

      {/* Liquidity Pools */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h2 className="text-2xl font-black mb-6">Liquidity Pools</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span>🔴🟢</span>
              <span className="font-bold">CSPR / csCSPR</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">TVL</p>
                <p className="font-bold">$2.4M</p>
              </div>
              <div>
                <p className="text-gray-400">24h Volume</p>
                <p className="font-bold">$156K</p>
              </div>
              <div>
                <p className="text-gray-400">APR</p>
                <p className="font-bold text-green-400">8.2%</p>
              </div>
              <div>
                <p className="text-gray-400">Fee</p>
                <p className="font-bold">0.1%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span>🟢🔵</span>
              <span className="font-bold">csCSPR / stCSPR</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">TVL</p>
                <p className="font-bold">$890K</p>
              </div>
              <div>
                <p className="text-gray-400">24h Volume</p>
                <p className="font-bold">$42K</p>
              </div>
              <div>
                <p className="text-gray-400">APR</p>
                <p className="font-bold text-green-400">5.8%</p>
              </div>
              <div>
                <p className="text-gray-400">Fee</p>
                <p className="font-bold">0.05%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span>🟢🟣</span>
              <span className="font-bold">csCSPR / lCSPR</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">TVL</p>
                <p className="font-bold">$520K</p>
              </div>
              <div>
                <p className="text-gray-400">24h Volume</p>
                <p className="font-bold">$28K</p>
              </div>
              <div>
                <p className="text-gray-400">APR</p>
                <p className="font-bold text-green-400">6.1%</p>
              </div>
              <div>
                <p className="text-gray-400">Fee</p>
                <p className="font-bold">0.05%</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}