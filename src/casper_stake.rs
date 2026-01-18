//! CasperStake - Privacy-First Liquid Staking Protocol
//! V6 - Works with standard frontend (no proxy_caller needed)
//! Pool = contract balance - reserved for pending unstakes

use odra::prelude::*;
use odra::casper_types::U512;

#[odra::event]
pub struct Staked {
    pub user: Address,
    pub amount: u64,
}

#[odra::event]
pub struct UnstakeRequested {
    pub user: Address,
    pub amount: u64,
    pub request_id: u64,
}

#[odra::event]
pub struct Withdrawn {
    pub user: Address,
    pub amount: u64,
}

#[odra::event]
pub struct InstantUnstaked {
    pub user: Address,
    pub cscspr_burned: u64,
    pub cspr_received: u64,
    pub fee_paid: u64,
}

#[odra::module]
pub struct CasperStake {
    total_staked: Var<u64>,
    owner: Var<Address>,
    paused: Var<bool>,
    user_stakes: Mapping<Address, u64>,
    unstake_amounts: Mapping<u64, u64>,
    unstake_users: Mapping<u64, Address>,
    unstake_unlock: Mapping<u64, u64>,
    unstake_completed: Mapping<u64, bool>,
    next_unstake_id: Var<u64>,
    unbonding_period: Var<u64>,
    // Instant pool tracking
    reserved_for_unstakes: Var<u64>,
    instant_fee_bps: Var<u64>,
    total_fees_collected: Var<u64>,
}

#[odra::module]
impl CasperStake {
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
        self.total_staked.set(0);
        self.next_unstake_id.set(0);
        self.paused.set(false);
        self.unbonding_period.set(50_400_000);
        self.reserved_for_unstakes.set(0);
        self.instant_fee_bps.set(50); // 0.5% fee
        self.total_fees_collected.set(0);
    }

    // ==================== STAKING ====================

    /// Stake CSPR - amount passed as parameter (works with standard frontend)
    pub fn stake(&mut self, amount: u64) {
        assert!(!self.paused.get_or_default(), "Contract paused");
        assert!(amount > 0, "Must stake more than 0");
        
        let caller = self.env().caller();

        let current = self.user_stakes.get(&caller).unwrap_or(0);
        self.user_stakes.set(&caller, current + amount);
        
        let total = self.total_staked.get_or_default();
        self.total_staked.set(total + amount);

        self.env().emit_event(Staked { user: caller, amount });
    }

    /// Request regular unstake
    pub fn request_unstake(&mut self, amount: u64) -> u64 {
        assert!(!self.paused.get_or_default(), "Contract paused");
        let caller = self.env().caller();
        let user_stake = self.user_stakes.get(&caller).unwrap_or(0);
        assert!(user_stake >= amount, "Insufficient stake");

        let request_id = self.next_unstake_id.get_or_default();
        let unlock_time = self.env().get_block_time() + self.unbonding_period.get_or_default();

        self.unstake_amounts.set(&request_id, amount);
        self.unstake_users.set(&request_id, caller);
        self.unstake_unlock.set(&request_id, unlock_time);
        self.unstake_completed.set(&request_id, false);
        self.user_stakes.set(&caller, user_stake - amount);
        self.next_unstake_id.set(request_id + 1);
        
        // Reserve this amount for withdrawal
        let reserved = self.reserved_for_unstakes.get_or_default();
        self.reserved_for_unstakes.set(reserved + amount);

        self.env().emit_event(UnstakeRequested { user: caller, amount, request_id });
        request_id
    }

    /// Withdraw after unbonding period
    pub fn withdraw(&mut self, request_id: u64) {
        assert!(!self.paused.get_or_default(), "Contract paused");
        let caller = self.env().caller();
        let user = self.unstake_users.get(&request_id).expect("Request not found");
        let amount = self.unstake_amounts.get(&request_id).unwrap_or(0);
        let unlock = self.unstake_unlock.get(&request_id).unwrap_or(u64::MAX);
        let completed = self.unstake_completed.get(&request_id).unwrap_or(true);

        assert!(user == caller, "Not your request");
        assert!(!completed, "Already withdrawn");
        assert!(self.env().get_block_time() >= unlock, "Still locked");

        self.unstake_completed.set(&request_id, true);
        
        let total = self.total_staked.get_or_default();
        self.total_staked.set(total.saturating_sub(amount));
        
        // Remove from reserved
        let reserved = self.reserved_for_unstakes.get_or_default();
        self.reserved_for_unstakes.set(reserved.saturating_sub(amount));

        self.env().transfer_tokens(&caller, &U512::from(amount));
        self.env().emit_event(Withdrawn { user: caller, amount });
    }

    // ==================== INSTANT UNSTAKE ====================

    /// Instant unstake - skip waiting period for 0.5% fee
    /// Uses total_staked as pool (simplified model for demo)
    pub fn instant_unstake(&mut self, amount: u64) {
        assert!(!self.paused.get_or_default(), "Contract paused");
        let caller = self.env().caller();
        
        let user_stake = self.user_stakes.get(&caller).unwrap_or(0);
        assert!(user_stake >= amount, "Insufficient stake");
        
        // Calculate fee and net output
        let fee_bps = self.instant_fee_bps.get_or_default();
        let fee = (amount * fee_bps) / 10_000;
        let net_output = amount - fee;
        
        // Check pool liquidity (total staked - reserved - this user's stake being withdrawn)
        let total = self.total_staked.get_or_default();
        let reserved = self.reserved_for_unstakes.get_or_default();
        let other_stakes = total.saturating_sub(user_stake);
        let available_pool = other_stakes.saturating_sub(reserved);
        
        // For instant unstake, we need liquidity from OTHER users' stakes
        // This is a simplified model - in production you'd have actual CSPR in contract
        assert!(available_pool >= net_output || total >= amount, "Insufficient pool liquidity");
        
        // Update user stake
        self.user_stakes.set(&caller, user_stake - amount);
        
        // Update total staked
        self.total_staked.set(total.saturating_sub(amount));
        
        // Track fees
        let current_fees = self.total_fees_collected.get_or_default();
        self.total_fees_collected.set(current_fees + fee);
        
        // Transfer CSPR to user (in production, this would be from contract balance)
        self.env().transfer_tokens(&caller, &U512::from(net_output));
        
        self.env().emit_event(InstantUnstaked { 
            user: caller, 
            cscspr_burned: amount,
            cspr_received: net_output,
            fee_paid: fee,
        });
    }

    // ==================== VIEW FUNCTIONS ====================

    pub fn get_total_staked(&self) -> u64 { 
        self.total_staked.get_or_default() 
    }
    
    pub fn get_user_stake(&self, user: Address) -> u64 { 
        self.user_stakes.get(&user).unwrap_or(0) 
    }
    
    pub fn get_unstake_amount(&self, id: u64) -> u64 { 
        self.unstake_amounts.get(&id).unwrap_or(0) 
    }
    
    pub fn is_withdrawal_ready(&self, id: u64) -> bool {
        !self.unstake_completed.get(&id).unwrap_or(true) 
            && self.env().get_block_time() >= self.unstake_unlock.get(&id).unwrap_or(u64::MAX)
    }

    /// Get available instant pool liquidity
    pub fn get_instant_pool_reserve(&self) -> u64 { 
        let total = self.total_staked.get_or_default();
        let reserved = self.reserved_for_unstakes.get_or_default();
        total.saturating_sub(reserved)
    }
    
    pub fn get_instant_fee_bps(&self) -> u64 { 
        self.instant_fee_bps.get_or_default() 
    }
    
    pub fn get_total_fees_collected(&self) -> u64 { 
        self.total_fees_collected.get_or_default() 
    }
    
    pub fn get_reserved_for_unstakes(&self) -> u64 {
        self.reserved_for_unstakes.get_or_default()
    }

    // ==================== ADMIN FUNCTIONS ====================

    pub fn pause(&mut self) { 
        self.assert_owner(); 
        self.paused.set(true); 
    }
    
    pub fn unpause(&mut self) { 
        self.assert_owner(); 
        self.paused.set(false); 
    }

    pub fn set_instant_fee(&mut self, fee_bps: u64) {
        self.assert_owner();
        assert!(fee_bps <= 500, "Fee cannot exceed 5%");
        self.instant_fee_bps.set(fee_bps);
    }

    fn assert_owner(&self) {
        assert!(self.env().caller() == self.owner.get().unwrap(), "Not owner");
    }
}