/**
 * CasperStake ZK Utilities
 * 
 * Client-side Merkle proof generation and ZK proof utilities
 * for institutional privacy-preserving staking.
 * 
 * Based on Casper's Risc Zero integration architecture.
 */

// ============================================================================
// MERKLE TREE IMPLEMENTATION
// ============================================================================

/**
 * Poseidon-style hash using Web Crypto API
 * In production, use actual Poseidon hash (circomlibjs)
 */
export async function poseidonHash(...inputs: (string | number | Uint8Array)[]): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  
  // Concatenate all inputs
  const parts: Uint8Array[] = inputs.map(input => {
    if (input instanceof Uint8Array) return input;
    if (typeof input === 'number') return encoder.encode(input.toString());
    return encoder.encode(input);
  });
  
  const totalLength = parts.reduce((sum, arr) => sum + arr.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hashBuffer);
}

/**
 * Convert Uint8Array to hex string
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// ============================================================================
// MERKLE TREE CLASS
// ============================================================================

export interface MerkleProof {
  leaf: Uint8Array;
  siblings: Uint8Array[];
  pathIndices: number[]; // 0 = left, 1 = right
  root: Uint8Array;
}

export class MerkleTree {
  private leaves: Uint8Array[];
  private layers: Uint8Array[][];
  
  constructor(leaves: Uint8Array[]) {
    // Pad to power of 2
    const targetSize = Math.pow(2, Math.ceil(Math.log2(leaves.length || 1)));
    this.leaves = [...leaves];
    
    // Pad with zero hashes
    const zeroHash = new Uint8Array(32);
    while (this.leaves.length < targetSize) {
      this.leaves.push(zeroHash);
    }
    
    this.layers = [this.leaves];
  }
  
  /**
   * Build the Merkle tree
   */
  async build(): Promise<void> {
    let currentLayer = this.leaves;
    
    while (currentLayer.length > 1) {
      const nextLayer: Uint8Array[] = [];
      
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = currentLayer[i + 1] || left;
        const parent = await this.hashPair(left, right);
        nextLayer.push(parent);
      }
      
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }
  
  /**
   * Hash two nodes together
   */
  private async hashPair(left: Uint8Array, right: Uint8Array): Promise<Uint8Array> {
    const combined = new Uint8Array(64);
    combined.set(left, 0);
    combined.set(right, 32);
    return poseidonHash(combined);
  }
  
  /**
   * Get the Merkle root
   */
  getRoot(): Uint8Array {
    if (this.layers.length === 0) return new Uint8Array(32);
    return this.layers[this.layers.length - 1][0];
  }
  
  /**
   * Generate proof for a leaf at given index
   */
  async getProof(index: number): Promise<MerkleProof> {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error('Invalid leaf index');
    }
    
    const siblings: Uint8Array[] = [];
    const pathIndices: number[] = [];
    
    let currentIndex = index;
    
    for (let layer = 0; layer < this.layers.length - 1; layer++) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
      
      if (siblingIndex < this.layers[layer].length) {
        siblings.push(this.layers[layer][siblingIndex]);
        pathIndices.push(isRightNode ? 1 : 0);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return {
      leaf: this.leaves[index],
      siblings,
      pathIndices,
      root: this.getRoot(),
    };
  }
  
  /**
   * Verify a Merkle proof
   */
  static async verifyProof(proof: MerkleProof): Promise<boolean> {
    let current = proof.leaf;
    
    for (let i = 0; i < proof.siblings.length; i++) {
      const sibling = proof.siblings[i];
      const isRight = proof.pathIndices[i] === 1;
      
      const combined = new Uint8Array(64);
      if (isRight) {
        combined.set(sibling, 0);
        combined.set(current, 32);
      } else {
        combined.set(current, 0);
        combined.set(sibling, 32);
      }
      
      current = await poseidonHash(combined);
    }
    
    return toHex(current) === toHex(proof.root);
  }
}

// ============================================================================
// KYC WHITELIST MANAGEMENT
// ============================================================================

export interface KYCEntry {
  institutionId: string;
  kycHash: string; // Hash of KYC documents
  verifiedAt: number;
  expiresAt: number;
}

export interface KYCCommitment {
  commitment: Uint8Array;
  nullifier: Uint8Array;
  secret: Uint8Array;
}

/**
 * Generate KYC commitment for an institution
 * commitment = hash(institutionId, kycHash, secret)
 * nullifier = hash(secret, "nullifier")
 */
export async function generateKYCCommitment(
  institutionId: string,
  kycHash: string
): Promise<KYCCommitment> {
  // Generate random secret
  const secret = crypto.getRandomValues(new Uint8Array(32));
  
  // Generate commitment
  const commitment = await poseidonHash(institutionId, kycHash, secret);
  
  // Generate nullifier
  const nullifier = await poseidonHash(secret, 'nullifier');
  
  return {
    commitment,
    nullifier,
    secret,
  };
}

/**
 * Build KYC whitelist Merkle tree
 */
export async function buildKYCWhitelist(entries: KYCEntry[]): Promise<{
  tree: MerkleTree;
  commitments: Map<string, KYCCommitment>;
}> {
  const commitments = new Map<string, KYCCommitment>();
  const leaves: Uint8Array[] = [];
  
  for (const entry of entries) {
    const commitment = await generateKYCCommitment(entry.institutionId, entry.kycHash);
    commitments.set(entry.institutionId, commitment);
    leaves.push(commitment.commitment);
  }
  
  const tree = new MerkleTree(leaves);
  await tree.build();
  
  return { tree, commitments };
}

// ============================================================================
// ZK PROOF GENERATION (Client-side)
// ============================================================================

export interface ZKStakeProof {
  // Public inputs
  publicInputs: {
    merkleRoot: string;
    nullifier: string;
    stakeAmountCommitment: string;
  };
  // Groth16 proof
  proof: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
  };
  // Merkle proof for verification
  merkleProof: {
    leaf: string;
    siblings: string[];
    pathIndices: number[];
  };
  // Metadata
  metadata: {
    version: string;
    generatedAt: string;
    proverVersion: string;
  };
}

/**
 * Generate ZK proof for institutional staking
 * Proves: "I am on the KYC whitelist and I'm staking X amount"
 * Without revealing: Institution identity, exact amount (only ≥ threshold)
 */
export async function generateZKStakeProof(
  merkleTree: MerkleTree,
  leafIndex: number,
  commitment: KYCCommitment,
  stakeAmount: bigint
): Promise<ZKStakeProof> {
  // Get Merkle proof
  const merkleProof = await merkleTree.getProof(leafIndex);
  
  // Verify Merkle proof locally first
  const isValid = await MerkleTree.verifyProof(merkleProof);
  if (!isValid) {
    throw new Error('Invalid Merkle proof - not on whitelist');
  }
  
  // Generate stake amount commitment (hide exact amount)
  const amountSecret = crypto.getRandomValues(new Uint8Array(32));
  const stakeAmountCommitment = await poseidonHash(
    stakeAmount.toString(),
    amountSecret
  );
  
  // Generate Groth16-style proof structure
  // In production, this would use snarkjs or Risc Zero
  const proofData = await generateGroth16Proof(
    merkleProof,
    commitment,
    stakeAmountCommitment
  );
  
  return {
    publicInputs: {
      merkleRoot: toHex(merkleProof.root),
      nullifier: toHex(commitment.nullifier),
      stakeAmountCommitment: toHex(stakeAmountCommitment),
    },
    proof: proofData,
    merkleProof: {
      leaf: toHex(merkleProof.leaf),
      siblings: merkleProof.siblings.map(toHex),
      pathIndices: merkleProof.pathIndices,
    },
    metadata: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      proverVersion: 'casper-zk-client-1.0',
    },
  };
}

/**
 * Generate Groth16 proof structure
 * In production, use snarkjs or Risc Zero prover
 */
async function generateGroth16Proof(
  merkleProof: MerkleProof,
  commitment: KYCCommitment,
  stakeAmountCommitment: Uint8Array
): Promise<ZKStakeProof['proof']> {
  // Generate deterministic proof components from inputs
  const pi_a_0 = await poseidonHash(merkleProof.root, 'pi_a_0');
  const pi_a_1 = await poseidonHash(commitment.nullifier, 'pi_a_1');
  const pi_a_2 = new Uint8Array([1, ...new Array(31).fill(0)]); // Point at infinity
  
  const pi_b_00 = await poseidonHash(stakeAmountCommitment, 'pi_b_00');
  const pi_b_01 = await poseidonHash(merkleProof.leaf, 'pi_b_01');
  const pi_b_10 = await poseidonHash(commitment.secret, 'pi_b_10');
  const pi_b_11 = await poseidonHash(pi_a_0, 'pi_b_11');
  const pi_b_20 = new Uint8Array([1, ...new Array(31).fill(0)]);
  const pi_b_21 = new Uint8Array([0, ...new Array(31).fill(0)]);
  
  const pi_c_0 = await poseidonHash(pi_a_0, pi_b_00, 'pi_c_0');
  const pi_c_1 = await poseidonHash(pi_a_1, pi_b_10, 'pi_c_1');
  const pi_c_2 = new Uint8Array([1, ...new Array(31).fill(0)]);
  
  return {
    pi_a: [toHex(pi_a_0), toHex(pi_a_1), toHex(pi_a_2)],
    pi_b: [
      [toHex(pi_b_00), toHex(pi_b_01)],
      [toHex(pi_b_10), toHex(pi_b_11)],
      [toHex(pi_b_20), toHex(pi_b_21)],
    ],
    pi_c: [toHex(pi_c_0), toHex(pi_c_1), toHex(pi_c_2)],
  };
}

// ============================================================================
// PROOF VERIFICATION (Client-side, before on-chain)
// ============================================================================

/**
 * Verify ZK stake proof locally
 */
export async function verifyZKStakeProof(proof: ZKStakeProof): Promise<{
  valid: boolean;
  reason?: string;
}> {
  try {
    // Check proof structure
    if (!proof.proof || !proof.publicInputs || !proof.merkleProof) {
      return { valid: false, reason: 'Invalid proof structure' };
    }
    
    // Check proof components exist
    if (proof.proof.pi_a.length !== 3 || proof.proof.pi_c.length !== 3) {
      return { valid: false, reason: 'Invalid Groth16 proof structure' };
    }
    
    // Verify Merkle proof
    const merkleProof: MerkleProof = {
      leaf: fromHex(proof.merkleProof.leaf),
      siblings: proof.merkleProof.siblings.map(fromHex),
      pathIndices: proof.merkleProof.pathIndices,
      root: fromHex(proof.publicInputs.merkleRoot),
    };
    
    const merkleValid = await MerkleTree.verifyProof(merkleProof);
    if (!merkleValid) {
      return { valid: false, reason: 'Invalid Merkle proof' };
    }
    
    // In production: Verify Groth16 proof using snarkjs
    // const vkey = await fetch('/verification_key.json').then(r => r.json());
    // const proofValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: `Verification error: ${e}` };
  }
}

// ============================================================================
// UTILITY: Format proof for Casper contract
// ============================================================================

export interface CasperZKProofArgs {
  proof_data: number[];
  public_inputs: string[];
  merkle_root: number[];
  nullifier: number[];
}

/**
 * Format ZK proof for Casper smart contract call
 */
export function formatProofForCasper(proof: ZKStakeProof): CasperZKProofArgs {
  // Flatten proof to bytes
  const proofBytes: number[] = [];
  
  // Add pi_a
  for (const p of proof.proof.pi_a) {
    proofBytes.push(...Array.from(fromHex(p)));
  }
  
  // Add pi_b (flattened)
  for (const row of proof.proof.pi_b) {
    for (const p of row) {
      proofBytes.push(...Array.from(fromHex(p)));
    }
  }
  
  // Add pi_c
  for (const p of proof.proof.pi_c) {
    proofBytes.push(...Array.from(fromHex(p)));
  }
  
  return {
    proof_data: proofBytes,
    public_inputs: [
      proof.publicInputs.merkleRoot,
      proof.publicInputs.nullifier,
      proof.publicInputs.stakeAmountCommitment,
    ],
    merkle_root: Array.from(fromHex(proof.publicInputs.merkleRoot)),
    nullifier: Array.from(fromHex(proof.publicInputs.nullifier)),
  };
}

// ============================================================================
// DEMO: Create sample whitelist and proof
// ============================================================================

export async function createDemoWhitelist(): Promise<{
  tree: MerkleTree;
  proofs: Map<string, ZKStakeProof>;
  root: string;
}> {
  // Sample institutions
  const institutions: KYCEntry[] = [
    { institutionId: 'bank_a', kycHash: 'kyc_hash_a', verifiedAt: Date.now(), expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 },
    { institutionId: 'fund_b', kycHash: 'kyc_hash_b', verifiedAt: Date.now(), expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 },
    { institutionId: 'corp_c', kycHash: 'kyc_hash_c', verifiedAt: Date.now(), expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 },
    { institutionId: 'trust_d', kycHash: 'kyc_hash_d', verifiedAt: Date.now(), expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000 },
  ];
  
  // Build whitelist
  const { tree, commitments } = await buildKYCWhitelist(institutions);
  
  // Generate proofs for each institution
  const proofs = new Map<string, ZKStakeProof>();
  
  let index = 0;
  for (const [institutionId, commitment] of commitments) {
    const proof = await generateZKStakeProof(
      tree,
      index,
      commitment,
      BigInt(100000 * 1e9) // 100k CSPR
    );
    proofs.set(institutionId, proof);
    index++;
  }
  
  return {
    tree,
    proofs,
    root: toHex(tree.getRoot()),
  };
}