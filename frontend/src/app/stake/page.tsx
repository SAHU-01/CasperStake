// // "use client";
// // import { useState, useRef, useEffect } from "react";
// // import { useWallet } from "@/contexts/WalletContext";
// // import { useToast } from "@/components/ToastProvider";
// // import { RuntimeArgs, CLValueBuilder, CLPublicKey, DeployUtil } from 'casper-js-sdk';

// // const CONTRACTS = {
// //   CASPER_STAKE: "hash-f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85",
// // };

// // // Validator data
// // const VALIDATORS = [
// //   { 
// //     id: "casperstake", 
// //     name: "CasperStake Pool", 
// //     apy: 12.5, 
// //     fee: 5,
// //     delegators: 1284,
// //     totalStake: "45.2M",
// //     status: "active",
// //     recommended: true,
// //     icon: "🏆"
// //   },
// //   { 
// //     id: "casperlabs", 
// //     name: "Casper Labs", 
// //     apy: 11.8, 
// //     fee: 8,
// //     delegators: 3421,
// //     totalStake: "128.5M",
// //     status: "active",
// //     recommended: false,
// //     icon: "🔴"
// //   },
// //   { 
// //     id: "hashquark", 
// //     name: "HashQuark", 
// //     apy: 11.5, 
// //     fee: 10,
// //     delegators: 892,
// //     totalStake: "32.1M",
// //     status: "active",
// //     recommended: false,
// //     icon: "⬡"
// //   },
// //   { 
// //     id: "everstake", 
// //     name: "Everstake", 
// //     apy: 11.2, 
// //     fee: 10,
// //     delegators: 2156,
// //     totalStake: "67.8M",
// //     status: "active",
// //     recommended: false,
// //     icon: "🌐"
// //   },
// //   { 
// //     id: "auto", 
// //     name: "Auto-Distribute", 
// //     apy: 11.8, 
// //     fee: 5,
// //     delegators: null,
// //     totalStake: null,
// //     status: "active",
// //     recommended: false,
// //     icon: "🔀",
// //     description: "Distribute across top validators"
// //   },
// // ];

// // export default function StakePage() {
// //   const { 
// //     connected, walletAddress, realBalance, stakedBalance, cscsprBalance, 
// //     pendingUnstakes, exchangeRate, loading, connect,
// //     setStakedBalance, setCscsprBalance, setRealBalance, setPendingUnstakes, setLoading
// //   } = useWallet();
  
// //   const { showToast } = useToast();

// //   const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
// //   const [stakeAmount, setStakeAmount] = useState("");
// //   const [unstakeAmount, setUnstakeAmount] = useState("");
// //   const [selectedValidator, setSelectedValidator] = useState(VALIDATORS[0]);
// //   const [validatorDropdownOpen, setValidatorDropdownOpen] = useState(false);
// //   const [referralCode, setReferralCode] = useState("");
// //   const dropdownRef = useRef<HTMLDivElement>(null);

// //   // Close dropdown when clicking outside
// //   useEffect(() => {
// //     function handleClickOutside(event: MouseEvent) {
// //       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
// //         setValidatorDropdownOpen(false);
// //       }
// //     }
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   const putDeployViaProxy = async (deployData: any) => {
// //     const response = await fetch('/api/casper', {
// //       method: 'POST',
// //       headers: { 'Content-Type': 'application/json' },
// //       body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'account_put_deploy', params: { deploy: deployData } })
// //     });
// //     const data = await response.json();
// //     if (data.error) throw new Error(data.error.message || "RPC Error");
// //     return data.result?.deploy_hash;
// //   };

// //   const handleStake = async () => {
// //     if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
// //       showToast("error", "Invalid Amount", "Please enter a valid amount to stake");
// //       return;
// //     }
    
// //     setLoading(true);
// //     const amount = parseFloat(stakeAmount);
// //     const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

// //     try {
// //       const runtimeArgs = RuntimeArgs.fromMap({
// //         "amount": CLValueBuilder.u64(amountMotes)
// //       });

// //       const contractHashBytes = Uint8Array.from(
// //         Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), 'hex')
// //       );

// //       const deploy = DeployUtil.makeDeploy(
// //         new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
// //         DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(contractHashBytes, null, "stake", runtimeArgs),
// //         DeployUtil.standardPayment(10_000_000_000)
// //       );

// //       const deployJson = DeployUtil.deployToJson(deploy);
      
// //       showToast("info", "Awaiting Signature", "Please sign the transaction in your wallet", undefined, 0);
      
// //       const provider = window.CasperWalletProvider!();
// //       const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
      
// //       if (signResult.cancelled) {
// //         showToast("error", "Cancelled", "Transaction signing was cancelled");
// //         setLoading(false);
// //         return;
// //       }

// //       showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

// //       const algoPrefix = walletAddress.substring(0, 2);
// //       const deployData = deployJson.deploy as any;
// //       deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
// //       const deployHash = await putDeployViaProxy(deployData);

// //       // Update balances
// //       const cscspr = amount / exchangeRate;
// //       setStakedBalance(prev => prev + amount);
// //       setCscsprBalance(prev => prev + cscspr);
// //       if (realBalance !== null) setRealBalance(prev => prev !== null ? prev - amount : null);
      
// //       showToast("success", "Stake Successful!", `Staked ${amount} CSPR`, deployHash, 8000);
// //       setStakeAmount("");
      
// //     } catch (error: any) {
// //       showToast("error", "Stake Failed", error.message || "Transaction failed");
// //     }
// //     setLoading(false);
// //   };

// //   const handleUnstake = async () => {
// //     if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
// //       showToast("error", "Invalid Amount", "Please enter a valid amount to unstake");
// //       return;
// //     }
    
// //     setLoading(true);
// //     const amount = parseFloat(unstakeAmount);
// //     const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

// //     try {
// //       const runtimeArgs = RuntimeArgs.fromMap({
// //         "amount": CLValueBuilder.u64(amountMotes)
// //       });

// //       const contractHashBytes = Uint8Array.from(
// //         Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), 'hex')
// //       );

// //       const deploy = DeployUtil.makeDeploy(
// //         new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
// //         DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(contractHashBytes, null, "request_unstake", runtimeArgs),
// //         DeployUtil.standardPayment(10_000_000_000)
// //       );

// //       const deployJson = DeployUtil.deployToJson(deploy);
      
// //       showToast("info", "Awaiting Signature", "Please sign the transaction in your wallet", undefined, 0);
      
// //       const provider = window.CasperWalletProvider!();
// //       const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
      
// //       if (signResult.cancelled) {
// //         showToast("error", "Cancelled", "Transaction signing was cancelled");
// //         setLoading(false);
// //         return;
// //       }

// //       showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

// //       const algoPrefix = walletAddress.substring(0, 2);
// //       const deployData = deployJson.deploy as any;
// //       deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
// //       const deployHash = await putDeployViaProxy(deployData);

// //       const unlockDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
// //       setCscsprBalance(prev => prev - amount);
// //       setPendingUnstakes(prev => [...prev, { amount: amount * exchangeRate, unlockDate }]);
      
// //       showToast("success", "Unstake Requested!", `${amount} csCSPR queued for withdrawal. Unlocks: ${unlockDate}`, deployHash, 8000);
// //       setUnstakeAmount("");
      
// //     } catch (error: any) {
// //       showToast("error", "Unstake Failed", error.message || "Transaction failed");
// //     }
// //     setLoading(false);
// //   };

// //   return (
// //     <div className="min-h-screen bg-black">
// //       {/* Header Section - Casper Style */}
// //       <section className="bg-gradient-to-b from-[#FF0032]/10 to-black py-8 md:py-12 border-b border-white/5">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8">
// //           <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4">
// //             Liquid <span className="text-[#FF0032]">Staking</span>
// //           </h1>
// //           <p className="text-gray-400 text-sm md:text-base max-w-xl">
// //             Stake CSPR and receive csCSPR. Earn 12.5% APY with auto-compounding rewards while maintaining full liquidity.
// //           </p>
// //         </div>
// //       </section>

// //       {/* Stats Bar - Casper Red */}
// //       <section className="bg-[#FF0032]">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
// //           <div>
// //             <p className="text-red-200 text-xs md:text-sm">Total Value Locked</p>
// //             <p className="text-lg md:text-2xl font-black text-white">$5.8M</p>
// //           </div>
// //           <div>
// //             <p className="text-red-200 text-xs md:text-sm">APY</p>
// //             <p className="text-lg md:text-2xl font-black text-white">12.5%</p>
// //           </div>
// //           <div>
// //             <p className="text-red-200 text-xs md:text-sm">Exchange Rate</p>
// //             <p className="text-lg md:text-2xl font-black text-white">1 csCSPR = {exchangeRate.toFixed(4)} CSPR</p>
// //           </div>
// //           <div>
// //             <p className="text-red-200 text-xs md:text-sm">Active Validators</p>
// //             <p className="text-lg md:text-2xl font-black text-white">25</p>
// //           </div>
// //         </div>
// //       </section>

// //       {/* User Balances - Only when connected */}
// //       {connected && (
// //         <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
// //           {/* Balance Cards */}
// //           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
// //             <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl">
// //               <p className="text-gray-500 text-xs md:text-sm mb-1">Wallet Balance</p>
// //               <p className="text-lg md:text-2xl font-black text-blue-400">
// //                 {realBalance?.toFixed(2) || "..."} 
// //                 <span className="text-xs md:text-sm text-gray-500 ml-1">CSPR</span>
// //               </p>
// //             </div>
// //             <div className="bg-[#BFFF00]/5 border border-[#BFFF00]/20 p-3 md:p-4 rounded-xl">
// //               <p className="text-gray-500 text-xs md:text-sm mb-1">Staked Value</p>
// //               <p className="text-lg md:text-2xl font-black text-[#BFFF00]">
// //                 {(cscsprBalance * exchangeRate).toFixed(2)} 
// //                 <span className="text-xs md:text-sm text-gray-500 ml-1">CSPR</span>
// //               </p>
// //               <p className="text-green-400 text-xs mt-1">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} rewards</p>
// //             </div>
// //             <div className="bg-green-500/5 border border-green-500/20 p-3 md:p-4 rounded-xl">
// //               <p className="text-gray-500 text-xs md:text-sm mb-1">csCSPR Balance</p>
// //               <p className="text-lg md:text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
// //             </div>
// //             <div className="bg-orange-500/5 border border-orange-500/20 p-3 md:p-4 rounded-xl">
// //               <p className="text-gray-500 text-xs md:text-sm mb-1">Pending Unstakes</p>
// //               <p className="text-lg md:text-2xl font-black text-orange-400">{pendingUnstakes.length}</p>
// //             </div>
// //           </div>

// //           {/* Rewards & Status Panels */}
// //           <div className="grid md:grid-cols-3 gap-3 md:gap-4 mt-4">
// //             <div className="bg-green-900/20 border border-green-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
// //               <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">📈</div>
// //               <div>
// //                 <p className="text-green-400 font-bold text-sm">Auto-Compound Active</p>
// //                 <p className="text-gray-500 text-xs">Rewards reinvested daily</p>
// //               </div>
// //             </div>
// //             <div className="bg-purple-900/20 border border-purple-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
// //               <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">🎯</div>
// //               <div>
// //                 <p className="text-purple-400 font-bold text-sm">Projected Yearly</p>
// //                 <p className="text-white font-bold">{(cscsprBalance * 0.125).toFixed(2)} CSPR</p>
// //               </div>
// //             </div>
// //             <div className="bg-blue-900/20 border border-blue-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
// //               <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">🛡️</div>
// //               <div>
// //                 <p className="text-blue-400 font-bold text-sm">Slashing Protection</p>
// //                 <p className="text-gray-500 text-xs">ThresholdModule Active</p>
// //               </div>
// //             </div>
// //           </div>
// //         </section>
// //       )}

// //       {/* Stake/Unstake Form */}
// //       <section className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
// //         <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
// //           {/* Tabs */}
// //           <div className="flex border-b border-white/10">
// //             <button
// //               onClick={() => setActiveTab("stake")}
// //               className={`flex-1 py-4 font-bold text-sm md:text-base transition-all ${
// //                 activeTab === "stake" 
// //                   ? "bg-[#BFFF00]/10 text-[#BFFF00] border-b-2 border-[#BFFF00]" 
// //                   : "text-gray-500 hover:text-gray-300"
// //               }`}
// //             >
// //               📥 Stake
// //             </button>
// //             <button
// //               onClick={() => setActiveTab("unstake")}
// //               className={`flex-1 py-4 font-bold text-sm md:text-base transition-all ${
// //                 activeTab === "unstake" 
// //                   ? "bg-orange-500/10 text-orange-400 border-b-2 border-orange-400" 
// //                   : "text-gray-500 hover:text-gray-300"
// //               }`}
// //             >
// //               📤 Unstake
// //             </button>
// //           </div>

// //           <div className="p-4 md:p-6">
// //             {/* Stake Tab */}
// //             {activeTab === "stake" && (
// //               <div className="space-y-4">
// //                 {/* Validator Selection - Custom Dropdown */}
// //                 <div ref={dropdownRef} className="relative">
// //                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Select Validator</label>
                  
// //                   {/* Dropdown Trigger */}
// //                   <button
// //                     type="button"
// //                     onClick={() => setValidatorDropdownOpen(!validatorDropdownOpen)}
// //                     className={`w-full bg-white/5 border ${validatorDropdownOpen ? 'border-[#BFFF00]/50 ring-1 ring-[#BFFF00]/20' : 'border-white/10'} rounded-xl p-3 md:p-4 text-left transition-all hover:border-white/20`}
// //                   >
// //                     <div className="flex items-center justify-between">
// //                       <div className="flex items-center gap-3">
// //                         <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
// //                           {selectedValidator.icon}
// //                         </div>
// //                         <div>
// //                           <div className="flex items-center gap-2">
// //                             <span className="font-bold text-white text-sm md:text-base">{selectedValidator.name}</span>
// //                             {selectedValidator.recommended && (
// //                               <span className="bg-[#BFFF00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">RECOMMENDED</span>
// //                             )}
// //                           </div>
// //                           <div className="flex items-center gap-3 mt-0.5">
// //                             <span className="text-[#BFFF00] text-xs font-bold">{selectedValidator.apy}% APY</span>
// //                             <span className="text-gray-500 text-xs">{selectedValidator.fee}% fee</span>
// //                           </div>
// //                         </div>
// //                       </div>
// //                       <svg 
// //                         className={`w-5 h-5 text-gray-400 transition-transform ${validatorDropdownOpen ? 'rotate-180' : ''}`} 
// //                         fill="none" 
// //                         stroke="currentColor" 
// //                         viewBox="0 0 24 24"
// //                       >
// //                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
// //                       </svg>
// //                     </div>
// //                   </button>

// //                   {/* Dropdown Menu */}
// //                   {validatorDropdownOpen && (
// //                     <div className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
// //                       <div className="p-2 border-b border-white/5">
// //                         <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-2">Available Validators</p>
// //                       </div>
// //                       <div className="max-h-[300px] overflow-y-auto">
// //                         {VALIDATORS.map((validator) => (
// //                           <button
// //                             key={validator.id}
// //                             type="button"
// //                             onClick={() => {
// //                               setSelectedValidator(validator);
// //                               setValidatorDropdownOpen(false);
// //                             }}
// //                             className={`w-full p-3 text-left transition-all hover:bg-white/5 ${
// //                               selectedValidator.id === validator.id ? 'bg-[#BFFF00]/5 border-l-2 border-[#BFFF00]' : 'border-l-2 border-transparent'
// //                             }`}
// //                           >
// //                             <div className="flex items-center gap-3">
// //                               <div className={`w-10 h-10 rounded-lg ${selectedValidator.id === validator.id ? 'bg-[#BFFF00]/20' : 'bg-white/10'} flex items-center justify-center text-xl`}>
// //                                 {validator.icon}
// //                               </div>
// //                               <div className="flex-1 min-w-0">
// //                                 <div className="flex items-center gap-2">
// //                                   <span className={`font-bold text-sm ${selectedValidator.id === validator.id ? 'text-[#BFFF00]' : 'text-white'}`}>
// //                                     {validator.name}
// //                                   </span>
// //                                   {validator.recommended && (
// //                                     <span className="bg-[#BFFF00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">BEST</span>
// //                                   )}
// //                                 </div>
// //                                 {validator.description ? (
// //                                   <p className="text-gray-500 text-xs mt-0.5">{validator.description}</p>
// //                                 ) : (
// //                                   <div className="flex items-center gap-3 mt-0.5">
// //                                     <span className="text-gray-500 text-xs">{validator.delegators?.toLocaleString()} delegators</span>
// //                                     <span className="text-gray-600 text-xs">•</span>
// //                                     <span className="text-gray-500 text-xs">{validator.totalStake} CSPR</span>
// //                                   </div>
// //                                 )}
// //                               </div>
// //                               <div className="text-right">
// //                                 <p className={`font-bold text-sm ${selectedValidator.id === validator.id ? 'text-[#BFFF00]' : 'text-[#BFFF00]/80'}`}>
// //                                   {validator.apy}%
// //                                 </p>
// //                                 <p className="text-gray-500 text-xs">{validator.fee}% fee</p>
// //                               </div>
// //                             </div>
// //                           </button>
// //                         ))}
// //                       </div>
// //                       <div className="p-3 border-t border-white/5 bg-white/[0.02]">
// //                         <div className="flex items-center gap-2 text-xs text-gray-500">
// //                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
// //                           </svg>
// //                           <span>APY varies based on network conditions</span>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* Amount Input */}
// //                 <div>
// //                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Amount to Stake</label>
// //                   <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#BFFF00]/50">
// //                     <input
// //                       type="number"
// //                       value={stakeAmount}
// //                       onChange={(e) => setStakeAmount(e.target.value)}
// //                       placeholder="0.0"
// //                       className="flex-1 bg-transparent px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-white focus:outline-none"
// //                     />
// //                     <span className="bg-white/10 px-4 py-3 md:py-4 font-bold text-gray-400 flex items-center">CSPR</span>
// //                   </div>
// //                   {connected && realBalance !== null && (
// //                     <div className="flex items-center justify-between mt-2 text-xs md:text-sm">
// //                       <span className="text-gray-500">Available: {realBalance.toFixed(2)} CSPR</span>
// //                       <button 
// //                         onClick={() => setStakeAmount(Math.max(0, realBalance - 20).toString())} 
// //                         className="text-[#FF0032] hover:text-[#FF0032]/80 font-bold"
// //                       >
// //                         MAX
// //                       </button>
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* Referral Code */}
// //                 <div>
// //                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Referral Code (Optional)</label>
// //                   <input
// //                     type="text"
// //                     value={referralCode}
// //                     onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
// //                     placeholder="Enter code for +0.5% APY bonus"
// //                     className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-[#BFFF00]/50"
// //                   />
// //                   {referralCode && (
// //                     <p className="text-xs text-green-400 mt-1">✓ Referral bonus: +0.5% APY!</p>
// //                   )}
// //                 </div>

// //                 {/* Summary Card */}
// //                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
// //                   <div className="flex justify-between text-sm">
// //                     <span className="text-gray-400">You stake:</span>
// //                     <span className="font-bold text-white">{stakeAmount || "0"} CSPR</span>
// //                   </div>
// //                   <div className="flex justify-between text-sm">
// //                     <span className="text-gray-400">You receive:</span>
// //                     <span className="font-bold text-[#BFFF00]">
// //                       {stakeAmount ? (parseFloat(stakeAmount) / exchangeRate).toFixed(4) : "0"} csCSPR
// //                     </span>
// //                   </div>
// //                   <div className="flex justify-between text-sm">
// //                     <span className="text-gray-400">Exchange rate:</span>
// //                     <span className="font-bold text-white">1 csCSPR = {exchangeRate.toFixed(4)} CSPR</span>
// //                   </div>
// //                   <div className="flex justify-between text-sm pt-2 border-t border-white/10">
// //                     <span className="text-gray-400">Est. APY:</span>
// //                     <span className="font-bold text-purple-400">{referralCode ? (selectedValidator.apy + 0.5).toFixed(1) : selectedValidator.apy}%</span>
// //                   </div>
// //                 </div>

// //                 {/* Feature Tags */}
// //                 <div className="flex flex-wrap gap-2">
// //                   <span className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium">📈 Auto-compound</span>
// //                   <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium">🛡️ Slashing Protection</span>
// //                   <span className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-medium">🔐 Threshold Security</span>
// //                 </div>

// //                 {/* Action Button */}
// //                 <button
// //                   onClick={connected ? handleStake : connect}
// //                   disabled={loading}
// //                   className="w-full py-4 bg-[#BFFF00] text-black font-bold text-base md:text-lg rounded-xl hover:bg-[#BFFF00]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
// //                 >
// //                   {loading ? (
// //                     <span className="flex items-center justify-center gap-2">
// //                       <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
// //                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
// //                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
// //                       </svg>
// //                       Processing...
// //                     </span>
// //                   ) : connected ? (
// //                     "🔐 Sign & Stake →"
// //                   ) : (
// //                     "Connect Wallet"
// //                   )}
// //                 </button>
// //               </div>
// //             )}

// //             {/* Unstake Tab */}
// //             {activeTab === "unstake" && (
// //               <div className="space-y-4">
// //                 {/* Two-Step Flow Info */}
// //                 <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
// //                   <p className="font-bold text-blue-400 text-sm mb-3">🔄 Two-Step Withdrawal</p>
// //                   <div className="flex flex-wrap items-center gap-2 text-xs">
// //                     <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded font-bold">Step 1</span>
// //                     <span className="text-gray-400">Request</span>
// //                     <span className="text-gray-600">→</span>
// //                     <span className="bg-white/10 text-gray-400 px-2 py-1 rounded">7 days</span>
// //                     <span className="text-gray-600">→</span>
// //                     <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded font-bold">Step 2</span>
// //                     <span className="text-gray-400">Withdraw</span>
// //                   </div>
// //                 </div>

// //                 {/* Pending Unstakes */}
// //                 {pendingUnstakes.length > 0 && (
// //                   <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
// //                     <p className="font-bold text-orange-400 text-sm mb-3">⏳ Pending Withdrawals</p>
// //                     <div className="space-y-2">
// //                       {pendingUnstakes.map((unstake, i) => (
// //                         <div key={i} className="flex justify-between items-center text-sm bg-white/5 rounded-lg px-3 py-2">
// //                           <span className="text-white font-bold">{unstake.amount.toFixed(2)} CSPR</span>
// //                           <span className="text-orange-400 text-xs">Unlocks: {unstake.unlockDate}</span>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Amount Input */}
// //                 <div>
// //                   <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Amount to Unstake</label>
// //                   <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-orange-400/50">
// //                     <input
// //                       type="number"
// //                       value={unstakeAmount}
// //                       onChange={(e) => setUnstakeAmount(e.target.value)}
// //                       placeholder="0.0"
// //                       className="flex-1 bg-transparent px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-white focus:outline-none"
// //                     />
// //                     <span className="bg-white/10 px-4 py-3 md:py-4 font-bold text-gray-400 flex items-center">csCSPR</span>
// //                   </div>
// //                   {connected && (
// //                     <div className="flex items-center justify-between mt-2 text-xs md:text-sm">
// //                       <span className="text-gray-500">Available: {cscsprBalance.toFixed(2)} csCSPR</span>
// //                       <button 
// //                         onClick={() => setUnstakeAmount(cscsprBalance.toString())} 
// //                         className="text-[#FF0032] hover:text-[#FF0032]/80 font-bold"
// //                       >
// //                         MAX
// //                       </button>
// //                     </div>
// //                   )}
// //                 </div>

// //                 {/* Summary Card */}
// //                 <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
// //                   <div className="flex justify-between text-sm">
// //                     <span className="text-gray-400">You burn:</span>
// //                     <span className="font-bold text-white">{unstakeAmount || "0"} csCSPR</span>
// //                   </div>
// //                   <div className="flex justify-between text-sm">
// //                     <span className="text-gray-400">You receive:</span>
// //                     <span className="font-bold text-[#BFFF00]">
// //                       {unstakeAmount ? (parseFloat(unstakeAmount) * exchangeRate).toFixed(4) : "0"} CSPR
// //                     </span>
// //                   </div>
// //                   <div className="flex justify-between text-sm pt-2 border-t border-white/10">
// //                     <span className="text-gray-400">Includes rewards:</span>
// //                     <span className="font-bold text-purple-400">
// //                       +{unstakeAmount ? ((parseFloat(unstakeAmount) * exchangeRate) - parseFloat(unstakeAmount)).toFixed(4) : "0"} CSPR
// //                     </span>
// //                   </div>
// //                 </div>

// //                 {/* Warning */}
// //                 <div className="bg-[#FF0032]/10 border-l-4 border-[#FF0032] rounded-r-xl p-4">
// //                   <p className="font-bold text-[#FF0032] text-sm">7-day unbonding period</p>
// //                   <p className="text-gray-400 text-xs mt-1">Protected by ThresholdModule (2-of-3 signatures required)</p>
// //                 </div>

// //                 {/* Action Button */}
// //                 <button
// //                   onClick={connected ? handleUnstake : connect}
// //                   disabled={loading}
// //                   className="w-full py-4 bg-[#FF0032] text-white font-bold text-base md:text-lg rounded-xl hover:bg-[#FF0032]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
// //                 >
// //                   {loading ? (
// //                     <span className="flex items-center justify-center gap-2">
// //                       <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
// //                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
// //                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
// //                       </svg>
// //                       Processing...
// //                     </span>
// //                   ) : connected ? (
// //                     "🔐 Sign & Unstake →"
// //                   ) : (
// //                     "Connect Wallet"
// //                   )}
// //                 </button>
// //               </div>
// //             )}
// //           </div>
// //         </div>

// //         {/* Help Text */}
// //         <p className="text-center text-gray-600 text-xs mt-4">
// //           Need testnet CSPR? Visit the <a href="https://testnet.cspr.live/tools/faucet" target="_blank" rel="noopener noreferrer" className="text-[#FF0032] hover:underline">Casper Faucet</a>
// //         </p>
// //       </section>
// //     </div>
// //   );
// // }

"use client";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/components/ToastProvider";
import { RuntimeArgs, CLValueBuilder, CLPublicKey, DeployUtil } from 'casper-js-sdk';

const CONTRACTS = {
  CASPER_STAKE: "hash-f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85",
};

// Validator data
const VALIDATORS = [
  { 
    id: "casperstake", 
    name: "CasperStake Pool", 
    apy: 12.5, 
    fee: 5,
    delegators: 1284,
    totalStake: "45.2M",
    status: "active",
    recommended: true,
    icon: "🏆"
  },
  { 
    id: "casperlabs", 
    name: "Casper Labs", 
    apy: 11.8, 
    fee: 8,
    delegators: 3421,
    totalStake: "128.5M",
    status: "active",
    recommended: false,
    icon: "🔴"
  },
  { 
    id: "hashquark", 
    name: "HashQuark", 
    apy: 11.5, 
    fee: 10,
    delegators: 892,
    totalStake: "32.1M",
    status: "active",
    recommended: false,
    icon: "⬡"
  },
  { 
    id: "everstake", 
    name: "Everstake", 
    apy: 11.2, 
    fee: 10,
    delegators: 2156,
    totalStake: "67.8M",
    status: "active",
    recommended: false,
    icon: "🌐"
  },
  { 
    id: "auto", 
    name: "Auto-Distribute", 
    apy: 11.8, 
    fee: 5,
    delegators: null,
    totalStake: null,
    status: "active",
    recommended: false,
    icon: "🔀",
    description: "Distribute across top validators"
  },
];

export default function StakePage() {
  const { 
    connected, walletAddress, realBalance, stakedBalance, cscsprBalance, 
    pendingUnstakes, exchangeRate, loading, connect,
    setStakedBalance, setCscsprBalance, setRealBalance, setPendingUnstakes, setLoading
  } = useWallet();
  
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState(VALIDATORS[0]);
  const [validatorDropdownOpen, setValidatorDropdownOpen] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    
    setLoading(true);
    const amount = parseFloat(stakeAmount);
    const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

    try {
      const runtimeArgs = RuntimeArgs.fromMap({
        "amount": CLValueBuilder.u64(amountMotes)
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

      showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

      const algoPrefix = walletAddress.substring(0, 2);
      const deployData = deployJson.deploy as any;
      deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
      const deployHash = await putDeployViaProxy(deployData);

      // Update balances
      const cscspr = amount / exchangeRate;
      setStakedBalance(prev => prev + amount);
      setCscsprBalance(prev => prev + cscspr);
      if (realBalance !== null) setRealBalance(prev => prev !== null ? prev - amount : null);
      
      showToast("success", "Stake Successful!", `Staked ${amount} CSPR`, deployHash, 8000);
      setStakeAmount("");
      
    } catch (error: any) {
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

    try {
      const runtimeArgs = RuntimeArgs.fromMap({
        "amount": CLValueBuilder.u64(amountMotes)
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

      showToast("info", "Broadcasting", "Submitting transaction to the network...", undefined, 0);

      const algoPrefix = walletAddress.substring(0, 2);
      const deployData = deployJson.deploy as any;
      deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      
      const deployHash = await putDeployViaProxy(deployData);

      const unlockDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
      setCscsprBalance(prev => prev - amount);
      setPendingUnstakes(prev => [...prev, { amount: amount * exchangeRate, unlockDate }]);
      
      showToast("success", "Unstake Requested!", `${amount} csCSPR queued for withdrawal. Unlocks: ${unlockDate}`, deployHash, 8000);
      setUnstakeAmount("");
      
    } catch (error: any) {
      showToast("error", "Unstake Failed", error.message || "Transaction failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section - Casper Style */}
      <section className="bg-gradient-to-b from-[#FF0032]/10 to-black py-8 md:py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4">
            Liquid <span className="text-[#FF0032]">Staking</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl">
            Stake CSPR and receive csCSPR. Earn 12.5% APY with auto-compounding rewards while maintaining full liquidity.
          </p>
        </div>
      </section>

      {/* Stats Bar - Casper Red */}
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
            <p className="text-red-200 text-xs md:text-sm">Active Validators</p>
            <p className="text-lg md:text-2xl font-black text-white">25</p>
          </div>
        </div>
      </section>

      {/* User Balances - Only when connected */}
      {connected && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          {/* Balance Cards */}
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
              <p className="text-green-400 text-xs mt-1">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} rewards</p>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 p-3 md:p-4 rounded-xl">
              <p className="text-gray-500 text-xs md:text-sm mb-1">csCSPR Balance</p>
              <p className="text-lg md:text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/20 p-3 md:p-4 rounded-xl">
              <p className="text-gray-500 text-xs md:text-sm mb-1">Pending Unstakes</p>
              <p className="text-lg md:text-2xl font-black text-orange-400">{pendingUnstakes.length}</p>
            </div>
          </div>

          {/* Rewards & Status Panels */}
          <div className="grid md:grid-cols-3 gap-3 md:gap-4 mt-4">
            <div className="bg-green-900/20 border border-green-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-xl">📈</div>
              <div>
                <p className="text-green-400 font-bold text-sm">Auto-Compound Active</p>
                <p className="text-gray-500 text-xs">Rewards reinvested daily</p>
              </div>
            </div>
            <div className="bg-purple-900/20 border border-purple-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-xl">🎯</div>
              <div>
                <p className="text-purple-400 font-bold text-sm">Projected Yearly</p>
                <p className="text-white font-bold">{(cscsprBalance * 0.125).toFixed(2)} CSPR</p>
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 p-3 md:p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xl">🛡️</div>
              <div>
                <p className="text-blue-400 font-bold text-sm">Slashing Protection</p>
                <p className="text-gray-500 text-xs">ThresholdModule Active</p>
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
            {/* Stake Tab */}
            {activeTab === "stake" && (
              <div className="space-y-4">
                {/* Validator Selection - Custom Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Select Validator</label>
                  
                  {/* Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => setValidatorDropdownOpen(!validatorDropdownOpen)}
                    className={`w-full bg-white/5 border ${validatorDropdownOpen ? 'border-[#BFFF00]/50 ring-1 ring-[#BFFF00]/20' : 'border-white/10'} rounded-xl p-3 md:p-4 text-left transition-all hover:border-white/20`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                          {selectedValidator.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm md:text-base">{selectedValidator.name}</span>
                            {selectedValidator.recommended && (
                              <span className="bg-[#BFFF00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">RECOMMENDED</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[#BFFF00] text-xs font-bold">{selectedValidator.apy}% APY</span>
                            <span className="text-gray-500 text-xs">{selectedValidator.fee}% fee</span>
                          </div>
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${validatorDropdownOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {validatorDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                      <div className="p-2 border-b border-white/5">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold px-2">Available Validators</p>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {VALIDATORS.map((validator) => (
                          <button
                            key={validator.id}
                            type="button"
                            onClick={() => {
                              setSelectedValidator(validator);
                              setValidatorDropdownOpen(false);
                            }}
                            className={`w-full p-3 text-left transition-all hover:bg-white/5 ${
                              selectedValidator.id === validator.id ? 'bg-[#BFFF00]/5 border-l-2 border-[#BFFF00]' : 'border-l-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${selectedValidator.id === validator.id ? 'bg-[#BFFF00]/20' : 'bg-white/10'} flex items-center justify-center text-xl`}>
                                {validator.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold text-sm ${selectedValidator.id === validator.id ? 'text-[#BFFF00]' : 'text-white'}`}>
                                    {validator.name}
                                  </span>
                                  {validator.recommended && (
                                    <span className="bg-[#BFFF00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">BEST</span>
                                  )}
                                </div>
                                {validator.description ? (
                                  <p className="text-gray-500 text-xs mt-0.5">{validator.description}</p>
                                ) : (
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-gray-500 text-xs">{validator.delegators?.toLocaleString()} delegators</span>
                                    <span className="text-gray-600 text-xs">•</span>
                                    <span className="text-gray-500 text-xs">{validator.totalStake} CSPR</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className={`font-bold text-sm ${selectedValidator.id === validator.id ? 'text-[#BFFF00]' : 'text-[#BFFF00]/80'}`}>
                                  {validator.apy}%
                                </p>
                                <p className="text-gray-500 text-xs">{validator.fee}% fee</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>APY varies based on network conditions</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Amount to Stake</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#BFFF00]/50">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-white focus:outline-none"
                    />
                    <span className="bg-white/10 px-4 py-3 md:py-4 font-bold text-gray-400 flex items-center">CSPR</span>
                  </div>
                  {connected && realBalance !== null && (
                    <div className="flex items-center justify-between mt-2 text-xs md:text-sm">
                      <span className="text-gray-500">Available: {realBalance.toFixed(2)} CSPR</span>
                      <button 
                        onClick={() => setStakeAmount(Math.max(0, realBalance - 20).toString())} 
                        className="text-[#FF0032] hover:text-[#FF0032]/80 font-bold"
                      >
                        MAX
                      </button>
                    </div>
                  )}
                </div>

                {/* Referral Code */}
                <div>
                  <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter code for +0.5% APY bonus"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-[#BFFF00]/50"
                  />
                  {referralCode && (
                    <p className="text-xs text-green-400 mt-1">✓ Referral bonus: +0.5% APY!</p>
                  )}
                </div>

                {/* Summary Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You stake:</span>
                    <span className="font-bold text-white">{stakeAmount || "0"} CSPR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You receive:</span>
                    <span className="font-bold text-[#BFFF00]">
                      {stakeAmount ? (parseFloat(stakeAmount) / exchangeRate).toFixed(4) : "0"} csCSPR
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Exchange rate:</span>
                    <span className="font-bold text-white">1 csCSPR = {exchangeRate.toFixed(4)} CSPR</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                    <span className="text-gray-400">Est. APY:</span>
                    <span className="font-bold text-purple-400">{referralCode ? (selectedValidator.apy + 0.5).toFixed(1) : selectedValidator.apy}%</span>
                  </div>
                </div>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium">📈 Auto-compound</span>
                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium">🛡️ Slashing Protection</span>
                  <span className="bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-medium">🔐 Threshold Security</span>
                </div>

                {/* Action Button */}
                <button
                  onClick={connected ? handleStake : connect}
                  disabled={loading}
                  className="w-full py-4 bg-[#BFFF00] text-black font-bold text-base md:text-lg rounded-xl hover:bg-[#BFFF00]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : connected ? (
                    "🔐 Sign & Stake →"
                  ) : (
                    "Connect Wallet"
                  )}
                </button>
              </div>
            )}

            {/* Unstake Tab */}
            {activeTab === "unstake" && (
              <div className="space-y-4">
                {/* Your Position Summary - Brief context */}
                <div className="bg-gradient-to-r from-[#BFFF00]/10 to-transparent border border-[#BFFF00]/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-xs">Your csCSPR Balance</p>
                      <p className="text-2xl font-black text-white">{cscsprBalance.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Current Value</p>
                      <p className="text-2xl font-black text-[#BFFF00]">{(cscsprBalance * exchangeRate).toFixed(2)} <span className="text-sm text-gray-500">CSPR</span></p>
                    </div>
                  </div>
                </div>

                {/* Amount Input - PRIMARY ACTION */}
                <div>
                  <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Amount to Unstake</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-orange-400/50">
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-transparent px-4 py-3 md:py-4 text-lg md:text-xl font-bold text-white focus:outline-none"
                    />
                    <span className="bg-white/10 px-4 py-3 md:py-4 font-bold text-gray-400 flex items-center">csCSPR</span>
                  </div>
                  {connected && (
                    <div className="flex items-center justify-between mt-2 text-xs md:text-sm">
                      <span className="text-gray-500">Available: {cscsprBalance.toFixed(2)} csCSPR</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setUnstakeAmount((cscsprBalance * 0.25).toFixed(2))} 
                          className="text-gray-400 hover:text-white text-xs font-medium px-2 py-0.5 bg-white/5 rounded hover:bg-white/10"
                        >
                          25%
                        </button>
                        <button 
                          onClick={() => setUnstakeAmount((cscsprBalance * 0.5).toFixed(2))} 
                          className="text-gray-400 hover:text-white text-xs font-medium px-2 py-0.5 bg-white/5 rounded hover:bg-white/10"
                        >
                          50%
                        </button>
                        <button 
                          onClick={() => setUnstakeAmount((cscsprBalance * 0.75).toFixed(2))} 
                          className="text-gray-400 hover:text-white text-xs font-medium px-2 py-0.5 bg-white/5 rounded hover:bg-white/10"
                        >
                          75%
                        </button>
                        <button 
                          onClick={() => setUnstakeAmount(cscsprBalance.toFixed(2))} 
                          className="text-[#FF0032] hover:text-[#FF0032]/80 font-bold"
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Card - Immediately shows what user gets */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-400 text-sm">You will receive</span>
                    <span className="text-xs text-gray-500">Rate: 1 csCSPR = {exchangeRate.toFixed(4)} CSPR</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-black text-[#BFFF00]">
                        {unstakeAmount ? (parseFloat(unstakeAmount) * exchangeRate).toFixed(2) : "0.00"}
                      </p>
                      <p className="text-gray-500 text-xs">CSPR</p>
                    </div>
                    {unstakeAmount && parseFloat(unstakeAmount) > 0 && (
                      <div className="text-right">
                        <p className="text-green-400 text-sm font-bold">
                          +{((parseFloat(unstakeAmount) * exchangeRate) - parseFloat(unstakeAmount)).toFixed(4)} rewards
                        </p>
                        <p className="text-gray-500 text-xs">
                          ≈ ${((parseFloat(unstakeAmount) * exchangeRate) * 0.047).toFixed(2)} USD
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7-Day Warning - Important but compact */}
                <div className="flex items-center gap-3 bg-[#FF0032]/10 border border-[#FF0032]/20 rounded-xl px-4 py-3">
                  <span className="text-lg">⏳</span>
                  <div className="flex-1">
                    <span className="text-[#FF0032] font-bold text-sm">7-day unbonding</span>
                    <span className="text-gray-400 text-sm ml-2">• Rewards stop immediately</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={connected ? handleUnstake : connect}
                  disabled={loading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                  className="w-full py-4 bg-[#FF0032] text-white font-bold text-base md:text-lg rounded-xl hover:bg-[#FF0032]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : connected ? (
                    `🔐 Request Unstake${unstakeAmount ? ` ${unstakeAmount} csCSPR` : ''} →`
                  ) : (
                    "Connect Wallet"
                  )}
                </button>

                {/* Pending Unstakes - Show if any exist */}
                {pendingUnstakes.length > 0 && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-orange-500/10 flex items-center justify-between">
                      <p className="font-bold text-orange-400 text-sm">⏳ Pending Withdrawals</p>
                      <span className="text-orange-400 text-xs">{pendingUnstakes.length} pending</span>
                    </div>
                    <div className="divide-y divide-orange-500/10">
                      {pendingUnstakes.map((unstake, i) => {
                        const daysRemaining = Math.max(0, 7 - i);
                        const progress = ((7 - daysRemaining) / 7) * 100;
                        const isReady = daysRemaining === 0;
                        
                        return (
                          <div key={i} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                {isReady ? <span className="text-green-400">✓</span> : <span className="text-orange-400 text-xs font-bold">{daysRemaining}d</span>}
                              </div>
                              <div>
                                <p className="text-white font-bold text-sm">{unstake.amount.toFixed(2)} CSPR</p>
                                <p className="text-gray-500 text-xs">{unstake.unlockDate}</p>
                              </div>
                            </div>
                            {isReady ? (
                              <button className="px-3 py-1.5 bg-green-500 text-black text-xs font-bold rounded-lg">
                                Withdraw
                              </button>
                            ) : (
                              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Collapsible Info Section - Secondary content */}
                <details className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <summary className="p-4 cursor-pointer flex items-center justify-between text-gray-400 hover:text-white transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400">ℹ️</span>
                      <span className="text-sm font-medium">How withdrawal works</span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-xs text-gray-500 space-y-3 border-t border-white/10 pt-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">1</div>
                      <p><span className="text-white">Request unstake</span> — Burns your csCSPR and starts the 7-day unbonding period</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">⏳</div>
                      <p><span className="text-white">7-day waiting</span> — Required by Casper network for security. You stop earning rewards.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-400 flex-shrink-0">2</div>
                      <p><span className="text-white">Withdraw</span> — Claim your CSPR to your wallet after unbonding completes</p>
                    </div>
                    <p className="text-gray-600 pt-2 border-t border-white/5">
                      💡 csCSPR is a pooled token representing your share across all validators. The protocol handles which validators to withdraw from.
                    </p>
                  </div>
                </details>

                {/* Security Note - Footer */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                  <span>🛡️</span>
                  <span>Protected by ThresholdModule multisig</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-600 text-xs mt-4">
          Need testnet CSPR? Visit the <a href="https://testnet.cspr.live/tools/faucet" target="_blank" rel="noopener noreferrer" className="text-[#FF0032] hover:underline">Casper Faucet</a>
        </p>
      </section>
    </div>
  );
}

