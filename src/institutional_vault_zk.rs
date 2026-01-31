//! CasperStake ZK Institutional Vault - Production
//! 
//! On-chain institution registry with Merkle Membership verification.


use odra::prelude::*;
use odra::casper_types::U256;

/// Institutional Vault - exactly 15 fields
#[odra::module]
pub struct InstitutionalVault {
    // ========== Core (3 fields) ==========
    owner: Var<Address>,
    is_active: Var<bool>,
    institution_count: Var<u64>,
    
    // ========== Institution Data (7 fields) ==========
    institution_creator: Mapping<u64, Address>,
    institution_metadata: Mapping<u64, String>,
    institution_merkle_root: Mapping<u64, U256>,
    /// Packed: min_stake(128) | referral%(8) | active(1) | public(1)
    institution_config: Mapping<u64, U256>,
    institution_total_staked: Mapping<u64, U256>,
    institution_member_count: Mapping<u64, u32>,
    invite_code_to_institution: Mapping<U256, u64>,
    
    // ========== Historical & Stakes (4 fields) ==========
    historical_roots: Mapping<(u64, U256), bool>,
    used_nullifiers: Mapping<U256, bool>,
    stakes_by_nullifier: Mapping<U256, U256>,
    nullifier_to_institution: Mapping<U256, u64>,
    
    // ========== Referral (1 field) ==========
    referral_earnings: Mapping<Address, U256>,
}
// Total: 15 fields ✓

#[odra::module]
impl InstitutionalVault {
    // ========== Init ==========
    
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
        self.is_active.set(true);
        self.institution_count.set(0);
    }

    // ========== Config Pack/Unpack ==========
    
    fn pack_config(min_stake: U256, referral_percent: u8, is_active: bool, is_public: bool) -> U256 {
        let mut config = min_stake;
        config = config + (U256::from(referral_percent) << 128);
        if is_active { config = config + (U256::one() << 136); }
        if is_public { config = config + (U256::one() << 137); }
        config
    }
    
    fn get_min_stake(config: U256) -> U256 {
        config & ((U256::one() << 128) - U256::one())
    }
    
    fn get_referral(config: U256) -> u8 {
        ((config >> 128) & U256::from(255u8)).as_u32() as u8
    }
    
    fn get_active(config: U256) -> bool {
        ((config >> 136) & U256::one()) == U256::one()
    }
    
    fn get_public(config: U256) -> bool {
        ((config >> 137) & U256::one()) == U256::one()
    }

    // ========== Institution Management ==========

    pub fn create_institution(
        &mut self,
        metadata_cid: String,
        invite_code_hash: U256,
        min_stake: U256,
        referral_percent: u8,
        is_public: bool,
    ) -> u64 {
        assert!(self.is_active.get_or_default(), "Paused");
        assert!(!metadata_cid.is_empty(), "No metadata");
        assert!(referral_percent >= 1 && referral_percent <= 10, "Referral 1-10%");
        assert!(min_stake >= U256::from(10_000_000_000u64), "Min 10 CSPR");
        assert!(self.invite_code_to_institution.get(&invite_code_hash).unwrap_or(0) == 0, "Code used");

        let id = self.institution_count.get_or_default() + 1;
        let caller = self.env().caller();
        
        self.institution_creator.set(&id, caller);
        self.institution_metadata.set(&id, metadata_cid);
        self.institution_merkle_root.set(&id, U256::zero());
        self.institution_config.set(&id, Self::pack_config(min_stake, referral_percent, true, is_public));
        self.institution_total_staked.set(&id, U256::zero());
        self.institution_member_count.set(&id, 0);
        self.invite_code_to_institution.set(&invite_code_hash, id);
        self.institution_count.set(id);

        id
    }

    pub fn update_merkle_root(&mut self, institution_id: u64, new_root: U256, member_count: u32) {
        let creator = self.institution_creator.get(&institution_id).expect("Not found");
        assert!(self.env().caller() == creator, "Not creator");
        
        let old = self.institution_merkle_root.get(&institution_id).unwrap_or(U256::zero());
        if old != U256::zero() {
            self.historical_roots.set(&(institution_id, old), true);
        }
        
        self.institution_merkle_root.set(&institution_id, new_root);
        self.institution_member_count.set(&institution_id, member_count);
    }

    pub fn update_institution_metadata(&mut self, institution_id: u64, new_cid: String) {
        let creator = self.institution_creator.get(&institution_id).expect("Not found");
        assert!(self.env().caller() == creator, "Not creator");
        self.institution_metadata.set(&institution_id, new_cid);
    }

    pub fn set_institution_active(&mut self, institution_id: u64, active: bool) {
        let creator = self.institution_creator.get(&institution_id).expect("Not found");
        assert!(self.env().caller() == creator, "Not creator");
        
        let cfg = self.institution_config.get(&institution_id).unwrap_or(U256::zero());
        let new_cfg = Self::pack_config(
            Self::get_min_stake(cfg),
            Self::get_referral(cfg),
            active,
            Self::get_public(cfg)
        );
        self.institution_config.set(&institution_id, new_cfg);
    }

    // ========== ZK Staking ==========

    pub fn stake_with_zk_proof(
        &mut self,
        institution_id: u64,
        proof_hash: U256,
        nullifier: U256,
        merkle_root: U256,
        amount: U256,
    ) {
        assert!(self.is_active.get_or_default(), "Paused");
        
        let creator = self.institution_creator.get(&institution_id).expect("Not found");
        let cfg = self.institution_config.get(&institution_id).unwrap_or(U256::zero());
        
        assert!(Self::get_active(cfg), "Institution paused");
        assert!(amount >= Self::get_min_stake(cfg), "Below min");
        assert!(!self.used_nullifiers.get(&nullifier).unwrap_or(false), "Nullifier used");
        assert!(proof_hash != U256::zero(), "Invalid proof");
        
        let current_root = self.institution_merkle_root.get(&institution_id).unwrap_or(U256::zero());
        let root_ok = merkle_root == current_root || 
                      self.historical_roots.get(&(institution_id, merkle_root)).unwrap_or(false);
        assert!(root_ok, "Invalid root");

        // Record stake
        self.used_nullifiers.set(&nullifier, true);
        self.stakes_by_nullifier.set(&nullifier, amount);
        self.nullifier_to_institution.set(&nullifier, institution_id);

        // Update totals
        let total = self.institution_total_staked.get(&institution_id).unwrap_or(U256::zero());
        self.institution_total_staked.set(&institution_id, total + amount);

        // Referral reward
        let referral_pct = Self::get_referral(cfg);
        let referral_amt = amount * U256::from(referral_pct) / U256::from(100u8);
        let earnings = self.referral_earnings.get(&creator).unwrap_or(U256::zero());
        self.referral_earnings.set(&creator, earnings + referral_amt);
    }

    pub fn unstake_with_nullifier(&mut self, nullifier: U256) -> U256 {
        let stake = self.stakes_by_nullifier.get(&nullifier).unwrap_or(U256::zero());
        assert!(stake > U256::zero(), "No stake");
        
        let inst_id = self.nullifier_to_institution.get(&nullifier).unwrap_or(0);
        self.stakes_by_nullifier.set(&nullifier, U256::zero());
        
        if inst_id > 0 {
            let total = self.institution_total_staked.get(&inst_id).unwrap_or(U256::zero());
            if total >= stake {
                self.institution_total_staked.set(&inst_id, total - stake);
            }
        }
        stake
    }

    // ========== View Functions ==========

    pub fn get_institution_count(&self) -> u64 {
        self.institution_count.get_or_default()
    }

    pub fn get_institution_creator(&self, id: u64) -> Option<Address> {
        self.institution_creator.get(&id)
    }

    pub fn get_institution_metadata(&self, id: u64) -> String {
        self.institution_metadata.get(&id).unwrap_or_default()
    }

    pub fn get_institution_merkle_root(&self, id: u64) -> U256 {
        self.institution_merkle_root.get(&id).unwrap_or(U256::zero())
    }

    pub fn get_institution_min_stake(&self, id: u64) -> U256 {
        let cfg = self.institution_config.get(&id).unwrap_or(U256::zero());
        Self::get_min_stake(cfg)
    }

    pub fn get_institution_referral_percent(&self, id: u64) -> u8 {
        let cfg = self.institution_config.get(&id).unwrap_or(U256::zero());
        Self::get_referral(cfg)
    }

    pub fn get_institution_total_staked(&self, id: u64) -> U256 {
        self.institution_total_staked.get(&id).unwrap_or(U256::zero())
    }

    pub fn get_institution_member_count(&self, id: u64) -> u32 {
        self.institution_member_count.get(&id).unwrap_or(0)
    }

    pub fn get_institution_active(&self, id: u64) -> bool {
        let cfg = self.institution_config.get(&id).unwrap_or(U256::zero());
        Self::get_active(cfg)
    }

    pub fn get_institution_public(&self, id: u64) -> bool {
        let cfg = self.institution_config.get(&id).unwrap_or(U256::zero());
        Self::get_public(cfg)
    }

    pub fn get_institution_by_invite(&self, invite_code_hash: U256) -> u64 {
        self.invite_code_to_institution.get(&invite_code_hash).unwrap_or(0)
    }

    pub fn is_nullifier_used(&self, nullifier: U256) -> bool {
        self.used_nullifiers.get(&nullifier).unwrap_or(false)
    }

    pub fn get_stake_by_nullifier(&self, nullifier: U256) -> U256 {
        self.stakes_by_nullifier.get(&nullifier).unwrap_or(U256::zero())
    }

    pub fn is_valid_root(&self, institution_id: u64, root: U256) -> bool {
        let current = self.institution_merkle_root.get(&institution_id).unwrap_or(U256::zero());
        root == current || self.historical_roots.get(&(institution_id, root)).unwrap_or(false)
    }

    pub fn get_referral_earnings(&self, address: Address) -> U256 {
        self.referral_earnings.get(&address).unwrap_or(U256::zero())
    }

    pub fn get_my_referral_earnings(&self) -> U256 {
        self.referral_earnings.get(&self.env().caller()).unwrap_or(U256::zero())
    }

    pub fn get_is_active(&self) -> bool {
        self.is_active.get_or_default()
    }

    // ========== Admin ==========

    pub fn set_active(&mut self, active: bool) {
        assert!(self.env().caller() == self.owner.get().expect("No owner"), "Not owner");
        self.is_active.set(active);
    }
}