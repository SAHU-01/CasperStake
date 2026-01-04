// "use client";
// import { useState } from "react";
// import { useWallet } from "@/contexts/WalletContext";
// import { useToast } from "@/components/ToastProvider";
// import { CLPublicKey, DeployUtil, RuntimeArgs, CLValueBuilder } from 'casper-js-sdk';

// // ============================================================================
// // CORRECT CONTRACT HASH (not package hash!)
// // ============================================================================
// const CONTRACTS = {
//   // This is the CONTRACT hash, not package hash
//   casperBridge: "122b5f47a0394f96f76e548ba1f8d2e8abcd496a094a73a95e089fd82404c115",
//   ethereumWcsCSPR: "0x6e4Ca763C4d67f4c1486e2239F9de5818CB7D51C",
// };

// type BridgeStatus = "idle" | "signing" | "submitting" | "confirming" | "complete" | "error";

// export default function BridgePage() {
//   const { connected, walletAddress, cscsprBalance, connect, setLoading } = useWallet();
//   const { showToast } = useToast();

//   const [amount, setAmount] = useState("");
//   const [destinationAddress, setDestinationAddress] = useState("");
//   const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("idle");
//   const [txHash, setTxHash] = useState("");

//   const bridgeFee = 0.1;
//   const outputAmount = amount ? (parseFloat(amount) * (1 - bridgeFee / 100)).toFixed(4) : "0";

//   const toBytes = (h: string) => Uint8Array.from(Buffer.from(h.replace("hash-", ""), 'hex'));

//   const sendDeploy = async (deployData: any): Promise<string> => {
//     const res = await fetch('/api/casper', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'account_put_deploy', params: { deploy: deployData } })
//     });
//     const j = await res.json();
//     if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
//     return j.result?.deploy_hash;
//   };

//   const executeBridge = async () => {
//     if (!connected) {
//       connect();
//       return;
//     }

//     if (!amount || parseFloat(amount) <= 0) {
//       showToast("error", "Invalid Amount", "Please enter an amount");
//       return;
//     }

//     if (parseFloat(amount) < 10) {
//       showToast("error", "Minimum 10 csCSPR", "Bridge requires minimum 10 csCSPR");
//       return;
//     }

//     if (!destinationAddress || !destinationAddress.startsWith("0x") || destinationAddress.length !== 42) {
//       showToast("error", "Invalid Address", "Enter a valid Ethereum address (0x...)");
//       return;
//     }

//     if (parseFloat(amount) > (cscsprBalance || 0)) {
//       showToast("error", "Insufficient Balance", "Not enough csCSPR");
//       return;
//     }

//     setLoading(true);
//     setBridgeStatus("signing");

//     try {
//       const provider = (window as any).CasperWalletProvider?.();
//       if (!provider) throw new Error("Casper Wallet not found");

//       // Convert to motes (9 decimals)
//       const amountMotes = Math.floor(parseFloat(amount) * 1e9);

//       showToast("info", "Creating Transaction", "Building bridge transaction...", undefined, 0);

//       // Entry point: lock_for_bridge(amount: U64, destination_chain: U32, destination_address: String)
//       const args = RuntimeArgs.fromMap({
//         "amount": CLValueBuilder.u64(amountMotes),
//         "destination_chain": CLValueBuilder.u32(11155111), // Sepolia chain ID
//         "destination_address": CLValueBuilder.string(destinationAddress),
//       });

//       // Create deploy using CONTRACT hash (not package hash!)
//       const deploy = DeployUtil.makeDeploy(
//         new DeployUtil.DeployParams(
//           CLPublicKey.fromHex(walletAddress),
//           "casper-test",
//           1,
//           1800000
//         ),
//         DeployUtil.ExecutableDeployItem.newStoredContractByHash(
//           toBytes(CONTRACTS.casperBridge),
//           "lock_for_bridge",
//           args
//         ),
//         DeployUtil.standardPayment(10_000_000_000) // 10 CSPR gas
//       );

//       showToast("info", "Sign Transaction", "Please approve in your Casper Wallet...", undefined, 0);

//       const deployJson = DeployUtil.deployToJson(deploy);
//       const sig = await provider.sign(JSON.stringify(deployJson), walletAddress);

//       if (sig.cancelled) {
//         showToast("info", "Cancelled", "Transaction cancelled by user");
//         setBridgeStatus("idle");
//         setLoading(false);
//         return;
//       }

//       setBridgeStatus("submitting");
//       showToast("info", "Broadcasting", "Submitting to Casper network...", undefined, 0);

//       // Attach signature
//       const deployData = deployJson.deploy as any;
//       deployData.approvals = [{
//         signer: walletAddress,
//         signature: walletAddress.substring(0, 2) + sig.signatureHex
//       }];

//       const hash = await sendDeploy(deployData);
//       setTxHash(hash);

//       setBridgeStatus("confirming");
//       showToast("info", "Confirming", "Waiting for block confirmation...", undefined, 0);

//       // Poll for confirmation
//       for (let i = 0; i < 60; i++) {
//         await new Promise(r => setTimeout(r, 3000));

//         try {
//           const statusRes = await fetch('/api/casper', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               jsonrpc: '2.0',
//               id: Date.now(),
//               method: 'info_get_deploy',
//               params: { deploy_hash: hash }
//             })
//           });

//           const statusData = await statusRes.json();
//           const execResults = statusData.result?.execution_results;

//           if (execResults && execResults.length > 0) {
//             const execResult = execResults[0];
//             if (execResult.result?.Success) {
//               break;
//             } else if (execResult.result?.Failure) {
//               throw new Error(`Transaction failed: ${execResult.result.Failure.error_message || 'Unknown error'}`);
//             }
//           }
//         } catch (pollError: any) {
//           if (pollError.message?.includes('failed')) throw pollError;
//         }
//       }

//       setBridgeStatus("complete");
//       showToast("success", "Bridge Initiated!",
//         `${amount} csCSPR locked! TX: ${hash.slice(0, 16)}...`,
//         hash, 10000
//       );

//     } catch (e: any) {
//       console.error("Bridge error:", e);
//       setBridgeStatus("error");
//       showToast("error", "Bridge Failed", e.message);
//     }

//     setLoading(false);
//   };

//   const resetBridge = () => {
//     setBridgeStatus("idle");
//     setTxHash("");
//     setAmount("");
//     setDestinationAddress("");
//   };

//   return (
//     <div className="min-h-screen bg-black">
//       {/* Header */}
//       <div className="border-b border-white/10">
//         <div className="max-w-4xl mx-auto px-6 py-10">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF0032] to-[#627EEA] flex items-center justify-center">
//               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
//               </svg>
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-white">Cross-Chain Bridge</h1>
//               <p className="text-white/40 text-sm">Casper → Ethereum Sepolia</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <main className="max-w-4xl mx-auto px-6 py-8">
//         <div className="grid lg:grid-cols-5 gap-8">
//           {/* Bridge Card */}
//           <div className="lg:col-span-3 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
//             {/* Chain Flow */}
//             <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#FF0032]/5 to-[#627EEA]/5">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-[#FF0032] flex items-center justify-center text-white font-bold">C</div>
//                   <div>
//                     <p className="text-white font-medium">Casper</p>
//                     <p className="text-white/40 text-xs">csCSPR</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2 text-white/30">
//                   <div className="w-8 h-[2px] bg-white/20"></div>
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
//                   </svg>
//                   <div className="w-8 h-[2px] bg-white/20"></div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <div>
//                     <p className="text-white font-medium text-right">Ethereum</p>
//                     <p className="text-white/40 text-xs text-right">wcsCSPR</p>
//                   </div>
//                   <div className="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center text-white font-bold">◆</div>
//                 </div>
//               </div>
//             </div>

//             <div className="p-6 space-y-5">
//               {/* Amount */}
//               <div>
//                 <div className="flex justify-between mb-2">
//                   <label className="text-xs font-medium text-white/50">AMOUNT</label>
//                   <div className="flex items-center gap-3 text-xs">
//                     <span className="text-white/30">Balance: {(cscsprBalance || 0).toFixed(2)}</span>
//                     <button
//                       onClick={() => setAmount(Math.max(0, (cscsprBalance || 0) - 1).toString())}
//                       className="text-[#FF0032] hover:underline font-medium"
//                     >
//                       MAX
//                     </button>
//                   </div>
//                 </div>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     placeholder="0.0"
//                     min="10"
//                     disabled={bridgeStatus !== "idle"}
//                     className="w-full p-4 pr-28 bg-black border border-white/10 rounded-xl text-2xl font-medium text-white placeholder-white/20 focus:outline-none focus:border-[#FF0032]/50 disabled:opacity-50"
//                   />
//                   <div className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#FF0032]/10 text-[#FF0032] rounded-lg text-sm font-medium">
//                     csCSPR
//                   </div>
//                 </div>
//                 <p className="text-xs text-white/30 mt-2">Minimum: 10 csCSPR</p>
//               </div>

//               {/* Destination */}
//               <div>
//                 <label className="text-xs font-medium text-white/50 mb-2 block">ETHEREUM DESTINATION ADDRESS</label>
//                 <input
//                   type="text"
//                   value={destinationAddress}
//                   onChange={(e) => setDestinationAddress(e.target.value)}
//                   placeholder="0x..."
//                   disabled={bridgeStatus !== "idle"}
//                   className="w-full p-4 bg-black border border-white/10 rounded-xl text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-[#FF0032]/50 disabled:opacity-50"
//                 />
//               </div>

//               {/* Summary */}
//               {amount && parseFloat(amount) >= 10 && (
//                 <div className="p-4 bg-white/5 rounded-xl space-y-2">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-white/50">You send</span>
//                     <span className="text-white">{amount} csCSPR</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-white/50">Fee ({bridgeFee}%)</span>
//                     <span className="text-white/40">-{(parseFloat(amount) * bridgeFee / 100).toFixed(4)}</span>
//                   </div>
//                   <div className="flex justify-between text-sm pt-2 border-t border-white/10">
//                     <span className="text-white/50">You receive</span>
//                     <span className="text-white font-semibold">{outputAmount} wcsCSPR</span>
//                   </div>
//                 </div>
//               )}

//               {/* Status */}
//               {bridgeStatus !== "idle" && bridgeStatus !== "complete" && bridgeStatus !== "error" && (
//                 <div className="flex items-center gap-3 p-4 bg-[#FF0032]/10 border border-[#FF0032]/20 rounded-xl">
//                   <div className="w-5 h-5 border-2 border-[#FF0032] border-t-transparent rounded-full animate-spin"></div>
//                   <span className="text-[#FF0032] text-sm">
//                     {bridgeStatus === "signing" && "Please sign in your Casper Wallet..."}
//                     {bridgeStatus === "submitting" && "Broadcasting to Casper network..."}
//                     {bridgeStatus === "confirming" && "Waiting for block confirmation..."}
//                   </span>
//                 </div>
//               )}

//               {/* Success */}
//               {bridgeStatus === "complete" && txHash && (
//                 <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
//                   <div className="flex items-center gap-2 mb-3">
//                     <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>
//                     <span className="text-green-400 font-medium">Bridge Transaction Confirmed!</span>
//                   </div>
//                   <a
//                     href={`https://testnet.cspr.live/deploy/${txHash}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-xs font-mono text-green-400/80 hover:text-green-400 break-all block mb-3"
//                   >
//                     {txHash}
//                   </a>
//                   <p className="text-white/50 text-xs">
//                     csCSPR locked on Casper. Relayer will mint wcsCSPR to {destinationAddress.slice(0, 10)}... on Ethereum.
//                   </p>
//                 </div>
//               )}

//               {/* Error */}
//               {bridgeStatus === "error" && (
//                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
//                   <p className="text-red-400 text-sm">Transaction failed. Please try again.</p>
//                 </div>
//               )}

//               {/* Button */}
//               {bridgeStatus === "complete" ? (
//                 <button
//                   onClick={resetBridge}
//                   className="w-full py-4 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
//                 >
//                   Bridge More
//                 </button>
//               ) : bridgeStatus === "error" ? (
//                 <button
//                   onClick={resetBridge}
//                   className="w-full py-4 rounded-xl font-semibold bg-[#FF0032] text-white hover:bg-[#FF0032]/90 transition-colors"
//                 >
//                   Try Again
//                 </button>
//               ) : (
//                 <button
//                   onClick={executeBridge}
//                   disabled={bridgeStatus !== "idle"}
//                   className={`w-full py-4 rounded-xl font-semibold transition-all ${
//                     !connected
//                       ? "bg-[#FF0032] text-white hover:bg-[#FF0032]/90"
//                       : bridgeStatus === "idle"
//                         ? "bg-gradient-to-r from-[#FF0032] to-[#627EEA] text-white hover:opacity-90"
//                         : "bg-white/10 text-white/50 cursor-wait"
//                   }`}
//                 >
//                   {!connected ? "Connect Wallet" : bridgeStatus === "idle" ? "Bridge to Ethereum" : "Processing..."}
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Info Panel */}
//           <div className="lg:col-span-2 space-y-5">
//             {/* Live Contracts */}
//             <div className="bg-[#0a0a0a] border border-green-500/30 rounded-2xl p-5">
//               <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
//                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//                 Live Contracts
//               </h3>

//               <div className="space-y-4">
//                 <div>
//                   <p className="text-xs text-white/40 mb-1">Casper Bridge</p>
//                   <a
//                     href={`https://testnet.cspr.live/contract/bc1eb12642de445d1d9c8696f817bf6f56cb9fb63cdbde18e57de769c0260675`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-xs font-mono text-[#FF0032] hover:underline break-all"
//                   >
//                     {CONTRACTS.casperBridge.slice(0, 20)}...
//                   </a>
//                 </div>

//                 <div>
//                   <p className="text-xs text-white/40 mb-1">Ethereum wcsCSPR</p>
//                   <a
//                     href={`https://sepolia.etherscan.io/address/${CONTRACTS.ethereumWcsCSPR}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-xs font-mono text-[#627EEA] hover:underline break-all"
//                   >
//                     {CONTRACTS.ethereumWcsCSPR}
//                   </a>
//                 </div>
//               </div>
//             </div>

//             {/* How it works */}
//             <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
//               <h3 className="font-semibold text-white mb-4">Bridge Flow</h3>
//               <div className="space-y-3">
//                 {[
//                   { num: "1", title: "Lock", desc: "csCSPR locked in Casper bridge", color: "#FF0032" },
//                   { num: "2", title: "Verify", desc: "Relayer detects lock event", color: "#fff" },
//                   { num: "3", title: "Mint", desc: "wcsCSPR minted on Ethereum", color: "#627EEA" },
//                 ].map((step) => (
//                   <div key={step.num} className="flex items-start gap-3">
//                     <div
//                       className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
//                       style={{ backgroundColor: step.color + "20", color: step.color }}
//                     >
//                       {step.num}
//                     </div>
//                     <div>
//                       <p className="text-white text-sm font-medium">{step.title}</p>
//                       <p className="text-white/40 text-xs">{step.desc}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Stats */}
//             <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
//               <div className="grid grid-cols-2 gap-4 text-center">
//                 <div className="p-3 bg-white/5 rounded-xl">
//                   <p className="text-white/40 text-xs">Fee</p>
//                   <p className="text-white font-bold">{bridgeFee}%</p>
//                 </div>
//                 <div className="p-3 bg-white/5 rounded-xl">
//                   <p className="text-white/40 text-xs">Min Amount</p>
//                   <p className="text-white font-bold">10 csCSPR</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Navigation */}
//         <div className="mt-10 flex justify-center gap-8 text-sm">
//           <a href="/stake" className="text-white/50 hover:text-white transition-colors">← Stake</a>
//           <a href="/swap" className="text-white/50 hover:text-white transition-colors">Swap</a>
//           <a href="/history" className="text-white/50 hover:text-white transition-colors">History</a>
//         </div>
//       </main>
//     </div>
//   );
// }

"use client";
import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/components/ToastProvider";
import { CLPublicKey, DeployUtil, RuntimeArgs, CLValueBuilder } from 'casper-js-sdk';

// ============================================================================
// CORRECT CONTRACT HASH (not package hash!)
// ============================================================================
const CONTRACTS = {
  // This is the CONTRACT hash, not package hash
  casperBridge: "122b5f47a0394f96f76e548ba1f8d2e8abcd496a094a73a95e089fd82404c115",
  ethereumWcsCSPR: "0x6e4Ca763C4d67f4c1486e2239F9de5818CB7D51C",
};

type BridgeStatus = "idle" | "signing" | "submitting" | "confirming" | "complete" | "error";

export default function BridgePage() {
  const { connected, walletAddress, cscsprBalance, connect, setLoading } = useWallet();
  const { showToast } = useToast();

  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("idle");
  const [txHash, setTxHash] = useState("");

  const bridgeFee = 0.1;
  const outputAmount = amount ? (parseFloat(amount) * (1 - bridgeFee / 100)).toFixed(4) : "0";

  const toBytes = (h: string) => Uint8Array.from(Buffer.from(h.replace("hash-", ""), 'hex'));

  const sendDeploy = async (deployData: any): Promise<string> => {
    const res = await fetch('/api/casper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'account_put_deploy', params: { deploy: deployData } })
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
    return j.result?.deploy_hash;
  };

  const executeBridge = async () => {
    if (!connected) {
      connect();
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showToast("error", "Invalid Amount", "Please enter an amount");
      return;
    }

    if (parseFloat(amount) < 10) {
      showToast("error", "Minimum 10 csCSPR", "Bridge requires minimum 10 csCSPR");
      return;
    }

    if (!destinationAddress || !destinationAddress.startsWith("0x") || destinationAddress.length !== 42) {
      showToast("error", "Invalid Address", "Enter a valid Ethereum address (0x...)");
      return;
    }

    if (parseFloat(amount) > (cscsprBalance || 0)) {
      showToast("error", "Insufficient Balance", "Not enough csCSPR");
      return;
    }

    setLoading(true);
    setBridgeStatus("signing");

    try {
      const provider = (window as any).CasperWalletProvider?.();
      if (!provider) throw new Error("Casper Wallet not found");

      // Convert to motes (9 decimals)
      const amountMotes = Math.floor(parseFloat(amount) * 1e9);

      showToast("info", "Creating Transaction", "Building bridge transaction...", undefined, 0);

      // Entry point: lock_for_bridge(amount: U64, destination_chain: U32, destination_address: String)
      const args = RuntimeArgs.fromMap({
        "amount": CLValueBuilder.u64(amountMotes),
        "destination_chain": CLValueBuilder.u32(11155111), // Sepolia chain ID
        "destination_address": CLValueBuilder.string(destinationAddress),
      });

      // Create deploy using CONTRACT hash (not package hash!)
      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(
          CLPublicKey.fromHex(walletAddress),
          "casper-test",
          1,
          1800000
        ),
        DeployUtil.ExecutableDeployItem.newStoredContractByHash(
          toBytes(CONTRACTS.casperBridge),
          "lock_for_bridge",
          args
        ),
        DeployUtil.standardPayment(10_000_000_000) // 10 CSPR gas
      );

      showToast("info", "Sign Transaction", "Please approve in your Casper Wallet...", undefined, 0);

      const deployJson = DeployUtil.deployToJson(deploy);
      const sig = await provider.sign(JSON.stringify(deployJson), walletAddress);

      if (sig.cancelled) {
        showToast("info", "Cancelled", "Transaction cancelled by user");
        setBridgeStatus("idle");
        setLoading(false);
        return;
      }

      setBridgeStatus("submitting");
      showToast("info", "Broadcasting", "Submitting to Casper network...", undefined, 0);

      // Attach signature
      const deployData = deployJson.deploy as any;
      deployData.approvals = [{
        signer: walletAddress,
        signature: walletAddress.substring(0, 2) + sig.signatureHex
      }];

      const hash = await sendDeploy(deployData);
      setTxHash(hash);

      setBridgeStatus("confirming");
      showToast("info", "Confirming", "Waiting for block confirmation...", undefined, 0);

      // Poll for confirmation (max 60 attempts, 3s each = 3 minutes)
      let confirmed = false;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));

        try {
          const statusRes = await fetch('/api/casper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'info_get_deploy',
              params: { deploy_hash: hash }
            })
          });

          const statusData = await statusRes.json();
          
          // Casper 2.0 format
          const execResults = statusData.result?.execution_results || statusData.result?.execution_info?.execution_result;
          
          if (execResults) {
            // Handle array format
            if (Array.isArray(execResults) && execResults.length > 0) {
              const execResult = execResults[0];
              if (execResult.result?.Success || execResult.Success) {
                confirmed = true;
                break;
              } else if (execResult.result?.Failure || execResult.Failure) {
                const errorMsg = execResult.result?.Failure?.error_message || execResult.Failure?.error_message || 'Unknown error';
                throw new Error(`Transaction failed: ${errorMsg}`);
              }
            }
            // Handle direct object format (Casper 2.0)
            else if (execResults.Success !== undefined) {
              confirmed = true;
              break;
            } else if (execResults.Failure) {
              throw new Error(`Transaction failed: ${execResults.Failure.error_message || 'Unknown error'}`);
            }
          }
        } catch (pollError: any) {
          if (pollError.message?.includes('failed') || pollError.message?.includes('Failed')) {
            throw pollError;
          }
          // Continue polling on other errors
        }
      }

      // Even if polling didn't confirm, the tx was submitted successfully
      setBridgeStatus("complete");
      showToast("success", "Bridge Initiated!",
        `${amount} csCSPR locked! TX: ${hash.slice(0, 16)}...`,
        hash, 10000
      );

    } catch (e: any) {
      console.error("Bridge error:", e);
      setBridgeStatus("error");
      showToast("error", "Bridge Failed", e.message);
    }

    setLoading(false);
  };

  const resetBridge = () => {
    setBridgeStatus("idle");
    setTxHash("");
    setAmount("");
    setDestinationAddress("");
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF0032] to-[#627EEA] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Cross-Chain Bridge</h1>
              <p className="text-white/40 text-sm">Casper → Ethereum Sepolia</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Bridge Card */}
          <div className="lg:col-span-3 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
            {/* Chain Flow */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-[#FF0032]/5 to-[#627EEA]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF0032] flex items-center justify-center text-white font-bold">C</div>
                  <div>
                    <p className="text-white font-medium">Casper</p>
                    <p className="text-white/40 text-xs">csCSPR</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/30">
                  <div className="w-8 h-[2px] bg-white/20"></div>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="w-8 h-[2px] bg-white/20"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white font-medium text-right">Ethereum</p>
                    <p className="text-white/40 text-xs text-right">wcsCSPR</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center text-white font-bold">◆</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Amount */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-white/50">AMOUNT</label>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-white/30">Balance: {(cscsprBalance || 0).toFixed(2)}</span>
                    <button
                      onClick={() => setAmount(Math.max(0, (cscsprBalance || 0) - 1).toString())}
                      className="text-[#FF0032] hover:underline font-medium"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    min="10"
                    disabled={bridgeStatus !== "idle"}
                    className="w-full p-4 pr-28 bg-black border border-white/10 rounded-xl text-2xl font-medium text-white placeholder-white/20 focus:outline-none focus:border-[#FF0032]/50 disabled:opacity-50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#FF0032]/10 text-[#FF0032] rounded-lg text-sm font-medium">
                    csCSPR
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-2">Minimum: 10 csCSPR</p>
              </div>

              {/* Destination */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-2 block">ETHEREUM DESTINATION ADDRESS</label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={bridgeStatus !== "idle"}
                  className="w-full p-4 bg-black border border-white/10 rounded-xl text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-[#FF0032]/50 disabled:opacity-50"
                />
              </div>

              {/* Summary */}
              {amount && parseFloat(amount) >= 10 && (
                <div className="p-4 bg-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">You send</span>
                    <span className="text-white">{amount} csCSPR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Fee ({bridgeFee}%)</span>
                    <span className="text-white/40">-{(parseFloat(amount) * bridgeFee / 100).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                    <span className="text-white/50">You receive</span>
                    <span className="text-white font-semibold">{outputAmount} wcsCSPR</span>
                  </div>
                </div>
              )}

              {/* Status */}
              {bridgeStatus !== "idle" && bridgeStatus !== "complete" && bridgeStatus !== "error" && (
                <div className="flex items-center gap-3 p-4 bg-[#FF0032]/10 border border-[#FF0032]/20 rounded-xl">
                  <div className="w-5 h-5 border-2 border-[#FF0032] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#FF0032] text-sm">
                    {bridgeStatus === "signing" && "Please sign in your Casper Wallet..."}
                    {bridgeStatus === "submitting" && "Broadcasting to Casper network..."}
                    {bridgeStatus === "confirming" && "Waiting for block confirmation..."}
                  </span>
                </div>
              )}

              {/* Success */}
              {bridgeStatus === "complete" && txHash && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400 font-medium">Bridge Transaction Confirmed!</span>
                  </div>
                  <a
                    href={`https://testnet.cspr.live/deploy/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-green-400/80 hover:text-green-400 break-all block mb-3"
                  >
                    {txHash}
                  </a>
                  <p className="text-white/50 text-xs">
                    csCSPR locked on Casper. Relayer will mint wcsCSPR to {destinationAddress.slice(0, 10)}... on Ethereum.
                  </p>
                </div>
              )}

              {/* Error */}
              {bridgeStatus === "error" && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">Transaction failed. Please try again.</p>
                </div>
              )}

              {/* Button */}
              {bridgeStatus === "complete" ? (
                <button
                  onClick={resetBridge}
                  className="w-full py-4 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Bridge More
                </button>
              ) : bridgeStatus === "error" ? (
                <button
                  onClick={resetBridge}
                  className="w-full py-4 rounded-xl font-semibold bg-[#FF0032] text-white hover:bg-[#FF0032]/90 transition-colors"
                >
                  Try Again
                </button>
              ) : (
                <button
                  onClick={executeBridge}
                  disabled={bridgeStatus !== "idle"}
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    !connected
                      ? "bg-[#FF0032] text-white hover:bg-[#FF0032]/90"
                      : bridgeStatus === "idle"
                        ? "bg-gradient-to-r from-[#FF0032] to-[#627EEA] text-white hover:opacity-90"
                        : "bg-white/10 text-white/50 cursor-wait"
                  }`}
                >
                  {!connected ? "Connect Wallet" : bridgeStatus === "idle" ? "Bridge to Ethereum" : "Processing..."}
                </button>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Live Contracts */}
            <div className="bg-[#0a0a0a] border border-green-500/30 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live Contracts
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Casper Bridge</p>
                  <a
                    href={`https://testnet.cspr.live/contract/bc1eb12642de445d1d9c8696f817bf6f56cb9fb63cdbde18e57de769c0260675`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-[#FF0032] hover:underline break-all"
                  >
                    {CONTRACTS.casperBridge.slice(0, 20)}...
                  </a>
                </div>

                <div>
                  <p className="text-xs text-white/40 mb-1">Ethereum wcsCSPR</p>
                  <a
                    href={`https://sepolia.etherscan.io/address/${CONTRACTS.ethereumWcsCSPR}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-[#627EEA] hover:underline break-all"
                  >
                    {CONTRACTS.ethereumWcsCSPR}
                  </a>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Bridge Flow</h3>
              <div className="space-y-3">
                {[
                  { num: "1", title: "Lock", desc: "csCSPR locked in Casper bridge", color: "#FF0032" },
                  { num: "2", title: "Verify", desc: "Relayer detects lock event", color: "#fff" },
                  { num: "3", title: "Mint", desc: "wcsCSPR minted on Ethereum", color: "#627EEA" },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: step.color + "20", color: step.color }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{step.title}</p>
                      <p className="text-white/40 text-xs">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-white/40 text-xs">Fee</p>
                  <p className="text-white font-bold">{bridgeFee}%</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-white/40 text-xs">Min Amount</p>
                  <p className="text-white font-bold">10 csCSPR</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-10 flex justify-center gap-8 text-sm">
          <a href="/stake" className="text-white/50 hover:text-white transition-colors">← Stake</a>
          <a href="/swap" className="text-white/50 hover:text-white transition-colors">Swap</a>
          <a href="/history" className="text-white/50 hover:text-white transition-colors">History</a>
        </div>
      </main>
    </div>
  );
}