//! Privacy Module - Commitment Scheme for Shielded Balances

use odra::prelude::*;

#[odra::event]
pub struct BalanceCommitted {
    pub user: Address,
    pub commitment_hash: u64,
}

#[odra::event]
pub struct BalanceVerified {
    pub user: Address,
    pub verified: bool,
    pub minimum_proven: u64,
}

#[odra::module]
pub struct PrivacyModule {
    owner: Var<Address>,
    commitment_hashes: Mapping<Address, u64>,
    commitment_verified: Mapping<Address, bool>,
    commitment_min: Mapping<Address, u64>,
    hash_owners: Mapping<u64, Address>,
    nullifiers: Mapping<u64, bool>,
}

#[odra::module]
impl PrivacyModule {
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
    }

    pub fn commit_balance(&mut self, commitment_hash: u64) {
        let caller = self.env().caller();
        assert!(self.hash_owners.get(&commitment_hash).is_none(), "Already exists");

        self.commitment_hashes.set(&caller, commitment_hash);
        self.commitment_verified.set(&caller, false);
        self.commitment_min.set(&caller, 0);
        self.hash_owners.set(&commitment_hash, caller);

        self.env().emit_event(BalanceCommitted { user: caller, commitment_hash });
    }

    pub fn verify_balance(&mut self, amount: u64, blinding: u64, minimum: u64) -> bool {
        let caller = self.env().caller();
        let stored = self.commitment_hashes.get(&caller).expect("No commitment");
        let computed = self.compute_commitment(amount, blinding);

        if computed != stored || amount < minimum {
            self.env().emit_event(BalanceVerified { user: caller, verified: false, minimum_proven: 0 });
            return false;
        }

        self.commitment_verified.set(&caller, true);
        self.commitment_min.set(&caller, minimum);
        self.env().emit_event(BalanceVerified { user: caller, verified: true, minimum_proven: minimum });
        true
    }

    pub fn compute_commitment(&self, amount: u64, blinding: u64) -> u64 {
        let mixed = amount ^ blinding;
        mixed.rotate_left(17) ^ amount.wrapping_mul(31) ^ blinding.wrapping_mul(37)
    }

    pub fn get_commitment_hash(&self, user: Address) -> u64 { 
        self.commitment_hashes.get(&user).unwrap_or(0) 
    }
    
    pub fn has_verified_minimum(&self, user: Address, min: u64) -> bool {
        self.commitment_verified.get(&user).unwrap_or(false) 
            && self.commitment_min.get(&user).unwrap_or(0) >= min
    }
    
    pub fn is_nullified(&self, hash: u64) -> bool { 
        self.nullifiers.get(&hash).unwrap_or(false) 
    }
}

