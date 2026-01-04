//! CasperStake Bridge - Simplified for Odra
//! Locks csCSPR on Casper for cross-chain bridging

use odra::prelude::*;

#[odra::event]
pub struct BridgeLockEvent {
    pub user: Address,
    pub amount: u64,
    pub destination_chain: u32,
    pub destination_address: String,
    pub nonce: u64,
}

#[odra::event]
pub struct BridgeUnlockEvent {
    pub user: Address,
    pub amount: u64,
    pub source_chain: u32,
    pub nonce: u64,
}

#[odra::module]
pub struct CasperStakeBridge {
    owner: Var<Address>,
    relayer: Var<Address>,
    paused: Var<bool>,
    next_nonce: Var<u64>,
    total_locked: Var<u64>,
    bridge_fee_bps: Var<u64>,
    collected_fees: Var<u64>,
    lock_amounts: Mapping<u64, u64>,
    lock_users: Mapping<u64, Address>,
    lock_dest_chains: Mapping<u64, u32>,
    lock_processed: Mapping<u64, bool>,
    user_locked_balance: Mapping<Address, u64>,
    supported_chains: Mapping<u32, bool>,
}

#[odra::module]
impl CasperStakeBridge {
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.relayer.set(caller);
        self.paused.set(false);
        self.next_nonce.set(1);
        self.total_locked.set(0);
        self.bridge_fee_bps.set(10);
        self.collected_fees.set(0);
        self.supported_chains.set(&1, true);
        self.supported_chains.set(&11155111, true);
        self.supported_chains.set(&137, true);
        self.supported_chains.set(&80001, true);
    }

    pub fn lock_for_bridge(&mut self, amount: u64, destination_chain: u32, destination_address: String) -> u64 {
        assert!(!self.paused.get_or_default(), "Bridge is paused");
        assert!(self.supported_chains.get(&destination_chain).unwrap_or(false), "Chain not supported");
        assert!(amount >= 10_000_000_000, "Min 10 CSPR");
        
        let caller = self.env().caller();
        let nonce = self.next_nonce.get_or_default();
        let fee_bps = self.bridge_fee_bps.get_or_default();
        let fee = (amount * fee_bps) / 10_000;
        let net_amount = amount - fee;
        
        self.lock_amounts.set(&nonce, net_amount);
        self.lock_users.set(&nonce, caller);
        self.lock_dest_chains.set(&nonce, destination_chain);
        self.lock_processed.set(&nonce, false);
        
        let user_locked = self.user_locked_balance.get(&caller).unwrap_or(0);
        self.user_locked_balance.set(&caller, user_locked + net_amount);
        
        let total = self.total_locked.get_or_default();
        self.total_locked.set(total + net_amount);
        
        let fees = self.collected_fees.get_or_default();
        self.collected_fees.set(fees + fee);
        
        self.next_nonce.set(nonce + 1);
        
        self.env().emit_event(BridgeLockEvent {
            user: caller,
            amount: net_amount,
            destination_chain,
            destination_address,
            nonce,
        });
        
        nonce
    }

    pub fn mark_processed(&mut self, nonce: u64) {
        self.assert_relayer();
        assert!(self.lock_amounts.get(&nonce).is_some(), "Lock not found");
        self.lock_processed.set(&nonce, true);
    }

    pub fn unlock_from_bridge(&mut self, user: Address, amount: u64, source_chain: u32) {
        self.assert_relayer();
        let total = self.total_locked.get_or_default();
        self.total_locked.set(total.saturating_sub(amount));
        
        let nonce = self.next_nonce.get_or_default();
        self.next_nonce.set(nonce + 1);
        
        self.env().emit_event(BridgeUnlockEvent { user, amount, source_chain, nonce });
    }

    pub fn get_lock_amount(&self, nonce: u64) -> u64 { self.lock_amounts.get(&nonce).unwrap_or(0) }
    pub fn get_lock_chain(&self, nonce: u64) -> u32 { self.lock_dest_chains.get(&nonce).unwrap_or(0) }
    pub fn is_lock_processed(&self, nonce: u64) -> bool { self.lock_processed.get(&nonce).unwrap_or(false) }
    pub fn get_user_locked_balance(&self, user: Address) -> u64 { self.user_locked_balance.get(&user).unwrap_or(0) }
    pub fn get_total_locked(&self) -> u64 { self.total_locked.get_or_default() }
    pub fn get_next_nonce(&self) -> u64 { self.next_nonce.get_or_default() }
    pub fn is_chain_supported(&self, chain_id: u32) -> bool { self.supported_chains.get(&chain_id).unwrap_or(false) }
    pub fn get_bridge_fee_bps(&self) -> u64 { self.bridge_fee_bps.get_or_default() }
    pub fn is_paused(&self) -> bool { self.paused.get_or_default() }

    pub fn set_relayer(&mut self, new_relayer: Address) { self.assert_owner(); self.relayer.set(new_relayer); }
    pub fn add_supported_chain(&mut self, chain_id: u32) { self.assert_owner(); self.supported_chains.set(&chain_id, true); }
    pub fn set_bridge_fee(&mut self, fee_bps: u64) { self.assert_owner(); self.bridge_fee_bps.set(fee_bps); }
    pub fn pause(&mut self) { self.assert_owner(); self.paused.set(true); }
    pub fn unpause(&mut self) { self.assert_owner(); self.paused.set(false); }

    fn assert_owner(&self) { assert!(self.env().caller() == self.owner.get().unwrap(), "Not owner"); }
    fn assert_relayer(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get().unwrap();
        let relayer = self.relayer.get().unwrap_or(owner);
        assert!(caller == owner || caller == relayer, "Not authorized");
    }
}
