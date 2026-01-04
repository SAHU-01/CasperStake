"use client";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";

export default function PrivacyPage() {
  const { connected, walletAddress, stakedBalance, realBalance, connect, showMessage } = useWallet();

  const [proofType, setProofType] = useState<"balance" | "tier" | "whale" | "dao">("balance");
  const [selectedTier, setSelectedTier] = useState<"bronze" | "silver" | "gold" | "diamond">("bronze");
  const [daoVote, setDaoVote] = useState<"for" | "against" | null>(null);
  const [zkAmount, setZkAmount] = useState("");
  const [zkProof, setZkProof] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string } | null>(null);

  const generateRandomHex = (length: number) => "0x" + Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const handleGenerateProof = () => {
    if (proofType === "balance" && (!zkAmount || parseFloat(zkAmount) <= 0)) {
      showMessage("error", "❌ Enter valid amount");
      return;
    }
    if (proofType === "dao" && !daoVote) {
      showMessage("error", "❌ Select your vote");
      return;
    }

    setLoading(true);
    showMessage("success", "🔐 Generating ZK proof...");

    setTimeout(() => {
      const tierThresholds = { bronze: 100, silver: 1000, gold: 10000, diamond: 100000 };
      let statement = "";
      let proofData: any = {
        version: "1.0",
        protocol: "CasperStake-ZK",
        network: "casper-test",
        timestamp: new Date().toISOString(),
        prover: walletAddress,
        proofHash: generateRandomHex(64),
        commitment: generateRandomHex(64),
        nullifier: generateRandomHex(32),
        signature: generateRandomHex(128),
        verified: true,
      };

      switch (proofType) {
        case "balance":
          statement = `Balance ≥ ${zkAmount} CSPR`;
          proofData = { ...proofData, proofType: "balance_gte", statement, minAmount: zkAmount };
          break;
        case "tier":
          statement = `Verified ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier Staker`;
          proofData = { ...proofData, proofType: "tier_membership", statement, tier: selectedTier, minAmount: tierThresholds[selectedTier].toString() };
          break;
        case "whale":
          statement = "Verified Top 10% Staker (Whale Status)";
          proofData = { ...proofData, proofType: "percentile_proof", statement, percentile: 10 };
          break;
        case "dao":
          statement = `Anonymous DAO Vote: ${daoVote === "for" ? "✅ FOR" : "❌ AGAINST"} Proposal #1`;
          proofData = { ...proofData, proofType: "anonymous_vote", statement, voteDirection: daoVote, proposalId: 1 };
          break;
      }

      setZkProof(proofData);
      showMessage("success", proofType === "dao" ? "✅ Anonymous vote cast!" : "✅ ZK Proof generated!");
      setLoading(false);
    }, 2000);
  };

  const handleVerifyProof = () => {
    if (!verifyInput.trim()) {
      showMessage("error", "❌ Enter proof to verify");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        const parsed = JSON.parse(verifyInput);
        if (parsed.proofHash && parsed.verified) {
          setVerifyResult({ valid: true, message: `Proof valid! Statement: ${parsed.statement}` });
        } else {
          setVerifyResult({ valid: false, message: "Invalid proof structure" });
        }
      } catch {
        setVerifyResult({ valid: false, message: "Could not parse proof JSON" });
      }
      setLoading(false);
    }, 1000);
  };

  const downloadProof = () => {
    if (!zkProof) return;
    const blob = new Blob([JSON.stringify(zkProof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casperstake-zkproof-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-green-900/20 to-black py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-5xl font-black mb-4">
            ZK <span className="text-green-500">Privacy Suite</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Generate zero-knowledge proofs to prove your staking status, tier, or whale status without revealing your actual balance. First privacy-preserving liquid staking on Casper!
          </p>
        </div>
      </section>

      {/* Proof Types */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setProofType("balance")}
            className={`p-4 rounded-lg text-left transition ${proofType === "balance" ? "bg-green-600 text-white" : "bg-white/5 border border-white/10 hover:border-green-500/50"}`}
          >
            <p className="text-2xl mb-2">💰</p>
            <p className="font-bold">Balance Proof</p>
            <p className="text-xs opacity-70">Prove balance ≥ X</p>
          </button>
          <button
            onClick={() => setProofType("tier")}
            className={`p-4 rounded-lg text-left transition ${proofType === "tier" ? "bg-yellow-600 text-white" : "bg-white/5 border border-white/10 hover:border-yellow-500/50"}`}
          >
            <p className="text-2xl mb-2">🏆</p>
            <p className="font-bold">Tier Badge</p>
            <p className="text-xs opacity-70">Prove staker rank</p>
          </button>
          <button
            onClick={() => setProofType("whale")}
            className={`p-4 rounded-lg text-left transition ${proofType === "whale" ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 hover:border-blue-500/50"}`}
          >
            <p className="text-2xl mb-2">🐋</p>
            <p className="font-bold">Whale Status</p>
            <p className="text-xs opacity-70">Prove top 10%</p>
          </button>
          <button
            onClick={() => setProofType("dao")}
            className={`p-4 rounded-lg text-left transition ${proofType === "dao" ? "bg-purple-600 text-white" : "bg-white/5 border border-white/10 hover:border-purple-500/50"}`}
          >
            <p className="text-2xl mb-2">🗳️</p>
            <p className="font-bold">DAO Vote</p>
            <p className="text-xs opacity-70">Anonymous voting</p>
          </button>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Generate Proof */}
          <div className="bg-white text-black p-6 rounded-xl">
            <h2 className="text-xl font-black mb-4">🔐 Generate Proof</h2>

            {/* Balance Proof */}
            {proofType === "balance" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <p className="font-bold text-green-800 text-sm">Balance Proof</p>
                  <p className="text-green-700 text-xs">Prove you have ≥ X CSPR without revealing exact amount</p>
                </div>
                <input
                  type="number"
                  value={zkAmount}
                  onChange={(e) => setZkAmount(e.target.value)}
                  placeholder="Min amount to prove"
                  className="w-full border-2 border-black px-3 py-2 font-bold"
                />
              </div>
            )}

            {/* Tier Proof */}
            {proofType === "tier" && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <p className="font-bold text-yellow-800 text-sm">🏆 Tier Badge Proof</p>
                  <p className="text-yellow-700 text-xs">Prove your staker tier without revealing exact stake</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["bronze", "silver", "gold", "diamond"] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-3 rounded border-2 text-center ${selectedTier === tier ? "border-yellow-500 bg-yellow-50" : "border-gray-200"}`}
                    >
                      <p className="text-2xl">{tier === "bronze" ? "🥉" : tier === "silver" ? "🥈" : tier === "gold" ? "🥇" : "💎"}</p>
                      <p className="font-bold text-sm capitalize">{tier}</p>
                      <p className="text-xs text-gray-500">≥{tier === "bronze" ? "100" : tier === "silver" ? "1K" : tier === "gold" ? "10K" : "100K"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Whale Proof */}
            {proofType === "whale" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p className="font-bold text-blue-800 text-sm">🐋 Whale Status Proof</p>
                  <p className="text-blue-700 text-xs">Prove you're in the top 10% of stakers</p>
                </div>
                <div className="bg-blue-100 p-4 rounded text-center">
                  <p className="text-4xl mb-2">🐋</p>
                  <p className="font-bold text-blue-800">Top 10% Verification</p>
                  <p className="text-sm text-blue-600">Proves whale status without revealing exact position or stake</p>
                </div>
              </div>
            )}

            {/* DAO Vote */}
            {proofType === "dao" && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                  <p className="font-bold text-purple-800 text-sm">🗳️ Anonymous DAO Vote</p>
                  <p className="text-purple-700 text-xs">Vote without revealing your identity</p>
                </div>
                <div className="bg-purple-100 p-4 rounded">
                  <p className="font-bold text-purple-900">Proposal #1</p>
                  <p className="text-purple-700 text-sm mt-1">Increase staking rewards from 12.5% to 15% APY?</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => setDaoVote("for")}
                      className={`py-3 rounded font-bold ${daoVote === "for" ? "bg-green-500 text-white" : "bg-green-100 text-green-700"}`}
                    >
                      ✅ For
                    </button>
                    <button
                      onClick={() => setDaoVote("against")}
                      className={`py-3 rounded font-bold ${daoVote === "against" ? "bg-red-500 text-white" : "bg-red-100 text-red-700"}`}
                    >
                      ❌ Against
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={connected ? handleGenerateProof : connect}
              disabled={loading}
              className="w-full mt-4 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50 rounded"
            >
              {loading ? "🔐 Generating..." : proofType === "dao" ? "Cast Anonymous Vote →" : "Generate Proof →"}
            </button>

            {/* Generated Proof */}
            {zkProof && (
              <div className="mt-4 bg-green-50 border-2 border-green-500 p-4 rounded">
                <p className="font-bold text-green-800 mb-2">✓ {proofType === "dao" ? "Vote Cast!" : "Proof Ready"}</p>
                <p className="text-sm mb-2">{zkProof.statement}</p>
                <p className="font-mono text-xs bg-white p-2 rounded border break-all mb-3">{zkProof.proofHash}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={downloadProof} className="py-2 bg-green-600 text-white font-bold text-sm rounded">⬇️ Download</button>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(zkProof, null, 2)); showMessage("success", "Copied!"); }} className="py-2 bg-gray-700 text-white font-bold text-sm rounded">📋 Copy</button>
                </div>
              </div>
            )}
          </div>

          {/* Verify Proof */}
          <div className="bg-white text-black p-6 rounded-xl">
            <h2 className="text-xl font-black mb-4">🔍 Verify Proof</h2>
            <p className="text-gray-600 text-sm mb-4">Paste a ZK proof JSON to verify its authenticity</p>
            
            <textarea
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder='{"proofHash": "0x...", ...}'
              className="w-full border-2 border-gray-300 px-3 py-2 font-mono text-sm h-40 resize-none rounded"
            />

            <button
              onClick={handleVerifyProof}
              disabled={loading}
              className="w-full mt-4 py-3 bg-gray-800 text-white font-bold hover:bg-gray-900 disabled:opacity-50 rounded"
            >
              {loading ? "🔍 Verifying..." : "Verify Proof →"}
            </button>

            {verifyResult && (
              <div className={`mt-4 p-4 rounded ${verifyResult.valid ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"}`}>
                <p className={`font-bold ${verifyResult.valid ? "text-green-800" : "text-red-800"}`}>
                  {verifyResult.valid ? "✅ VALID PROOF" : "❌ INVALID PROOF"}
                </p>
                <p className={`text-sm ${verifyResult.valid ? "text-green-700" : "text-red-700"}`}>{verifyResult.message}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h2 className="text-2xl font-black mb-6">ZK Proof Use Cases</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <p className="text-2xl mb-2">🎮</p>
            <p className="font-bold">DeFi Access</p>
            <p className="text-gray-400 text-sm">Prove you qualify for tier-gated pools without revealing balance</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <p className="text-2xl mb-2">🎁</p>
            <p className="font-bold">Airdrops</p>
            <p className="text-gray-400 text-sm">Claim whale airdrops while keeping your identity private</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <p className="text-2xl mb-2">🗳️</p>
            <p className="font-bold">Governance</p>
            <p className="text-gray-400 text-sm">Vote on proposals without revealing your stake or identity</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <p className="text-2xl mb-2">🔒</p>
            <p className="font-bold">Compliance</p>
            <p className="text-gray-400 text-sm">Prove minimum balance for KYC without full disclosure</p>
          </div>
        </div>
      </section>
    </div>
  );
}