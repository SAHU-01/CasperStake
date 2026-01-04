"use client";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function BridgePage() {
  const { connected, cscsprBalance, connect, showMessage, loading: walletLoading } = useWallet();

  const [bridgeFromChain, setBridgeFromChain] = useState("casper");
  const [bridgeToChain, setBridgeToChain] = useState("ethereum");
  const [bridgeAmount, setBridgeAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const chains = [
    { id: "casper", name: "Casper Network", icon: "🔴", token: "csCSPR" },
    { id: "ethereum", name: "Ethereum", icon: "🔷", token: "wcsCSPR" },
    { id: "polygon", name: "Polygon", icon: "🟣", token: "wcsCSPR" },
    { id: "arbitrum", name: "Arbitrum", icon: "🔵", token: "wcsCSPR" },
    { id: "bsc", name: "BNB Chain", icon: "🟡", token: "wcsCSPR" },
  ];

  const getChain = (id: string) => chains.find(c => c.id === id);

  const handleBridge = async () => {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) {
      showMessage("error", "❌ Enter valid amount");
      return;
    }
    
    setLoading(true);
    showMessage("success", `🌉 Initiating bridge of ${bridgeAmount} csCSPR to ${getChain(bridgeToChain)?.name}...`);
    
    // Simulate bridge
    setTimeout(() => {
      showMessage("success", `✅ Bridge initiated! Your ${bridgeAmount} wcsCSPR will arrive on ${getChain(bridgeToChain)?.name} in ~15 minutes.`);
      setBridgeAmount("");
      setLoading(false);
    }, 3000);
  };

  const switchChains = () => {
    const temp = bridgeFromChain;
    setBridgeFromChain(bridgeToChain);
    setBridgeToChain(temp);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-purple-900/20 to-black py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            Cross-Chain <span className="text-purple-500">Bridge</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Bridge your csCSPR to Ethereum, Polygon, Arbitrum and more. Earn yield even while your assets are being bridged!
          </p>
        </div>
      </section>

      {/* Supported Chains */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {chains.map((chain) => (
            <div key={chain.id} className="bg-white/5 border border-white/10 p-4 rounded-lg text-center">
              <span className="text-3xl">{chain.icon}</span>
              <p className="font-bold mt-2">{chain.name}</p>
              <p className="text-gray-400 text-xs">{chain.token}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bridge Interface */}
      <section className="max-w-lg mx-auto px-4 md:px-8 py-8">
        <div className="bg-white text-black p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🌉</span>
            <h2 className="text-xl font-black">Bridge csCSPR</h2>
          </div>

          {/* From Chain */}
          <div className="mb-2">
            <label className="text-sm font-bold text-gray-600 block mb-1">From Chain</label>
            <select
              value={bridgeFromChain}
              onChange={(e) => setBridgeFromChain(e.target.value)}
              className="w-full border-2 border-black px-4 py-3 font-bold rounded"
            >
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.icon} {chain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center my-2">
            <button
              onClick={switchChains}
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Chain */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-600 block mb-1">To Chain</label>
            <select
              value={bridgeToChain}
              onChange={(e) => setBridgeToChain(e.target.value)}
              className="w-full border-2 border-black px-4 py-3 font-bold rounded"
            >
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.icon} {chain.name} ({chain.token})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-600 block mb-1">Amount</label>
            <div className="flex border-2 border-black rounded overflow-hidden">
              <input
                type="number"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-4 py-3 text-xl font-bold focus:outline-none"
              />
              <span className="bg-black text-white px-4 py-3 font-bold">csCSPR</span>
            </div>
            {connected && (
              <p className="text-xs text-gray-500 mt-1">
                Available: {cscsprBalance.toFixed(4)} csCSPR
                <button
                  onClick={() => setBridgeAmount(cscsprBalance.toString())}
                  className="ml-2 text-purple-500 hover:underline"
                >
                  MAX
                </button>
              </p>
            )}
          </div>

          {/* Yield While Bridging */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💰</span>
              <p className="font-bold text-green-800">Earn While You Bridge!</p>
            </div>
            <p className="text-green-700 text-sm">Your csCSPR continues earning 12.5% APY even while locked in the bridge.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white/50 p-2 rounded">
                <p className="text-gray-600 text-xs">Bridge Duration</p>
                <p className="font-bold">~15 minutes</p>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <p className="text-gray-600 text-xs">Est. Yield Earned</p>
                <p className="font-bold text-green-600">+{bridgeAmount ? (parseFloat(bridgeAmount) * 0.000005).toFixed(6) : "0"} CSPR</p>
              </div>
            </div>
          </div>

          {/* Bridge Details */}
          <div className="bg-gray-100 p-4 rounded mb-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">You send:</span>
              <span className="font-bold">{bridgeAmount || "0"} csCSPR on {getChain(bridgeFromChain)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You receive:</span>
              <span className="font-bold">{bridgeAmount || "0"} {getChain(bridgeToChain)?.token} on {getChain(bridgeToChain)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bridge Fee:</span>
              <span className="font-bold">0.1%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Time:</span>
              <span className="font-bold">~15 minutes</span>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded mb-4">
            <span>🛡️</span>
            <span>Secured by ThresholdModule multi-sig & ZK proofs</span>
          </div>

          {/* Bridge Button */}
          <button
            onClick={connected ? handleBridge : connect}
            disabled={loading || walletLoading || !bridgeAmount}
            className="w-full py-4 bg-purple-600 text-white font-bold text-lg hover:bg-purple-700 disabled:opacity-50 rounded"
          >
            {loading ? "⏳ Bridging..." : connected ? `Bridge to ${getChain(bridgeToChain)?.name}` : "Connect Wallet"}
          </button>
        </div>
      </section>

      {/* Bridge Stats */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h2 className="text-2xl font-black mb-6">Bridge Statistics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Total Bridged</p>
            <p className="text-2xl font-black text-purple-400">$3.2M</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">24h Volume</p>
            <p className="text-2xl font-black">$245K</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Avg. Bridge Time</p>
            <p className="text-2xl font-black text-green-400">12 min</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Success Rate</p>
            <p className="text-2xl font-black text-green-400">99.9%</p>
          </div>
        </div>

        {/* Recent Bridges */}
        <div className="mt-8">
          <h3 className="font-bold mb-4">Recent Bridges</h3>
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr className="text-gray-400 text-left">
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/5">
                  <td className="p-4">🔴 Casper</td>
                  <td className="p-4">🔷 Ethereum</td>
                  <td className="p-4 font-bold">1,250 csCSPR</td>
                  <td className="p-4"><span className="text-green-400">✅ Completed</span></td>
                  <td className="p-4 text-gray-400">2 min ago</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="p-4">🔷 Ethereum</td>
                  <td className="p-4">🔴 Casper</td>
                  <td className="p-4 font-bold">500 wcsCSPR</td>
                  <td className="p-4"><span className="text-yellow-400">⏳ Pending</span></td>
                  <td className="p-4 text-gray-400">5 min ago</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="p-4">🔴 Casper</td>
                  <td className="p-4">🟣 Polygon</td>
                  <td className="p-4 font-bold">3,000 csCSPR</td>
                  <td className="p-4"><span className="text-green-400">✅ Completed</span></td>
                  <td className="p-4 text-gray-400">15 min ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}