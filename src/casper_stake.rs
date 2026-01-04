// //! CasperStake - Privacy-First Liquid Staking Protocol

// use odra::prelude::*;
// use odra::casper_types::U512;

// #[odra::event]
// pub struct Staked {
//     pub user: Address,
//     pub amount: u64,
// }

// #[odra::event]
// pub struct UnstakeRequested {
//     pub user: Address,
//     pub amount: u64,
//     pub request_id: u64,
// }

// #[odra::event]
// pub struct Withdrawn {
//     pub user: Address,
//     pub amount: u64,
// }

// #[odra::module]
// pub struct CasperStake {
//     total_staked: Var<u64>,
//     owner: Var<Address>,
//     paused: Var<bool>,
//     user_stakes: Mapping<Address, u64>,
//     unstake_amounts: Mapping<u64, u64>,
//     unstake_users: Mapping<u64, Address>,
//     unstake_unlock: Mapping<u64, u64>,
//     unstake_completed: Mapping<u64, bool>,
//     next_unstake_id: Var<u64>,
//     unbonding_period: Var<u64>,
// }

// #[odra::module]
// impl CasperStake {
//     pub fn init(&mut self) {
//         self.owner.set(self.env().caller());
//         self.total_staked.set(0);
//         self.next_unstake_id.set(0);
//         self.paused.set(false);
//         self.unbonding_period.set(50_400_000);
//     }

//     #[odra(payable)]
//     pub fn stake(&mut self) {
//         assert!(!self.paused.get_or_default(), "Paused");
//         let caller = self.env().caller();
//         let amount = self.env().attached_value().as_u64();
//         assert!(amount > 0, "Must stake > 0");

//         let current = self.user_stakes.get(&caller).unwrap_or(0);
//         self.user_stakes.set(&caller, current + amount);
//         let total = self.total_staked.get_or_default();
//         self.total_staked.set(total + amount);

//         self.env().emit_event(Staked { user: caller, amount });
//     }

//     pub fn request_unstake(&mut self, amount: u64) -> u64 {
//         assert!(!self.paused.get_or_default(), "Paused");
//         let caller = self.env().caller();
//         let user_stake = self.user_stakes.get(&caller).unwrap_or(0);
//         assert!(user_stake >= amount, "Insufficient stake");

//         let request_id = self.next_unstake_id.get_or_default();
//         let unlock_time = self.env().get_block_time() + self.unbonding_period.get_or_default();

//         self.unstake_amounts.set(&request_id, amount);
//         self.unstake_users.set(&request_id, caller);
//         self.unstake_unlock.set(&request_id, unlock_time);
//         self.unstake_completed.set(&request_id, false);
//         self.user_stakes.set(&caller, user_stake - amount);
//         self.next_unstake_id.set(request_id + 1);

//         self.env().emit_event(UnstakeRequested { user: caller, amount, request_id });
//         request_id
//     }

//     pub fn withdraw(&mut self, request_id: u64) {
//         assert!(!self.paused.get_or_default(), "Paused");
//         let caller = self.env().caller();
//         let user = self.unstake_users.get(&request_id).expect("Not found");
//         let amount = self.unstake_amounts.get(&request_id).unwrap_or(0);
//         let unlock = self.unstake_unlock.get(&request_id).unwrap_or(u64::MAX);
//         let completed = self.unstake_completed.get(&request_id).unwrap_or(true);

//         assert!(user == caller, "Not yours");
//         assert!(!completed, "Already done");
//         assert!(self.env().get_block_time() >= unlock, "Still locked");

//         self.unstake_completed.set(&request_id, true);
//         let total = self.total_staked.get_or_default();
//         self.total_staked.set(total.saturating_sub(amount));

//         self.env().transfer_tokens(&caller, &U512::from(amount));
//         self.env().emit_event(Withdrawn { user: caller, amount });
//     }

//     pub fn get_total_staked(&self) -> u64 { self.total_staked.get_or_default() }
//     pub fn get_user_stake(&self, user: Address) -> u64 { self.user_stakes.get(&user).unwrap_or(0) }
//     pub fn get_unstake_amount(&self, id: u64) -> u64 { self.unstake_amounts.get(&id).unwrap_or(0) }
//     pub fn is_withdrawal_ready(&self, id: u64) -> bool {
//         !self.unstake_completed.get(&id).unwrap_or(true) 
//             && self.env().get_block_time() >= self.unstake_unlock.get(&id).unwrap_or(u64::MAX)
//     }

//     pub fn pause(&mut self) { self.assert_owner(); self.paused.set(true); }
//     pub fn unpause(&mut self) { self.assert_owner(); self.paused.set(false); }

//     fn assert_owner(&self) {
//         assert!(self.env().caller() == self.owner.get().unwrap(), "Not owner");
//     }
// }

//! CasperStake - Privacy-First Liquid Staking Protocol

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
}

#[odra::module]
impl CasperStake {
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
        self.total_staked.set(0);
        self.next_unstake_id.set(0);
        self.paused.set(false);
        self.unbonding_period.set(50_400_000);
    }

    // FIXED: Accept amount as parameter instead of using attached_value
    pub fn stake(&mut self, amount: u64) {
        assert!(!self.paused.get_or_default(), "Paused");
        let caller = self.env().caller();
        assert!(amount > 0, "Must stake > 0");

        let current = self.user_stakes.get(&caller).unwrap_or(0);
        self.user_stakes.set(&caller, current + amount);
        let total = self.total_staked.get_or_default();
        self.total_staked.set(total + amount);

        self.env().emit_event(Staked { user: caller, amount });
    }

    pub fn request_unstake(&mut self, amount: u64) -> u64 {
        assert!(!self.paused.get_or_default(), "Paused");
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

        self.env().emit_event(UnstakeRequested { user: caller, amount, request_id });
        request_id
    }

    pub fn withdraw(&mut self, request_id: u64) {
        assert!(!self.paused.get_or_default(), "Paused");
        let caller = self.env().caller();
        let user = self.unstake_users.get(&request_id).expect("Not found");
        let amount = self.unstake_amounts.get(&request_id).unwrap_or(0);
        let unlock = self.unstake_unlock.get(&request_id).unwrap_or(u64::MAX);
        let completed = self.unstake_completed.get(&request_id).unwrap_or(true);

        assert!(user == caller, "Not yours");
        assert!(!completed, "Already done");
        assert!(self.env().get_block_time() >= unlock, "Still locked");

        self.unstake_completed.set(&request_id, true);
        let total = self.total_staked.get_or_default();
        self.total_staked.set(total.saturating_sub(amount));

        self.env().transfer_tokens(&caller, &U512::from(amount));
        self.env().emit_event(Withdrawn { user: caller, amount });
    }

    pub fn get_total_staked(&self) -> u64 { self.total_staked.get_or_default() }
    pub fn get_user_stake(&self, user: Address) -> u64 { self.user_stakes.get(&user).unwrap_or(0) }
    pub fn get_unstake_amount(&self, id: u64) -> u64 { self.unstake_amounts.get(&id).unwrap_or(0) }
    pub fn is_withdrawal_ready(&self, id: u64) -> bool {
        !self.unstake_completed.get(&id).unwrap_or(true) 
            && self.env().get_block_time() >= self.unstake_unlock.get(&id).unwrap_or(u64::MAX)
    }

    pub fn pause(&mut self) { self.assert_owner(); self.paused.set(true); }
    pub fn unpause(&mut self) { self.assert_owner(); self.paused.set(false); }

    fn assert_owner(&self) {
        assert!(self.env().caller() == self.owner.get().unwrap(), "Not owner");
    }
}