"use client";
import { useState, useEffect, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/components/ToastProvider";
import { RuntimeArgs, CLValueBuilder, CLPublicKey, DeployUtil, CLByteArray } from 'casper-js-sdk';

// ============================================================================
// CONTRACT ADDRESSES (Casper Testnet)
// ============================================================================
const CONTRACTS = {
  ROUTER: "d52d2e98554c1854fd8a9ce541a9d52dab73fd2841655513a9c8295898803ce0",
  WCSPR: "4f2d1b772147b9ce3706919fe0750af6964249b0931e2115045f97e1e135e80b",  
  CSCSPR_TOKEN: "7de7de6418324583a8fd186226fb65c3db36c37480fc11e19d262989279f78bd",
  CASPER_STAKE: "8322aff2cdaf904269205090a0a42da0aec6b659bb888a6b7172a6f2cf3bec3f",
  FACTORY: "13cc83616c3fb4e6ea22ead5e61eb6319d728783ed02eab51b1f442085e605a7",
};

// Gas costs (in motes = CSPR * 10^9)
const GAS = {
  WRAP: 10_000_000_000,           // 10 CSPR
  UNWRAP: 10_000_000_000,         // 10 CSPR
  APPROVE: 3_000_000_000,         // 3 CSPR
  SWAP_TOKEN_TOKEN: 30_000_000_000, // 30 CSPR
  SWAP_CSPR_TOKEN: 35_000_000_000,  // 35 CSPR
  SWAP_TOKEN_CSPR: 35_000_000_000,  // 35 CSPR
};

// Token definitions
const TOKENS = [
  { symbol: "CSPR", name: "Casper", color: "#FF0032", hash: null, decimals: 9 },
  { symbol: "WCSPR", name: "Wrapped CSPR", color: "#FF6B35", hash: CONTRACTS.WCSPR, decimals: 9 },
  { symbol: "csCSPR", name: "CasperStake LST", color: "#BFFF00", hash: CONTRACTS.CSCSPR_TOKEN, decimals: 9 },
];

// Swap route types
type SwapType = "wrap" | "unwrap" | "cspr_to_token" | "token_to_cspr" | "token_to_token";

interface SwapRoute {
  from: string;
  to: string;
  type: SwapType;
  fee: number;
  wasmFile?: string;
  needsPool?: boolean;
}

// All possible swap routes
const ROUTES: SwapRoute[] = [
  // Wrap/Unwrap (need WASM)
  { from: "CSPR", to: "WCSPR", type: "wrap", fee: 0, wasmFile: "wrap_cspr.wasm" },
  { from: "WCSPR", to: "CSPR", type: "unwrap", fee: 0, wasmFile: "unwrap_cspr.wasm" },
  
  // CSPR <-> Token (need WASM + pool)
  // { from: "CSPR", to: "csCSPR", type: "cspr_to_token", fee: 0.3, wasmFile: "swap_cspr_for_tokens.wasm", needsPool: true },
  { from: "csCSPR", to: "CSPR", type: "token_to_cspr", fee: 0.5, needsPool: false },
  
  // Token <-> Token (no WASM needed, just pool)
  // { from: "WCSPR", to: "csCSPR", type: "token_to_token", fee: 0.3, needsPool: true },
  // { from: "csCSPR", to: "WCSPR", type: "token_to_token", fee: 0.3, needsPool: true },
];

// WASM cache
interface WasmCache {
  wrap_cspr: Uint8Array | null;
  unwrap_cspr: Uint8Array | null;
  swap_cspr_for_tokens: Uint8Array | null;
  swap_tokens_for_cspr: Uint8Array | null;
}

export default function SwapPage() {
  const { connected, walletAddress, realBalance, cscsprBalance, exchangeRate, connect, setLoading } = useWallet();
  const { showToast } = useToast();

  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [wcsprBalance, setWcsprBalance] = useState(0);
  const [slippage, setSlippage] = useState(0.5);
  
  // WASM loading state
  const [wasm, setWasm] = useState<WasmCache>({
    wrap_cspr: null,
    unwrap_cspr: null,
    swap_cspr_for_tokens: null,
    swap_tokens_for_cspr: null,
  });
  const [wasmLoading, setWasmLoading] = useState(true);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Load all WASM files on mount
  useEffect(() => {
    loadAllWasm();
  }, []);

  const loadAllWasm = async () => {
    setWasmLoading(true);
    const wasmFiles = ['wrap_cspr', 'unwrap_cspr', 'swap_cspr_for_tokens', 'swap_tokens_for_cspr'];
    const loaded: WasmCache = {
      wrap_cspr: null,
      unwrap_cspr: null,
      swap_cspr_for_tokens: null,
      swap_tokens_for_cspr: null,
    };

    for (const name of wasmFiles) {
      try {
        const res = await fetch(`/${name}.wasm`);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          loaded[name as keyof WasmCache] = new Uint8Array(buffer);
          console.log(`✓ Loaded ${name}.wasm (${buffer.byteLength} bytes)`);
        } else {
          console.warn(`✗ ${name}.wasm not found`);
        }
      } catch (e) {
        console.warn(`✗ Failed to load ${name}.wasm:`, e);
      }
    }

    setWasm(loaded);
    setWasmLoading(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFrom(false);
      if (toRef.current && !toRef.current.contains(e.target as Node)) setShowTo(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch WCSPR balance
  useEffect(() => {
    if (connected && walletAddress) fetchWCSPR();
  }, [connected, walletAddress]);

  const fetchWCSPR = async () => {
    try {
      const accHash = CLPublicKey.fromHex(walletAddress).toAccountHashStr().replace('account-hash-', '');
      const res = await fetch('/api/casper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'state_get_dictionary_item',
          params: {
            state_root_hash: null,
            dictionary_identifier: {
              ContractNamedKey: { key: `hash-${CONTRACTS.WCSPR}`, dictionary_name: 'balances', dictionary_item_key: accHash }
            }
          }
        })
      });
      const data = await res.json();
      if (data.result?.stored_value?.CLValue?.parsed) {
        setWcsprBalance(Number(BigInt(data.result.stored_value.CLValue.parsed)) / 1e9);
      }
    } catch (e) { /* ignore */ }
  };

  // Find current route
  const route = ROUTES.find(r => r.from === fromToken.symbol && r.to === toToken.symbol);

  // Get balance for token
  const getBal = (s: string) => {
    if (s === "CSPR") return realBalance || 0;
    if (s === "csCSPR") return cscsprBalance || 0;
    if (s === "WCSPR") return wcsprBalance;
    return 0;
  };

  // Calculate output amount
  useEffect(() => {
    if (!fromAmount || !route) { setToAmount(""); return; }
    const inp = parseFloat(fromAmount);
    if (isNaN(inp) || inp <= 0) { setToAmount(""); return; }
    
    let out = inp;
    // Apply exchange rate for csCSPR <-> CSPR
    if ((fromToken.symbol === "csCSPR" && toToken.symbol === "CSPR") ||
        (fromToken.symbol === "CSPR" && toToken.symbol === "csCSPR")) {
      if (fromToken.symbol === "csCSPR") {
        out = inp * exchangeRate;
      } else {
        out = inp / exchangeRate;
      }
    }
    // Apply fee
    out = out * (1 - route.fee / 100);
    setToAmount(out.toFixed(6));
  }, [fromAmount, route, exchangeRate, fromToken.symbol, toToken.symbol]);

  // Switch tokens
  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
  };

  // Helper: hash string to bytes
  const toBytes = (h: string) => Uint8Array.from(Buffer.from(h.replace("hash-", ""), 'hex'));

  // Helper: send deploy to RPC
  const sendDeploy = async (deployData: any): Promise<string> => {
    const res = await fetch('/api/casper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'account_put_deploy', params: { deploy: deployData } })
    });
    const j = await res.json();
    console.log("RPC Response:", j);
    if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
    return j.result?.deploy_hash;
  };

  // Check if route can execute
  const canExecute = (): { ok: boolean; reason?: string } => {
    if (!route) return { ok: false, reason: "No route available" };
    if (!fromAmount || parseFloat(fromAmount) <= 0) return { ok: false, reason: "Enter amount" };
    if (parseFloat(fromAmount) > getBal(fromToken.symbol)) return { ok: false, reason: "Insufficient balance" };
    
    // Check WASM availability
    if (route.wasmFile) {
      const wasmKey = route.wasmFile.replace('.wasm', '') as keyof WasmCache;
      if (!wasm[wasmKey]) return { ok: false, reason: `Missing ${route.wasmFile}` };
    }
    
    return { ok: true };
  };

  // MAIN SWAP FUNCTION - FIXED: Prevents dual toasts
  const doSwap = async () => {
    if (!connected) { connect(); return; }
    
    const check = canExecute();
    if (!check.ok) {
      showToast("error", "Cannot Swap", check.reason || "Unknown error");
      return;
    }

    setSwapping(true);
    setLoading(true);

    const amount = parseFloat(fromAmount);
    const amountMotes = BigInt(Math.floor(amount * 1e9));
    const minOutput = BigInt(Math.floor(parseFloat(toAmount) * (1 - slippage / 100) * 1e9));
    const deadline = BigInt(Date.now() + 20 * 60 * 1000);

    // Track if we've already shown a final result
    let hasShownResult = false;

    const showFinalResult = (type: "success" | "error", title: string, message: string, hash?: string) => {
      if (hasShownResult) return; // Prevent duplicate toasts
      hasShownResult = true;
      showToast(type, title, message, hash, type === "success" ? 8000 : 5000);
    };

    const cleanup = () => {
      setSwapping(false);
      setLoading(false);
    };

    try {
      const provider = (window as any).CasperWalletProvider?.();
      if (!provider) throw new Error("Casper Wallet not found");

      let deploy;
      let successMsg = "";

      switch (route!.type) {
        // ============================================
        // WRAP: CSPR → WCSPR
        // ============================================
        case "wrap": {
          showToast("info", "Wrapping CSPR", "Creating transaction...", undefined, 0);
          
          const args = RuntimeArgs.fromMap({
            "wcspr_hash": new CLByteArray(toBytes(CONTRACTS.WCSPR)),
            "amount": CLValueBuilder.u512(amountMotes.toString())
          });

          // Payment includes gas + amount to wrap
          const payment = GAS.WRAP + Number(amountMotes);

          deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
            DeployUtil.ExecutableDeployItem.newModuleBytes(wasm.wrap_cspr!, args),
            DeployUtil.standardPayment(payment)
          );
          successMsg = `Wrapped ${amount} CSPR → WCSPR`;
          break;
        }

        // ============================================
        // UNWRAP: WCSPR → CSPR
        // ============================================
        case "unwrap": {
          showToast("info", "Unwrapping WCSPR", "Creating transaction...", undefined, 0);
          
          const args = RuntimeArgs.fromMap({
            "wcspr_hash": new CLByteArray(toBytes(CONTRACTS.WCSPR)),
            "amount": CLValueBuilder.u512(amountMotes.toString())
          });

          deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
            DeployUtil.ExecutableDeployItem.newModuleBytes(wasm.unwrap_cspr!, args),
            DeployUtil.standardPayment(GAS.UNWRAP)
          );
          successMsg = `Unwrapped ${amount} WCSPR → CSPR`;
          break;
        }

        // ============================================
        // CSPR → Token (via DEX)
        // ============================================
        case "cspr_to_token": {
          showToast("info", "Swapping CSPR", "Creating transaction...", undefined, 0);
          
          // Path: WCSPR -> output token
          const path = [`hash-${CONTRACTS.WCSPR}`, `hash-${toToken.hash}`];
          
          const args = RuntimeArgs.fromMap({
            "router_hash": new CLByteArray(toBytes(CONTRACTS.ROUTER)),
            "amount_in": CLValueBuilder.u512(amountMotes.toString()),
            "amount_out_min": CLValueBuilder.u256(minOutput.toString()),
            "path": CLValueBuilder.list(path.map(p => CLValueBuilder.string(p))),
            "deadline": CLValueBuilder.u256(deadline.toString())
          });

          // Payment includes gas + amount to swap
          const payment = GAS.SWAP_CSPR_TOKEN + Number(amountMotes);

          deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
            DeployUtil.ExecutableDeployItem.newModuleBytes(wasm.swap_cspr_for_tokens!, args),
            DeployUtil.standardPayment(payment)
          );
          successMsg = `Swapped ${amount} CSPR → ${toToken.symbol}`;
          break;
        }

        // ============================================
        // Token → CSPR (via DEX)
        // ============================================
       case "token_to_cspr": {
  showToast("info", "Request Unstake", "Creating transaction...", undefined, 0);
  
  const args = RuntimeArgs.fromMap({
    "cscspr_amount": CLValueBuilder.u256(amountMotes.toString())
  });

  deploy = DeployUtil.makeDeploy(
    new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
    DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(toBytes(CONTRACTS.CASPER_STAKE), null, "request_unstake", args),
    DeployUtil.standardPayment(15_000_000_000)
  );
  successMsg = `Unstake requested: ${amount} csCSPR (14hr unbonding)`;
  break;
}

        // ============================================
        // Token → Token (via DEX, no WASM needed)
        // ============================================
        case "token_to_token": {
          // Step 1: Approve token spending
          showToast("info", "Step 1/2: Approve", "Approving token...", undefined, 0);
          
          const approveArgs = RuntimeArgs.fromMap({
            "spender": CLValueBuilder.key(new CLByteArray(toBytes(CONTRACTS.ROUTER))),
            "amount": CLValueBuilder.u256(amountMotes.toString())
          });

          const approveDeploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
            DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(toBytes(fromToken.hash!), null, "approve", approveArgs),
            DeployUtil.standardPayment(GAS.APPROVE)
          );

          const approveJson = DeployUtil.deployToJson(approveDeploy);
          const approveSig = await provider.sign(JSON.stringify(approveJson), walletAddress);
          if (approveSig.cancelled) {
            showFinalResult("error", "Cancelled", "Transaction cancelled by user");
            cleanup();
            return; // IMPORTANT: Early return
          }

          const approveData = approveJson.deploy as any;
          approveData.approvals = [{ signer: walletAddress, signature: walletAddress.substring(0, 2) + approveSig.signatureHex }];
          await sendDeploy(approveData);

          showToast("info", "Waiting", "Approval processing (~15s)...", undefined, 0);
          await new Promise(r => setTimeout(r, 15000));

          // Step 2: Swap via Router contract directly
          showToast("info", "Step 2/2: Swap", "Executing swap...", undefined, 0);
          
          const path = [`hash-${fromToken.hash}`, `hash-${toToken.hash}`];
          
          const swapArgs = RuntimeArgs.fromMap({
            "amount_in": CLValueBuilder.u256(amountMotes.toString()),
            "amount_out_min": CLValueBuilder.u256(minOutput.toString()),
            "path": CLValueBuilder.list(path.map(p => CLValueBuilder.string(p))),
            "to": CLValueBuilder.key(CLPublicKey.fromHex(walletAddress)),
            "deadline": CLValueBuilder.u256(deadline.toString())
          });

          deploy = DeployUtil.makeDeploy(
            new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
            DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(toBytes(CONTRACTS.ROUTER), null, "swap_exact_tokens_for_tokens", swapArgs),
            DeployUtil.standardPayment(GAS.SWAP_TOKEN_TOKEN)
          );
          successMsg = `Swapped ${amount} ${fromToken.symbol} → ${toToken.symbol}`;
          break;
        }

        default:
          throw new Error("Unknown swap type");
      }

      // Sign and send
      showToast("info", "Sign Transaction", "Please approve in wallet...", undefined, 0);
      
      const deployJson = DeployUtil.deployToJson(deploy);
      console.log("Deploy:", JSON.stringify(deployJson, null, 2));
      
      const sig = await provider.sign(JSON.stringify(deployJson), walletAddress);
      if (sig.cancelled) {
        showFinalResult("error", "Cancelled", "Transaction cancelled by user");
        cleanup();
        return; // IMPORTANT: Early return
      }

      showToast("info", "Broadcasting", "Submitting to network...", undefined, 0);
      
      const deployData = deployJson.deploy as any;
      deployData.approvals = [{ signer: walletAddress, signature: walletAddress.substring(0, 2) + sig.signatureHex }];
      
      const hash = await sendDeploy(deployData);
      
      // SUCCESS - Show toast and clean up
      showFinalResult("success", "Success!", successMsg, hash);
      setFromAmount("");
      setToAmount("");
      
      // Refresh balance after delay
      setTimeout(() => { fetchWCSPR(); }, 20000);
      
      // IMPORTANT: Clean up and return here to prevent any further code execution
      cleanup();
      return;

    } catch (e: any) {
      console.error("Swap error:", e);
      if (e.message !== "Cancelled") {
        showFinalResult("error", "Swap Failed", e.message);
      }
      cleanup();
      return;
    }
  };

  // Token icon component
  const TokenIcon = ({ token, size = 28 }: { token: typeof TOKENS[0], size?: number }) => (
    <div 
      className="rounded-full flex items-center justify-center font-bold text-black"
      style={{ width: size, height: size, backgroundColor: token.color, fontSize: size * 0.4 }}
    >
      {token.symbol[0]}
    </div>
  );

  const check = canExecute();

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      <div className="fixed inset-0 bg-gradient-to-br from-[#FF0032]/5 via-transparent to-[#BFFF00]/5 pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Swap</h1>
          <p className="text-white/50 text-sm mt-1">Trade tokens via CasperSwap DEX</p>
        </div>
      </header>

      <main className="relative max-w-md mx-auto px-4 py-8">
        {/* WASM Status */}
        <div className={`rounded-2xl p-4 mb-6 border ${
          wasmLoading ? 'bg-blue-500/10 border-blue-500/20' :
          Object.values(wasm).every(w => w !== null) ? 'bg-green-500/10 border-green-500/20' :
          'bg-orange-500/10 border-orange-500/20'
        }`}>
          <p className={`font-medium text-sm mb-3 ${
            wasmLoading ? 'text-blue-400' :
            Object.values(wasm).every(w => w !== null) ? 'text-green-400' : 'text-orange-400'
          }`}>
            {wasmLoading ? 'Loading WASM modules...' :
             Object.values(wasm).every(w => w !== null) ? '✓ All WASM modules loaded' : 
             'Some WASM modules missing'}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['wrap_cspr', 'unwrap_cspr', 'swap_cspr_for_tokens', 'swap_tokens_for_cspr'] as const).map(name => (
              <div key={name} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${wasm[name] ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                <span className="text-white/60 truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Swap Card */}
        <div className="bg-[#141414] border border-white/5 rounded-3xl p-4">
          {/* From Section */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/50 text-sm">You pay</span>
            <span className="text-white/30 text-xs">Slippage: {slippage}%</span>
          </div>
          <div className="bg-[#0D0D0D] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative" ref={fromRef}>
                <button 
                  onClick={() => setShowFrom(!showFrom)} 
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 pl-2 pr-3 py-2 rounded-full transition-colors"
                >
                  <TokenIcon token={fromToken} />
                  <span className="text-white font-semibold">{fromToken.symbol}</span>
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showFrom && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                    {TOKENS.filter(t => t.symbol !== toToken.symbol).map(t => (
                      <button 
                        key={t.symbol} 
                        onClick={() => { setFromToken(t); setShowFrom(false); setFromAmount(""); }} 
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <TokenIcon token={t} size={32} />
                        <div className="text-left">
                          <p className="text-white font-medium">{t.symbol}</p>
                          <p className="text-white/40 text-xs">{t.name}</p>
                        </div>
                        <span className="ml-auto text-white/40 text-sm">{getBal(t.symbol).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input 
                type="number" 
                value={fromAmount} 
                onChange={e => setFromAmount(e.target.value)} 
                placeholder="0" 
                className="flex-1 bg-transparent text-right text-2xl font-medium text-white placeholder-white/20 focus:outline-none"
              />
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-white/5 text-sm">
              <span className="text-white/40">Balance: {getBal(fromToken.symbol).toFixed(4)}</span>
              <div className="flex gap-1">
                {[25, 50, 75].map(p => (
                  <button 
                    key={p}
                    onClick={() => setFromAmount((getBal(fromToken.symbol) * p / 100).toFixed(6))} 
                    className="px-2 py-1 text-xs text-white/40 hover:text-white hover:bg-white/5 rounded transition-colors"
                  >
                    {p}%
                  </button>
                ))}
                <button 
                  onClick={() => setFromAmount(Math.max(0, getBal(fromToken.symbol) - (fromToken.symbol === "CSPR" ? 15 : 0)).toFixed(6))} 
                  className="px-2 py-1 text-xs text-[#FF0032] hover:bg-[#FF0032]/10 rounded font-medium transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button 
              onClick={switchTokens} 
              className="w-10 h-10 bg-[#1a1a1a] border-4 border-[#141414] rounded-xl flex items-center justify-center hover:bg-[#252525] transition-colors"
            >
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Section */}
          <div className="mb-2 mt-3">
            <span className="text-white/50 text-sm">You receive</span>
          </div>
          <div className="bg-[#0D0D0D] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative" ref={toRef}>
                <button 
                  onClick={() => setShowTo(!showTo)} 
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 pl-2 pr-3 py-2 rounded-full transition-colors"
                >
                  <TokenIcon token={toToken} />
                  <span className="text-white font-semibold">{toToken.symbol}</span>
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTo && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
                    {TOKENS.filter(t => t.symbol !== fromToken.symbol).map(t => (
                      <button 
                        key={t.symbol} 
                        onClick={() => { setToToken(t); setShowTo(false); }} 
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        <TokenIcon token={t} size={32} />
                        <div className="text-left">
                          <p className="text-white font-medium">{t.symbol}</p>
                          <p className="text-white/40 text-xs">{t.name}</p>
                        </div>
                        <span className="ml-auto text-white/40 text-sm">{getBal(t.symbol).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className={`flex-1 text-right text-2xl font-medium ${toAmount ? 'text-white' : 'text-white/20'}`}>
                {toAmount || "0"}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 text-sm">
              <span className="text-white/40">Balance: {getBal(toToken.symbol).toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Route Info */}
        {route && fromAmount && parseFloat(fromAmount) > 0 && (
          <div className={`mt-3 p-4 rounded-2xl border ${check.ok ? 'bg-[#141414] border-white/5' : 'bg-orange-500/10 border-orange-500/20'}`}>
            {!check.ok && (
              <p className="text-orange-400 text-sm mb-3">⚠️ {check.reason}</p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Route Type</span>
                <span className="text-white capitalize">{route.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Fee</span>
                <span className="text-white">{route.fee}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Min Received</span>
                <span className="text-white">{(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken.symbol}</span>
              </div>
              {route.wasmFile && (
                <div className="flex justify-between">
                  <span className="text-white/50">WASM</span>
                  <span className={wasm[route.wasmFile.replace('.wasm', '') as keyof WasmCache] ? 'text-green-400' : 'text-orange-400'}>
                    {route.wasmFile}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={doSwap}
          disabled={swapping || wasmLoading || !connected || !check.ok}
          className={`w-full mt-4 py-4 rounded-2xl font-semibold text-lg transition-all ${
            !connected ? "bg-[#FF0032] text-white hover:bg-[#FF0032]/90" :
            swapping || wasmLoading ? "bg-white/10 text-white/50 cursor-wait" :
            check.ok ? "bg-[#FF0032] text-white hover:bg-[#FF0032]/90 shadow-lg shadow-[#FF0032]/25" :
            "bg-orange-500/20 text-orange-400 cursor-not-allowed"
          }`}
        >
          {swapping ? "Processing..." :
           wasmLoading ? "Loading WASM..." :
           !connected ? "Connect Wallet" :
           !check.ok ? (check.reason || "Cannot Swap") :
           `Swap ${fromToken.symbol} → ${toToken.symbol}`}
        </button>

        {/* Navigation Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm">
          <a href="/stake" className="text-[#FF0032] hover:underline">← Stake</a>
          <a href="/history" className="text-white/50 hover:text-white">History</a>
          <a href="https://testnet.casperswap.xyz/" target="_blank" className="text-blue-400 hover:underline">CasperSwap →</a>
        </div>

        {/* Contracts Info */}
        <div className="mt-8 p-4 bg-white/5 rounded-xl text-xs">
          <p className="text-white/50 mb-2">Contracts (Testnet)</p>
          <div className="space-y-1 font-mono text-white/30">
            <p>Router: {CONTRACTS.ROUTER.slice(0, 16)}...</p>
            <p>WCSPR: {CONTRACTS.WCSPR.slice(0, 16)}...</p>
            <p>csCSPR: {CONTRACTS.CSCSPR_TOKEN.slice(0, 16)}...</p>
          </div>
        </div>
      </main>
    </div>
  );
}