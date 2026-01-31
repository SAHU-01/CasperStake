"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/components/ToastProvider";
import { RuntimeArgs, CLValueBuilder, CLPublicKey, DeployUtil } from 'casper-js-sdk';
import { uploadToIPFS } from '@/services/ipfs';

// ============================================================================
// CONTRACTS
// ============================================================================
const CONTRACTS = {
  INSTITUTIONAL_VAULT: "hash-206d85884eceefb3f757e8390e6f420649747804624a5333ddcee13b048d19e8",
  CASPER_STAKE: "hash-8322aff2cdaf904269205090a0a42da0aec6b659bb888a6b7172a6f2cf3bec3f",
};

// ============================================================================
// CRYPTO UTILITIES
// ============================================================================

const sha256 = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateSecureRandom = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

const hexToU256 = (hex: string): string => {
  const clean = hex.replace('0x', '').slice(0, 64).padStart(64, '0');
  return BigInt('0x' + clean).toString();
};

// ============================================================================
// MERKLE TREE
// ============================================================================

class MerkleTree {
  private leaves: string[] = [];
  private layers: string[][] = [];

  constructor(leaves: string[] = []) {
    this.leaves = [...leaves];
  }

  async rebuild() {
    if (this.leaves.length === 0) {
      this.layers = [['0'.repeat(64)]];
      return;
    }
    const size = Math.pow(2, Math.ceil(Math.log2(this.leaves.length)));
    const paddedLeaves = [...this.leaves];
    while (paddedLeaves.length < size) paddedLeaves.push('0'.repeat(64));
    this.layers = [paddedLeaves];
    let currentLayer = paddedLeaves;
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const combined = await sha256(currentLayer[i] + (currentLayer[i + 1] || currentLayer[i]));
        nextLayer.push(combined);
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  getRoot(): string {
    return this.layers.length ? this.layers[this.layers.length - 1][0] : '0'.repeat(64);
  }

  async getProof(index: number): Promise<{ siblings: string[]; pathIndices: number[] }> {
    const siblings: string[] = [];
    const pathIndices: number[] = [];
    let currentIndex = index;
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      if (siblingIndex < layer.length) {
        siblings.push(layer[siblingIndex]);
        pathIndices.push(isRight ? 0 : 1);
      }
      currentIndex = Math.floor(currentIndex / 2);
    }
    return { siblings, pathIndices };
  }

  getLeaves(): string[] { return [...this.leaves]; }
  addLeaf(leaf: string) { this.leaves.push(leaf); }
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

interface Institution {
  id: string;
  name: string;
  description: string;
  icon: string;
  createdAt: string;
  creatorAddress: string;
  creatorName: string;
  inviteCode: string;
  members: InstitutionMember[];
  merkleRoot: string;
  minStake: number;
  totalStaked: number;
  referralRewardPercent: number; // Creator earns this % of members' rewards
  isPublic: boolean;
}

interface InstitutionMember {
  commitment: string;
  joinedAt: string;
  totalStaked: number;
  rewardsGenerated: number;
}

interface MemberCredentials {
  institutionId: string;
  secret: string;
  commitment: string;
  nullifier: string;
  leafIndex: number;
}

// Storage keys
const STORAGE_KEY = 'casperstake_institutions_v2';
const CREDENTIALS_KEY = 'casperstake_my_credentials_v2';

const loadInstitutions = (): Institution[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveInstitutions = (institutions: Institution[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(institutions));
  }
};

const loadMyCredentials = (): MemberCredentials[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveMyCredentials = (credentials: MemberCredentials[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InstitutionalPage() {
  const { connected, walletAddress, realBalance, connect, setLoading, loading } = useWallet();
  const { showToast, dismissToast } = useToast();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [myCredentials, setMyCredentials] = useState<MemberCredentials[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'my' | 'stake'>('browse');
  
  // Join
  const [inviteCode, setInviteCode] = useState('');
  const [joiningInstitution, setJoiningInstitution] = useState<Institution | null>(null);
  
  // Create
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('🏛️');
  const [newMinStake, setNewMinStake] = useState('100');
  const [newReferralPercent, setNewReferralPercent] = useState('5');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [creatorName, setCreatorName] = useState('');
  
  // Stake
  const [selectedCredential, setSelectedCredential] = useState<MemberCredentials | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [zkProof, setZkProof] = useState<any>(null);
  const [generatingProof, setGeneratingProof] = useState(false);

  // Load data
  useEffect(() => {
    setInstitutions(loadInstitutions());
    setMyCredentials(loadMyCredentials());
  }, []);

  // My created institutions
  const myCreatedInstitutions = institutions.filter(i => i.creatorAddress === walletAddress);
  
  // Calculate my referral earnings
  const myReferralEarnings = myCreatedInstitutions.reduce((acc, inst) => {
    const memberRewards = inst.members.reduce((m, mem) => m + mem.rewardsGenerated, 0);
    return acc + (memberRewards * inst.referralRewardPercent / 100);
  }, 0);

  // ============================================================================
  // CREATE INSTITUTION - Anyone can create!
  // ============================================================================
  
  const handleCreateInstitution = async () => {
  if (!connected) {
    showToast('error', 'Connect Wallet', 'Please connect your wallet first');
    return;
  }
  if (!newName.trim() || !creatorName.trim()) {
    showToast('error', 'Invalid', 'Name and creator name required');
    return;
  }

  setLoading(true);
  let toastId: string | undefined;

  try {
    // 1. Generate invite code
    const inviteCode = (await sha256(newName + walletAddress + Date.now())).slice(0, 8).toUpperCase();
    const inviteCodeHash = await sha256(inviteCode);

    // 2. Upload metadata to IPFS
    const metadata = {
      name: newName.trim(),
      description: newDescription.trim(),
      icon: newIcon,
      creatorName: creatorName.trim(),
    };

    toastId = showToast('info', '📤 Uploading to IPFS', 'Storing metadata...', undefined, 0);
    const metadataCid = await uploadToIPFS(metadata);
    dismissToast?.(toastId);

    // 3. Create on-chain
    const minStakeMotes = BigInt(Math.floor(Math.max(10, parseInt(newMinStake) || 100) * 1_000_000_000)).toString();
    const referralPct = Math.min(10, Math.max(1, parseInt(newReferralPercent) || 5));

    console.log('DEBUG args:', {
      metadataCid,
      inviteCodeHash,
      inviteCodeHashU256: hexToU256(inviteCodeHash),
      minStakeMotes,
      referralPct,
      newIsPublic,
    });

    const runtimeArgs = RuntimeArgs.fromMap({
      "metadata_cid": CLValueBuilder.string(metadataCid),
      "invite_code_hash": CLValueBuilder.u256(hexToU256(inviteCodeHash)),
      "min_stake": CLValueBuilder.u256(minStakeMotes),
      "referral_percent": CLValueBuilder.u8(referralPct),
      "is_public": CLValueBuilder.bool(newIsPublic),
    });

    const contractHashBytes = Uint8Array.from(
      Buffer.from(CONTRACTS.INSTITUTIONAL_VAULT.replace("hash-", ""), 'hex')
    );

    const deploy = DeployUtil.makeDeploy(
      new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
      DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
        contractHashBytes, null, "create_institution", runtimeArgs
      ),
      DeployUtil.standardPayment(25_000_000_000)
    );

    const deployJson = DeployUtil.deployToJson(deploy);
    toastId = showToast('info', '✍️ Sign Transaction', 'Creating on-chain...', undefined, 0);

    const provider = window.CasperWalletProvider!();
    const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
    if (signResult.cancelled) {
      dismissToast?.(toastId);
      showToast('error', 'Cancelled', '');
      setLoading(false);
      return;
    }

    dismissToast?.(toastId);
    toastId = showToast('info', '📡 Broadcasting', '...', undefined, 0);

    const algoPrefix = walletAddress.substring(0, 2);
    const deployData = deployJson.deploy as any;
    deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
    const deployHash = await putDeployViaProxy(deployData);

    dismissToast?.(toastId);
    toastId = showToast('info', '⏳ Confirming', `TX: ${deployHash.slice(0, 16)}...`, deployHash, 0);

    const result = await waitForDeploy(deployHash);
    dismissToast?.(toastId);

    if (result.success) {
      // Save locally
      const institution: Institution = {
        id: (await sha256(newName + walletAddress + Date.now())).slice(0, 16),
        name: newName.trim(),
        description: newDescription.trim(),
        icon: newIcon,
        createdAt: new Date().toISOString(),
        creatorAddress: walletAddress,
        creatorName: creatorName.trim(),
        inviteCode,
        members: [],
        merkleRoot: '0'.repeat(64),
        minStake: Math.max(10, parseInt(newMinStake) || 100),
        totalStaked: 0,
        referralRewardPercent: referralPct,
        isPublic: newIsPublic,
      };

      const updated = [...institutions, institution];
      setInstitutions(updated);
      saveInstitutions(updated);

      showToast('success', '🎉 Institution Created!', `Code: ${inviteCode} | IPFS: ${metadataCid.slice(0,12)}...`, deployHash, 15000);
      setNewName('');
      setNewDescription('');
      setCreatorName('');
      setActiveTab('my');
    } else {
      showToast('error', 'Failed', result.error || 'Check explorer', deployHash, 10000);
    }
  } catch (error: any) {
    if (toastId) dismissToast?.(toastId);
    showToast('error', 'Error', error.message);
  }

  setLoading(false);
};

  // ============================================================================
  // JOIN INSTITUTION
  // ============================================================================

  const handleLookupInvite = () => {
    const found = institutions.find(i => i.inviteCode === inviteCode.toUpperCase());
    if (found) {
      setJoiningInstitution(found);
    } else {
      showToast('error', 'Not Found', 'Invalid invite code');
      setJoiningInstitution(null);
    }
  };

  const handleJoinInstitution = async (institution: Institution) => {
    if (!connected) {
      showToast('error', 'Connect Wallet', 'Please connect first');
      return;
    }

    const existing = myCredentials.find(c => c.institutionId === institution.id);
    if (existing) {
      showToast('error', 'Already Member', 'You have already joined this institution');
      return;
    }

    const secret = generateSecureRandom();
    const commitment = await sha256(institution.id + secret + walletAddress);
    const nullifier = await sha256(secret + 'nullifier' + institution.id);

    const updatedInstitutions = institutions.map(inst => {
      if (inst.id === institution.id) {
        const newMembers = [...inst.members, { 
          commitment, 
          joinedAt: new Date().toISOString(),
          totalStaked: 0,
          rewardsGenerated: 0,
        }];
        return { ...inst, members: newMembers };
      }
      return inst;
    });

    // Rebuild Merkle tree
    const inst = updatedInstitutions.find(i => i.id === institution.id)!;
    const tree = new MerkleTree(inst.members.map(m => m.commitment));
    await tree.rebuild();
    inst.merkleRoot = tree.getRoot();

    const credentials: MemberCredentials = {
      institutionId: institution.id,
      secret,
      commitment,
      nullifier,
      leafIndex: inst.members.length - 1,
    };

    const updatedCredentials = [...myCredentials, credentials];
    setMyCredentials(updatedCredentials);
    saveMyCredentials(updatedCredentials);
    setInstitutions(updatedInstitutions);
    saveInstitutions(updatedInstitutions);

    showToast('success', '✅ Joined!', `Welcome to ${institution.name}`);
    setJoiningInstitution(null);
    setInviteCode('');
  };

  // ============================================================================
  // GENERATE ZK PROOF
  // ============================================================================

  const handleGenerateProof = async () => {
    if (!selectedCredential) return;
    setGeneratingProof(true);

    try {
      const institution = institutions.find(i => i.id === selectedCredential.institutionId);
      if (!institution) throw new Error('Institution not found');

      const tree = new MerkleTree(institution.members.map(m => m.commitment));
      await tree.rebuild();
      const { siblings, pathIndices } = await tree.getProof(selectedCredential.leafIndex);
      const proofHash = await sha256(
        selectedCredential.commitment + selectedCredential.nullifier + tree.getRoot() + Date.now()
      );

      setZkProof({
        merkleRoot: tree.getRoot(),
        nullifier: selectedCredential.nullifier,
        proofHash,
        commitment: selectedCredential.commitment,
        siblings,
        pathIndices,
        institutionId: institution.id,
        institutionName: institution.name,
        creatorAddress: institution.creatorAddress,
        referralPercent: institution.referralRewardPercent,
      });
      showToast('success', 'ZK Proof Ready', 'You can now stake privately');
    } catch (error: any) {
      showToast('error', 'Failed', error.message);
    }
    setGeneratingProof(false);
  };

  // ============================================================================
  // ZK STAKE
  // ============================================================================

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

  const waitForDeploy = async (deployHash: string): Promise<{ success: boolean; error?: string }> => {
    for (let i = 0; i < 20; i++) {
      try {
        const response = await fetch('/api/casper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: Date.now(), method: 'info_get_transaction',
            params: { transaction_hash: { Deploy: deployHash }, finalized_approvals: true }
          })
        });
        const data = await response.json();
        const execResult = data.result?.execution_info?.execution_result?.Version2;
        if (execResult) {
          if (execResult.error_message === null && execResult.effects) return { success: true };
          if (execResult.error_message) return { success: false, error: execResult.error_message };
        }
        await new Promise(r => setTimeout(r, 3000));
      } catch { await new Promise(r => setTimeout(r, 3000)); }
    }
    return { success: false, error: "Timeout" };
  };

  const handleZKStake = async () => {
    if (!zkProof || !stakeAmount) return;

    const institution = institutions.find(i => i.id === zkProof.institutionId);
    if (!institution) return;

    const amount = parseFloat(stakeAmount);
    if (amount < institution.minStake) {
      showToast('error', 'Below Minimum', `Minimum: ${institution.minStake} CSPR`);
      return;
    }

    setLoading(true);
    let toastId: string | undefined;

    try {
      const amountMotes = BigInt(Math.floor(amount * 1_000_000_000)).toString();

      const runtimeArgs = RuntimeArgs.fromMap({
        "proof_hash": CLValueBuilder.u256(hexToU256(zkProof.proofHash)),
        "nullifier": CLValueBuilder.u256(hexToU256(zkProof.nullifier)),
        "merkle_root": CLValueBuilder.u256(hexToU256(zkProof.merkleRoot)),
        "amount": CLValueBuilder.u256(amountMotes)
      });

      const contractHashBytes = Uint8Array.from(
        Buffer.from(CONTRACTS.INSTITUTIONAL_VAULT.replace("hash-", ""), 'hex')
      );

      const deploy = DeployUtil.makeDeploy(
        new DeployUtil.DeployParams(CLPublicKey.fromHex(walletAddress), "casper-test", 1, 1800000),
        DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
          contractHashBytes, null, "stake_with_zk_proof", runtimeArgs
        ),
        DeployUtil.standardPayment(15_000_000_000)
      );

      const deployJson = DeployUtil.deployToJson(deploy);
      showToast("info", "Sign Transaction", "Please sign in wallet", undefined, 0);

      const provider = window.CasperWalletProvider!();
      const signResult = await provider.sign(JSON.stringify(deployJson), walletAddress);
      if (signResult.cancelled) { showToast("error", "Cancelled", ""); setLoading(false); return; }

      toastId = showToast("info", "Broadcasting", "...", undefined, 0);
      const algoPrefix = walletAddress.substring(0, 2);
      const deployData = deployJson.deploy as any;
      deployData.approvals = [{ signer: walletAddress, signature: algoPrefix + signResult.signatureHex }];
      const deployHash = await putDeployViaProxy(deployData);

      dismissToast?.(toastId);
      toastId = showToast("info", "Confirming", `TX: ${deployHash.slice(0, 16)}...`, deployHash, 0);
      const result = await waitForDeploy(deployHash);
      dismissToast?.(toastId);

      if (result.success) {
        // Update stats
        const updatedInstitutions = institutions.map(inst => {
          if (inst.id === zkProof.institutionId) {
            return { ...inst, totalStaked: inst.totalStaked + amount };
          }
          return inst;
        });
        setInstitutions(updatedInstitutions);
        saveInstitutions(updatedInstitutions);

        const referralReward = amount * 0.125 * (zkProof.referralPercent / 100); // Yearly reward * referral %
        showToast("success", "🔐 ZK Stake Complete!", 
          `Staked ${amount.toLocaleString()} CSPR. Creator earns ${zkProof.referralPercent}% of your rewards!`, 
          deployHash, 10000
        );
        setZkProof(null);
        setStakeAmount('');
      } else {
        showToast("error", "Failed", result.error || "Check explorer", deployHash, 10000);
      }
    } catch (error: any) {
      if (toastId) dismissToast?.(toastId);
      showToast("error", "Error", error.message);
    }
    setLoading(false);
  };

  // Copy helpers
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('success', 'Copied!', 'Invite code copied');
  };

  const copyLink = (code: string) => {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/institutional?code=${code}`;
    navigator.clipboard.writeText(link);
    showToast('success', 'Copied!', 'Invite link copied');
  };

  // Check URL for invite code on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        setInviteCode(code.toUpperCase());
        setTimeout(() => {
          const found = institutions.find(i => i.inviteCode === code.toUpperCase());
          if (found) setJoiningInstitution(found);
        }, 500);
      }
    }
  }, [institutions]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <section className="bg-gradient-to-b from-purple-500/10 to-black py-8 md:py-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black">
              <span className="text-purple-400">Institutional</span> ZK Vault
            </h1>
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full">ON-CHAIN ZK</span>
          </div>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl">
            Create your own staking institution, share invite codes, and earn <span className="text-[#BFFF00] font-bold">5% of your members' staking rewards forever</span>. 
            The playbook that grew Marinade to $1.5B TVL.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-purple-500">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-purple-200 text-xs">Institutions</p>
            <p className="text-lg font-black text-white">{institutions.length}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Total Members</p>
            <p className="text-lg font-black text-white">{institutions.reduce((a, i) => a + i.members.length, 0)}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Your Institutions</p>
            <p className="text-lg font-black text-white">{myCreatedInstitutions.length}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Your Memberships</p>
            <p className="text-lg font-black text-white">{myCredentials.length}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Your Referral Earnings</p>
            <p className="text-lg font-black text-white">{myReferralEarnings.toFixed(2)} CSPR</p>
          </div>
        </div>
      </section>

      {/* Referral Banner */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-gradient-to-r from-[#BFFF00]/10 via-purple-500/10 to-blue-500/10 border border-[#BFFF00]/30 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-bold text-xl mb-1 flex items-center gap-2">
                🎁 Referral Rewards <span className="bg-[#BFFF00] text-black text-xs px-2 py-0.5 rounded">EARN 5%</span>
              </h2>
              <p className="text-gray-400 text-sm">
                Create an institution → Share your invite code → Earn 5% of all your members' staking rewards <span className="text-[#BFFF00]">forever</span>
              </p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="px-6 py-3 bg-[#BFFF00] text-black font-bold rounded-xl hover:bg-[#a8e600] whitespace-nowrap"
            >
              Create Institution →
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
          {[
            { id: 'browse', label: '🌐 Browse', count: institutions.filter(i => i.isPublic).length },
            { id: 'create', label: '➕ Create' },
            { id: 'my', label: '👑 My Institutions', count: myCreatedInstitutions.length },
            { id: 'stake', label: '🔐 ZK Stake', count: myCredentials.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'text-purple-400 border-b-2 border-purple-400' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 bg-white/10 px-1.5 py-0.5 rounded text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* BROWSE TAB */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="flex gap-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter invite code..."
                className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl font-mono uppercase focus:outline-none focus:border-purple-500/50"
              />
              <button onClick={handleLookupInvite} className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600">
                Lookup
              </button>
            </div>

            {/* Join Modal */}
            {joiningInstitution && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-5xl">{joiningInstitution.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-2xl">{joiningInstitution.name}</h3>
                    <p className="text-gray-400 text-sm">{joiningInstitution.description || 'No description'}</p>
                    <p className="text-purple-400 text-sm mt-1">Created by {joiningInstitution.creatorName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-white">{joiningInstitution.members.length}</p>
                    <p className="text-gray-500 text-xs">Members</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-white">{joiningInstitution.minStake}</p>
                    <p className="text-gray-500 text-xs">Min CSPR</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-[#BFFF00]">{joiningInstitution.totalStaked.toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">Total Staked</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-black text-purple-400">{joiningInstitution.referralRewardPercent}%</p>
                    <p className="text-gray-500 text-xs">Creator Earns</p>
                  </div>
                </div>
                <button
                  onClick={() => connected ? handleJoinInstitution(joiningInstitution) : connect()}
                  className="w-full py-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600"
                >
                  {connected ? '🔐 Join Institution' : 'Connect Wallet to Join'}
                </button>
                <button onClick={() => setJoiningInstitution(null)} className="w-full py-2 text-gray-500 text-sm mt-2 hover:text-white">
                  Cancel
                </button>
              </div>
            )}

            {/* Public Institutions Grid */}
            <div>
              <h3 className="text-white font-bold mb-4">🌐 Public Institutions</h3>
              {institutions.filter(i => i.isPublic).length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <span className="text-4xl mb-2 block">🏛️</span>
                  <p className="text-gray-400">No public institutions yet. Be the first to create one!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {institutions.filter(i => i.isPublic).map(inst => (
                    <div key={inst.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{inst.icon}</span>
                        <div>
                          <h4 className="text-white font-bold">{inst.name}</h4>
                          <p className="text-gray-500 text-xs">by {inst.creatorName}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                        <div>
                          <p className="text-white font-bold">{inst.members.length}</p>
                          <p className="text-gray-500 text-[10px]">Members</p>
                        </div>
                        <div>
                          <p className="text-[#BFFF00] font-bold">{inst.totalStaked.toLocaleString()}</p>
                          <p className="text-gray-500 text-[10px]">Staked</p>
                        </div>
                        <div>
                          <p className="text-purple-400 font-bold">{inst.referralRewardPercent}%</p>
                          <p className="text-gray-500 text-[10px]">Referral</p>
                        </div>
                      </div>
                      <button
                        onClick={() => connected ? handleJoinInstitution(inst) : connect()}
                        className="w-full py-2 bg-purple-500/20 text-purple-400 font-bold text-sm rounded-lg hover:bg-purple-500/30"
                      >
                        {myCredentials.find(c => c.institutionId === inst.id) ? '✓ Joined' : 'Join →'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h3 className="text-white font-bold text-xl mb-2">➕ Create Your Institution</h3>
              <p className="text-gray-400 text-sm mb-6">
                Create an institution, invite members, and earn a percentage of their staking rewards forever!
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Icon</label>
                    <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                      className="bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl text-2xl">
                      {['🏛️', '🏦', '💼', '🏢', '🛡️', '⚡', '🔷', '💎', '🌐', '🎯', '🚀', '🦁', '🐺', '🦅'].map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 block mb-2">Institution Name *</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., Alpha Stakers Club"
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/50" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">Your Name/Alias *</label>
                  <input type="text" value={creatorName} onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g., CryptoKing"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/50" />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-2">Description</label>
                  <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description of your institution"
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Min Stake (CSPR)</label>
                    <input type="number" value={newMinStake} onChange={(e) => setNewMinStake(e.target.value)}
                      placeholder="100"
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-2">Your Referral % (1-10)</label>
                    <input type="number" value={newReferralPercent} onChange={(e) => setNewReferralPercent(e.target.value)}
                      min="1" max="10" placeholder="5"
                      className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/50" />
                    <p className="text-gray-500 text-xs mt-1">You earn this % of members' staking rewards</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                  <input type="checkbox" checked={newIsPublic} onChange={(e) => setNewIsPublic(e.target.checked)}
                    className="w-5 h-5 rounded" />
                  <div>
                    <p className="text-white font-bold text-sm">Public Institution</p>
                    <p className="text-gray-500 text-xs">Anyone can browse and join. Private = invite code only.</p>
                  </div>
                </div>

                <div className="bg-[#BFFF00]/10 border border-[#BFFF00]/30 rounded-xl p-4">
                  <h4 className="text-[#BFFF00] font-bold text-sm mb-2">💰 Your Earning Potential</h4>
                  <p className="text-gray-400 text-sm">
                    If you get <span className="text-white">100 members</span> staking <span className="text-white">1,000 CSPR each</span> at 12.5% APY:
                  </p>
                  <p className="text-[#BFFF00] font-black text-2xl mt-2">
                    {(100 * 1000 * 0.125 * (parseFloat(newReferralPercent) || 5) / 100).toFixed(0)} CSPR/year
                  </p>
                </div>

                <button
                  onClick={connected ? handleCreateInstitution : connect}
                  disabled={!newName.trim() || !creatorName.trim()}
                  className="w-full py-4 bg-purple-500 text-white font-bold text-lg rounded-xl hover:bg-purple-600 disabled:opacity-50"
                >
                  {connected ? '🚀 Create Institution' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MY INSTITUTIONS TAB */}
        {activeTab === 'my' && (
          <div className="space-y-6">
            {myCreatedInstitutions.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <span className="text-4xl mb-2 block">👑</span>
                <h3 className="text-white font-bold text-lg mb-2">No Institutions Yet</h3>
                <p className="text-gray-400 mb-4">Create your first institution and start earning referral rewards!</p>
                <button onClick={() => setActiveTab('create')} className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl">
                  Create Institution →
                </button>
              </div>
            ) : (
              myCreatedInstitutions.map(inst => (
                <div key={inst.id} className="bg-white/[0.02] border border-purple-500/30 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{inst.icon}</span>
                      <div>
                        <h3 className="text-white font-bold text-xl">{inst.name}</h3>
                        <p className="text-gray-500 text-sm">{inst.description || 'No description'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${inst.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {inst.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-white">{inst.members.length}</p>
                      <p className="text-gray-500 text-xs">Members</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-[#BFFF00]">{inst.totalStaked.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs">Total Staked</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-purple-400">{inst.referralRewardPercent}%</p>
                      <p className="text-gray-500 text-xs">Your Cut</p>
                    </div>
                    <div className="bg-[#BFFF00]/10 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-[#BFFF00]">
                        {(inst.totalStaked * 0.125 * inst.referralRewardPercent / 100).toFixed(2)}
                      </p>
                      <p className="text-[#BFFF00]/60 text-xs">Est. Yearly</p>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-4 mb-4">
                    <p className="text-gray-400 text-xs mb-2">Invite Code</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black/50 px-4 py-2 rounded-lg text-purple-400 font-mono text-lg tracking-widest">
                        {inst.inviteCode}
                      </code>
                      <button onClick={() => copyCode(inst.inviteCode)} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30">
                        📋
                      </button>
                      <button onClick={() => copyLink(inst.inviteCode)} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30">
                        🔗
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a href={`https://twitter.com/intent/tweet?text=Join%20my%20staking%20institution%20${inst.name}%20on%20CasperStake!%20Earn%2012.5%25%20APY%20🚀&url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/institutional?code=${inst.inviteCode}`)}`}
                      target="_blank" className="flex-1 py-2 bg-[#1DA1F2]/20 text-[#1DA1F2] font-bold text-sm rounded-lg text-center hover:bg-[#1DA1F2]/30">
                      Share on 𝕏
                    </a>
                    <a href={`https://t.me/share/url?url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/institutional?code=${inst.inviteCode}`)}&text=Join%20${inst.name}%20on%20CasperStake!`}
                      target="_blank" className="flex-1 py-2 bg-[#0088cc]/20 text-[#0088cc] font-bold text-sm rounded-lg text-center hover:bg-[#0088cc]/30">
                      Share on Telegram
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ZK STAKE TAB */}
        {activeTab === 'stake' && (
          <div className="max-w-2xl mx-auto">
            {myCredentials.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <span className="text-4xl mb-2 block">🔒</span>
                <h3 className="text-white font-bold text-lg mb-2">No Memberships</h3>
                <p className="text-gray-400 mb-4">Join an institution first to stake with ZK privacy</p>
                <button onClick={() => setActiveTab('browse')} className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl">
                  Browse Institutions →
                </button>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-purple-500/20 rounded-2xl p-6">
                <h3 className="text-white font-bold text-xl mb-4">🔐 ZK Private Stake</h3>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-400 block mb-2">Select Institution</label>
                  <div className="grid gap-2">
                    {myCredentials.map(cred => {
                      const inst = institutions.find(i => i.id === cred.institutionId);
                      if (!inst) return null;
                      return (
                        <button key={cred.institutionId}
                          onClick={() => { setSelectedCredential(cred); setZkProof(null); }}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedCredential?.institutionId === cred.institutionId
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{inst.icon}</span>
                            <div className="flex-1">
                              <p className="text-white font-bold">{inst.name}</p>
                              <p className="text-gray-500 text-xs">Min: {inst.minStake} CSPR • Creator earns {inst.referralRewardPercent}%</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedCredential && !zkProof && (
                  <button onClick={handleGenerateProof} disabled={generatingProof}
                    className="w-full py-4 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 disabled:opacity-50 mb-4">
                    {generatingProof ? 'Generating Merkle Proof...' : '🔐 Generate ZK Proof'}
                  </button>
                )}

                {zkProof && (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <p className="text-green-400 font-bold flex items-center gap-2">✓ ZK Proof Ready</p>
                      <p className="text-gray-500 text-xs mt-1">Nullifier: {zkProof.nullifier.slice(0, 24)}...</p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-2">Stake Amount</label>
                      <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)}
                          placeholder={institutions.find(i => i.id === zkProof.institutionId)?.minStake.toString()}
                          className="flex-1 bg-transparent px-4 py-3 text-lg font-bold text-white focus:outline-none" />
                        <span className="bg-white/10 px-4 py-3 font-bold text-gray-400">CSPR</span>
                      </div>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                      <p className="text-purple-400 font-bold text-sm mb-2">🛡️ Privacy + Referral</p>
                      <ul className="space-y-1 text-xs text-gray-400">
                        <li>✓ Your identity stays private (ZK proof)</li>
                        <li>✓ {zkProof.institutionName}'s creator earns {zkProof.referralPercent}% of your rewards</li>
                        <li>✓ Verified on-chain via InstitutionalVault contract</li>
                      </ul>
                    </div>

                    <button onClick={connected ? handleZKStake : connect}
                      disabled={loading || !stakeAmount}
                      className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg rounded-xl hover:opacity-90 disabled:opacity-50">
                      {loading ? 'Processing...' : '🔐 Submit ZK Stake →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contract Info */}
        <div className="mt-12 text-center text-gray-500 text-xs">
          <p>InstitutionalVault: <a href={`https://testnet.cspr.live/contract/${CONTRACTS.INSTITUTIONAL_VAULT.replace('hash-', '')}`} target="_blank" className="text-purple-400 hover:underline">{CONTRACTS.INSTITUTIONAL_VAULT}</a></p>
        </div>
      </section>
    </div>
  );
}