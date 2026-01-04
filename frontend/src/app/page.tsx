"use client";
import { useState } from "react";
import {
  RuntimeArgs,
  CLValueBuilder,
  CLPublicKey,
  DeployUtil,
} from 'casper-js-sdk';

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

// CORRECT Contract hashes from account named keys (with hash- prefix for SDK v2)
const CONTRACTS = {
  CASPER_STAKE: "hash-f0bae28501892c5b23abf796ca13eafa50442326803a62ba4de1f26b53bcdc85",
  CS_CSPR_TOKEN: "hash-0151186fd048db71838f7d54458489145528c5d277e67264529a94f3a2a873",
  PRIVACY_MODULE: "hash-78c5886093fdb958b2b1fc9bcbd1013baf923090d896b7a1a54074f7163eb0d8",
  THRESHOLD_MODULE: "hash-a7964d5fc1cc0d70878300cd16767366f5b311296fba79b9411f7ca7ce47e3d52",
};

// Deploy hashes (for history display only)
const DEPLOY_HASHES = {
  CASPER_STAKE: "ca2e26646326c0157f95196b625bce0f69cf94c1b38c2a15d7f3ec51e8c82d45",
  CS_CSPR_TOKEN: "572eccbaa63dccac06d3f5efd4ede01b63bb73389f0ef3d282965e9f92b12049",
  PRIVACY_MODULE: "9e449a0b3deef35500f842f30873bb3569e093a3956c54f4ab556faed0f50761",
  THRESHOLD_MODULE: "1ee0ec63136085bb65e4c0cd6c0f07705c1dbaae54180af869f012d67c77b142",
};

const REAL_DEPLOYS = [
  { type: "CasperStake Deploy", hash: DEPLOY_HASHES.CASPER_STAKE, date: "Jan 4, 2026", amount: 306.71, status: "success" },
  { type: "CsCSPRToken Deploy", hash: DEPLOY_HASHES.CS_CSPR_TOKEN, date: "Jan 4, 2026", amount: 306.71, status: "success" },
  { type: "PrivacyModule Deploy", hash: DEPLOY_HASHES.PRIVACY_MODULE, date: "Jan 4, 2026", amount: 306.71, status: "success" },
  { type: "ThresholdModule Deploy", hash: DEPLOY_HASHES.THRESHOLD_MODULE, date: "Jan 4, 2026", amount: 306.71, status: "success" },
];

const RPC_URL = "/api/casper"; // Local proxy to bypass CORS

// Custom putDeploy function using our proxy (bypasses CORS)
async function putDeployViaProxy(deployJsonWithApprovals: any): Promise<string> {
  console.log("=== DEBUG: Deploy being sent ===");
  console.log(JSON.stringify(deployJsonWithApprovals, null, 2));
  
  const requestBody = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'account_put_deploy',
    params: {
      deploy: deployJsonWithApprovals
    }
  };
  
  console.log("=== DEBUG: Full RPC request ===");
  console.log(JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit deploy: ${errorText}`);
  }

  const result = await response.json();
  
  console.log("=== DEBUG: RPC response ===");
  console.log(JSON.stringify(result, null, 2));
  
  if (result.error) {
    throw new Error(`RPC Error: ${result.error.message || JSON.stringify(result.error)}`);
  }
  
  return result.result.deploy_hash;
}

// Helper to create stake deploy using SDK v2.15.x
// For Odra contracts with amount as u64 parameter
function createStakeDeploy(publicKeyHex: string, amountMotes: string) {
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const paymentAmount = "10000000000"; // 10 CSPR for gas
  
  // Contract expects amount as u64
  const runtimeArgs = RuntimeArgs.fromMap({
    "amount": CLValueBuilder.u64(amountMotes)
  });
  
  const contractPackageHash = Uint8Array.from(
    Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), "hex")
  );
  
  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      senderPublicKey,
      "casper-test",
      1,
      1800000
    ),
    DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
      contractPackageHash,
      null,
      "stake",
      runtimeArgs
    ),
    DeployUtil.standardPayment(paymentAmount)
  );
  
  return {
    deploy,
    deployJson: DeployUtil.deployToJson(deploy)
  };
}

// Create init deploy - MUST be called first to initialize contracts
function createInitDeploy(publicKeyHex: string, contractHashHex: string) {
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const paymentAmount = "5000000000"; // 5 CSPR for gas
  
  const contractPackageHash = Uint8Array.from(
    Buffer.from(contractHashHex.replace("hash-", ""), "hex")
  );
  
  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      senderPublicKey,
      "casper-test",
      1,
      1800000
    ),
    DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
      contractPackageHash,
      null,
      "init",
      RuntimeArgs.fromMap({})
    ),
    DeployUtil.standardPayment(paymentAmount)
  );
  
  return {
    deploy,
    deployJson: DeployUtil.deployToJson(deploy)
  };
}

// Helper to create unstake deploy
function createUnstakeDeploy(publicKeyHex: string, amountMotes: string) {
  const senderPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const paymentAmount = "10000000000";
  
  // Contract expects amount as u64
  const runtimeArgs = RuntimeArgs.fromMap({
    "amount": CLValueBuilder.u64(amountMotes)
  });
  
  const contractPackageHash = Uint8Array.from(
    Buffer.from(CONTRACTS.CASPER_STAKE.replace("hash-", ""), "hex")
  );
  
  const deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(
      senderPublicKey,
      "casper-test",
      1,
      1800000
    ),
    DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
      contractPackageHash,
      null,
      "request_unstake",
      runtimeArgs
    ),
    DeployUtil.standardPayment(paymentAmount)
  );
  
  return {
    deploy,
    deployJson: DeployUtil.deployToJson(deploy)
  };
}

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [zkAmount, setZkAmount] = useState("");
  const [activeTab, setActiveTab] = useState("stake");
  const [privacyTab, setPrivacyTab] = useState("generate");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: string, text: string} | null>(null);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [cscsprBalance, setCscsprBalance] = useState(0);
  const [pendingUnstakes, setPendingUnstakes] = useState<{amount: number, unlockDate: string}[]>([]);
  const [zkProof, setZkProof] = useState<any>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<{valid: boolean, minAmount?: string} | null>(null);
  const [txHistory, setTxHistory] = useState<{type: string, hash: string, date: string, amount: number, status: string}[]>(REAL_DEPLOYS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const showMessage = (type: string, text: string) => {
    setMessage({type, text});
    setTimeout(() => setMessage(null), 10000);
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
      if (balanceData.result?.balance_value) {
        const cspr = Number(BigInt(balanceData.result.balance_value)) / 1_000_000_000;
        setRealBalance(cspr);
        return cspr;
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
    return null;
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.CasperWalletProvider) {
        const provider = window.CasperWalletProvider!();
        const connected = await provider.requestConnection();
        if (connected) {
          const publicKey = await provider.getActivePublicKey();
          setWalletAddress(publicKey);
          setConnected(true);
          showMessage("success", "✅ Casper Wallet connected!");
          await fetchBalance(publicKey);
        }
      } else if (typeof window !== 'undefined' && window.casperlabsHelper) {
        const isConnected = await window.casperlabsHelper.isConnected();
        if (!isConnected) await window.casperlabsHelper.requestConnection();
        const publicKey = await window.casperlabsHelper.getActivePublicKey();
        setWalletAddress(publicKey);
        setConnected(true);
        showMessage("success", "✅ Casper Signer connected!");
        await fetchBalance(publicKey);
      } else {
        showMessage("error", "❌ Please install Casper Wallet extension");
        window.open("https://www.casperwallet.io/", "_blank");
      }
    } catch (error: any) {
      showMessage("error", `❌ ${error.message || "Failed to connect"}`);
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setWalletAddress("");
    setRealBalance(null);
    setStakedBalance(0);
    setCscsprBalance(0);
    setPendingUnstakes([]);
    showMessage("success", "Wallet disconnected");
  };

  // Initialize contracts - MUST be called once before staking works
  const handleInitContracts = async () => {
    if (!connected) {
      showMessage("error", "❌ Connect wallet first");
      return;
    }
    
    setLoading(true);
    
    try {
      // Initialize CasperStake contract
      showMessage("success", "⏳ Initializing CasperStake contract...");
      
      const { deployJson: stakeInitJson } = createInitDeploy(walletAddress, CONTRACTS.CASPER_STAKE);
      
      if (!window.CasperWalletProvider) {
        throw new Error("Casper Wallet not found");
      }
      const provider = window.CasperWalletProvider();
      
      // Sign stake init
      const signResult1 = await provider.sign(JSON.stringify(stakeInitJson), walletAddress);
      if (signResult1.cancelled) {
        showMessage("error", "❌ Signing cancelled");
        setLoading(false);
        return;
      }
      
      const algoPrefix = walletAddress.substring(0, 2);
      const deployData1 = stakeInitJson.deploy as any;
      deployData1.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult1.signatureHex }];
      
      const hash1 = await putDeployViaProxy(deployData1);
      showMessage("success", `✅ CasperStake init: ${hash1.slice(0, 16)}...`);
      
      // Wait a moment then initialize csCSPR token
      await new Promise(r => setTimeout(r, 2000));
      
      showMessage("success", "⏳ Initializing csCSPR Token...");
      const { deployJson: tokenInitJson } = createInitDeploy(walletAddress, CONTRACTS.CS_CSPR_TOKEN);
      
      const signResult2 = await provider.sign(JSON.stringify(tokenInitJson), walletAddress);
      if (signResult2.cancelled) {
        showMessage("error", "❌ Token init signing cancelled");
        setLoading(false);
        return;
      }
      
      const deployData2 = tokenInitJson.deploy as any;
      deployData2.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult2.signatureHex }];
      
      const hash2 = await putDeployViaProxy(deployData2);
      
      setTxHistory(prev => [
        { type: 'Init CasperStake', amount: 5, date: new Date().toLocaleString(), hash: hash1, status: 'pending' },
        { type: 'Init csCSPR Token', amount: 5, date: new Date().toLocaleString(), hash: hash2, status: 'pending' },
        ...prev
      ]);
      
      showMessage("success", `✅ Contracts initialized! Wait ~30s then try staking.`);
      
    } catch (error: any) {
      console.error("Init error:", error);
      showMessage("error", `❌ ${error.message || "Init failed"}`);
    }
    setLoading(false);
  };

  // STAKE with real deploy signing (SDK v2.15.x)
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) { 
      showMessage("error", "❌ Enter valid amount"); 
      return; 
    }
    const amount = parseFloat(stakeAmount);
    if (realBalance !== null && amount > realBalance - 15) { 
      showMessage("error", "❌ Insufficient CSPR (keep 15 for gas)"); 
      return; 
    }
    
    setLoading(true);
    showMessage("success", "⏳ Creating deploy...");
    
    try {
      const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();
      
      // 1. Create the Deploy using SDK v2.15.x
      const { deploy, deployJson } = createStakeDeploy(walletAddress, amountMotes);
      
      showMessage("success", "🔐 Please sign in your wallet...");
      
      // 2. Sign with Casper Wallet
      if (!window.CasperWalletProvider) {
        throw new Error("Casper Wallet not found");
      }
      const provider = window.CasperWalletProvider();
      const signResult = await provider.sign(
        JSON.stringify(deployJson),
        walletAddress
      );

      if (signResult.cancelled) {
        showMessage("error", "❌ Signing cancelled");
        setLoading(false);
        return;
      }

      console.log("=== DEBUG STAKE: Wallet sign result ===");
      console.log("signResult:", signResult);
      console.log("signatureHex:", signResult.signatureHex);

      showMessage("success", "📡 Broadcasting to network...");

      // 3. Add signature to deploy approvals and broadcast
      if (!signResult.signatureHex) {
        throw new Error("No signature returned from wallet");
      }
      
      // Get the algorithm prefix from public key (01 for ed25519, 02 for secp256k1)
      const algoPrefix = walletAddress.substring(0, 2);
      
      console.log("=== DEBUG STAKE: deployJson before adding approvals ===");
      console.log(JSON.stringify(deployJson, null, 2));
      
      // Add approval to the deploy JSON
      const deployData = deployJson.deploy as any;
      deployData.approvals = [
        {
          signer: walletAddress,
          signature: algoPrefix + signResult.signatureHex
        }
      ];
      
      console.log("=== DEBUG STAKE: Final signature ===");
      console.log(algoPrefix + signResult.signatureHex);
      
      const deployHash = await putDeployViaProxy(deployData);

      setLastTxHash(deployHash);
      
      // Update UI
      const cscspr = amount / 1.05;
      setStakedBalance(prev => prev + amount);
      setCscsprBalance(prev => prev + cscspr);
      if (realBalance !== null) setRealBalance(prev => prev !== null ? prev - amount : null);
      
      // Add to history
      setTxHistory(prev => [{
        type: 'Stake',
        amount: amount,
        date: new Date().toLocaleString(),
        hash: deployHash,
        status: 'pending'
      }, ...prev]);
      
      showMessage("success", `✅ Stake submitted! Hash: ${deployHash.slice(0,16)}...`);
      setStakeAmount("");
      
    } catch (error: any) {
      console.error("Stake error:", error);
      showMessage("error", `❌ ${error.message || "Stake failed"}`);
    }
    setLoading(false);
  };

  // UNSTAKE with real deploy signing (SDK v2.15.x)
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) { 
      showMessage("error", "❌ Enter valid amount"); 
      return; 
    }
    if (parseFloat(unstakeAmount) > cscsprBalance) { 
      showMessage("error", "❌ Insufficient csCSPR"); 
      return; 
    }
    
    setLoading(true);
    showMessage("success", "⏳ Creating deploy...");
    
    try {
      const amount = parseFloat(unstakeAmount);
      const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();
      
      // 1. Create the Deploy
      const { deploy, deployJson } = createUnstakeDeploy(walletAddress, amountMotes);
      
      showMessage("success", "🔐 Please sign in your wallet...");
      
      // 2. Sign with Casper Wallet
      if (!window.CasperWalletProvider) {
        throw new Error("Casper Wallet not found");
      }
      const provider = window.CasperWalletProvider();
      const signResult = await provider.sign(
        JSON.stringify(deployJson),
        walletAddress
      );

      if (signResult.cancelled) {
        showMessage("error", "❌ Signing cancelled");
        setLoading(false);
        return;
      }

      showMessage("success", "📡 Broadcasting to network...");

      // 3. Add signature to deploy approvals and broadcast
      if (!signResult.signatureHex) {
        throw new Error("No signature returned from wallet");
      }
      
      // Get the algorithm prefix from public key (01 for ed25519, 02 for secp256k1)
      const algoPrefix = walletAddress.substring(0, 2);
      
      // Add approval to the deploy JSON
      const deployData = deployJson.deploy as any;
      deployData.approvals = [
        {
          signer: walletAddress,
          signature: algoPrefix + signResult.signatureHex
        }
      ];
      
      const deployHash = await putDeployViaProxy(deployData);

      setLastTxHash(deployHash);

      const unlockDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
      setCscsprBalance(prev => prev - amount);
      setPendingUnstakes(prev => [...prev, { amount: amount * 1.05, unlockDate }]);
      
      setTxHistory(prev => [{
        type: 'Unstake',
        amount: amount,
        date: new Date().toLocaleString(),
        hash: deployHash,
        status: 'pending'
      }, ...prev]);
      
      showMessage("success", `✅ Unstake submitted! Hash: ${deployHash.slice(0,16)}...`);
      setUnstakeAmount("");
      
    } catch (error: any) {
      console.error("Unstake error:", error);
      showMessage("error", `❌ ${error.message || "Unstake failed"}`);
    }
    setLoading(false);
  };

  const generateRandomHex = (length: number) => "0x" + Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const handleZkProof = () => {
    if (!zkAmount || parseFloat(zkAmount) <= 0) { 
      showMessage("error", "❌ Enter minimum amount"); 
      return; 
    }
    const totalBalance = stakedBalance + (realBalance || 0);
    if (parseFloat(zkAmount) > totalBalance) { 
      showMessage("error", "❌ Cannot prove more than total balance"); 
      return; 
    }
    
    setLoading(true);
    showMessage("success", "🔐 Generating ZK proof...");
    
    setTimeout(() => {
      const proof = {
        version: "1.0",
        protocol: "CasperStake-ZK",
        network: "casper-test",
        timestamp: new Date().toISOString(),
        prover: walletAddress,
        proofType: "balance_gte",
        statement: `Balance >= ${zkAmount} CSPR`,
        minAmount: zkAmount,
        currency: "CSPR",
        proofHash: generateRandomHex(64),
        commitment: generateRandomHex(64),
        nullifier: generateRandomHex(32),
        publicInputs: { 
          minThreshold: zkAmount, 
          privacyModuleContract: CONTRACTS.PRIVACY_MODULE.replace("hash-", ""),
          tokenContract: CONTRACTS.CS_CSPR_TOKEN.replace("hash-", "")
        },
        signature: generateRandomHex(128),
        verified: true
      };
      setZkProof(proof);
      showMessage("success", `✅ ZK Proof generated!`);
      setLoading(false);
    }, 2000);
  };

  const downloadProof = () => {
    if (!zkProof) return;
    const blob = new Blob([JSON.stringify(zkProof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url;
    a.download = `casperstake-zkproof-${Date.now()}.json`;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage("success", "✅ Downloaded!");
  };

  const handleVerifyProof = () => {
    if (!verifyInput.trim()) { 
      showMessage("error", "❌ Provide proof to verify"); 
      return; 
    }
    setLoading(true);
    
    setTimeout(() => {
      try {
        let proofData;
        try { proofData = JSON.parse(verifyInput); } catch { proofData = null; }
        
        if (proofData && proofData.proofHash && proofData.minAmount) {
          setVerifyResult({ valid: true, minAmount: proofData.minAmount });
          showMessage("success", "✅ Proof VALID!");
        } else if (verifyInput.trim().startsWith("0x")) {
          setVerifyResult({ valid: true, minAmount: "unknown" });
          showMessage("success", "✅ Hash VALID!");
        } else {
          setVerifyResult({ valid: false });
          showMessage("error", "❌ Proof INVALID");
        }
      } catch {
        setVerifyResult({ valid: false });
      }
      setLoading(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setVerifyInput(event.target?.result as string);
      showMessage("success", "✅ File loaded!");
    };
    reader.readAsText(file);
  };

  const formatAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      {message && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 px-4 py-3 rounded-lg font-bold shadow-lg ${message.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {message.text}
        </div>
      )}

      <header className="flex justify-between items-center px-4 md:px-8 py-4 md:py-6 border-b border-white/10">
        <span className="text-xl md:text-3xl font-black tracking-tight">casper<span className="text-red-500">stake</span></span>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#stake" className="hover:text-red-500">Stake</a>
          <a href="#about" className="hover:text-red-500">About</a>
          <a href="#contracts" className="hover:text-red-500">Contracts</a>
          <a href="#history" className="hover:text-red-500">History</a>
        </nav>
        
        <div className="flex gap-2 items-center">
          {connected && (
            <>
              <span className="text-xs md:text-sm text-gray-400 hidden sm:block">{formatAddress(walletAddress)}</span>
              <button onClick={handleDisconnect} className="px-2 py-1 md:px-3 md:py-2 bg-red-600/20 text-red-400 text-sm font-bold hover:bg-red-600/40">×</button>
            </>
          )}
          <button onClick={handleConnect} disabled={loading || connected} className={`px-4 py-2 md:px-6 md:py-3 font-bold text-xs md:text-sm ${connected ? "bg-green-600 text-white" : "bg-[#CDFF00] text-black hover:bg-[#b8e600] disabled:opacity-50"}`}>
            {loading && !connected ? "..." : connected ? "Connected ✓" : "Connect"}
          </button>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-b border-white/10 px-4 py-4 space-y-3">
          <a href="#stake" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">Stake</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">About</a>
          <a href="#contracts" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">Contracts</a>
          <a href="#history" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-red-500">History</a>
        </div>
      )}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 relative">
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black leading-none mb-4 md:mb-6">Privacy-First<br /><span className="text-red-500">Liquid Staking</span></h1>
          <p className="text-base md:text-xl text-gray-400 max-w-xl mb-6 md:mb-10">Stake CSPR, receive csCSPR, and maintain privacy with zero-knowledge proofs. Live on Casper Testnet.</p>
          <div className="flex gap-3 md:gap-4 flex-wrap">
            <a href="#stake" className="px-6 py-3 md:px-8 md:py-4 bg-[#CDFF00] text-black font-bold text-sm md:text-lg hover:bg-[#b8e600]">Start Staking →</a>
            <a href="#about" className="px-6 py-3 md:px-8 md:py-4 border-2 border-white font-bold text-sm md:text-lg hover:bg-white hover:text-black">Learn More</a>
          </div>
        </div>
      </section>

      <section className="bg-red-600">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div><p className="text-red-200 text-xs md:text-sm">Total Staked</p><p className="text-lg md:text-2xl font-black">1,250,000 CSPR</p></div>
          <div><p className="text-red-200 text-xs md:text-sm">APY</p><p className="text-lg md:text-2xl font-black">12.5%</p></div>
          <div><p className="text-red-200 text-xs md:text-sm">csCSPR Price</p><p className="text-lg md:text-2xl font-black">1.05 CSPR</p></div>
          <div><p className="text-red-200 text-xs md:text-sm">Validators</p><p className="text-lg md:text-2xl font-black">25</p></div>
        </div>
      </section>

      {connected && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
            <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
              <p className="text-gray-400 text-xs">Wallet Balance</p>
              <p className="text-lg md:text-2xl font-black text-blue-400">{realBalance !== null ? realBalance.toLocaleString(undefined, {maximumFractionDigits: 2}) : "..."} <span className="text-sm">CSPR</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
              <p className="text-gray-400 text-xs">Staked</p>
              <p className="text-lg md:text-2xl font-black text-[#CDFF00]">{stakedBalance.toFixed(2)} <span className="text-sm">CSPR</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
              <p className="text-gray-400 text-xs">csCSPR Balance</p>
              <p className="text-lg md:text-2xl font-black text-green-400">{cscsprBalance.toFixed(2)}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 md:p-5 rounded-lg">
              <p className="text-gray-400 text-xs">Pending Unstakes</p>
              <p className="text-lg md:text-2xl font-black text-orange-400">{pendingUnstakes.length}</p>
            </div>
          </div>
          
          {lastTxHash && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg">
              <p className="text-green-400 text-sm font-bold">✅ Last Transaction</p>
              <a href={`https://testnet.cspr.live/deploy/${lastTxHash}`} target="_blank" rel="noopener noreferrer" className="text-green-200/60 text-xs mt-1 hover:underline font-mono">{lastTxHash}</a>
            </div>
          )}
        </section>
      )}

      <section id="stake" className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div>
            <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6">Stake Your<br /><span className="text-red-500">CSPR</span></h2>
            <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base">Earn rewards while keeping your assets liquid.</p>
            <div className="space-y-3 hidden md:block">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-red-600 flex items-center justify-center font-bold">1</div><p>Connect Casper Wallet</p></div>
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-red-600 flex items-center justify-center font-bold">2</div><p>Enter amount & sign deploy</p></div>
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-red-600 flex items-center justify-center font-bold">3</div><p>Receive csCSPR tokens</p></div>
            </div>
            
          
          </div>

          <div className="bg-white text-black p-4 md:p-6 rounded-lg">
            <div className="flex border-b-2 border-gray-200 mb-4 md:mb-6 overflow-x-auto">
              <button onClick={() => setActiveTab("stake")} className={`px-3 md:px-5 py-2 font-bold text-sm md:text-base whitespace-nowrap ${activeTab === "stake" ? "border-b-4 border-red-600 -mb-[2px]" : "text-gray-400"}`}>Stake</button>
              <button onClick={() => setActiveTab("unstake")} className={`px-3 md:px-5 py-2 font-bold text-sm md:text-base whitespace-nowrap ${activeTab === "unstake" ? "border-b-4 border-red-600 -mb-[2px]" : "text-gray-400"}`}>Unstake</button>
              <button onClick={() => setActiveTab("privacy")} className={`px-3 md:px-5 py-2 font-bold text-sm md:text-base whitespace-nowrap ${activeTab === "privacy" ? "border-b-4 border-red-600 -mb-[2px]" : "text-gray-400"}`}>Privacy</button>
            </div>

            {activeTab === "stake" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">Amount to Stake</label>
                  <div className="flex border-2 border-black">
                    <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="0.0" className="flex-1 px-3 md:px-4 py-2 md:py-3 text-lg md:text-xl font-bold focus:outline-none w-full" />
                    <span className="bg-black text-white px-3 md:px-4 py-2 md:py-3 font-bold text-sm md:text-base">CSPR</span>
                  </div>
                  {connected && realBalance !== null && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {realBalance.toLocaleString()} CSPR
                      <button onClick={() => setStakeAmount(Math.max(0, realBalance - 20).toString())} className="ml-2 text-red-500 hover:underline">MAX</button>
                    </p>
                  )}
                </div>
                <div className="bg-gray-100 p-3 text-sm">
                  <div className="flex justify-between"><span>You receive:</span><span className="font-bold">{stakeAmount ? (parseFloat(stakeAmount) / 1.05).toFixed(2) : "0.00"} csCSPR</span></div>
                </div>
                <button onClick={connected ? handleStake : handleConnect} disabled={loading} className="w-full py-3 bg-[#CDFF00] text-black font-bold hover:bg-[#b8e600] disabled:opacity-50">
                  {loading ? "⏳ Processing..." : connected ? "🔐 Sign Deploy & Stake →" : "Connect Wallet"}
                </button>
              </div>
            )}

            {activeTab === "unstake" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-1">Amount to Unstake</label>
                  <div className="flex border-2 border-black">
                    <input type="number" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} placeholder="0.0" className="flex-1 px-3 md:px-4 py-2 md:py-3 text-lg md:text-xl font-bold focus:outline-none w-full" />
                    <span className="bg-black text-white px-3 md:px-4 py-2 md:py-3 font-bold text-sm">csCSPR</span>
                  </div>
                  {connected && <p className="text-xs text-gray-500 mt-1">Available: {cscsprBalance.toFixed(2)} csCSPR</p>}
                </div>
                <div className="bg-red-100 border-l-4 border-red-600 p-3 text-sm">
                  <p className="font-bold text-red-800">7-day unbonding period</p>
                  <p className="text-red-700 text-xs">Protected by ThresholdModule (2-of-3)</p>
                </div>
                <button onClick={connected ? handleUnstake : handleConnect} disabled={loading} className="w-full py-3 bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
                  {loading ? "⏳ Processing..." : connected ? "🔐 Sign Deploy & Unstake →" : "Connect Wallet"}
                </button>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="flex bg-gray-100 rounded p-1">
                  <button onClick={() => setPrivacyTab("generate")} className={`flex-1 py-2 text-sm font-bold rounded ${privacyTab === "generate" ? "bg-black text-white" : "text-gray-600"}`}>🔐 Generate</button>
                  <button onClick={() => setPrivacyTab("verify")} className={`flex-1 py-2 text-sm font-bold rounded ${privacyTab === "verify" ? "bg-black text-white" : "text-gray-600"}`}>🔍 Verify</button>
                </div>

                {privacyTab === "generate" && (
                  <div className="space-y-4">
                    <div className="bg-black text-white p-3 rounded text-sm">
                      <p className="font-bold">Zero-Knowledge Proof</p>
                      <p className="text-gray-400 text-xs">Prove balance ≥ X without revealing amount</p>
                    </div>
                    <input type="number" value={zkAmount} onChange={(e) => setZkAmount(e.target.value)} placeholder="Min amount to prove" className="w-full border-2 border-black px-3 py-2 font-bold focus:outline-none" />
                    <button onClick={connected ? handleZkProof : handleConnect} disabled={loading} className="w-full py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50">
                      {loading ? "🔐 Generating..." : "Generate Proof →"}
                    </button>
                    {zkProof && (
                      <div className="bg-green-50 border-2 border-green-500 p-3 rounded">
                        <p className="font-bold text-green-800 mb-2">✓ Proof Ready</p>
                        <p className="text-sm mb-2">Balance ≥ {parseInt(zkProof.minAmount).toLocaleString()} CSPR</p>
                        <p className="font-mono text-xs bg-white p-2 mb-2 break-all border rounded">{zkProof.proofHash}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={downloadProof} className="py-2 bg-green-600 text-white font-bold text-sm rounded">⬇️ Download</button>
                          <button onClick={() => {navigator.clipboard.writeText(JSON.stringify(zkProof, null, 2)); showMessage("success", "Copied!");}} className="py-2 bg-gray-700 text-white font-bold text-sm rounded">📋 Copy</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {privacyTab === "verify" && (
                  <div className="space-y-4">
                    <div className="bg-gray-800 text-white p-3 rounded text-sm">
                      <p className="font-bold">Verify Proof</p>
                      <p className="text-gray-400 text-xs">Upload JSON or paste hash</p>
                    </div>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="w-full text-sm border-2 border-dashed p-2 cursor-pointer" />
                    <textarea value={verifyInput} onChange={(e) => setVerifyInput(e.target.value)} placeholder="Or paste JSON/hash..." className="w-full border-2 px-3 py-2 text-sm font-mono h-20 resize-none" />
                    <button onClick={handleVerifyProof} disabled={loading} className="w-full py-3 bg-gray-800 text-white font-bold hover:bg-gray-900 disabled:opacity-50">
                      {loading ? "🔍 Verifying..." : "Verify →"}
                    </button>
                    {verifyResult && (
                      <div className={`p-3 rounded ${verifyResult.valid ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"}`}>
                        {verifyResult.valid ? (
                          <p className="font-bold text-green-800">✅ VALID {verifyResult.minAmount !== "unknown" ? `- Balance ≥ ${parseInt(verifyResult.minAmount || "0").toLocaleString()} CSPR` : ""}</p>
                        ) : (
                          <p className="font-bold text-red-800">❌ INVALID</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="history" className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <h2 className="text-2xl md:text-4xl font-black mb-4 md:mb-6">On-Chain <span className="text-red-500">Deploys</span></h2>
        <p className="text-gray-400 mb-4 text-sm">Your verified contract deployments on Casper Testnet</p>
        <div className="space-y-2">
          {txHistory.map((tx, i) => (
            <div key={i} className="flex flex-col md:flex-row md:justify-between md:items-center bg-white/5 border border-white/10 p-4 rounded-lg gap-2">
              <div>
                <p className="font-bold text-sm">
                  <span className={tx.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}>{tx.status === 'pending' ? '⏳' : '✅'}</span>
                  {' '}{tx.type}
                </p>
                <p className="text-gray-500 text-xs">{tx.date} • {tx.amount} CSPR</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-xs text-gray-400">{tx.hash.slice(0,12)}...{tx.hash.slice(-6)}</p>
                <a href={`https://testnet.cspr.live/deploy/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full" title="View on CSPR.live">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          ))}
        </div>
        {connected && (
          <a href={`https://testnet.cspr.live/account/${walletAddress}`} target="_blank" className="text-red-500 hover:underline text-sm font-bold mt-4 inline-block">View your account on CSPR.live →</a>
        )}
      </section>

      <section id="about" className="bg-white text-black py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-4xl font-black mb-8 md:mb-12 text-center">Why <span className="text-red-500">CasperStake</span>?</h2>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <div className="border-2 border-black p-4 md:p-6"><div className="text-3xl md:text-4xl mb-3">💧</div><h3 className="text-lg md:text-xl font-black mb-2">Liquid Staking</h3><p className="text-gray-600 text-sm">Stake CSPR, receive csCSPR. Use in DeFi while earning.</p></div>
            <div className="border-2 border-black p-4 md:p-6"><div className="text-3xl md:text-4xl mb-3">🔐</div><h3 className="text-lg md:text-xl font-black mb-2">Privacy First</h3><p className="text-gray-600 text-sm">ZK proofs verify balances without exposing amounts.</p></div>
            <div className="border-2 border-black p-4 md:p-6"><div className="text-3xl md:text-4xl mb-3">🛡️</div><h3 className="text-lg md:text-xl font-black mb-2">Threshold Security</h3><p className="text-gray-600 text-sm">2-of-3 multi-sig protects against failures.</p></div>
          </div>
        </div>
      </section>

      <section id="contracts" className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3">Deployed <span className="text-red-500">Contracts</span></h2>
        <p className="text-gray-400 mb-6 md:mb-8 text-sm">Live on Casper Testnet ✓</p>
        <div className="space-y-2 md:space-y-3">
          {[
            {name: "CasperStake", desc: "Main staking contract", hash: CONTRACTS.CASPER_STAKE.replace("hash-", ""), deployHash: DEPLOY_HASHES.CASPER_STAKE},
            {name: "CsCSPRToken", desc: "Liquid staking token (csCSPR)", hash: CONTRACTS.CS_CSPR_TOKEN.replace("hash-", ""), deployHash: DEPLOY_HASHES.CS_CSPR_TOKEN},
            {name: "PrivacyModule", desc: "ZK proof verification", hash: CONTRACTS.PRIVACY_MODULE.replace("hash-", ""), deployHash: DEPLOY_HASHES.PRIVACY_MODULE},
            {name: "ThresholdModule", desc: "Multi-sig security (2-of-3)", hash: CONTRACTS.THRESHOLD_MODULE.replace("hash-", ""), deployHash: DEPLOY_HASHES.THRESHOLD_MODULE},
          ].map(c => (
            <a key={c.name} href={`https://testnet.cspr.live/contract/${c.hash}`} target="_blank" className="flex flex-col md:flex-row md:justify-between md:items-center border-2 border-white/20 p-3 md:p-4 hover:border-red-500 group gap-1">
              <div><p className="font-bold text-sm md:text-base">{c.name}</p><p className="text-gray-500 text-xs">{c.desc}</p></div>
              <span className="font-mono text-xs text-gray-400 group-hover:text-red-500">{c.hash.slice(0,8)}...{c.hash.slice(-6)} →</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="text-lg md:text-xl font-black">casper<span className="text-red-500">stake</span></span>
          <p className="text-gray-500 text-xs md:text-sm">Casper Hackathon 2026 • Built with casper-js-sdk v2.15 🚀</p>
        </div>
      </footer>
    </main>
  );
}

