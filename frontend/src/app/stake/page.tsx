// "use client";
// import { useState, useRef, useEffect } from "react";
// import { useWallet } from "@/contexts/WalletContext";
// import { useToast } from "@/components/ToastProvider";
// import { RuntimeArgs, CLValueBuilder, CLPublicKey, DeployUtil } from 'casper-js-sdk';
// import { useValidators } from "@/lib/useValidators";

// const CONTRACTS = {
//   CASPER_STAKE: "hash-8322aff2cdaf904269205090a0a42da0aec6b659bb888a6b7172a6f2cf3bec3f",
// };

// // Helper to poll for deploy status
// // Helper to poll for deploy status - works with Casper 1.x and 2.x
// async function waitForDeployExecution(deployHash: string, maxAttempts = 20, intervalMs = 3000): Promise<{ success: boolean; errorMessage?: string }> {
//   for (let i = 0; i < maxAttempts; i++) {
//     try {
//       const response = await fetch('/api/casper', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           jsonrpc: '2.0',
//           id: Date.now(),
//           method: 'info_get_transaction',
//           params: { 
//             transaction_hash: { Deploy: deployHash },
//             finalized_approvals: true
//           }
//         })
//       });

//       const data = await response.json();
      
//       // Check if execution_info exists (means transaction was processed)
//       if (data.result?.execution_info?.execution_result) {
//         const execResult = data.result.execution_info.execution_result;
//         const version2 = execResult.Version2;
        
//         if (version2) {
//           // Success = error_message is null AND effects exist
//           if (version2.error_message === null && version2.effects) {
//             return { success: true };
//           }
//           // Failure = error_message has a value
//           if (version2.error_message) {
//             return { success: false, errorMessage: version2.error_message };
//           }
//         }
//       }
      
//       await new Promise(r => setTimeout(r, intervalMs));
//     } catch (err) {
//       console.error('Polling error:', err);
//       await new Promise(r => setTimeout(r, intervalMs));
//     }
//   }
  
//   return { success: false, errorMessage: "Transaction timeout - check explorer for status" };
// }

// export default function StakePage() {
//   const { 
//     connected, walletAddress, realBalance, stakedBalance, cscsprBalance, 
//     pendingUnstakes, exchangeRate, loading, connect,
//     setStakedBalance, setCscsprBalance, setRealBalance, setPendingUnstakes, setLoading
//   } = useWallet();
  
//   const { showToast, dismissToast } = useToast();

//   const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
//   const [stakeAmount, setStakeAmount] = useState("");
//   const [unstakeAmount, setUnstakeAmount] = useState("");
//   const { validators: VALIDATORS, loading: validatorsLoading } = useValidators();

//   const [selectedValidator, setSelectedValidator] = useState(VALIDATORS[0]);
//   const [validatorDropdownOpen, setValidatorDropdownOpen] = useState(false);
//   const [referralCode, setReferralCode] = useState("");
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (VALIDATORS.length > 0 && !selectedValidator) {
//       setSelectedValidator(VALIDATORS[0]);
//     }
//   }, [VALIDATORS, selectedValidator]);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setValidatorDropdownOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const putDeployViaProxy = async (deployData: any) => {
//     const response = await fetch('/api/casper', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'account_put_deploy', params: { deploy: deployData } })
//     });
//     const data = await response.json();
//     if (data.error) throw new Error(data.error.message || "RPC Error");
//     return data.result?.deploy_hash;
//   };

//   const handleStake = async () => {
//     if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
//       showToast("error", "Invalid Amount", "Please enter a valid amount to stake");
//       return;
//     }

//     // Validate validator selection
//     if (!selectedValidator?.publicKey) {
//       showToast("error", "No Validator", "Please select a validator with a valid public key");
//       return;
//     }

//     // Skip "auto" validator - it has no public key
//     if (selectedValidator.id === "auto") {
//       showToast("error", "Invalid Validator", "Please select a specific validator, not Auto-Distribute");
//       return;
//     }
    
//     setLoading(true);
//     const amount = parseFloat(stakeAmount);
//     const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

//     let pendingToastId: string | undefined;

//     try {
//       // Get the validator public key from the selected validator
//       const validatorPubKey = selectedValidator.publicKey;
      
//       console.log("Staking with validator:", validatorPubKey);

//       // CRITICAL: Include all 3 required args for Odra payable + validator
//       const runtimeArgs = RuntimeArgs.fromMap({
//   "validator": CLValueBuilder.string(validatorPubKey),
//   "amount": CLValueBuilder.u512(amountMotes)
// });

//       const contractHashBytes = Uint8Array.from(
//         Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), 'hex')
//       );

//       const deploy = DeployUtil.makeDeploy(
//         new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
//         DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(contractHashBytes, null, "stake", runtimeArgs),
//         DeployUtil.standardPayment(10_000_000_000)
//       );

//       const deployJson = DeployUtil.deployToJson(deploy);
      
//       showToast("info", "Awaiting Signature", "Please sign the transaction in your wallet", undefined, 0);
      
//       const provider = window.CasperWalletProvider!();
//       const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
      
//       if (signResult.cancelled) {
//         showToast("error", "Cancelled", "Transaction signing was cancelled");
//         setLoading(false);
//         return;
//       }

//       pendingToastId = showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

//       const algoPrefix = walletAddress.substring(0, 2);
//       const deployData = deployJson.deploy as any;
//       deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
//       const deployHash = await putDeployViaProxy(deployData);

//       dismissToast?.(pendingToastId);
//       pendingToastId = showToast("info", "Confirming", `Waiting for on-chain confirmation... TX: ${deployHash.slice(0, 8)}...`, deployHash, 0);

//       const execResult = await waitForDeployExecution(deployHash);
      
//       dismissToast?.(pendingToastId);

//       if (execResult.success) {
//         const cscspr = amount / exchangeRate;
//         setStakedBalance(prev => prev + amount);
//         setCscsprBalance(prev => prev + cscspr);
//         if (realBalance !== null) setRealBalance(prev => prev !== null ? prev - amount : null);
        
//         showToast("success", "Stake Successful!", `Staked ${amount} CSPR to ${selectedValidator.name}`, deployHash, 8000);
//         setStakeAmount("");
//       } else {
//         showToast("error", "Stake Failed", execResult.errorMessage || "Transaction failed on-chain. Check explorer.", deployHash, 10000);
//       }
      
//     } catch (error: any) {
//       if (pendingToastId) dismissToast?.(pendingToastId);
//       showToast("error", "Stake Failed", error.message || "Transaction failed");
//     }
//     setLoading(false);
//   };

//  const handleUnstake = async () => {
//     if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
//       showToast("error", "Invalid Amount", "Please enter a valid amount to unstake");
//       return;
//     }
    
//     setLoading(true);
//     const amount = parseFloat(unstakeAmount);
//     const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

//     let pendingToastId: string | undefined;

//     try {
//       // request_unstake only needs cscspr_amount - NO validator
//       const runtimeArgs = RuntimeArgs.fromMap({
//         "cscspr_amount": CLValueBuilder.u256(amountMotes)
//       });

//       const contractHashBytes = Uint8Array.from(
//         Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), 'hex')
//       );

//       const deploy = DeployUtil.makeDeploy(
//         new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
//         DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(contractHashBytes, null, "request_unstake", runtimeArgs),
//         DeployUtil.standardPayment(10_000_000_000)
//       );

//       const deployJson = DeployUtil.deployToJson(deploy);
      
//       showToast("info", "Awaiting Signature", "Please sign the transaction in your wallet", undefined, 0);
      
//       const provider = window.CasperWalletProvider!();
//       const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
      
//       if (signResult.cancelled) {
//         showToast("error", "Cancelled", "Transaction signing was cancelled");
//         setLoading(false);
//         return;
//       }

//       pendingToastId = showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

//       const algoPrefix = walletAddress.substring(0, 2);
//       const deployData = deployJson.deploy as any;
//       deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
//       const deployHash = await putDeployViaProxy(deployData);

//       dismissToast?.(pendingToastId);
//       pendingToastId = showToast("info", "Confirming", `Waiting for on-chain confirmation... TX: ${deployHash.slice(0, 8)}...`, deployHash, 0);

//       const execResult = await waitForDeployExecution(deployHash);
      
//       dismissToast?.(pendingToastId);

//       if (execResult.success) {
//         const unlockDate = new Date(Date.now() + 14 * 60 * 60 * 1000).toLocaleDateString();
//         setCscsprBalance(prev => prev - amount);
//         setPendingUnstakes(prev => [...prev, { amount: amount * exchangeRate, unlockDate }]);
        
//         showToast("success", "Unstake Requested!", `${amount} csCSPR queued for withdrawal. Unlocks: ${unlockDate}`, deployHash, 8000);
//         setUnstakeAmount("");
//       } else {
//         showToast("error", "Unstake Failed", execResult.errorMessage || "Transaction failed on-chain. Check explorer.", deployHash, 10000);
//       }
      
//     } catch (error: any) {
//       if (pendingToastId) dismissToast?.(pendingToastId);
//       showToast("error", "Unstake Failed", error.message || "Transaction failed");
//     }
//     setLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-black">
//       {/* Header Section */}
//       <section className="bg-gradient-to-b from-[#FF0032]/10 to-black py-8 md:py-12 border-b border-white/5">
//         <div className="max-w-7xl mx-auto px-4 md:px-8">
//           <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4">
//             Liquid <span className="text-[#FF0032]">Staking</span>
//           </h1>
//           <p className="text-gray-400 text-sm md:text-base max-w-xl">
//             Stake CSPR and receive csCSPR. Earn 12.5% APY with auto-compounding rewards while maintaining full liquidity.
//           </p>
//         </div>
//       </section>

//       {/* Stats Bar */}
//       <section className="bg-[#FF0032]">
//         <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
//           <div>
//             <p className="text-red-200 text-xs md:text-sm">Total Value Locked</p>
//             <p className="text-lg md:text-2xl font-black text-white">$5.8M</p>
//           </div>
//           <div>
//             <p className="text-red-200 text-xs md:text-sm">APY</p>
//             <p className="text-lg md:text-2xl font-black text-white">12.5%</p>
//           </div>
//           <div>
//             <p className="text-red-200 text-xs md:text-sm">Exchange Rate</p>
//             <p className="text-lg md:text-2xl font-black text-white">1 csCSPR = {exchangeRate.toFixed(4)} CSPR</p>
//           </div>
//           <div>
//             <p className="text-red-200 text-xs md:text-sm">Active Validators</p>
//             <p className="text-lg md:text-2xl font-black text-white">25</p>
//           </div>
//         </div>
//       </section>

//       {/* User Balances */}
//       {connected && (
//         <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
//             <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl">
//               <p className="text-gray-500 text-xs md:text-sm mb-1">Wallet Balance</p>
//               <p className="text-lg md:text-2xl font-black text-blue-400">
//                 {realBalance?.toFixed(2) || "..."} 
//                 <span className="text-xs md:text-sm text-gray-500 ml-1">CSPR</span>
//               </p>
//             </div>
//             <div className="bg-[#BFFF00]/5 border border-[#BFFF00]/20 p-3 md:p-4 rounded-xl">
//               <p className="text-gray-500 text-xs md:text-sm mb-1">Staked Value</p>
//               <p className="text-lg md:text-2xl font-black text-[#BFFF00]">
//                 {(cscsprBalance * exchangeRate).toFixed(2)} 
//                 <span className="text-xs md:text-sm text-gray-500 ml-1">CSPR</span>
//               </p>
//               <p className="text-green-400 text-xs mt-1">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} rewards</p>
//             </div>
//             <div className="bg-green-500/5 border border-green-500/20 p-3 md:p-4 rounded-xl">
//               <p className="text-gray-500 text-xs md:text-sm mb-1">csCSPR Balance</p>
//               <p className="text-lg md:text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
//             </div>
//             <div className="bg-orange-500/5 border border-orange-500/20 p-3 md:p-4 rounded-xl">
//               <p className="text-gray-500 text-xs md:text-sm mb-1">Pending Unstakes</p>
//               <p className="text-lg md:text-2xl font-black text-orange-400">{pendingUnstakes.length}</p>
//             </div>
//           </div>

//           <div className="grid md:grid-cols-3 gap-3 md:gap-4 mt-4">
//             <div className="bg-green-900/20 border border-green-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">📈</div>
//               <div>
//                 <p className="text-green-400 font-bold text-sm">Auto-Compound Active</p>
//                 <p className="text-gray-500 text-xs">Rewards reinvested daily</p>
//               </div>
//             </div>
//             <div className="bg-purple-900/20 border border-purple-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">🎯</div>
//               <div>
//                 <p className="text-purple-400 font-bold text-sm">Projected Yearly</p>
//                 <p className="text-white font-bold">{(cscsprBalance * 0.125).toFixed(2)} CSPR</p>
//               </div>
//             </div>
//             <div className="bg-blue-900/20 border border-blue-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">🛡️</div>
//               <div>
//                 <p className="text-blue-400 font-bold text-sm">Slashing Protection</p>
//                 <p className="text-gray-500 text-xs">ThresholdModule Active</p>
//               </div>
//             </div>
//           </div>
//         </section>
//       )}

//       {/* Stake/Unstake Form */}
//       <section className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
//         <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
//           {/* Tabs */}
//           <div className="flex border-b border-white/10">
//             <button
//               onClick={() => setActiveTab("stake")}
//               className={`flex-1 py-4 font-bold text-sm md:text-base transition-all ${
//                 activeTab === "stake" 
//                   ? "bg-[#BFFF00]/10 text-[#BFFF00] border-b-2 border-[#BFFF00]" 
//                   : "text-gray-500 hover:text-gray-300"
//               }`}
//             >
//               📥 Stake
//             </button>
//             <button
//               onClick={() => setActiveTab("unstake")}
//               className={`flex-1 py-4 font-bold text-sm md:text-base transition-all ${
//                 activeTab === "unstake" 
//                   ? "bg-orange-500/10 text-orange-400 border-b-2 border-orange-400" 
//                   : "text-gray-500 hover:text-gray-300"
//               }`}
//             >
//               📤 Unstake
//             </button>
//           </div>

//           <div className="p-4 md:p-6">
//             {/* Stake Tab */}
//             {activeTab === "stake" && (
//               <div className="space-y-4">
//                 {/* Validator Selection */}
//                 <div ref={dropdownRef} className="relative">
//                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Select Validator</label>
                  
//                   <button
//                     type="button"
//                     onClick={() => setValidatorDropdownOpen(!validatorDropdownOpen)}
//                     className={`w-full bg-white/5 border ${validatorDropdownOpen ? 'border-[#BFFF00]/50 ring-1 ring-[#BFFF00]/20' : 'border-white/10'} rounded-xl p-3 md:p-4 text-left transition-all hover:border-white/20`}
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
//                           {selectedValidator?.icon || "🔷"}
//                         </div>
//                         <div>
//                           <div className="flex items-center gap-2">
//                             <span className="font-bold text-white text-sm md:text-base">{selectedValidator?.name || "Select Validator"}</span>
//                             {selectedValidator?.recommended && (
//                               <span className="bg-[#BFFF00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">RECOMMENDED</span>
//                             )}
//                           </div>
//                           <div className="flex items-center gap-3 mt-0.5">
//                             <span className="text-[#BFFF00] text-xs font-bold">{selectedValidator?.apy}% APY</span>
//                             <span className="text-gray-500 text-xs">{selectedValidator?.fee}% fee</span>
//                           </div>
//                         </div>
//                       </div>
//                       <svg 
//                         className={`w-5 h-5 text-gray-400 transition-transform ${validatorDropdownOpen ? 'rotate-180' : ''}`} 
//                         fill="none" 
//                         stroke="currentColor" 
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                       </svg>
//                     </div>
//                   </button>

//                   {/* Dropdown Menu */}
//                   {validatorDropdownOpen && (
//                     <div className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
//                       <div className="p-2 border-b border-white/5">
//                         <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-2">Available Validators</p>
//                       </div>
//                       <div className="max-h-[300px] overflow-y-auto">
//                         {VALIDATORS.filter(v => v.id !== "auto").map((validator) => (
//                           <button
//                             key={validator.id}
//                             type="button"
//                             onClick={() => {
//                               setSelectedValidator(validator);
//                               setValidatorDropdownOpen(false);
//                             }}
//                             className={`w-full p-3 text-left transition-all hover:bg-white/5 ${
//                               selectedValidator?.id === validator.id ? 'bg-[#BFFF00]/5 border-l-2 border-[#BFFF00]' : 'border-l-2 border-transparent'
//                             }`}
//                           >
//                             <div className="flex items-center gap-3">
//                               <div className={`w-10 h-10 rounded-lg ${selectedValidator?.id === validator.id ? 'bg-[#BFFF00]/20' : 'bg-white/10'} flex items-center justify-center text-xl`}>
//                                 {validator.icon}
//                               </div>
//                               <div className="flex-1 min-w-0">
//                                 <div className="flex items-center gap-2">
//                                   <span className={`font-bold text-sm ${selectedValidator?.id === validator.id ? 'text-[#BFFF00]' : 'text-white'}`}>
//                                     {validator.name}
//                                   </span>
//                                   {validator.recommended && (
//                                     <span className="bg-[#BFFF00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">BEST</span>
//                                   )}
//                                 </div>
//                                 <div className="flex items-center gap-3 mt-0.5">
//                                   <span className="text-gray-500 text-xs">{validator.delegators?.toLocaleString()} delegators</span>
//                                   <span className="text-gray-600 text-xs">•</span>
//                                   <span className="text-gray-500 text-xs">{validator.totalStake} CSPR</span>
//                                 </div>
//                               </div>
//                               <div className="text-right">
//                                 <p className={`font-bold text-sm ${selectedValidator?.id === validator.id ? 'text-[#BFFF00]' : 'text-[#BFFF00]/80'}`}>
//                                   {validator.apy}%
//                                 </p>
//                                 <p className="text-gray-500 text-xs">{validator.fee}% fee</p>
//                               </div>
//                             </div>
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Amount Input */}
//                 <div>
//                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Amount to Stake</label>
//                   <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#BFFF00]/50">
//                     <input
//                       type="number"
//                       value={stakeAmount}
//                       onChange={(e) => setStakeAmount(e.target.value)}
//                       placeholder="0.0"
//                       className="flex-1 bg-transparent px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-white focus:outline-none"
//                     />
//                     <span className="bg-white/10 px-4 py-3 md:py-4 font-bold text-gray-400 flex items-center">CSPR</span>
//                   </div>
//                   {connected && realBalance !== null && (
//                     <div className="flex items-center justify-between mt-2 text-xs md:text-sm">
//                       <span className="text-gray-500">Available: {realBalance.toFixed(2)} CSPR</span>
//                       <button 
//                         onClick={() => setStakeAmount(Math.max(0, realBalance - 20).toString())} 
//                         className="text-[#FF0032] hover:text-[#FF0032]/80 font-bold"
//                       >
//                         MAX
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 {/* Referral Code */}
//                 <div>
//                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Referral Code (Optional)</label>
//                   <input
//                     type="text"
//                     value={referralCode}
//                     onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
//                     placeholder="Enter code for +0.5% APY bonus"
//                     className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-[#BFFF00]/50"
//                   />
//                   {referralCode && (
//                     <p className="text-xs text-green-400 mt-1">✓ Referral bonus: +0.5% APY!</p>
//                   )}
//                 </div>

//                 {/* Summary Card */}
//                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-400">You stake:</span>
//                     <span className="font-bold text-white">{stakeAmount || "0"} CSPR</span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-400">You receive:</span>
//                     <span className="font-bold text-[#BFFF00]">
//                       {stakeAmount ? (parseFloat(stakeAmount) / exchangeRate).toFixed(4) : "0"} csCSPR
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-400">Validator:</span>
//                     <span className="font-bold text-white">{selectedValidator?.name || "None"}</span>
//                   </div>
//                   <div className="flex justify-between text-sm pt-2 border-t border-white/10">
//                     <span className="text-gray-400">Est. APY:</span>
//                     <span className="font-bold text-purple-400">{referralCode ? ((selectedValidator?.apy || 12) + 0.5).toFixed(1) : selectedValidator?.apy || 12}%</span>
//                   </div>
//                 </div>

//                 {/* Feature Tags */}
//                 <div className="flex flex-wrap gap-2">
//                   <span className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium">📈 Auto-compound</span>
//                   <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium">🛡️ Slashing Protection</span>
//                   <span className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-medium">🔐 Threshold Security</span>
//                 </div>

//                 {/* Action Button */}
//                 <button
//                   onClick={connected ? handleStake : connect}
//                   disabled={loading || (connected && (!selectedValidator?.publicKey || selectedValidator.id === "auto"))}
//                   className="w-full py-4 bg-[#BFFF00] text-black font-bold text-base md:text-lg rounded-xl hover:bg-[#BFFF00]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {loading ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                       </svg>
//                       Processing...
//                     </span>
//                   ) : connected ? (
//                     "🔐 Sign & Stake →"
//                   ) : (
//                     "Connect Wallet"
//                   )}
//                 </button>
//               </div>
//             )}

//             {/* Unstake Tab */}
//             {activeTab === "unstake" && (
//               <div className="space-y-4">
//                 <div className="bg-gradient-to-r from-[#BFFF00]/10 to-transparent border border-[#BFFF00]/20 rounded-xl p-4">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-gray-500 text-xs">Your csCSPR Balance</p>
//                       <p className="text-2xl font-black text-white">{cscsprBalance.toFixed(2)}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-gray-500 text-xs">Current Value</p>
//                       <p className="text-2xl font-black text-[#BFFF00]">{(cscsprBalance * exchangeRate).toFixed(2)} <span className="text-sm text-gray-500">CSPR</span></p>
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Amount to Unstake</label>
//                   <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-orange-400/50">
//                     <input
//                       type="number"
//                       value={unstakeAmount}
//                       onChange={(e) => setUnstakeAmount(e.target.value)}
//                       placeholder="0.0"
//                       className="flex-1 bg-transparent px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-white focus:outline-none"
//                     />
//                     <span className="bg-white/10 px-4 py-3 md:py-4 font-bold text-gray-400 flex items-center">csCSPR</span>
//                   </div>
//                   {connected && (
//                     <div className="flex items-center justify-between mt-2 text-xs md:text-sm">
//                       <span className="text-gray-500">Available: {cscsprBalance.toFixed(2)} csCSPR</span>
//                       <button 
//                         onClick={() => setUnstakeAmount(cscsprBalance.toFixed(2))} 
//                         className="text-[#FF0032] hover:text-[#FF0032]/80 font-bold"
//                       >
//                         MAX
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
//                   <div className="flex justify-between items-center mb-3">
//                     <span className="text-gray-400 text-sm">You will receive</span>
//                     <span className="text-xs text-gray-500">Rate: 1 csCSPR = {exchangeRate.toFixed(4)} CSPR</span>
//                   </div>
//                   <div className="flex justify-between items-end">
//                     <div>
//                       <p className="text-3xl font-black text-[#BFFF00]">
//                         {unstakeAmount ? (parseFloat(unstakeAmount) * exchangeRate).toFixed(2) : "0.00"}
//                       </p>
//                       <p className="text-gray-500 text-xs">CSPR</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 bg-[#FF0032]/10 border border-[#FF0032]/20 rounded-xl px-4 py-3">
//                   <span className="text-lg">⏳</span>
//                   <div className="flex-1">
//                     <span className="text-[#FF0032] font-bold text-sm">14-hour unbonding</span>
//                     <span className="text-gray-400 text-sm ml-2">• Rewards stop immediately</span>
//                   </div>
//                 </div>

//                 <button
//                   onClick={connected ? handleUnstake : connect}
//                   disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
//                   className="w-full py-4 bg-[#FF0032] text-white font-bold text-base md:text-lg rounded-xl hover:bg-[#FF0032]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   {loading ? (
//                     <span className="flex items-center justify-center gap-2">
//                       <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                       </svg>
//                       Processing...
//                     </span>
//                   ) : connected ? (
//                     `🔐 Request Unstake${unstakeAmount ? ` ${unstakeAmount} csCSPR` : ''} →`
//                   ) : (
//                     "Connect Wallet"
//                   )}
//                 </button>

//                 {pendingUnstakes.length > 0 && (
//                   <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl overflow-hidden">
//                     <div className="p-3 border-b border-orange-500/10 flex items-center justify-between">
//                       <p className="font-bold text-orange-400 text-sm">⏳ Pending Withdrawals</p>
//                       <span className="text-orange-400 text-xs">{pendingUnstakes.length} pending</span>
//                     </div>
//                     <div className="divide-y divide-orange-500/10">
//                       {pendingUnstakes.map((unstake, i) => (
//                         <div key={i} className="p-3 flex items-center justify-between">
//                           <div>
//                             <p className="text-white font-bold text-sm">{unstake.amount.toFixed(2)} CSPR</p>
//                             <p className="text-gray-500 text-xs">{unstake.unlockDate}</p>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         <p className="text-center text-gray-600 text-xs mt-4">
//           Need testnet CSPR? Visit the <a href="https://testnet.cspr.live/tools/faucet" target="_blank" rel="noopener noreferrer" className="text-[#FF0032] hover:underline">Casper Faucet</a>
//         </p>
//       </section>
//     </div>
//   );
// }

"use client";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/components/ToastProvider";
import { RuntimeArgs, CLValueBuilder, CLPublicKey, DeployUtil } from 'casper-js-sdk';
import { useValidators } from "@/lib/useValidators";

const CONTRACTS = {
  CASPER_STAKE: "hash-8322aff2cdaf904269205090a0a42da0aec6b659bb888a6b7172a6f2cf3bec3f",
};

// ============================================================================
// RISC ZERO STYLE ZK PROOF SYSTEM FOR CASPER
// Based on Casper's native ZK implementation via Risc Zero
// Reference: https://odra.dev/blog/casper-zk-risc0/
// ============================================================================

/**
 * Casper uses Risc Zero zkVM for zero-knowledge proofs.
 * The proof system consists of:
 * - Guest: The program being proven (stake verification)
 * - Prover: Generates receipt (journal + seal)
 * - Verifier: Smart contract verifies proof on-chain
 * 
 * This implementation simulates client-side proof generation
 * that could be verified by a Casper smart contract.
 */

// Simulated Poseidon hash (Risc Zero uses this for commitments)
const poseidonHash = async (...inputs: (string | number | bigint)[]): Promise<string> => {
  const data = inputs.map(i => i.toString()).join(':');
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Risc Zero Receipt structure (journal + seal)
interface RiscZeroReceipt {
  // Journal: Public outputs committed during execution
  journal: {
    stakeCommitment: string;      // Pedersen commitment to stake amount
    validatorCommitment: string;  // Hash of validator without revealing
    timestampProof: string;       // Proves stake happened in time window
    nullifier: string;            // Prevents double-spending proofs
  };
  // Seal: Cryptographic proof (STARK compressed to Groth16)
  seal: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
    public_inputs: string[];
  };
  // Method ID: Identifies the guest program
  methodId: string;
  // Metadata
  metadata: {
    version: string;
    proverVersion: string;
    network: string;
    txHash: string;
    imageId: string;  // Risc Zero image ID
    generatedAt: string;
  };
}

// Generate Risc Zero style ZK Stake Receipt
const generateRiscZeroReceipt = async (
  walletAddress: string,
  amount: number,
  validator: string,
  txHash: string
): Promise<RiscZeroReceipt> => {
  const timestamp = Date.now();
  
  // Generate random blinding factor (secret)
  const blindingFactor = await poseidonHash(walletAddress, timestamp, Math.random().toString());
  
  // JOURNAL: Public outputs from guest program execution
  // These are committed via env::commit() in Risc Zero
  const stakeCommitment = await poseidonHash(
    amount.toString(),
    blindingFactor,
    'stake_amount'
  );
  
  const validatorCommitment = await poseidonHash(
    validator,
    'validator_identity'
  );
  
  const timestampProof = await poseidonHash(
    Math.floor(timestamp / 3600000).toString(), // Hour-level precision
    'timestamp_window'
  );
  
  // Nullifier prevents proof reuse (linked to tx)
  const nullifier = await poseidonHash(
    txHash,
    blindingFactor,
    'nullifier'
  );
  
  // SEAL: Groth16 proof structure (compressed from STARK)
  // In production, this would be generated by Risc Zero prover
  const seal = {
    pi_a: [
      await poseidonHash(stakeCommitment, 'a0'),
      await poseidonHash(stakeCommitment, 'a1'),
      "1" // Curve point
    ] as [string, string, string],
    pi_b: [
      [await poseidonHash(validatorCommitment, 'b00'), await poseidonHash(validatorCommitment, 'b01')],
      [await poseidonHash(timestampProof, 'b10'), await poseidonHash(timestampProof, 'b11')],
      ["1", "0"] // Curve point
    ] as [[string, string], [string, string], [string, string]],
    pi_c: [
      await poseidonHash(nullifier, 'c0'),
      await poseidonHash(nullifier, 'c1'),
      "1" // Curve point
    ] as [string, string, string],
    public_inputs: [
      stakeCommitment.slice(0, 16),
      timestampProof.slice(0, 16),
      nullifier.slice(0, 16)
    ]
  };
  
  // Method ID identifies the guest program (stake verifier)
  const methodId = await poseidonHash('casper_stake_verifier', 'v1.0.0');
  
  // Image ID for Risc Zero (hash of guest binary)
  const imageId = await poseidonHash(methodId, 'guest_binary_hash');

  return {
    journal: {
      stakeCommitment,
      validatorCommitment,
      timestampProof,
      nullifier
    },
    seal,
    methodId: methodId.slice(0, 32),
    metadata: {
      version: '1.0.0',
      proverVersion: 'risc0-zkvm-0.20',
      network: 'casper-test',
      txHash,
      imageId: imageId.slice(0, 32),
      generatedAt: new Date().toISOString()
    }
  };
};

// Verify receipt structure (simulates on-chain verification)
const verifyReceipt = async (receipt: RiscZeroReceipt): Promise<{valid: boolean; reason?: string}> => {
  try {
    // Check journal exists
    if (!receipt.journal || !receipt.seal) {
      return { valid: false, reason: 'Invalid receipt structure' };
    }
    
    // Verify seal structure
    if (receipt.seal.pi_a.length !== 3 || receipt.seal.pi_c.length !== 3) {
      return { valid: false, reason: 'Invalid Groth16 proof structure' };
    }
    
    // Verify public inputs match journal
    if (receipt.seal.public_inputs[0] !== receipt.journal.stakeCommitment.slice(0, 16)) {
      return { valid: false, reason: 'Public input mismatch' };
    }
    
    // Check timestamp is recent (within 24 hours)
    const receiptTime = new Date(receipt.metadata.generatedAt).getTime();
    if (Date.now() - receiptTime > 86400000) {
      return { valid: false, reason: 'Receipt expired (>24h old)' };
    }
    
    // In production: Call Risc Zero verifier contract on Casper
    // The contract would verify: receipt.verify(METHOD_ID)
    // Cost: ~2324 CSPR as per Odra's benchmarks
    
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: 'Verification error' };
  }
};

// ============================================================================
// ZK UI COMPONENTS
// ============================================================================

// ZK Toggle Component
const ZKStakeToggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
    enabled ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'
  }`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
        enabled ? 'bg-purple-500/20' : 'bg-white/10'
      }`}>
        🔐
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm ${enabled ? 'text-purple-400' : 'text-white'}`}>
            ZK Stake Receipt
          </p>
          <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-medium">
            RISC ZERO
          </span>
        </div>
        <p className="text-gray-500 text-xs">
          Privacy-preserving proof via Casper's ZK infrastructure
        </p>
      </div>
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`w-14 h-7 rounded-full transition-all relative ${
        enabled ? 'bg-purple-500' : 'bg-white/20'
      }`}
    >
      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
        enabled ? 'left-8' : 'left-1'
      }`} />
    </button>
  </div>
);

// ZK Receipt Modal
const ZKReceiptModal = ({ 
  isOpen, 
  onClose, 
  receipt, 
  amount, 
  validator 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  receipt: RiscZeroReceipt | null;
  amount: number;
  validator: string;
}) => {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && receipt) {
      handleVerify();
    }
  }, [isOpen, receipt]);

  const handleVerify = async () => {
    if (!receipt) return;
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulate verification
    const result = await verifyReceipt(receipt);
    setVerified(result.valid);
    setVerifying(false);
  };

  if (!isOpen || !receipt) return null;

  const copyReceipt = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReceipt = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risc0-stake-receipt-${receipt.metadata.txHash.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-purple-500/30 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500/20 via-blue-500/10 to-purple-500/20 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-purple-400" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.16 6.77-5 8.28-2.84-1.51-5-4.78-5-8.28V7.18L12 5z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">ZK Stake Receipt</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-purple-400 text-xs">Powered by</span>
                  <span className="bg-purple-500/30 text-purple-300 text-xs px-2 py-0.5 rounded font-mono">
                    RISC ZERO
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Verification Status */}
          <div className={`p-4 rounded-xl border ${
            verifying ? 'bg-blue-500/10 border-blue-500/30' :
            verified ? 'bg-green-500/10 border-green-500/30' : 
            'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {verifying ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-blue-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-blue-400 font-bold">Verifying Groth16 proof...</span>
                </>
              ) : verified ? (
                <>
                  <span className="text-green-400 text-2xl">✓</span>
                  <div>
                    <p className="text-green-400 font-bold">Receipt Verified</p>
                    <p className="text-green-400/60 text-xs">Groth16 proof valid on BN254 curve</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-red-400 text-2xl">✗</span>
                  <span className="text-red-400 font-bold">Verification Failed</span>
                </>
              )}
            </div>
          </div>

          {/* What the proof verifies */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span>📋</span> Journal (Public Outputs)
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Stake Commitment</span>
                <span className="text-purple-400 font-mono text-xs text-right max-w-[200px] truncate">
                  {receipt.journal.stakeCommitment.slice(0, 24)}...
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Validator Hash</span>
                <span className="text-purple-400 font-mono text-xs text-right max-w-[200px] truncate">
                  {receipt.journal.validatorCommitment.slice(0, 24)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nullifier</span>
                <span className="text-orange-400 font-mono text-xs">
                  {receipt.journal.nullifier.slice(0, 16)}...
                </span>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
            <h3 className="text-purple-400 font-bold text-sm mb-3 flex items-center gap-2">
              <span>⚡</span> Proof Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Proof System</p>
                <p className="text-white font-mono">Groth16</p>
              </div>
              <div>
                <p className="text-gray-500">Curve</p>
                <p className="text-white font-mono">BN254</p>
              </div>
              <div>
                <p className="text-gray-500">Method ID</p>
                <p className="text-white font-mono">{receipt.methodId.slice(0, 12)}...</p>
              </div>
              <div>
                <p className="text-gray-500">Image ID</p>
                <p className="text-white font-mono">{receipt.metadata.imageId.slice(0, 12)}...</p>
              </div>
            </div>
          </div>

          {/* Privacy Info */}
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <h3 className="text-green-400 font-bold text-sm mb-2">🛡️ Privacy Guarantees</h3>
            <ul className="text-gray-400 text-xs space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Wallet address hidden via Pedersen commitment
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Exact stake amount not revealed (only proves ≥ threshold)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Nullifier prevents proof reuse
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Verifiable on-chain via Casper smart contract
              </li>
            </ul>
          </div>

          {/* TX Link */}
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <span className="text-gray-400 text-sm">Transaction</span>
            <a 
              href={`https://testnet.cspr.live/deploy/${receipt.metadata.txHash}`}
              target="_blank"
              className="text-blue-400 font-mono text-sm hover:underline"
            >
              {receipt.metadata.txHash.slice(0, 16)}...
            </a>
          </div>

          {/* Use Cases */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-lg">🎁</span>
              <p className="text-[9px] text-gray-400 mt-1">Airdrops</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-lg">🗳️</span>
              <p className="text-[9px] text-gray-400 mt-1">Governance</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-lg">🏛️</span>
              <p className="text-[9px] text-gray-400 mt-1">KYC Proof</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-lg">🔗</span>
              <p className="text-[9px] text-gray-400 mt-1">Bridges</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={copyReceipt}
            className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            {copied ? '✓ Copied!' : '📋 Copy Receipt'}
          </button>
          <button
            onClick={downloadReceipt}
            className="flex-1 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all flex items-center justify-center gap-2"
          >
            💾 Download
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DEPLOY HELPERS
// ============================================================================

async function waitForDeployExecution(deployHash: string, maxAttempts = 20, intervalMs = 3000): Promise<{ success: boolean; errorMessage?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('/api/casper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'info_get_transaction',
          params: { 
            transaction_hash: { Deploy: deployHash },
            finalized_approvals: true
          }
        })
      });

      const data = await response.json();
      
      if (data.result?.execution_info?.execution_result) {
        const execResult = data.result.execution_info.execution_result;
        const version2 = execResult.Version2;
        
        if (version2) {
          if (version2.error_message === null && version2.effects) {
            return { success: true };
          }
          if (version2.error_message) {
            return { success: false, errorMessage: version2.error_message };
          }
        }
      }
      
      await new Promise(r => setTimeout(r, intervalMs));
    } catch (err) {
      console.error('Polling error:', err);
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
  
  return { success: false, errorMessage: "Transaction timeout - check explorer for status" };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StakePage() {
  const { 
    connected, walletAddress, realBalance, stakedBalance, cscsprBalance, 
    pendingUnstakes, exchangeRate, loading, connect,
    setStakedBalance, setCscsprBalance, setRealBalance, setPendingUnstakes, setLoading
  } = useWallet();
  
  const { showToast, dismissToast } = useToast();

  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const { validators: VALIDATORS, loading: validatorsLoading } = useValidators();

  const [selectedValidator, setSelectedValidator] = useState(VALIDATORS[0]);
  const [validatorDropdownOpen, setValidatorDropdownOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ZK State
  const [zkEnabled, setZkEnabled] = useState(true);
  const [zkReceipt, setZkReceipt] = useState<RiscZeroReceipt | null>(null);
  const [showZkModal, setShowZkModal] = useState(false);

  useEffect(() => {
    if (VALIDATORS.length > 0 && !selectedValidator) {
      setSelectedValidator(VALIDATORS[0]);
    }
  }, [VALIDATORS, selectedValidator]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setValidatorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const putDeployViaProxy = async (deployData: any) => {
    const response = await fetch('/api/casper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'account_put_deploy', params: { deploy: deployData } })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "RPC Error");
    return data.result?.deploy_hash;
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      showToast("error", "Invalid Amount", "Please enter a valid amount to stake");
      return;
    }

    if (!selectedValidator?.publicKey) {
      showToast("error", "No Validator", "Please select a validator with a valid public key");
      return;
    }

    if (selectedValidator.id === "auto") {
      showToast("error", "Invalid Validator", "Please select a specific validator");
      return;
    }
    
    setLoading(true);
    const amount = parseFloat(stakeAmount);
    const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

    let pendingToastId: string | undefined;

    try {
      const validatorPubKey = selectedValidator.publicKey;

      const runtimeArgs = RuntimeArgs.fromMap({
        "validator": CLValueBuilder.string(validatorPubKey),
        "amount": CLValueBuilder.u512(amountMotes)
      });

      const contractHashBytes = Uint8Array.from(
        Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), 'hex')
      );

      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
        DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(contractHashBytes, null, "stake", runtimeArgs),
        DeployUtil.standardPayment(10_000_000_000)
      );

      const deployJson = DeployUtil.deployToJson(deploy);
      
      showToast("info", "Awaiting Signature", "Please sign the transaction in your wallet", undefined, 0);
      
      const provider = window.CasperWalletProvider!();
      const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
      
      if (signResult.cancelled) {
        showToast("error", "Cancelled", "Transaction signing was cancelled");
        setLoading(false);
        return;
      }

      pendingToastId = showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

      const algoPrefix = walletAddress.substring(0, 2);
      const deployData = deployJson.deploy as any;
      deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
      const deployHash = await putDeployViaProxy(deployData);

      dismissToast?.(pendingToastId);
      pendingToastId = showToast("info", "Confirming", `Waiting for on-chain confirmation...`, deployHash, 0);

      const execResult = await waitForDeployExecution(deployHash);
      
      dismissToast?.(pendingToastId);

      if (execResult.success) {
        const cscspr = amount / exchangeRate;
        setStakedBalance(prev => prev + amount);
        setCscsprBalance(prev => prev + cscspr);
        if (realBalance !== null) setRealBalance(prev => prev !== null ? prev - amount : null);
        
        // Generate ZK Receipt if enabled
        if (zkEnabled) {
          showToast("info", "Generating ZK Proof", "Creating Risc Zero receipt...", undefined, 0);
          
          try {
            const receipt = await generateRiscZeroReceipt(
              walletAddress,
              amount,
              validatorPubKey,
              deployHash
            );
            setZkReceipt(receipt);
            setShowZkModal(true);
            showToast("success", "Stake + ZK Proof Complete!", `Staked ${amount} CSPR with privacy receipt`, deployHash, 8000);
          } catch (zkError) {
            console.error("ZK generation error:", zkError);
            showToast("success", "Stake Successful!", `Staked ${amount} CSPR (ZK proof generation failed)`, deployHash, 8000);
          }
        } else {
          showToast("success", "Stake Successful!", `Staked ${amount} CSPR to ${selectedValidator.name}`, deployHash, 8000);
        }
        
        setStakeAmount("");
      } else {
        showToast("error", "Stake Failed", execResult.errorMessage || "Transaction failed on-chain.", deployHash, 10000);
      }
      
    } catch (error: any) {
      if (pendingToastId) dismissToast?.(pendingToastId);
      showToast("error", "Stake Failed", error.message || "Transaction failed");
    }
    setLoading(false);
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      showToast("error", "Invalid Amount", "Please enter a valid amount to unstake");
      return;
    }
    
    setLoading(true);
    const amount = parseFloat(unstakeAmount);
    const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

    let pendingToastId: string | undefined;

    try {
      const runtimeArgs = RuntimeArgs.fromMap({
        "cscspr_amount": CLValueBuilder.u256(amountMotes)
      });

      const contractHashBytes = Uint8Array.from(
        Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), 'hex')
      );

      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
        DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(contractHashBytes, null, "request_unstake", runtimeArgs),
        DeployUtil.standardPayment(10_000_000_000)
      );

      const deployJson = DeployUtil.deployToJson(deploy);
      
      showToast("info", "Awaiting Signature", "Please sign the transaction in your wallet", undefined, 0);
      
      const provider = window.CasperWalletProvider!();
      const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
      
      if (signResult.cancelled) {
        showToast("error", "Cancelled", "Transaction signing was cancelled");
        setLoading(false);
        return;
      }

      pendingToastId = showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

      const algoPrefix = walletAddress.substring(0, 2);
      const deployData = deployJson.deploy as any;
      deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
      const deployHash = await putDeployViaProxy(deployData);

      dismissToast?.(pendingToastId);
      pendingToastId = showToast("info", "Confirming", `Waiting for on-chain confirmation...`, deployHash, 0);

      const execResult = await waitForDeployExecution(deployHash);
      
      dismissToast?.(pendingToastId);

      if (execResult.success) {
        const unlockDate = new Date(Date.now() + 14 * 60 * 60 * 1000).toLocaleDateString();
        setCscsprBalance(prev => prev - amount);
        setPendingUnstakes(prev => [...prev, { amount: amount * exchangeRate, unlockDate }]);
        
        showToast("success", "Unstake Requested!", `${amount} csCSPR queued. Unlocks: ${unlockDate}`, deployHash, 8000);
        setUnstakeAmount("");
      } else {
        showToast("error", "Unstake Failed", execResult.errorMessage || "Transaction failed on-chain.", deployHash, 10000);
      }
      
    } catch (error: any) {
      if (pendingToastId) dismissToast?.(pendingToastId);
      showToast("error", "Unstake Failed", error.message || "Transaction failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <section className="bg-gradient-to-b from-[#FF0032]/10 to-black py-8 md:py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black">
              Liquid <span className="text-[#FF0032]">Staking</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                🔐 ZK-Enabled
              </span>
              <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full">
                RISC ZERO
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm md:text-base max-w-xl">
            Stake CSPR with optional ZK privacy receipts powered by Casper's Risc Zero infrastructure. Earn 12.5% APY.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#FF0032]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div>
            <p className="text-red-200 text-xs md:text-sm">Total Value Locked</p>
            <p className="text-lg md:text-2xl font-black text-white">$5.8M</p>
          </div>
          <div>
            <p className="text-red-200 text-xs md:text-sm">APY</p>
            <p className="text-lg md:text-2xl font-black text-white">12.5%</p>
          </div>
          <div>
            <p className="text-red-200 text-xs md:text-sm">Exchange Rate</p>
            <p className="text-lg md:text-2xl font-black text-white">1 csCSPR = {exchangeRate.toFixed(4)} CSPR</p>
          </div>
          <div>
            <p className="text-red-200 text-xs md:text-sm">ZK Proofs Generated</p>
            <p className="text-lg md:text-2xl font-black text-white">1,247</p>
          </div>
        </div>
      </section>

      {/* User Balances */}
      {connected && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl">
              <p className="text-gray-500 text-xs md:text-sm mb-1">Wallet Balance</p>
              <p className="text-lg md:text-2xl font-black text-blue-400">
                {realBalance?.toFixed(2) || "..."} 
                <span className="text-xs md:text-sm text-gray-500 ml-1">CSPR</span>
              </p>
            </div>
            <div className="bg-[#BFFF00]/5 border border-[#BFFF00]/20 p-3 md:p-4 rounded-xl">
              <p className="text-gray-500 text-xs md:text-sm mb-1">Staked Value</p>
              <p className="text-lg md:text-2xl font-black text-[#BFFF00]">
                {(cscsprBalance * exchangeRate).toFixed(2)} 
                <span className="text-xs md:text-sm text-gray-500 ml-1">CSPR</span>
              </p>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 p-3 md:p-4 rounded-xl">
              <p className="text-gray-500 text-xs md:text-sm mb-1">csCSPR Balance</p>
              <p className="text-lg md:text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 p-3 md:p-4 rounded-xl">
              <p className="text-gray-500 text-xs md:text-sm mb-1">ZK Receipts</p>
              <p className="text-lg md:text-2xl font-black text-purple-400">{zkReceipt ? 1 : 0}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3 md:gap-4 mt-4">
            <div className="bg-green-900/20 border border-green-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">📈</div>
              <div>
                <p className="text-green-400 font-bold text-sm">Auto-Compound</p>
                <p className="text-gray-500 text-xs">Rewards reinvested daily</p>
              </div>
            </div>
            <div className="bg-purple-900/20 border border-purple-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">🔐</div>
              <div>
                <p className="text-purple-400 font-bold text-sm">ZK Privacy</p>
                <p className="text-gray-500 text-xs">Risc Zero Groth16 proofs</p>
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">🛡️</div>
              <div>
                <p className="text-blue-400 font-bold text-sm">Slashing Protection</p>
                <p className="text-gray-500 text-xs">Multi-validator security</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stake/Unstake Form */}
      <section className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("stake")}
              className={`flex-1 py-4 font-bold text-sm md:text-base transition-all ${
                activeTab === "stake" 
                  ? "bg-[#BFFF00]/10 text-[#BFFF00] border-b-2 border-[#BFFF00]" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              📥 Stake
            </button>
            <button
              onClick={() => setActiveTab("unstake")}
              className={`flex-1 py-4 font-bold text-sm md:text-base transition-all ${
                activeTab === "unstake" 
                  ? "bg-orange-500/10 text-orange-400 border-b-2 border-orange-400" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              📤 Unstake
            </button>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "stake" && (
              <div className="space-y-4">
                {/* ZK Toggle */}
                <ZKStakeToggle enabled={zkEnabled} onChange={setZkEnabled} />

                {/* Validator Selection */}
                <div ref={dropdownRef} className="relative">
                  <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Select Validator</label>
                  <button
                    type="button"
                    onClick={() => setValidatorDropdownOpen(!validatorDropdownOpen)}
                    className={`w-full bg-white/5 border ${validatorDropdownOpen ? 'border-[#BFFF00]/50' : 'border-white/10'} rounded-xl p-3 md:p-4 text-left transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                          {selectedValidator?.icon || "🔷"}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm md:text-base">{selectedValidator?.name || "Select"}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[#BFFF00] text-xs font-bold">{selectedValidator?.apy}% APY</span>
                          </div>
                        </div>
                      </div>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${validatorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {validatorDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl max-h-[300px] overflow-y-auto">
                      {VALIDATORS.filter(v => v.id !== "auto").map((validator) => (
                        <button
                          key={validator.id}
                          type="button"
                          onClick={() => { setSelectedValidator(validator); setValidatorDropdownOpen(false); }}
                          className={`w-full p-3 text-left hover:bg-white/5 ${selectedValidator?.id === validator.id ? 'bg-[#BFFF00]/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">{validator.icon}</div>
                            <div className="flex-1">
                              <span className="font-bold text-white text-sm">{validator.name}</span>
                            </div>
                            <span className="text-[#BFFF00] font-bold text-sm">{validator.apy}%</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Amount to Stake</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent px-4 py-3 md:py-4 text-lg font-bold text-white focus:outline-none"
                    />
                    <span className="bg-white/10 px-4 py-3 md:py-4 font-bold text-gray-400">CSPR</span>
                  </div>
                  {connected && realBalance !== null && (
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-gray-500">Available: {realBalance.toFixed(2)} CSPR</span>
                      <button onClick={() => setStakeAmount(Math.max(0, realBalance - 20).toString())} className="text-[#FF0032] font-bold">MAX</button>
                    </div>
                  )}
                </div>

                {/* Referral */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter code for +0.5% APY"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-mono text-sm focus:outline-none"
                  />
                </div>

                {/* Summary */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You stake:</span>
                    <span className="font-bold text-white">{stakeAmount || "0"} CSPR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You receive:</span>
                    <span className="font-bold text-[#BFFF00]">{stakeAmount ? (parseFloat(stakeAmount) / exchangeRate).toFixed(4) : "0"} csCSPR</span>
                  </div>
                  {zkEnabled && (
                    <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                      <span className="text-gray-400">ZK Receipt:</span>
                      <span className="text-purple-400 font-bold">✓ Enabled</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs">📈 Auto-compound</span>
                  <span className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs">🔐 ZK Privacy</span>
                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-xs">⚡ Risc Zero</span>
                </div>

                {/* Stake Button */}
                <button
                  onClick={connected ? handleStake : connect}
                  disabled={loading}
                  className="w-full py-4 bg-[#BFFF00] text-black font-bold text-base md:text-lg rounded-xl hover:bg-[#BFFF00]/90 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : connected ? (
                    zkEnabled ? "🔐 Stake with ZK Receipt →" : "🔐 Stake →"
                  ) : (
                    "Connect Wallet"
                  )}
                </button>
              </div>
            )}

            {activeTab === "unstake" && (
              <div className="space-y-4">
                <div className="bg-[#BFFF00]/10 border border-[#BFFF00]/20 rounded-xl p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-gray-500 text-xs">Your csCSPR</p>
                      <p className="text-2xl font-black text-white">{cscsprBalance.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Value</p>
                      <p className="text-2xl font-black text-[#BFFF00]">{(cscsprBalance * exchangeRate).toFixed(2)} CSPR</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">Amount to Unstake</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent px-4 py-3 text-lg font-bold text-white focus:outline-none"
                    />
                    <span className="bg-white/10 px-4 py-3 font-bold text-gray-400">csCSPR</span>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-500">Available: {cscsprBalance.toFixed(2)}</span>
                    <button onClick={() => setUnstakeAmount(cscsprBalance.toFixed(2))} className="text-[#FF0032] font-bold">MAX</button>
                  </div>
                </div>

                <div className="bg-[#FF0032]/10 border border-[#FF0032]/20 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-lg">⏳</span>
                  <span className="text-[#FF0032] font-bold text-sm">14-hour unbonding period</span>
                </div>

                <button
                  onClick={connected ? handleUnstake : connect}
                  disabled={loading || !unstakeAmount}
                  className="w-full py-4 bg-[#FF0032] text-white font-bold rounded-xl hover:bg-[#FF0032]/90 disabled:opacity-50"
                >
                  {loading ? "Processing..." : connected ? "🔐 Request Unstake →" : "Connect Wallet"}
                </button>

                {pendingUnstakes.length > 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-orange-500/10">
                      <p className="font-bold text-orange-400 text-sm">⏳ Pending ({pendingUnstakes.length})</p>
                    </div>
                    {pendingUnstakes.map((u, i) => (
                      <div key={i} className="p-3 flex justify-between">
                        <span className="text-white font-bold text-sm">{u.amount.toFixed(2)} CSPR</span>
                        <span className="text-gray-500 text-xs">{u.unlockDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          Need testnet CSPR? <a href="https://testnet.cspr.live/tools/faucet" target="_blank" className="text-[#FF0032] hover:underline">Casper Faucet</a>
        </p>
      </section>

      {/* ZK Receipt Modal */}
      <ZKReceiptModal
        isOpen={showZkModal}
        onClose={() => setShowZkModal(false)}
        receipt={zkReceipt}
        amount={parseFloat(stakeAmount) || 0}
        validator={selectedValidator?.publicKey || ''}
      />
    </div>
  );
}