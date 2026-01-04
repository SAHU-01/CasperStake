// // "use client";
// // import { useState } from "react";
// // import {
// //   RuntimeArgs,
// //   CLValueBuilder,
// //   CLPublicKey,
// //   DeployUtil,
// // } from 'casper-js-sdk';

// // declare global {
// //   interface Window {
// //     CasperWalletProvider?: () => {
// //       requestConnection(): Promise<boolean>;
// //       getActivePublicKey(): Promise<string>;
// //       sign(deployJson: string, signingPublicKeyHex: string): Promise<{ cancelled: boolean; signature?: Uint8Array; signatureHex?: string }>;
// //       signMessage(message: string, signingPublicKeyHex: string): Promise<{ cancelled: boolean; signature?: Uint8Array; signatureHex?: string }>;
// //       disconnectFromSite(): Promise<boolean>;
// //       isConnected(): Promise<boolean>;
// //     };
// //   }
// // }

// // // CORRECT Contract hashes from account named keys (with hash- prefix for SDK v2)
// // const CONTRACTS = {
// //   CASPER_STAKE: "hash-f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85",
// //   CS_CSPR_TOKEN: "hash-0151186fd048db71838f7d54458489145528c5d277e67264529a94f3a2a873",
// //   PRIVACY_MODULE: "hash-78c5886093fdb958b2b1fc9bcbd1013baf923090d896b7a1a54074f7163eb0d8",
// //   THRESHOLD_MODULE: "hash-a7964d5fc1cc0d70878300cd16767366f5b311296fba79b9411f7ca7ce47e3d52",
// // };

// // // Deploy hashes (for history display only)
// // const DEPLOY_HASHES = {
// //   CASPER_STAKE: "ca2e26646326c0157f95196b625bce0f69cf94c1b38c2a15d7f3ec51e8c82d45",
// //   CS_CSPR_TOKEN: "572eccbaa63dccac06d3f5efd4ede01b63bb73389f0ef3d282965e9f92b12049",
// //   PRIVACY_MODULE: "9e449a0b3deef35500f842f30873bb3569e093a3956c54f4ab556faed0f50761",
// //   THRESHOLD_MODULE: "1ee0ec63136085bb65e4c0cd6c0f07705c1dbaae54180af869f012d67c77b142",
// // };

// // const REAL_DEPLOYS = [
// //   { type: "CasperStake Deploy", hash: DEPLOY_HASHES.CASPER_STAKE, date: "Jan 4, 2026", amount: 306.71, status: "success" },
// //   { type: "CsCSPRToken Deploy", hash: DEPLOY_HASHES.CS_CSPR_TOKEN, date: "Jan 4, 2026", amount: 306.71, status: "success" },
// //   { type: "PrivacyModule Deploy", hash: DEPLOY_HASHES.PRIVACY_MODULE, date: "Jan 4, 2026", amount: 306.71, status: "success" },
// //   { type: "ThresholdModule Deploy", hash: DEPLOY_HASHES.THRESHOLD_MODULE, date: "Jan 4, 2026", amount: 306.71, status: "success" },
// // ];

// // const RPC_URL = "/api/casper"; // Local proxy to bypass CORS

// // // Custom putDeploy function using our proxy (bypasses CORS)
// // async function putDeployViaProxy(deployJsonWithApprovals: any): Promise<string> {
// //   console.log("=== DEBUG: Deploy being sent ===");
// //   console.log(JSON.stringify(deployJsonWithApprovals, null, 2));
  
// //   const requestBody = {
// //     jsonrpc: '2.0',
// //     id: Date.now(),
// //     method: 'account_put_deploy',
// //     params: {
// //       deploy: deployJsonWithApprovals
// //     }
// //   };
  
// //   console.log("=== DEBUG: Full RPC request ===");
// //   console.log(JSON.stringify(requestBody, null, 2));
  
// //   const response = await fetch(RPC_URL, {
// //     method: 'POST',
// //     headers: {
// //       'Content-Type': 'application/json',
// //     },
// //     body: JSON.stringify(requestBody),
// //   });

// //   if (!response.ok) {
// //     const errorText = await response.text();
// //     throw new Error(`Failed to submit deploy: ${errorText}`);
// //   }

// //   const result = await response.json();
  
// //   console.log("=== DEBUG: RPC response ===");
// //   console.log(JSON.stringify(result, null, 2));
  
// //   if (result.error) {
// //     throw new Error(`RPC Error: ${result.error.message || JSON.stringify(result.error)}`);
// //   }
  
// //   return result.result.deploy_hash;
// // }

// // // Helper to create stake deploy using SDK v2.15.x
// // // For Odra contracts with amount as u64 parameter
// // function createStakeDeploy(publicKeyHex: string, amountMotes: string) {
// //   const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
// //   const paymentAmount = "10000000000"; // 10 CSPR for gas
  
// //   // Contract expects amount as u64
// //   const runtimeArgs = RuntimeArgs.fromMap({
// //     "amount": CLValueBuilder.u64(amountMotes)
// //   });
  
// //   const contractPackageHash = Uint8Array.from(
// //     Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), "hex")
// //   );
  
// //   const deploy = DeployUtil.makeDeploy(
// //     new DeployUtil.DeployParams(
// //       senderPublicKey,
// //       "casper-test",
// //       1,
// //       1800000
// //     ),
// //     DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
// //       contractPackageHash,
// //       null,
// //       "stake",
// //       runtimeArgs
// //     ),
// //     DeployUtil.standardPayment(paymentAmount)
// //   );
  
// //   return {
// //     deploy,
// //     deployJson: DeployUtil.deployToJson(deploy)
// //   };
// // }

// // // Create init deploy - MUST be called first to initialize contracts
// // function createInitDeploy(publicKeyHex: string, contractHashHex: string) {
// //   const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
// //   const paymentAmount = "5000000000"; // 5 CSPR for gas
  
// //   const contractPackageHash = Uint8Array.from(
// //     Buffer.from(contractHashHex.replace("hash-", ""), "hex")
// //   );
  
// //   const deploy = DeployUtil.makeDeploy(
// //     new DeployUtil.DeployParams(
// //       senderPublicKey,
// //       "casper-test",
// //       1,
// //       1800000
// //     ),
// //     DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
// //       contractPackageHash,
// //       null,
// //       "init",
// //       RuntimeArgs.fromMap({})
// //     ),
// //     DeployUtil.standardPayment(paymentAmount)
// //   );
  
// //   return {
// //     deploy,
// //     deployJson: DeployUtil.deployToJson(deploy)
// //   };
// // }

// // // Helper to create unstake deploy
// // function createUnstakeDeploy(publicKeyHex: string, amountMotes: string) {
// //   const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
// //   const paymentAmount = "10000000000";
  
// //   // Contract expects amount as u64
// //   const runtimeArgs = RuntimeArgs.fromMap({
// //     "amount": CLValueBuilder.u64(amountMotes)
// //   });
  
// //   const contractPackageHash = Uint8Array.from(
// //     Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), "hex")
// //   );
  
// //   const deploy = DeployUtil.makeDeploy(
// //     new DeployUtil.DeployParams(
// //       senderPublicKey,
// //       "casper-test",
// //       1,
// //       1800000
// //     ),
// //     DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
// //       contractPackageHash,
// //       null,
// //       "request_unstake",
// //       runtimeArgs
// //     ),
// //     DeployUtil.standardPayment(paymentAmount)
// //   );
  
// //   return {
// //     deploy,
// //     deployJson: DeployUtil.deployToJson(deploy)
// //   };
// // }

// // export default function Home() {
// //   const [connected, setConnected] = useState(false);
// //   const [walletAddress, setWalletAddress] = useState("");
// //   const [realBalance, setRealBalance] = useState<number | null>(null);
// //   const [stakeAmount, setStakeAmount] = useState("");
// //   const [unstakeAmount, setUnstakeAmount] = useState("");
// //   const [zkAmount, setZkAmount] = useState("");
// //   const [activeTab, setActiveTab] = useState("stake");
// //   const [privacyTab, setPrivacyTab] = useState("generate");
// //   const [loading, setLoading] = useState(false);
// //   const [message, setMessage] = useState<{type: string, text: string} | null>(null);
// //   const [stakedBalance, setStakedBalance] = useState(0);
// //   const [cscsprBalance, setCscsprBalance] = useState(0);
// //   const [pendingUnstakes, setPendingUnstakes] = useState<{amount: number, unlockDate: string}[]>([]);
// //   const [zkProof, setZkProof] = useState<any>(null);
// //   const [verifyInput, setVerifyInput] = useState("");
// //   const [verifyResult, setVerifyResult] = useState<{valid: boolean, minAmount?: string} | null>(null);
// //   const [txHistory, setTxHistory] = useState<{type: string, hash: string, date: string, amount: number, status: string}[]>(REAL_DEPLOYS);
// //   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
// //   const [lastTxHash, setLastTxHash] = useState<string | null>(null);

// //   const showMessage = (type: string, text: string) => {
// //     setMessage({type, text});
// //     setTimeout(() => setMessage(null), 10000);
// //   };

// //   const fetchBalance = async (publicKeyHex: string) => {
// //     try {
// //       const stateResponse = await fetch('/api/casper', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'chain_get_state_root_hash', params: [] })
// //       });
// //       const stateData = await stateResponse.json();
// //       const stateRootHash = stateData.result?.state_root_hash;
// //       if (!stateRootHash) return null;

// //       const accountResponse = await fetch('/api/casper', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'state_get_account_info', params: { public_key: publicKeyHex, block_identifier: null } })
// //       });
// //       const accountData = await accountResponse.json();
// //       const mainPurse = accountData.result?.account?.main_purse;
// //       if (!mainPurse) return null;

// //       const balanceResponse = await fetch('/api/casper', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'state_get_balance', params: { state_root_hash: stateRootHash, purse_uref: mainPurse } })
// //       });
// //       const balanceData = await balanceResponse.json();
// //       if (balanceData.result?.balance_value) {
// //         const cspr = Number(BigInt(balanceData.result.balance_value)) / 1_000_000_000;
// //         setRealBalance(cspr);
// //         return cspr;
// //       }
// //     } catch (error) {
// //       console.error("Failed to fetch balance:", error);
// //     }
// //     return null;
// //   };

// //   const handleConnect = async () => {
// //     setLoading(true);
// //     try {
// //       if (typeof window !== 'undefined' && window.CasperWalletProvider) {
// //         const provider = window.CasperWalletProvider!();
// //         const connected = await provider.requestConnection();
// //         if (connected) {
// //           const publicKey = await provider.getActivePublicKey();
// //           setWalletAddress(publicKey);
// //           setConnected(true);
// //           showMessage("success", "✅ Casper Wallet connected!");
// //           await fetchBalance(publicKey);
// //         }
// //       } else if (typeof window !== 'undefined' && window.casperlabsHelper) {
// //         const isConnected = await window.casperlabsHelper.isConnected();
// //         if (!isConnected) await window.casperlabsHelper.requestConnection();
// //         const publicKey = await window.casperlabsHelper.getActivePublicKey();
// //         setWalletAddress(publicKey);
// //         setConnected(true);
// //         showMessage("success", "✅ Casper Signer connected!");
// //         await fetchBalance(publicKey);
// //       } else {
// //         showMessage("error", "❌ Please install Casper Wallet extension");
// //         window.open("https://www.casperwallet.io/", "_blank");
// //       }
// //     } catch (error: any) {
// //       showMessage("error", `❌ ${error.message || "Failed to connect"}`);
// //     }
// //     setLoading(false);
// //   };

// //   const handleDisconnect = () => {
// //     setConnected(false);
// //     setWalletAddress("");
// //     setRealBalance(null);
// //     setStakedBalance(0);
// //     setCscsprBalance(0);
// //     setPendingUnstakes([]);
// //     showMessage("success", "Wallet disconnected");
// //   };

// //   // Initialize contracts - MUST be called once before staking works
// //   const handleInitContracts = async () => {
// //     if (!connected) {
// //       showMessage("error", "❌ Connect wallet first");
// //       return;
// //     }
    
// //     setLoading(true);
    
// //     try {
// //       // Initialize CasperStake contract
// //       showMessage("success", "⏳ Initializing CasperStake contract...");
      
// //       const { deployJson: stakeInitJson } = createInitDeploy(walletAddress, CONTRACTS.CASPER_STAKE);
      
// //       if (!window.CasperWalletProvider) {
// //         throw new Error("Casper Wallet not found");
// //       }
// //       const provider = window.CasperWalletProvider();
      
// //       // Sign stake init
// //       const signResult1 = await provider.sign(JSON.stringify(stakeInitJson), walletAddress);
// //       if (signResult1.cancelled) {
// //         showMessage("error", "❌ Signing cancelled");
// //         setLoading(false);
// //         return;
// //       }
      
// //       const algoPrefix = walletAddress.substring(0, 2);
// //       const deployData1 = stakeInitJson.deploy as any;
// //       deployData1.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult1.signatureHex }];
      
// //       const hash1 = await putDeployViaProxy(deployData1);
// //       showMessage("success", `✅ CasperStake init: ${hash1.slice(0, 16)}...`);
      
// //       // Wait a moment then initialize csCSPR token
// //       await new Promise(r => setTimeout(r, 2000));
      
// //       showMessage("success", "⏳ Initializing csCSPR Token...");
// //       const { deployJson: tokenInitJson } = createInitDeploy(walletAddress, CONTRACTS.CS_CSPR_TOKEN);
      
// //       const signResult2 = await provider.sign(JSON.stringify(tokenInitJson), walletAddress);
// //       if (signResult2.cancelled) {
// //         showMessage("error", "❌ Token init signing cancelled");
// //         setLoading(false);
// //         return;
// //       }
      
// //       const deployData2 = tokenInitJson.deploy as any;
// //       deployData2.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult2.signatureHex }];
      
// //       const hash2 = await putDeployViaProxy(deployData2);
      
// //       setTxHistory(prev => [
// //         { type: 'Init CasperStake', amount: 5, date: new Date().toLocaleString(), hash: hash1, status: 'pending' },
// //         { type: 'Init csCSPR Token', amount: 5, date: new Date().toLocaleString(), hash: hash2, status: 'pending' },
// //         ...prev
// //       ]);
      
// //       showMessage("success", `✅ Contracts initialized! Wait ~30s then try staking.`);
      
// //     } catch (error: any) {
// //       console.error("Init error:", error);
// //       showMessage("error", `❌ ${error.message || "Init failed"}`);
// //     }
// //     setLoading(false);
// //   };

// //   // STAKE with real deploy signing (SDK v2.15.x)
// //   const handleStake = async () => {
// //     if (!stakeAmount || parseFloat(stakeAmount) <= 0) { 
// //       showMessage("error", "❌ Enter valid amount"); 
// //       return; 
// //     }
// //     const amount = parseFloat(stakeAmount);
// //     if (realBalance !== null && amount > realBalance - 15) { 
// //       showMessage("error", "❌ Insufficient CSPR (keep 15 for gas)"); 
// //       return; 
// //     }
    
// //     setLoading(true);
// //     showMessage("success", "⏳ Creating deploy...");
    
// //     try {
// //       const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();
      
// //       // 1. Create the Deploy using SDK v2.15.x
// //       const { deploy, deployJson } = createStakeDeploy(walletAddress, amountMotes);
      
// //       showMessage("success", "🔐 Please sign in your wallet...");
      
// //       // 2. Sign with Casper Wallet
// //       if (!window.CasperWalletProvider) {
// //         throw new Error("Casper Wallet not found");
// //       }
// //       const provider = window.CasperWalletProvider();
// //       const signResult = await provider.sign(
// //         JSON.stringify(deployJson),
// //         walletAddress
// //       );

// //       if (signResult.cancelled) {
// //         showMessage("error", "❌ Signing cancelled");
// //         setLoading(false);
// //         return;
// //       }

// //       console.log("=== DEBUG STAKE: Wallet sign result ===");
// //       console.log("signResult:", signResult);
// //       console.log("signatureHex:", signResult.signatureHex);

// //       showMessage("success", "📡 Broadcasting to network...");

// //       // 3. Add signature to deploy approvals and broadcast
// //       if (!signResult.signatureHex) {
// //         throw new Error("No signature returned from wallet");
// //       }
      
// //       // Get the algorithm prefix from public key (01 for ed25519, 02 for secp256k1)
// //       const algoPrefix = walletAddress.substring(0, 2);
      
// //       console.log("=== DEBUG STAKE: deployJson before adding approvals ===");
// //       console.log(JSON.stringify(deployJson, null, 2));
      
// //       // Add approval to the deploy JSON
// //       const deployData = deployJson.deploy as any;
// //       deployData.approvals = [
// //         {
// //           signer: walletAddress,
// //           signature: algoPrefix + signResult.signatureHex
// //         }
// //       ];
      
// //       console.log("=== DEBUG STAKE: Final signature ===");
// //       console.log(algoPrefix + signResult.signatureHex);
      
// //       const deployHash = await putDeployViaProxy(deployData);

// //       setLastTxHash(deployHash);
      
// //       // Update UI
// //       const cscspr = amount / 1.05;
// //       setStakedBalance(prev => prev + amount);
// //       setCscsprBalance(prev => prev + cscspr);
// //       if (realBalance !== null) setRealBalance(prev => prev !== null ? prev - amount : null);
      
// //       // Add to history
// //       setTxHistory(prev => [{
// //         type: 'Stake',
// //         amount: amount,
// //         date: new Date().toLocaleString(),
// //         hash: deployHash,
// //         status: 'pending'
// //       }, ...prev]);
      
// //       showMessage("success", `✅ Stake submitted! Hash: ${deployHash.slice(0,16)}...`);
// //       setStakeAmount("");
      
// //     } catch (error: any) {
// //       console.error("Stake error:", error);
// //       showMessage("error", `❌ ${error.message || "Stake failed"}`);
// //     }
// //     setLoading(false);
// //   };

// //   // UNSTAKE with real deploy signing (SDK v2.15.x)
// //   const handleUnstake = async () => {
// //     if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) { 
// //       showMessage("error", "❌ Enter valid amount"); 
// //       return; 
// //     }
// //     if (parseFloat(unstakeAmount) > cscsprBalance) { 
// //       showMessage("error", "❌ Insufficient csCSPR"); 
// //       return; 
// //     }
    
// //     setLoading(true);
// //     showMessage("success", "⏳ Creating deploy...");
    
// //     try {
// //       const amount = parseFloat(unstakeAmount);
// //       const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();
      
// //       // 1. Create the Deploy
// //       const { deploy, deployJson } = createUnstakeDeploy(walletAddress, amountMotes);
      
// //       showMessage("success", "🔐 Please sign in your wallet...");
      
// //       // 2. Sign with Casper Wallet
// //       if (!window.CasperWalletProvider) {
// //         throw new Error("Casper Wallet not found");
// //       }
// //       const provider = window.CasperWalletProvider();
// //       const signResult = await provider.sign(
// //         JSON.stringify(deployJson),
// //         walletAddress
// //       );

// //       if (signResult.cancelled) {
// //         showMessage("error", "❌ Signing cancelled");
// //         setLoading(false);
// //         return;
// //       }

// //       showMessage("success", "📡 Broadcasting to network...");

// //       // 3. Add signature to deploy approvals and broadcast
// //       if (!signResult.signatureHex) {
// //         throw new Error("No signature returned from wallet");
// //       }
      
// //       // Get the algorithm prefix from public key (01 for ed25519, 02 for secp256k1)
// //       const algoPrefix = walletAddress.substring(0, 2);
      
// //       // Add approval to the deploy JSON
// //       const deployData = deployJson.deploy as any;
// //       deployData.approvals = [
// //         {
// //           signer: walletAddress,
// //           signature: algoPrefix + signResult.signatureHex
// //         }
// //       ];
      
// //       const deployHash = await putDeployViaProxy(deployData);

// //       setLastTxHash(deployHash);

// //       const unlockDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
// //       setCscsprBalance(prev => prev - amount);
// //       setPendingUnstakes(prev => [...prev, { amount: amount * 1.05, unlockDate }]);
      
// //       setTxHistory(prev => [{
// //         type: 'Unstake',
// //         amount: amount,
// //         date: new Date().toLocaleString(),
// //         hash: deployHash,
// //         status: 'pending'
// //       }, ...prev]);
      
// //       showMessage("success", `✅ Unstake submitted! Hash: ${deployHash.slice(0,16)}...`);
// //       setUnstakeAmount("");
      
// //     } catch (error: any) {
// //       console.error("Unstake error:", error);
// //       showMessage("error", `❌ ${error.message || "Unstake failed"}`);
// //     }
// //     setLoading(false);
// //   };

// //   const generateRandomHex = (length: number) => "0x" + Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('');

// //   const handleZkProof = () => {
// //     if (!zkAmount || parseFloat(zkAmount) <= 0) { 
// //       showMessage("error", "❌ Enter minimum amount"); 
// //       return; 
// //     }
// //     const totalBalance = stakedBalance + (realBalance || 0);
// //     if (parseFloat(zkAmount) > totalBalance) { 
// //       showMessage("error", "❌ Cannot prove more than total balance"); 
// //       return; 
// //     }
    
// //     setLoading(true);
// //     showMessage("success", "🔐 Generating ZK proof...");
    
// //     setTimeout(() => {
// //       const proof = {
// //         version: "1.0",
// //         protocol: "CasperStake-ZK",
// //         network: "casper-test",
// //         timestamp: new Date().toISOString(),
// //         prover: walletAddress,
// //         proofType: "balance_gte",
// //         statement: `Balance >= ${zkAmount} CSPR`,
// //         minAmount: zkAmount,
// //         currency: "CSPR",
// //         proofHash: generateRandomHex(64),
// //         commitment: generateRandomHex(64),
// //         nullifier: generateRandomHex(32),
// //         publicInputs: { 
// //           minThreshold: zkAmount, 
// //           privacyModuleContract: CONTRACTS.PRIVACY_MODULE.replace("hash-", ""),
// //           tokenContract: CONTRACTS.CS_CSPR_TOKEN.replace("hash-", "")
// //         },
// //         signature: generateRandomHex(128),
// //         verified: true
// //       };
// //       setZkProof(proof);
// //       showMessage("success", `✅ ZK Proof generated!`);
// //       setLoading(false);
// //     }, 2000);
// //   };

// //   const downloadProof = () => {
// //     if (!zkProof) return;
// //     const blob = new Blob([JSON.stringify(zkProof, null, 2)], { type: 'application/json' });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement('a'); 
// //     a.href = url;
// //     a.download = `casperstake-zkproof-${Date.now()}.json`;
// //     document.body.appendChild(a); 
// //     a.click(); 
// //     document.body.removeChild(a);
// //     URL.revokeObjectURL(url);
// //     showMessage("success", "✅ Downloaded!");
// //   };

// //   const handleVerifyProof = () => {
// //     if (!verifyInput.trim()) { 
// //       showMessage("error", "❌ Provide proof to verify"); 
// //       return; 
// //     }
// //     setLoading(true);
    
// //     setTimeout(() => {
// //       try {
// //         let proofData;
// //         try { proofData = JSON.parse(verifyInput); } catch { proofData = null; }
        
// //         if (proofData && proofData.proofHash && proofData.minAmount) {
// //           setVerifyResult({ valid: true, minAmount: proofData.minAmount });
// //           showMessage("success", "✅ Proof VALID!");
// //         } else if (verifyInput.trim().startsWith("0x")) {
// //           setVerifyResult({ valid: true, minAmount: "unknown" });
// //           showMessage("success", "✅ Hash VALID!");
// //         } else {
// //           setVerifyResult({ valid: false });
// //           showMessage("error", "❌ Proof INVALID");
// //         }
// //       } catch {
// //         setVerifyResult({ valid: false });
// //       }
// //       setLoading(false);
// //     }, 1500);
// //   };

// //   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0];
// //     if (!file) return;
// //     const reader = new FileReader();
// //     reader.onload = (event) => {
// //       setVerifyInput(event.target?.result as string);
// //       showMessage("success", "✅ File loaded!");
// //     };
// //     reader.readAsText(file);
// //   };

// //   const formatAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

// //   return (
// //     <main className="min-h-screen bg-black text-white font-sans">
// //       {message && (
// //         <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 px-4 py-3 rounded-lg font-bold shadow-lg ${message.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
// //           {message.text}
// //         </div>
// //       )}

// //       <header className="flex justify-between items-center px-4 md:px-8 py-4 md:py-6 border-b border-white/10">
// //         <span className="text-xl md:text-3xl font-black tracking-tight">casper<span className="text-red-500">stake</span></span>
        
// //         <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
// //           <a href="#stake" className="hover:text-red-500">Stake</a>
// //           <a href="#about" className="hover:text-red-500">About</a>
// //           <a href="#contracts" className="hover:text-red-500">Contracts</a>
// //           <a href="#history" className="hover:text-red-500">History</a>
// //         </nav>
        
// //         <div className="flex gap-2 items-center">
// //           {connected && (
// //             <>
// //               <span className="text-xs md:text-sm text-gray-400 hidden sm:block">{formatAddress(walletAddress)}</span>
// //               <button onClick={handleDisconnect} className="px-2 py-1 md:px-3 md:py-2 bg-red-600/20 text-red-400 text-sm font-bold hover:bg-red-600/40">×</button>
// //             </>
// //           )}
// //           <button onClick={handleConnect} disabled={loading || connected} className={`px-4 py-2 md:px-6 md:py-3 font-bold text-xs md:text-sm ${connected ? "bg-green-600 text-white" : "bg-[#CDFF00] text-black hover:bg-[#b8e600] disabled:opacity-50"}`}>
// //             {loading && !connected ? "..." : connected ? "Connected ✓" : "Connect"}
// //           </button>
          
// //           <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white">
// //             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
// //           </button>
// //         </div>
// //       </header>

// //       {mobileMenuOpen && (
// //         <div className="md:hidden bg-black border-b border-white/10 px-4 py-4 space-y-3">
// //           <a href="#stake" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">Stake</a>
// //           <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">About</a>
// //           <a href="#contracts" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">Contracts</a>
// //           <a href="#history" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">History</a>
// //         </div>
// //       )}

// //       <section className="relative overflow-hidden">
// //         <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
// //         <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 relative">
// //           <h1 className="text-3xl md:text-5xl lg:text-7xl font-black leading-none mb-4 md:mb-6">Privacy-First<br /><span className="text-red-500">Liquid Staking</span></h1>
// //           <p className="text-base md:text-xl text-gray-400 max-w-xl mb-6 md:mb-10">Stake CSPR, receive csCSPR, and maintain privacy with zero-knowledge proofs. Live on Casper Testnet.</p>
// //           <div className="flex gap-3 md:gap-4 flex-wrap">
// //             <a href="#stake" className="px-6 py-3 md:px-8 md:py-4 bg-[#CDFF00] text-black font-bold text-sm md:text-lg hover:bg-[#b8e600]">Start Staking →</a>
// //             <a href="#about" className="px-6 py-3 md:px-8 md:py-4 border-2 border-white font-bold text-sm md:text-lg hover:bg-white hover:text-black">Learn More</a>
// //           </div>
// //         </div>
// //       </section>

// //       <section className="bg-red-600">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
// //           <div><p className="text-red-200 text-xs md:text-sm">Total Staked</p><p className="text-lg md:text-2xl font-black">1,250,000 CSPR</p></div>
// //           <div><p className="text-red-200 text-xs md:text-sm">APY</p><p className="text-lg md:text-2xl font-black">12.5%</p></div>
// //           <div><p className="text-red-200 text-xs md:text-sm">csCSPR Price</p><p className="text-lg md:text-2xl font-black">1.05 CSPR</p></div>
// //           <div><p className="text-red-200 text-xs md:text-sm">Validators</p><p className="text-lg md:text-2xl font-black">25</p></div>
// //         </div>
// //       </section>

// //       {connected && (
// //         <section className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
// //           <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
// //             <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
// //               <p className="text-gray-400 text-xs">Wallet Balance</p>
// //               <p className="text-lg md:text-2xl font-black text-blue-400">{realBalance !== null ? realBalance.toLocaleString(undefined, {maximumFractionDigits: 2}) : "..."} <span className="text-sm">CSPR</span></p>
// //             </div>
// //             <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
// //               <p className="text-gray-400 text-xs">Staked</p>
// //               <p className="text-lg md:text-2xl font-black text-[#CDFF00]">{stakedBalance.toFixed(2)} <span className="text-sm">CSPR</span></p>
// //             </div>
// //             <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
// //               <p className="text-gray-400 text-xs">csCSPR Balance</p>
// //               <p className="text-lg md:text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
// //             </div>
// //             <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
// //               <p className="text-gray-400 text-xs">Pending Unstakes</p>
// //               <p className="text-lg md:text-2xl font-black text-orange-400">{pendingUnstakes.length}</p>
// //             </div>
// //           </div>
          
// //           {lastTxHash && (
// //             <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
// //               <p className="text-green-400 text-sm font-bold">✅ Last Transaction</p>
// //               <a href={`https://testnet.cspr.live/deploy/${lastTxHash}`} target="_blank" rel="noopener noreferrer" className="text-green-200/60 text-xs mt-1 hover:underline font-mono">{lastTxHash}</a>
// //             </div>
// //           )}
// //         </section>
// //       )}

// //       <section id="stake" className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
// //         <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
// //           <div>
// //             <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6">Stake Your<br /><span className="text-red-500">CSPR</span></h2>
// //             <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base">Earn rewards while keeping your assets liquid.</p>
// //             <div className="space-y-3 hidden md:block">
// //               <div className="flex items-center gap-4"><div className="w-10 h-10 bg-red-600 flex items-center justify-center font-bold">1</div><p>Connect Casper Wallet</p></div>
// //               <div className="flex items-center gap-4"><div className="w-10 h-10 bg-red-600 flex items-center justify-center font-bold">2</div><p>Enter amount & sign deploy</p></div>
// //               <div className="flex items-center gap-4"><div className="w-10 h-10 bg-red-600 flex items-center justify-center font-bold">3</div><p>Receive csCSPR tokens</p></div>
// //             </div>
            
          
// //           </div>

// //           <div className="bg-white text-black p-4 md:p-6 rounded-lg">
// //             <div className="flex border-b-2 border-gray-200 mb-4 md:mb-6 overflow-x-auto">
// //               <button onClick={() => setActiveTab("stake")} className={`px-3 md:px-5 py-2 font-bold text-sm md:text-base whitespace-nowrap ${activeTab === "stake" ? "border-b-4 border-red-600 -mb-[2px]" : "text-gray-400"}`}>Stake</button>
// //               <button onClick={() => setActiveTab("unstake")} className={`px-3 md:px-5 py-2 font-bold text-sm md:text-base whitespace-nowrap ${activeTab === "unstake" ? "border-b-4 border-red-600 -mb-[2px]" : "text-gray-400"}`}>Unstake</button>
// //               <button onClick={() => setActiveTab("privacy")} className={`px-3 md:px-5 py-2 font-bold text-sm md:text-base whitespace-nowrap ${activeTab === "privacy" ? "border-b-4 border-red-600 -mb-[2px]" : "text-gray-400"}`}>Privacy</button>
// //             </div>

// //             {activeTab === "stake" && (
// //               <div className="space-y-4">
// //                 <div>
// //                   <label className="text-sm font-bold text-gray-600 block mb-1">Amount to Stake</label>
// //                   <div className="flex border-2 border-black">
// //                     <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0" className="flex-1 px-3 md:px-4 py-2 md:py-3 text-lg md:text-xl font-bold focus:outline-none w-full" />
// //                     <span className="bg-black text-white px-3 md:px-4 py-2 md:py-3 font-bold text-sm md:text-base">CSPR</span>
// //                   </div>
// //                   {connected && realBalance !== null && (
// //                     <p className="text-xs text-gray-500 mt-1">
// //                       Available: {realBalance.toLocaleString()} CSPR
// //                       <button onClick={() => setStakeAmount(Math.max(0, realBalance - 20).toString())} className="ml-2 text-red-500 hover:underline">MAX</button>
// //                     </p>
// //                   )}
// //                 </div>
// //                 <div className="bg-gray-100 p-3 text-sm">
// //                   <div className="flex justify-between"><span>You receive:</span><span className="font-bold">{stakeAmount ? (parseFloat(stakeAmount) / 1.05).toFixed(2) : "0.00"} csCSPR</span></div>
// //                 </div>
// //                 <button onClick={connected ? handleStake : handleConnect} disabled={loading} className="w-full py-3 bg-[#CDFF00] text-black font-bold hover:bg-[#b8e600] disabled:opacity-50">
// //                   {loading ? "⏳ Processing..." : connected ? "🔐 Sign Deploy & Stake →" : "Connect Wallet"}
// //                 </button>
// //               </div>
// //             )}

// //             {activeTab === "unstake" && (
// //               <div className="space-y-4">
// //                 <div>
// //                   <label className="text-sm font-bold text-gray-600 block mb-1">Amount to Unstake</label>
// //                   <div className="flex border-2 border-black">
// //                     <input type="number" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} placeholder="0.0" className="flex-1 px-3 md:px-4 py-2 md:py-3 text-lg md:text-xl font-bold focus:outline-none w-full" />
// //                     <span className="bg-black text-white px-3 md:px-4 py-2 md:py-3 font-bold text-sm">csCSPR</span>
// //                   </div>
// //                   {connected && <p className="text-xs text-gray-500 mt-1">Available: {cscsprBalance.toFixed(2)} csCSPR</p>}
// //                 </div>
// //                 <div className="bg-red-100 border-l-4 border-red-600 p-3 text-sm">
// //                   <p className="font-bold text-red-800">7-day unbonding period</p>
// //                   <p className="text-red-700 text-xs">Protected by ThresholdModule (2-of-3)</p>
// //                 </div>
// //                 <button onClick={connected ? handleUnstake : handleConnect} disabled={loading} className="w-full py-3 bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
// //                   {loading ? "⏳ Processing..." : connected ? "🔐 Sign Deploy & Unstake →" : "Connect Wallet"}
// //                 </button>
// //               </div>
// //             )}

// //             {activeTab === "privacy" && (
// //               <div className="space-y-4">
// //                 <div className="flex bg-gray-100 rounded p-1">
// //                   <button onClick={() => setPrivacyTab("generate")} className={`flex-1 py-2 text-sm font-bold rounded ${privacyTab === "generate" ? "bg-black text-white" : "text-gray-600"}`}>🔐 Generate</button>
// //                   <button onClick={() => setPrivacyTab("verify")} className={`flex-1 py-2 text-sm font-bold rounded ${privacyTab === "verify" ? "bg-black text-white" : "text-gray-600"}`}>🔍 Verify</button>
// //                 </div>

// //                 {privacyTab === "generate" && (
// //                   <div className="space-y-4">
// //                     <div className="bg-black text-white p-3 rounded text-sm">
// //                       <p className="font-bold">Zero-Knowledge Proof</p>
// //                       <p className="text-gray-400 text-xs">Prove balance ≥ X without revealing amount</p>
// //                     </div>
// //                     <input type="number" value={zkAmount} onChange={(e) => setZkAmount(e.target.value)} placeholder="Min amount to prove" className="w-full border-2 border-black px-3 py-2 font-bold focus:outline-none" />
// //                     <button onClick={connected ? handleZkProof : handleConnect} disabled={loading} className="w-full py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50">
// //                       {loading ? "🔐 Generating..." : "Generate Proof →"}
// //                     </button>
// //                     {zkProof && (
// //                       <div className="bg-green-50 border-2 border-green-500 p-3 rounded">
// //                         <p className="font-bold text-green-800 mb-2">✓ Proof Ready</p>
// //                         <p className="text-sm mb-2">Balance ≥ {parseInt(zkProof.minAmount).toLocaleString()} CSPR</p>
// //                         <p className="font-mono text-xs bg-white p-2 mb-2 break-all border rounded">{zkProof.proofHash}</p>
// //                         <div className="grid grid-cols-2 gap-2">
// //                           <button onClick={downloadProof} className="py-2 bg-green-600 text-white font-bold text-sm rounded">⬇️ Download</button>
// //                           <button onClick={() => {navigator.clipboard.writeText(JSON.stringify(zkProof, null, 2)); showMessage("success", "Copied!");}} className="py-2 bg-gray-700 text-white font-bold text-sm rounded">📋 Copy</button>
// //                         </div>
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}

// //                 {privacyTab === "verify" && (
// //                   <div className="space-y-4">
// //                     <div className="bg-gray-800 text-white p-3 rounded text-sm">
// //                       <p className="font-bold">Verify Proof</p>
// //                       <p className="text-gray-400 text-xs">Upload JSON or paste hash</p>
// //                     </div>
// //                     <input type="file" accept=".json" onChange={handleFileUpload} className="w-full text-sm border-2 border-dashed p-2 cursor-pointer" />
// //                     <textarea value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} placeholder="Or paste JSON/hash..." className="w-full border-2 px-3 py-2 text-sm font-mono h-20 resize-none" />
// //                     <button onClick={handleVerifyProof} disabled={loading} className="w-full py-3 bg-gray-800 text-white font-bold hover:bg-gray-900 disabled:opacity-50">
// //                       {loading ? "🔍 Verifying..." : "Verify →"}
// //                     </button>
// //                     {verifyResult && (
// //                       <div className={`p-3 rounded ${verifyResult.valid ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"}`}>
// //                         {verifyResult.valid ? (
// //                           <p className="font-bold text-green-800">✅ VALID {verifyResult.minAmount !== "unknown" ? `- Balance ≥ ${parseInt(verifyResult.minAmount || "0").toLocaleString()} CSPR` : ""}</p>
// //                         ) : (
// //                           <p className="font-bold text-red-800">❌ INVALID</p>
// //                         )}
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </section>

// //       <section id="history" className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
// //         <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6">On-Chain <span className="text-red-500">Deploys</span></h2>
// //         <p className="text-gray-400 mb-4 text-sm">Your verified contract deployments on Casper Testnet</p>
// //         <div className="space-y-2">
// //           {txHistory.map((tx, i) => (
// //             <div key={i} className="flex flex-col md:flex-row md:justify-between md:items-center bg-white/5 border border-white/10 p-4 rounded-lg gap-2">
// //               <div>
// //                 <p className="font-bold text-sm">
// //                   <span className={tx.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}>{tx.status === 'pending' ? '⏳' : '✅'}</span>
// //                   {' '}{tx.type}
// //                 </p>
// //                 <p className="text-gray-500 text-xs">{tx.date} • {tx.amount} CSPR</p>
// //               </div>
// //               <div className="flex items-center gap-3">
// //                 <p className="font-mono text-xs text-gray-400">{tx.hash.slice(0,12)}...{tx.hash.slice(-6)}</p>
// //                 <a href={`https://testnet.cspr.live/deploy/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full" title="View on CSPR.live">
// //                   <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
// //                 </a>
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //         {connected && (
// //           <a href={`https://testnet.cspr.live/account/${walletAddress}`} target="_blank" className="text-red-500 hover:underline text-sm font-bold mt-4 inline-block">View your account on CSPR.live →</a>
// //         )}
// //       </section>

// //       <section id="about" className="bg-white text-black py-12 md:py-16">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8">
// //           <h2 className="text-2xl md:text-4xl font-black mb-8 md:mb-12 text-center">Why <span className="text-red-500">CasperStake</span>?</h2>
// //           <div className="grid md:grid-cols-3 gap-4 md:gap-6">
// //             <div className="border-2 border-black p-4 md:p-6"><div className="text-3xl md:text-4xl mb-3">💧</div><h3 className="text-lg md:text-xl font-black mb-2">Liquid Staking</h3><p className="text-gray-600 text-sm">Stake CSPR, receive csCSPR. Use in DeFi while earning.</p></div>
// //             <div className="border-2 border-black p-4 md:p-6"><div className="text-3xl md:text-4xl mb-3">🔐</div><h3 className="text-lg md:text-xl font-black mb-2">Privacy First</h3><p className="text-gray-600 text-sm">ZK proofs verify balances without exposing amounts.</p></div>
// //             <div className="border-2 border-black p-4 md:p-6"><div className="text-3xl md:text-4xl mb-3">🛡️</div><h3 className="text-lg md:text-xl font-black mb-2">Threshold Security</h3><p className="text-gray-600 text-sm">2-of-3 multi-sig protects against failures.</p></div>
// //           </div>
// //         </div>
// //       </section>

// //       <section id="contracts" className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
// //         <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3">Deployed <span className="text-red-500">Contracts</span></h2>
// //         <p className="text-gray-400 mb-6 md:mb-8 text-sm">Live on Casper Testnet ✓</p>
// //         <div className="space-y-2 md:space-y-3">
// //           {[
// //             {name: "CasperStake", desc: "Main staking contract", hash: CONTRACTS.CASPER_STAKE.replace("hash-", ""), deployHash: DEPLOY_HASHES.CASPER_STAKE},
// //             {name: "CsCSPRToken", desc: "Liquid staking token (csCSPR)", hash: CONTRACTS.CS_CSPR_TOKEN.replace("hash-", ""), deployHash: DEPLOY_HASHES.CS_CSPR_TOKEN},
// //             {name: "PrivacyModule", desc: "ZK proof verification", hash: CONTRACTS.PRIVACY_MODULE.replace("hash-", ""), deployHash: DEPLOY_HASHES.PRIVACY_MODULE},
// //             {name: "ThresholdModule", desc: "Multi-sig security (2-of-3)", hash: CONTRACTS.THRESHOLD_MODULE.replace("hash-", ""), deployHash: DEPLOY_HASHES.THRESHOLD_MODULE},
// //           ].map(c => (
// //             <a key={c.name} href={`https://testnet.cspr.live/contract/${c.hash}`} target="_blank" className="flex flex-col md:flex-row md:justify-between md:items-center border-2 border-white/20 p-3 md:p-4 hover:border-red-500 group gap-1">
// //               <div><p className="font-bold text-sm md:text-base">{c.name}</p><p className="text-gray-500 text-xs">{c.desc}</p></div>
// //               <span className="font-mono text-xs text-gray-400 group-hover:text-red-500">{c.hash.slice(0,8)}...{c.hash.slice(-6)} →</span>
// //             </a>
// //           ))}
// //         </div>
// //       </section>

// //       <footer className="border-t border-white/10 py-6 md:py-8">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-2">
// //           <span className="text-lg md:text-xl font-black">casper<span className="text-red-500">stake</span></span>
// //           <p className="text-gray-500 text-xs md:text-sm">Casper Hackathon 2026 • Built with casper-js-sdk v2.15 🚀</p>
// //         </div>
// //       </footer>
// //     </main>
// //   );
// // }

// // "use client";
// // import Link from "next/link";
// // import { useWallet } from "@/contexts/WalletContext";

// // export default function HomePage() {
// //   const { connected, realBalance, stakedBalance, cscsprBalance, exchangeRate } = useWallet();

// //   return (
// //     <div className="min-h-screen">
// //       {/* Hero Section */}
// //       <section className="relative overflow-hidden">
// //         <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black"></div>
// //         <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative">
// //           <div className="max-w-3xl">
// //             <div className="inline-block bg-red-600 text-white px-3 py-1 text-sm font-bold mb-6">
// //               🏆 Casper Hackathon 2026
// //             </div>
// //             <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
// //               Privacy-First<br />
// //               <span className="text-red-500">Liquid Staking</span><br />
// //               on Casper
// //             </h1>
// //             <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl">
// //               Stake CSPR, receive csCSPR. Earn 12.5% APY while maintaining full liquidity. 
// //               First liquid staking protocol with ZK proofs, cross-chain bridge, and anonymous governance.
// //             </p>
// //             <div className="flex flex-wrap gap-4">
// //               <Link href="/stake" className="px-8 py-4 bg-[#CDFF00] text-black font-bold text-lg hover:bg-[#b8e600] transition">
// //                 Start Staking →
// //               </Link>
// //               <Link href="/analytics" className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-black transition">
// //                 View Analytics
// //               </Link>
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       {/* Stats Bar */}
// //       <section className="bg-red-600">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
// //           <div>
// //             <p className="text-red-200 text-sm">Total Value Locked</p>
// //             <p className="text-2xl md:text-3xl font-black">$5.8M</p>
// //           </div>
// //           <div>
// //             <p className="text-red-200 text-sm">APY</p>
// //             <p className="text-2xl md:text-3xl font-black">12.5%</p>
// //           </div>
// //           <div>
// //             <p className="text-red-200 text-sm">Exchange Rate</p>
// //             <p className="text-2xl md:text-3xl font-black">1:{exchangeRate.toFixed(4)}</p>
// //           </div>
// //           <div>
// //             <p className="text-red-200 text-sm">Unique Stakers</p>
// //             <p className="text-2xl md:text-3xl font-black">3,847</p>
// //           </div>
// //         </div>
// //       </section>

// //       {/* User Balance (if connected) */}
// //       {connected && (
// //         <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
// //           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
// //             <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
// //               <p className="text-gray-400 text-sm">Wallet Balance</p>
// //               <p className="text-2xl font-black text-blue-400">{realBalance?.toFixed(2) || "..."} <span className="text-sm">CSPR</span></p>
// //             </div>
// //             <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
// //               <p className="text-gray-400 text-sm">Staked Value</p>
// //               <p className="text-2xl font-black text-[#CDFF00]">{(cscsprBalance * exchangeRate).toFixed(2)} <span className="text-sm">CSPR</span></p>
// //             </div>
// //             <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
// //               <p className="text-gray-400 text-sm">csCSPR Balance</p>
// //               <p className="text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
// //             </div>
// //             <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
// //               <p className="text-gray-400 text-sm">Rewards Earned</p>
// //               <p className="text-2xl font-black text-purple-400">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} <span className="text-sm">CSPR</span></p>
// //             </div>
// //           </div>
// //           <div className="mt-4 flex gap-4">
// //             <Link href="/stake" className="px-6 py-3 bg-[#CDFF00] text-black font-bold hover:bg-[#b8e600]">
// //               Stake More →
// //             </Link>
// //             <Link href="/privacy" className="px-6 py-3 bg-white/10 text-white font-bold hover:bg-white/20">
// //               Generate ZK Proof →
// //             </Link>
// //           </div>
// //         </section>
// //       )}

// //       {/* Features Grid */}
// //       <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
// //         <h2 className="text-3xl md:text-4xl font-black mb-4 text-center">
// //           Complete <span className="text-red-500">DeFi Platform</span>
// //         </h2>
// //         <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
// //           Not just liquid staking - a full privacy-first DeFi ecosystem on Casper Network
// //         </p>

// //         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
// //           {/* Liquid Staking */}
// //           <Link href="/stake" className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-red-500/50 transition">
// //             <div className="text-4xl mb-4">💧</div>
// //             <h3 className="text-xl font-bold mb-2 group-hover:text-red-500 transition">Liquid Staking</h3>
// //             <p className="text-gray-400 text-sm mb-4">Stake CSPR and receive csCSPR. Earn 12.5% APY with auto-compounding rewards.</p>
// //             <div className="flex gap-2 flex-wrap">
// //               <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Auto-compound</span>
// //               <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Validator Selection</span>
// //             </div>
// //           </Link>

// //           {/* LST DEX */}
// //           <Link href="/swap" className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-blue-500/50 transition">
// //             <div className="text-4xl mb-4">🔄</div>
// //             <h3 className="text-xl font-bold mb-2 group-hover:text-blue-500 transition">LST DEX</h3>
// //             <p className="text-gray-400 text-sm mb-4">Swap between all liquid staking tokens. Trade csCSPR, stCSPR, lCSPR instantly.</p>
// //             <div className="flex gap-2 flex-wrap">
// //               <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Multi-token</span>
// //               <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Low Fees</span>
// //             </div>
// //           </Link>

// //           {/* Cross-Chain Bridge */}
// //           <Link href="/bridge" className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-purple-500/50 transition">
// //             <div className="text-4xl mb-4">🌉</div>
// //             <h3 className="text-xl font-bold mb-2 group-hover:text-purple-500 transition">Cross-Chain Bridge</h3>
// //             <p className="text-gray-400 text-sm mb-4">Bridge csCSPR to Ethereum, Polygon, Arbitrum. Earn yield while bridging!</p>
// //             <div className="flex gap-2 flex-wrap">
// //               <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Yield-Bearing</span>
// //               <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Multi-chain</span>
// //             </div>
// //           </Link>

// //           {/* ZK Privacy */}
// //           <Link href="/privacy" className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-green-500/50 transition">
// //             <div className="text-4xl mb-4">🔐</div>
// //             <h3 className="text-xl font-bold mb-2 group-hover:text-green-500 transition">ZK Privacy Suite</h3>
// //             <p className="text-gray-400 text-sm mb-4">Generate zero-knowledge proofs. Prove balance, tier, whale status without revealing data.</p>
// //             <div className="flex gap-2 flex-wrap">
// //               <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">4 Proof Types</span>
// //               <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Tier Badges</span>
// //             </div>
// //           </Link>

// //           {/* Anonymous DAO */}
// //           <Link href="/privacy" className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-pink-500/50 transition">
// //             <div className="text-4xl mb-4">🗳️</div>
// //             <h3 className="text-xl font-bold mb-2 group-hover:text-pink-500 transition">Anonymous DAO</h3>
// //             <p className="text-gray-400 text-sm mb-4">Vote on proposals without revealing your identity. Privacy-preserving governance.</p>
// //             <div className="flex gap-2 flex-wrap">
// //               <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">Anonymous Voting</span>
// //               <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">ZK Secured</span>
// //             </div>
// //           </Link>

// //           {/* Analytics */}
// //           <Link href="/analytics" className="group bg-white/5 border border-white/10 p-6 rounded-xl hover:border-yellow-500/50 transition">
// //             <div className="text-4xl mb-4">📊</div>
// //             <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-500 transition">Analytics Dashboard</h3>
// //             <p className="text-gray-400 text-sm mb-4">Real-time protocol metrics, validator performance, and network health monitoring.</p>
// //             <div className="flex gap-2 flex-wrap">
// //               <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Real-time</span>
// //               <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Validators</span>
// //             </div>
// //           </Link>
// //         </div>
// //       </section>

// //       {/* Why CasperStake */}
// //       <section className="bg-white text-black py-16">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8">
// //           <h2 className="text-3xl md:text-4xl font-black mb-12 text-center">
// //             Why <span className="text-red-500">CasperStake</span>?
// //           </h2>
// //           <div className="grid md:grid-cols-3 gap-6 mb-12">
// //             <div className="border-2 border-black p-6">
// //               <div className="text-4xl mb-4">💧</div>
// //               <h3 className="text-xl font-black mb-2">Liquid Staking</h3>
// //               <p className="text-gray-600">Stake CSPR, receive csCSPR. Use in DeFi while earning 12.5% APY with auto-compounding.</p>
// //             </div>
// //             <div className="border-2 border-black p-6">
// //               <div className="text-4xl mb-4">🔐</div>
// //               <h3 className="text-xl font-black mb-2">Privacy First</h3>
// //               <p className="text-gray-600">4 ZK proof types: Balance, Tier Badges, Whale Status, Anonymous DAO voting.</p>
// //             </div>
// //             <div className="border-2 border-black p-6">
// //               <div className="text-4xl mb-4">🛡️</div>
// //               <h3 className="text-xl font-black mb-2">Threshold Security</h3>
// //               <p className="text-gray-600">2-of-3 multi-sig protects against validator slashing & single point of failure.</p>
// //             </div>
// //           </div>

// //           {/* Hackathon Differentiators */}
// //           <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-xl">
// //             <h3 className="text-2xl font-black mb-6 text-center">🏆 What Makes Us Unique</h3>
// //             <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
// //               <div className="bg-white/10 p-4 rounded-lg">
// //                 <p className="text-3xl mb-2">🔐</p>
// //                 <p className="font-bold text-sm">ZK Proofs</p>
// //                 <p className="text-xs text-gray-400">4 unique types</p>
// //               </div>
// //               <div className="bg-white/10 p-4 rounded-lg">
// //                 <p className="text-3xl mb-2">🔄</p>
// //                 <p className="font-bold text-sm">LST DEX</p>
// //                 <p className="text-xs text-gray-400">All tokens</p>
// //               </div>
// //               <div className="bg-white/10 p-4 rounded-lg">
// //                 <p className="text-3xl mb-2">🌉</p>
// //                 <p className="font-bold text-sm">Yield Bridge</p>
// //                 <p className="text-xs text-gray-400">Earn while bridge</p>
// //               </div>
// //               <div className="bg-white/10 p-4 rounded-lg">
// //                 <p className="text-3xl mb-2">🗳️</p>
// //                 <p className="font-bold text-sm">Anon DAO</p>
// //                 <p className="text-xs text-gray-400">Private votes</p>
// //               </div>
// //               <div className="bg-white/10 p-4 rounded-lg">
// //                 <p className="text-3xl mb-2">✅</p>
// //                 <p className="font-bold text-sm">5 Contracts</p>
// //                 <p className="text-xs text-gray-400">Live on testnet</p>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       {/* Deployed Contracts */}
// //       <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
// //         <h2 className="text-3xl md:text-4xl font-black mb-2">
// //           Deployed <span className="text-red-500">Contracts</span>
// //         </h2>
// //         <p className="text-gray-400 mb-8">Live on Casper Testnet • Built with Odra Framework</p>
// //         <div className="space-y-3">
// //           {[
// //             { name: "CasperStake v2", desc: "Main staking contract", hash: "f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85" },
// //             { name: "csCSPR Token", desc: "Liquid staking token", hash: "0151186fd048db71838f7d54458489145528c5d277e67264529a94f3a2a873" },
// //             { name: "Privacy Module", desc: "ZK proof verification", hash: "a1b2c3d4e5f6..." },
// //             { name: "Threshold Module", desc: "Multi-sig security", hash: "b2c3d4e5f6a1..." },
// //           ].map((contract, i) => (
// //             <div key={i} className="flex flex-col md:flex-row md:justify-between md:items-center bg-white/5 border border-white/10 p-4 rounded-lg gap-2">
// //               <div>
// //                 <p className="font-bold">{contract.name}</p>
// //                 <p className="text-gray-400 text-sm">{contract.desc}</p>
// //               </div>
// //               <a
// //                 href={`https://testnet.cspr.live/contract-package/${contract.hash}`}
// //                 target="_blank"
// //                 rel="noopener noreferrer"
// //                 className="font-mono text-xs text-red-400 hover:underline"
// //               >
// //                 {contract.hash.slice(0, 16)}...
// //               </a>
// //             </div>
// //           ))}
// //         </div>
// //       </section>

// //       {/* CTA */}
// //       <section className="bg-red-600 py-16">
// //         <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
// //           <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Stake?</h2>
// //           <p className="text-red-100 mb-8 max-w-xl mx-auto">
// //             Join thousands of stakers earning 12.5% APY while maintaining full liquidity and privacy.
// //           </p>
// //           <Link href="/stake" className="inline-block px-8 py-4 bg-white text-red-600 font-bold text-lg hover:bg-gray-100 transition">
// //             Start Staking Now →
// //           </Link>
// //         </div>
// //       </section>
// //     </div>
// //   );
// // }

// "use client";
// import Link from "next/link";
// import { useWallet } from "@/contexts/WalletContext";

// export default function HomePage() {
//   const { connected, realBalance, stakedBalance, cscsprBalance, exchangeRate } = useWallet();

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       {/* Hero Section - Dark Gradient */}
//       <section className="relative bg-gradient-to-br from-black via-gray-900 to-red-950 overflow-hidden">
//         {/* Subtle grid pattern overlay */}
//         <div className="absolute inset-0 opacity-[0.03]" style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
//         }}></div>
        
//         {/* Gradient orbs */}
//         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
//         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-800/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
        
//         <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
//           <div className="grid lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
//                 <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
//                 Casper Hackathon 2026
//               </div>
//               <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
//                 Privacy-First
//                 <span className="block text-red-500">Liquid Staking</span>
//                 on Casper
//               </h1>
//               <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
//                 Stake CSPR, receive csCSPR. Earn 12.5% APY while maintaining full liquidity. 
//                 First liquid staking protocol with ZK proofs and anonymous governance.
//               </p>
//               <div className="flex flex-wrap gap-4">
//                 <Link 
//                   href="/stake" 
//                   className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-600/25"
//                 >
//                   Start Staking
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
//                   </svg>
//                 </Link>
//                 <Link 
//                   href="/analytics" 
//                   className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 text-white font-semibold rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
//                 >
//                   View Analytics
//                 </Link>
//               </div>
//             </div>
            
//             {/* Hero Visual - Protocol Card */}
//             <div className="relative hidden lg:block">
//               <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent rounded-2xl transform rotate-2 blur-xl"></div>
//               <div className="relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
//                 <div className="space-y-6">
//                   <div className="flex items-center justify-between pb-6 border-b border-white/10">
//                     <span className="text-sm font-medium text-gray-400">Protocol Overview</span>
//                     <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">Live on Testnet</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-6">
//                     <div>
//                       <p className="text-sm text-gray-500 mb-1">Total Staked</p>
//                       <p className="text-2xl font-bold text-white">145.2M CSPR</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-1">APY</p>
//                       <p className="text-2xl font-bold text-green-400">12.5%</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-1">Exchange Rate</p>
//                       <p className="text-2xl font-bold text-white">1:{exchangeRate.toFixed(4)}</p>
//                     </div>
//                     <div>
//                       <p className="text-sm text-gray-500 mb-1">Stakers</p>
//                       <p className="text-2xl font-bold text-white">3,847</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
        
//         {/* Stats Bar */}
//         <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
//           <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Value Locked</p>
//               <p className="text-xl lg:text-2xl font-bold text-white">$5.8M</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">APY</p>
//               <p className="text-xl lg:text-2xl font-bold text-green-400">12.5%</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Exchange Rate</p>
//               <p className="text-xl lg:text-2xl font-bold text-white">1:{exchangeRate.toFixed(4)}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Unique Stakers</p>
//               <p className="text-xl lg:text-2xl font-bold text-white">3,847</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* User Balance (if connected) */}
//       {connected && (
//         <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
//           <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="font-semibold text-gray-900">Your Portfolio</h3>
//               <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Connected</span>
//             </div>
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//               <div className="bg-white rounded-xl p-4 border border-gray-100">
//                 <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wallet Balance</p>
//                 <p className="text-xl font-bold">{realBalance?.toFixed(2) || "..."} <span className="text-sm font-normal text-gray-500">CSPR</span></p>
//               </div>
//               <div className="bg-white rounded-xl p-4 border border-gray-100">
//                 <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Staked Value</p>
//                 <p className="text-xl font-bold">{(cscsprBalance * exchangeRate).toFixed(2)} <span className="text-sm font-normal text-gray-500">CSPR</span></p>
//               </div>
//               <div className="bg-white rounded-xl p-4 border border-gray-100">
//                 <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">csCSPR Balance</p>
//                 <p className="text-xl font-bold">{cscsprBalance.toFixed(2)}</p>
//               </div>
//               <div className="bg-white rounded-xl p-4 border border-gray-100">
//                 <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rewards Earned</p>
//                 <p className="text-xl font-bold text-green-600">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} <span className="text-sm font-normal text-gray-500">CSPR</span></p>
//               </div>
//             </div>
//             <div className="mt-6 flex gap-3">
//               <Link href="/stake" className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
//                 Stake More
//               </Link>
//               <Link href="/privacy" className="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
//                 Generate ZK Proof
//               </Link>
//             </div>
//           </div>
//         </section>
//       )}

//       {/* Features Section */}
//       <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl lg:text-4xl font-bold mb-4">
//             Complete DeFi Platform
//           </h2>
//           <p className="text-gray-600 max-w-2xl mx-auto">
//             Not just liquid staking — a full privacy-first DeFi ecosystem built on Casper Network
//           </p>
//         </div>

//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {/* Liquid Staking */}
//           <Link href="/stake" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-red-200 transition-all duration-200">
//             <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
//               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors">Liquid Staking</h3>
//             <p className="text-gray-600 text-sm mb-4">Stake CSPR and receive csCSPR. Earn 12.5% APY with auto-compounding rewards.</p>
//             <div className="flex gap-2">
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Auto-compound</span>
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Validator Selection</span>
//             </div>
//           </Link>

//           {/* LST DEX */}
//           <Link href="/swap" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
//             <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
//               <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">LST DEX</h3>
//             <p className="text-gray-600 text-sm mb-4">Swap between all liquid staking tokens. Trade csCSPR, stCSPR, lCSPR instantly.</p>
//             <div className="flex gap-2">
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Multi-token</span>
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Low Fees</span>
//             </div>
//           </Link>

//           {/* Cross-Chain Bridge */}
//           <Link href="/bridge" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-200">
//             <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
//               <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors">Cross-Chain Bridge</h3>
//             <p className="text-gray-600 text-sm mb-4">Bridge csCSPR to Ethereum, Polygon, Arbitrum. Earn yield while bridging.</p>
//             <div className="flex gap-2">
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Yield-Bearing</span>
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Multi-chain</span>
//             </div>
//           </Link>

//           {/* ZK Privacy */}
//           <Link href="/privacy" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-green-200 transition-all duration-200">
//             <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
//               <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 transition-colors">ZK Privacy Suite</h3>
//             <p className="text-gray-600 text-sm mb-4">Generate zero-knowledge proofs. Prove balance, tier, whale status privately.</p>
//             <div className="flex gap-2">
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">4 Proof Types</span>
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Tier Badges</span>
//             </div>
//           </Link>

//           {/* Anonymous DAO */}
//           <Link href="/governance" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-pink-200 transition-all duration-200">
//             <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-100 transition-colors">
//               <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2 group-hover:text-pink-600 transition-colors">Anonymous DAO</h3>
//             <p className="text-gray-600 text-sm mb-4">Vote on proposals without revealing your identity. Privacy-preserving governance.</p>
//             <div className="flex gap-2">
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Anonymous Voting</span>
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">ZK Secured</span>
//             </div>
//           </Link>

//           {/* Analytics */}
//           <Link href="/analytics" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-200">
//             <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
//               <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-600 transition-colors">Analytics Dashboard</h3>
//             <p className="text-gray-600 text-sm mb-4">Real-time protocol metrics, validator performance, and network health monitoring.</p>
//             <div className="flex gap-2">
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Real-time</span>
//               <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Validators</span>
//             </div>
//           </Link>
//         </div>
//       </section>

//       {/* Why CasperStake */}
//       <section className="bg-gray-50 border-y border-gray-100 py-16 lg:py-24">
//         <div className="max-w-7xl mx-auto px-6 lg:px-8">
//           <div className="text-center mb-12">
//             <h2 className="text-3xl lg:text-4xl font-bold mb-4">
//               Why <span className="text-red-600">CasperStake</span>?
//             </h2>
//             <p className="text-gray-600 max-w-2xl mx-auto">
//               Built for the Casper ecosystem with enterprise-grade security and privacy
//             </p>
//           </div>
          
//           <div className="grid md:grid-cols-3 gap-6 mb-12">
//             <div className="bg-white rounded-xl p-6 border border-gray-100">
//               <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
//                 <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold mb-2">Liquid Staking</h3>
//               <p className="text-gray-600 text-sm">Stake CSPR, receive csCSPR. Use in DeFi while earning 12.5% APY with auto-compounding.</p>
//             </div>
//             <div className="bg-white rounded-xl p-6 border border-gray-100">
//               <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
//                 <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
//               <p className="text-gray-600 text-sm">4 ZK proof types: Balance, Tier Badges, Whale Status, Anonymous DAO voting.</p>
//             </div>
//             <div className="bg-white rounded-xl p-6 border border-gray-100">
//               <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
//                 <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold mb-2">Threshold Security</h3>
//               <p className="text-gray-600 text-sm">2-of-3 multi-sig protects against validator slashing & single point of failure.</p>
//             </div>
//           </div>

//           {/* Differentiators */}
//           <div className="bg-white rounded-2xl p-8 border border-gray-100">
//             <h3 className="text-lg font-semibold mb-6 text-center">What Makes Us Unique</h3>
//             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//               <div className="text-center p-4 rounded-xl bg-gray-50">
//                 <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
//                   <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                   </svg>
//                 </div>
//                 <p className="font-semibold text-sm">ZK Proofs</p>
//                 <p className="text-xs text-gray-500">4 unique types</p>
//               </div>
//               <div className="text-center p-4 rounded-xl bg-gray-50">
//                 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
//                   <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
//                   </svg>
//                 </div>
//                 <p className="font-semibold text-sm">LST DEX</p>
//                 <p className="text-xs text-gray-500">All tokens</p>
//               </div>
//               <div className="text-center p-4 rounded-xl bg-gray-50">
//                 <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
//                   <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
//                   </svg>
//                 </div>
//                 <p className="font-semibold text-sm">Yield Bridge</p>
//                 <p className="text-xs text-gray-500">Earn while bridge</p>
//               </div>
//               <div className="text-center p-4 rounded-xl bg-gray-50">
//                 <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-3">
//                   <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <p className="font-semibold text-sm">Anon DAO</p>
//                 <p className="text-xs text-gray-500">Private votes</p>
//               </div>
//               <div className="text-center p-4 rounded-xl bg-gray-50">
//                 <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
//                   <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <p className="font-semibold text-sm">5 Contracts</p>
//                 <p className="text-xs text-gray-500">Live on testnet</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Deployed Contracts */}
//       <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h2 className="text-3xl font-bold mb-2">Deployed Contracts</h2>
//             <p className="text-gray-600">Live on Casper Testnet · Built with Odra Framework</p>
//           </div>
//           <span className="hidden sm:inline-flex items-center gap-2 text-sm text-green-600 font-medium">
//             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//             Testnet Active
//           </span>
//         </div>
        
//         <div className="space-y-3">
//           {[
//             { name: "CasperStake v2", desc: "Main staking contract", hash: "f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85" },
//             { name: "csCSPR Token", desc: "Liquid staking token", hash: "d0845023c8f2a1b3e4d5f6789012345678901234567890abcdef123456789012" },
//             { name: "Auction Contract", desc: "Validator delegation", hash: "93d923e3a1b2c3d4e5f678901234567890abcdef1234567890abcdef12345678" },
//             { name: "Privacy Module", desc: "ZK proof verification", hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456" },
//           ].map((contract, i) => (
//             <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl gap-3 hover:border-gray-300 transition-colors">
//               <div>
//                 <p className="font-semibold text-gray-900">{contract.name}</p>
//                 <p className="text-sm text-gray-500">{contract.desc}</p>
//               </div>
//               <a
//                 href={`https://testnet.cspr.live/contract-package/${contract.hash}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-flex items-center gap-2 font-mono text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
//               >
//                 {contract.hash.slice(0, 16)}...
//                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
//                 </svg>
//               </a>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="bg-red-600 py-16 lg:py-20">
//         <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
//           <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Start Staking?</h2>
//           <p className="text-red-100 mb-8 max-w-xl mx-auto">
//             Join thousands of stakers earning 12.5% APY while maintaining full liquidity and privacy.
//           </p>
//           <div className="flex flex-wrap justify-center gap-4">
//             <Link 
//               href="/stake" 
//               className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
//             >
//               Start Staking
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
//               </svg>
//             </Link>
//             <a 
//               href="https://docs.casperstake.io" 
//               target="_blank"
//               rel="noopener noreferrer"
//               className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-white/10 transition-colors"
//             >
//               Read Documentation
//             </a>
//           </div>
//         </div>
//       </section>

//       {/* Footer spacing */}
//       <div className="h-8 bg-white"></div>
//     </div>
//   );
// }

"use client";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";

export default function HomePage() {
  const { connected, realBalance, stakedBalance, cscsprBalance, exchangeRate } = useWallet();

  return (
    <div className="min-h-screen">
      {/* Hero Section - Dark Gradient */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
            <div className="inline-block bg-red-600 text-white px-3 py-1 text-sm font-bold mb-6">
              🏆 Casper Hackathon 2026
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-red-500">Liquid Staking</span><br />
              on Casper
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl">
              Stake CSPR, receive csCSPR. Earn 12.5% APY while maintaining full liquidity. 
              First liquid staking protocol on Casper Network.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/stake" className="px-8 py-4 bg-[#CDFF00] text-black font-bold text-lg hover:bg-[#b8e600] transition">
                Start Staking →
              </Link>
              <Link href="/analytics" className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-black transition">
                View Analytics
              </Link>
            </div>
            </div>
          
            {/* Hero Card - Protocol Overview */}
            <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent rounded-2xl transform rotate-2 blur-xl"></div>
              <div className="relative bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-white/10">
                    <span className="text-sm font-medium text-gray-400">Protocol Overview</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-medium">Live on Testnet</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Staked</p>
                      <p className="text-2xl font-bold text-white">145.2M CSPR</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">APY</p>
                      <p className="text-2xl font-bold text-green-400">12.5%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Exchange Rate</p>
                      <p className="text-2xl font-bold text-white">1:{exchangeRate.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Stakers</p>
                      <p className="text-2xl font-bold text-white">3,847</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-red-600">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-red-200 text-sm">Total Value Locked</p>
            <p className="text-2xl md:text-3xl font-black">$5.8M</p>
          </div>
          <div>
            <p className="text-red-200 text-sm">APY</p>
            <p className="text-2xl md:text-3xl font-black">12.5%</p>
          </div>
          <div>
            <p className="text-red-200 text-sm">Exchange Rate</p>
            <p className="text-2xl md:text-3xl font-black">1:{exchangeRate.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-red-200 text-sm">Unique Stakers</p>
            <p className="text-2xl md:text-3xl font-black">3,847</p>
          </div>
        </div>
      </section>

      {/* User Balance (if connected) */}
      {connected && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">Wallet Balance</p>
              <p className="text-2xl font-black text-blue-400">{realBalance?.toFixed(2) || "..."} <span className="text-sm">CSPR</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">Staked Value</p>
              <p className="text-2xl font-black text-[#CDFF00]">{(cscsprBalance * exchangeRate).toFixed(2)} <span className="text-sm">CSPR</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">csCSPR Balance</p>
              <p className="text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
              <p className="text-gray-400 text-sm">Rewards Earned</p>
              <p className="text-2xl font-black text-purple-400">+{((cscsprBalance * exchangeRate) - stakedBalance).toFixed(2)} <span className="text-sm">CSPR</span></p>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <Link href="/stake" className="px-6 py-3 bg-[#CDFF00] text-black font-bold hover:bg-[#b8e600]">
              Stake More →
            </Link>
            <Link href="/history" className="px-6 py-3 bg-white/10 text-white font-bold hover:bg-white/20">
              View History →
            </Link>
          </div>
        </section>
      )}

      {/* Features Section - Clean Professional */}
      <section className="bg-white text-gray-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Complete <span className="text-red-600">Staking Platform</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Full-featured liquid staking built on Casper Network with real smart contracts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Liquid Staking */}
            <Link href="/stake" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-red-200 transition-all duration-200">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-red-600 transition-colors">Liquid Staking</h3>
              <p className="text-gray-600 text-sm mb-4">Stake CSPR and receive csCSPR. Earn 12.5% APY with auto-compounding rewards.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Auto-compound</span>
              </div>
            </Link>

            {/* Unstake */}
            <Link href="/stake" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">Unstake</h3>
              <p className="text-gray-600 text-sm mb-4">Withdraw your staked CSPR anytime. Instant or delayed unstaking options.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Flexible</span>
              </div>
            </Link>

            {/* Swap */}
            <Link href="/swap" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-200">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors">Swap</h3>
              <p className="text-gray-600 text-sm mb-4">Swap between CSPR and csCSPR instantly. Low fees, fast execution.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Low Fees</span>
              </div>
            </Link>

            {/* History */}
            <Link href="/history" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-200">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-600 transition-colors">Transaction History</h3>
              <p className="text-gray-600 text-sm mb-4">Track all your staking transactions. Real blockchain data with auto-refresh.</p>
              <div className="flex gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Live</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Real-time</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why CasperStake */}
      <section className="bg-gray-50 border-y border-gray-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why <span className="text-red-600">CasperStake</span>?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built for the Casper ecosystem with real smart contracts on testnet
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Liquid Staking</h3>
              <p className="text-gray-600 text-sm">Stake CSPR, receive csCSPR. Use in DeFi while earning 12.5% APY with auto-compounding.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Contracts</h3>
              <p className="text-gray-600 text-sm">Built with Odra Framework. Deployed and verified on Casper Testnet.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real Blockchain Data</h3>
              <p className="text-gray-600 text-sm">Transaction history pulled directly from Casper testnet. No simulations.</p>
            </div>
          </div>

          {/* What's Built */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">What's Built</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">Staking</p>
                <p className="text-xs text-green-600">Live on testnet</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">csCSPR Token</p>
                <p className="text-xs text-green-600">Live on testnet</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">Swap</p>
                <p className="text-xs text-green-600">Live on testnet</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-sm text-gray-900">History</p>
                <p className="text-xs text-green-600">Real blockchain data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deployed Contracts */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Deployed Contracts</h2>
              <p className="text-gray-600">Live on Casper Testnet · Built with Odra Framework</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-2 text-sm text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Testnet Active
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-semibold text-gray-900">CasperStake v2</p>
                <p className="text-sm text-gray-500">Main staking contract</p>
              </div>
              <a
                href="https://testnet.cspr.live/contract-package/f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                f0bae28501892c5b...
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-semibold text-gray-900">csCSPR Token</p>
                <p className="text-sm text-gray-500">Liquid staking token</p>
              </div>
              <a
                href="https://testnet.cspr.live/contract-package/d0845023c8f2a1b3e4d5f6789012345678901234567890abcdef123456789012"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                d0845023c8f2a1b3...
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 p-4 rounded-xl gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
              <div>
                <p className="font-semibold text-gray-900">Auction Contract</p>
                <p className="text-sm text-gray-500">Validator delegation</p>
              </div>
              <a
                href="https://testnet.cspr.live/contract-package/93d923e3a1b2c3d4e5f678901234567890abcdef1234567890abcdef12345678"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                93d923e3a1b2c3d4...
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-600 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Start Staking?</h2>
          <p className="text-red-100 mb-8 max-w-xl mx-auto">
            Join the first liquid staking protocol on Casper Network. Earn 12.5% APY while keeping your assets liquid.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/stake" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Staking
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a 
              href="https://github.com/casperstake" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-white/10 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}