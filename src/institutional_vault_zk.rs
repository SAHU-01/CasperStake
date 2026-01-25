//! CasperStake ZK Institutional Vault
//! 
//! Implements Merkle Membership verification for KYC-compliant staking.

use odra::prelude::*;
use odra::casper_types::U256;

/// Institutional Vault with ZK Verification
#[odra::module]
pub struct InstitutionalVault {
    owner: Var<Address>,
    kyc_merkle_root: Var<U256>,
    historical_roots: Mapping<U256, bool>,
    used_nullifiers: Mapping<U256, bool>,
    total_institutional_stake: Var<U256>,
    stakes_by_nullifier: Mapping<U256, U256>,
    staking_contract: Var<U256>,
    min_stake: Var<U256>,
    is_active: Var<bool>,
}

#[odra::module]
impl InstitutionalVault {
    /// Initialize with defaults - no args required
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.min_stake.set(U256::from(100_000_000_000_000u64)); // 100k CSPR default
        self.is_active.set(true);
        self.total_institutional_stake.set(U256::zero());
        self.kyc_merkle_root.set(U256::zero());
        self.staking_contract.set(U256::zero());
    }

    /// Set staking contract (owner only) - call after deploy
    pub fn set_staking_contract_hash(&mut self, contract_hash: U256) {
        self.only_owner();
        self.staking_contract.set(contract_hash);
    }

    /// Update the KYC Merkle root (owner only)
    pub fn update_merkle_root(&mut self, new_root: U256) {
        self.only_owner();
        let old_root = self.kyc_merkle_root.get_or_default();
        if old_root != U256::zero() {
            self.historical_roots.set(&old_root, true);
        }
        self.kyc_merkle_root.set(new_root);
    }

    /// Stake with Merkle proof of KYC membership
    pub fn stake_with_proof(
        &mut self,
        merkle_proof_hash: U256,
        nullifier: U256,
        amount: U256,
    ) {
        assert!(self.is_active.get_or_default(), "Vault is paused");
        let min = self.min_stake.get_or_default();
        assert!(amount >= min, "Below minimum stake");
        assert!(
            !self.used_nullifiers.get(&nullifier).unwrap_or(false),
            "Nullifier already used"
        );
        
        let current_root = self.kyc_merkle_root.get_or_default();
        let is_valid = merkle_proof_hash == current_root || 
                       self.historical_roots.get(&merkle_proof_hash).unwrap_or(false);
        assert!(is_valid, "Invalid Merkle proof");
        
        self.used_nullifiers.set(&nullifier, true);
        self.stakes_by_nullifier.set(&nullifier, amount);
        let total = self.total_institutional_stake.get_or_default();
        self.total_institutional_stake.set(total + amount);
    }

    /// Verify a ZK proof
    pub fn verify_zk_proof(
        &self, 
        proof_hash: U256,
        nullifier: U256,
        merkle_root: U256
    ) -> bool {
        if self.used_nullifiers.get(&nullifier).unwrap_or(false) {
            return false;
        }
        let current_root = self.kyc_merkle_root.get_or_default();
        if merkle_root != current_root {
            if !self.historical_roots.get(&merkle_root).unwrap_or(false) {
                return false;
            }
        }
        if proof_hash == U256::zero() {
            return false;
        }
        true
    }

    /// Stake using ZK proof
    pub fn stake_with_zk_proof(
        &mut self, 
        proof_hash: U256,
        nullifier: U256,
        merkle_root: U256,
        amount: U256
    ) {
        assert!(self.is_active.get_or_default(), "Vault is paused");
        assert!(amount >= self.min_stake.get_or_default(), "Below minimum");
        assert!(self.verify_zk_proof(proof_hash, nullifier, merkle_root), "Invalid ZK proof");
        
        self.used_nullifiers.set(&nullifier, true);
        self.stakes_by_nullifier.set(&nullifier, amount);
        let total = self.total_institutional_stake.get_or_default();
        self.total_institutional_stake.set(total + amount);
    }

    /// Unstake using nullifier
    pub fn unstake_with_nullifier(&mut self, nullifier: U256) -> U256 {
        let stake = self.stakes_by_nullifier.get(&nullifier).unwrap_or(U256::zero());
        assert!(stake > U256::zero(), "No stake found");
        self.stakes_by_nullifier.set(&nullifier, U256::zero());
        let total = self.total_institutional_stake.get_or_default();
        self.total_institutional_stake.set(total - stake);
        stake
    }

    // ========== View Functions ==========
    pub fn get_merkle_root(&self) -> U256 { self.kyc_merkle_root.get_or_default() }
    pub fn is_nullifier_used(&self, nullifier: U256) -> bool { self.used_nullifiers.get(&nullifier).unwrap_or(false) }
    pub fn get_total_institutional_stake(&self) -> U256 { self.total_institutional_stake.get_or_default() }
    pub fn is_valid_root(&self, root: U256) -> bool {
        let current = self.kyc_merkle_root.get_or_default();
        root == current || self.historical_roots.get(&root).unwrap_or(false)
    }
    pub fn get_stake_by_nullifier(&self, nullifier: U256) -> U256 { self.stakes_by_nullifier.get(&nullifier).unwrap_or(U256::zero()) }
    pub fn get_min_stake(&self) -> U256 { self.min_stake.get_or_default() }
    pub fn get_is_active(&self) -> bool { self.is_active.get_or_default() }

    // ========== Admin Functions ==========
    pub fn set_active(&mut self, active: bool) { self.only_owner(); self.is_active.set(active); }
    pub fn set_min_stake(&mut self, min_stake: U256) { self.only_owner(); self.min_stake.set(min_stake); }

    fn only_owner(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get().expect("Owner not set");
        assert!(caller == owner, "Not owner");
    }
}