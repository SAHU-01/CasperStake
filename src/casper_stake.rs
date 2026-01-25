// //! CasperStake v11 - Liquid Staking with CEP-18 Token Minting
// //!
// //! This version mints actual csCSPR tokens visible on explorer

// use odra::prelude::*;
// use odra::casper_types::{U256, U512};
// use odra::ContractRef;

// // External reference to token contract for cross-contract calls
// #[odra::external_contract]
// pub trait CsCSPRTokenExt {
//     fn mint(&mut self, to: Address, amount: U256);
//     fn burn(&mut self, from: Address, amount: U256);
//     fn balance_of(&self, owner: Address) -> U256;
// }

// #[odra::event]
// pub struct Staked {
//     pub user: Address,
//     pub validator: String,
//     pub cspr_amount: U512,
//     pub cscspr_minted: U256,
//     pub exchange_rate: U256,
// }

// #[odra::event]
// pub struct UnstakeRequested {
//     pub user: Address,
//     pub cscspr_amount: U256,
//     pub cspr_amount: U512,
//     pub request_id: u64,
//     pub unlock_time: u64,
// }

// #[odra::event]
// pub struct Withdrawn {
//     pub user: Address,
//     pub cspr_amount: U512,
//     pub request_id: u64,
// }

// #[odra::event]
// pub struct RewardsDistributed {
//     pub amount: U512,
//     pub new_exchange_rate: U256,
// }

// #[odra::odra_type]
// pub struct UnstakeRequest {
//     pub user: Address,
//     pub cscspr_amount: U256,
//     pub cspr_amount: U512,
//     pub unlock_time: u64,
//     pub completed: bool,
// }

// const RATE_PRECISION: u128 = 1_000_000_000_000_000_000;

// #[odra::module(events = [Staked, UnstakeRequested, Withdrawn, RewardsDistributed])]
// pub struct CasperStake {
//     owner: Var<Address>,
//     paused: Var<bool>,
//     total_cspr_pooled: Var<U512>,
//     total_cscspr_supply: Var<U256>,
//     exchange_rate: Var<U256>,
//     unstake_requests: Mapping<u64, UnstakeRequest>,
//     next_unstake_id: Var<u64>,
//     unbonding_period: Var<u64>,
//     reserved_for_unstakes: Var<U512>,
//     user_validator: Mapping<Address, String>,
//     // Address of the csCSPR token contract
//     cscspr_token: Var<Address>,
// }

// #[odra::module]
// impl CasperStake {
//     pub fn init(&mut self, cscspr_token_address: Address) {
//         self.owner.set(self.env().caller());
//         self.paused.set(false);
//         self.total_cspr_pooled.set(U512::zero());
//         self.total_cscspr_supply.set(U256::zero());
//         self.exchange_rate.set(U256::from(RATE_PRECISION));
//         self.next_unstake_id.set(0);
//         self.unbonding_period.set(14 * 60 * 60 * 1000);
//         self.reserved_for_unstakes.set(U512::zero());
//         self.cscspr_token.set(cscspr_token_address);
//     }

//     /// Stake CSPR and receive csCSPR tokens (minted to your wallet)
//     pub fn stake(&mut self, validator: String, amount: U512) {
//         assert!(!self.paused.get_or_default(), "Contract paused");
//         assert!(amount > U512::zero(), "Amount must be > 0");

//         let caller = self.env().caller();
//         let exchange_rate = self.exchange_rate.get_or_default();
//         let cspr_u256 = u512_to_u256(amount);
//         let cscspr_to_mint = (cspr_u256 * U256::from(RATE_PRECISION)) / exchange_rate;
//         assert!(cscspr_to_mint > U256::zero(), "Amount too small");

//         // Store validator preference
//         if !validator.is_empty() {
//             self.user_validator.set(&caller, validator.clone());
//         }

//         // Update totals
//         let current_pooled = self.total_cspr_pooled.get_or_default();
//         self.total_cspr_pooled.set(current_pooled + amount);

//         let current_supply = self.total_cscspr_supply.get_or_default();
//         self.total_cscspr_supply.set(current_supply + cscspr_to_mint);

//         // MINT csCSPR tokens to user via cross-contract call
//         let token_address = self.cscspr_token.get().expect("Token not set");
//         CsCSPRTokenExtContractRef::new(self.env(), token_address).mint(caller, cscspr_to_mint);

//         self.env().emit_event(Staked {
//             user: caller,
//             validator,
//             cspr_amount: amount,
//             cscspr_minted: cscspr_to_mint,
//             exchange_rate,
//         });
//     }

//     /// Request unstake - burns csCSPR tokens, starts unbonding period
//     pub fn request_unstake(&mut self, cscspr_amount: U256) -> u64 {
//         assert!(!self.paused.get_or_default(), "Contract paused");
//         assert!(cscspr_amount > U256::zero(), "Amount must be > 0");

//         let caller = self.env().caller();

//         // BURN csCSPR tokens from user via cross-contract call
//         let token_address = self.cscspr_token.get().expect("Token not set");
//         CsCSPRTokenExtContractRef::new(self.env(), token_address).burn(caller, cscspr_amount);

//         let exchange_rate = self.exchange_rate.get_or_default();
//         let cspr_to_return_u256 = (cscspr_amount * exchange_rate) / U256::from(RATE_PRECISION);
//         let cspr_to_return = u256_to_u512(cspr_to_return_u256);

//         let unbonding_period = self.unbonding_period.get_or_default();
//         let unlock_time = self.env().get_block_time() + unbonding_period;

//         let request_id = self.next_unstake_id.get_or_default();
//         self.next_unstake_id.set(request_id + 1);

//         let request = UnstakeRequest {
//             user: caller,
//             cscspr_amount,
//             cspr_amount: cspr_to_return,
//             unlock_time,
//             completed: false,
//         };
//         self.unstake_requests.set(&request_id, request);

//         let current_supply = self.total_cscspr_supply.get_or_default();
//         self.total_cscspr_supply.set(current_supply.saturating_sub(cscspr_amount));

//         let current_reserved = self.reserved_for_unstakes.get_or_default();
//         self.reserved_for_unstakes.set(current_reserved + cspr_to_return);

//         self.env().emit_event(UnstakeRequested {
//             user: caller,
//             cscspr_amount,
//             cspr_amount: cspr_to_return,
//             request_id,
//             unlock_time,
//         });

//         request_id
//     }

//     pub fn withdraw(&mut self, request_id: u64) {
//         assert!(!self.paused.get_or_default(), "Contract paused");

//         let caller = self.env().caller();
//         let mut request = self.unstake_requests.get(&request_id).expect("Request not found");

//         assert!(request.user == caller, "Not your request");
//         assert!(!request.completed, "Already withdrawn");
//         assert!(self.env().get_block_time() >= request.unlock_time, "Still unbonding");

//         request.completed = true;
//         self.unstake_requests.set(&request_id, request.clone());

//         let current_pooled = self.total_cspr_pooled.get_or_default();
//         self.total_cspr_pooled.set(current_pooled.saturating_sub(request.cspr_amount));

//         let current_reserved = self.reserved_for_unstakes.get_or_default();
//         self.reserved_for_unstakes.set(current_reserved.saturating_sub(request.cspr_amount));

//         self.env().transfer_tokens(&caller, &request.cspr_amount);

//         self.env().emit_event(Withdrawn {
//             user: caller,
//             cspr_amount: request.cspr_amount,
//             request_id,
//         });
//     }

//     #[odra(payable)]
//     pub fn distribute_rewards(&mut self) {
//         self.assert_owner();
//         let reward_amount = self.env().attached_value();
//         assert!(reward_amount > U512::zero(), "Must send rewards");

//         let current_pooled = self.total_cspr_pooled.get_or_default();
//         self.total_cspr_pooled.set(current_pooled + reward_amount);

//         let total_cscspr = self.total_cscspr_supply.get_or_default();
//         if total_cscspr > U256::zero() {
//             let new_total = self.total_cspr_pooled.get_or_default();
//             let new_total_u256 = u512_to_u256(new_total);
//             let new_rate = (new_total_u256 * U256::from(RATE_PRECISION)) / total_cscspr;
//             self.exchange_rate.set(new_rate);

//             self.env().emit_event(RewardsDistributed {
//                 amount: reward_amount,
//                 new_exchange_rate: new_rate,
//             });
//         }
//     }

//     pub fn set_cscspr_token(&mut self, token_address: Address) {
//         self.assert_owner();
//         self.cscspr_token.set(token_address);
//     }

//     pub fn pause(&mut self) {
//         self.assert_owner();
//         self.paused.set(true);
//     }

//     pub fn unpause(&mut self) {
//         self.assert_owner();
//         self.paused.set(false);
//     }

//     pub fn set_unbonding_period(&mut self, period_ms: u64) {
//         self.assert_owner();
//         self.unbonding_period.set(period_ms);
//     }

//     pub fn emergency_withdraw(&mut self, amount: U512, recipient: Address) {
//         self.assert_owner();
//         self.env().transfer_tokens(&recipient, &amount);
//     }

//     fn assert_owner(&self) {
//         assert!(
//             self.env().caller() == self.owner.get().expect("Owner not set"),
//             "Not owner"
//         );
//     }

//     // VIEW FUNCTIONS
//     pub fn get_total_staked(&self) -> U512 { self.total_cspr_pooled.get_or_default() }
//     pub fn get_total_cscspr_supply(&self) -> U256 { self.total_cscspr_supply.get_or_default() }
//     pub fn get_exchange_rate(&self) -> U256 { self.exchange_rate.get_or_default() }
//     pub fn get_user_validator(&self, user: Address) -> String {
//         self.user_validator.get(&user).unwrap_or_default()
//     }
//     pub fn get_unstake_request(&self, request_id: u64) -> Option<UnstakeRequest> {
//         self.unstake_requests.get(&request_id)
//     }
//     pub fn is_withdrawal_ready(&self, request_id: u64) -> bool {
//         if let Some(request) = self.unstake_requests.get(&request_id) {
//             !request.completed && self.env().get_block_time() >= request.unlock_time
//         } else { false }
//     }
//     pub fn get_unbonding_period(&self) -> u64 { self.unbonding_period.get_or_default() }
//     pub fn is_paused(&self) -> bool { self.paused.get_or_default() }
//     pub fn get_owner(&self) -> Option<Address> { self.owner.get() }
//     pub fn get_cscspr_token(&self) -> Option<Address> { self.cscspr_token.get() }
// }

// fn u512_to_u256(value: U512) -> U256 { U256::from(value.low_u128()) }
// fn u256_to_u512(value: U256) -> U512 { U512::from(value.low_u128()) }

//! CasperStake v14 - Liquid Staking with Instant Unstake
//!
//! Based on working v11 + instant_unstake feature
//! stake() takes amount parameter (NOT payable - works with frontend)
//!
//! Features:
//! - Stake CSPR → get csCSPR (CEP-18 token)
//! - Regular unstake (14hr unbonding, no fee)
//! - INSTANT unstake (immediate, 0.5% fee)

use odra::prelude::*;
use odra::casper_types::{U256, U512};
use odra::ContractRef;

#[odra::external_contract]
pub trait CsCSPRTokenExt {
    fn mint(&mut self, to: Address, amount: U256);
    fn burn(&mut self, from: Address, amount: U256);
    fn balance_of(&self, owner: Address) -> U256;
}

#[odra::event]
pub struct Staked {
    pub user: Address,
    pub validator: String,
    pub cspr_amount: U512,
    pub cscspr_minted: U256,
    pub exchange_rate: U256,
}

#[odra::event]
pub struct UnstakeRequested {
    pub user: Address,
    pub cscspr_amount: U256,
    pub cspr_amount: U512,
    pub request_id: u64,
    pub unlock_time: u64,
}

#[odra::event]
pub struct InstantUnstaked {
    pub user: Address,
    pub cscspr_burned: U256,
    pub cspr_returned: U512,
    pub fee: U512,
}

#[odra::event]
pub struct Withdrawn {
    pub user: Address,
    pub cspr_amount: U512,
    pub request_id: u64,
}

#[odra::event]
pub struct RewardsDistributed {
    pub amount: U512,
    pub new_exchange_rate: U256,
}

#[odra::odra_type]
pub struct UnstakeRequest {
    pub user: Address,
    pub cscspr_amount: U256,
    pub cspr_amount: U512,
    pub unlock_time: u64,
    pub completed: bool,
}

const RATE_PRECISION: u128 = 1_000_000_000_000_000_000;
const INSTANT_UNSTAKE_FEE_BPS: u64 = 50; // 0.5% = 50 basis points

#[odra::module(events = [Staked, UnstakeRequested, InstantUnstaked, Withdrawn, RewardsDistributed])]
pub struct CasperStake {
    owner: Var<Address>,
    paused: Var<bool>,
    total_cspr_pooled: Var<U512>,
    total_cscspr_supply: Var<U256>,
    exchange_rate: Var<U256>,
    unstake_requests: Mapping<u64, UnstakeRequest>,
    next_unstake_id: Var<u64>,
    unbonding_period: Var<u64>,
    reserved_for_unstakes: Var<U512>,
    user_validator: Mapping<Address, String>,
    cscspr_token: Var<Address>,
}

#[odra::module]
impl CasperStake {
    /// Initialize - token set separately via set_cscspr_token
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
        self.paused.set(false);
        self.total_cspr_pooled.set(U512::zero());
        self.total_cscspr_supply.set(U256::zero());
        self.exchange_rate.set(U256::from(RATE_PRECISION));
        self.next_unstake_id.set(0);
        self.unbonding_period.set(14 * 60 * 60 * 1000); // 14 hours
        self.reserved_for_unstakes.set(U512::zero());
    }

    /// Stake CSPR and receive csCSPR tokens
    /// amount parameter = how much CSPR to stake (passed via payment)
    pub fn stake(&mut self, validator: String, amount: U512) {
        assert!(!self.paused.get_or_default(), "Contract paused");
        assert!(amount > U512::zero(), "Amount must be > 0");

        let caller = self.env().caller();
        let exchange_rate = self.exchange_rate.get_or_default();
        let cspr_u256 = u512_to_u256(amount);
        let cscspr_to_mint = (cspr_u256 * U256::from(RATE_PRECISION)) / exchange_rate;
        assert!(cscspr_to_mint > U256::zero(), "Amount too small");

        // Store validator preference
        if !validator.is_empty() {
            self.user_validator.set(&caller, validator.clone());
        }

        // Update totals
        let current_pooled = self.total_cspr_pooled.get_or_default();
        self.total_cspr_pooled.set(current_pooled + amount);

        let current_supply = self.total_cscspr_supply.get_or_default();
        self.total_cscspr_supply.set(current_supply + cscspr_to_mint);

        // MINT csCSPR tokens to user
        let token_address = self.cscspr_token.get().expect("Token not set");
        CsCSPRTokenExtContractRef::new(self.env(), token_address).mint(caller, cscspr_to_mint);

        self.env().emit_event(Staked {
            user: caller,
            validator,
            cspr_amount: amount,
            cscspr_minted: cscspr_to_mint,
            exchange_rate,
        });
    }

    /// Request unstake - burns csCSPR, starts unbonding (no fee)
    pub fn request_unstake(&mut self, cscspr_amount: U256) -> u64 {
        assert!(!self.paused.get_or_default(), "Contract paused");
        assert!(cscspr_amount > U256::zero(), "Amount must be > 0");

        let caller = self.env().caller();

        // BURN csCSPR tokens
        let token_address = self.cscspr_token.get().expect("Token not set");
        CsCSPRTokenExtContractRef::new(self.env(), token_address).burn(caller, cscspr_amount);

        let exchange_rate = self.exchange_rate.get_or_default();
        let cspr_to_return_u256 = (cscspr_amount * exchange_rate) / U256::from(RATE_PRECISION);
        let cspr_to_return = u256_to_u512(cspr_to_return_u256);

        let unbonding_period = self.unbonding_period.get_or_default();
        let unlock_time = self.env().get_block_time() + unbonding_period;

        let request_id = self.next_unstake_id.get_or_default();
        self.next_unstake_id.set(request_id + 1);

        let request = UnstakeRequest {
            user: caller,
            cscspr_amount,
            cspr_amount: cspr_to_return,
            unlock_time,
            completed: false,
        };
        self.unstake_requests.set(&request_id, request);

        let current_supply = self.total_cscspr_supply.get_or_default();
        self.total_cscspr_supply.set(current_supply.saturating_sub(cscspr_amount));

        let current_reserved = self.reserved_for_unstakes.get_or_default();
        self.reserved_for_unstakes.set(current_reserved + cspr_to_return);

        self.env().emit_event(UnstakeRequested {
            user: caller,
            cscspr_amount,
            cspr_amount: cspr_to_return,
            request_id,
            unlock_time,
        });

        request_id
    }

    /// INSTANT UNSTAKE - burns csCSPR, returns CSPR immediately with 0.5% fee
    pub fn instant_unstake(&mut self, cscspr_amount: U256) {
        assert!(!self.paused.get_or_default(), "Contract paused");
        assert!(cscspr_amount > U256::zero(), "Amount must be > 0");

        let caller = self.env().caller();

        // BURN csCSPR tokens
        let token_address = self.cscspr_token.get().expect("Token not set");
        CsCSPRTokenExtContractRef::new(self.env(), token_address).burn(caller, cscspr_amount);

        // Calculate CSPR value
        let exchange_rate = self.exchange_rate.get_or_default();
        let cspr_value_u256 = (cscspr_amount * exchange_rate) / U256::from(RATE_PRECISION);
        
        // Apply 0.5% fee
        let cspr_after_fee_u256 = (cspr_value_u256 * U256::from(10000u64 - INSTANT_UNSTAKE_FEE_BPS)) / U256::from(10000u64);
        let cspr_to_return = u256_to_u512(cspr_after_fee_u256);
        
        let fee_u256 = cspr_value_u256.saturating_sub(cspr_after_fee_u256);
        let fee = u256_to_u512(fee_u256);

        // Check liquidity
        let total_pooled = self.total_cspr_pooled.get_or_default();
        let reserved = self.reserved_for_unstakes.get_or_default();
        let available = total_pooled.saturating_sub(reserved);
        assert!(cspr_to_return <= available, "Insufficient liquidity");

        // Update totals
        let current_supply = self.total_cscspr_supply.get_or_default();
        self.total_cscspr_supply.set(current_supply.saturating_sub(cscspr_amount));
        self.total_cspr_pooled.set(total_pooled.saturating_sub(cspr_to_return));

        // Transfer CSPR immediately
        self.env().transfer_tokens(&caller, &cspr_to_return);

        self.env().emit_event(InstantUnstaked {
            user: caller,
            cscspr_burned: cscspr_amount,
            cspr_returned: cspr_to_return,
            fee,
        });
    }

    pub fn withdraw(&mut self, request_id: u64) {
        assert!(!self.paused.get_or_default(), "Contract paused");

        let caller = self.env().caller();
        let mut request = self.unstake_requests.get(&request_id).expect("Request not found");

        assert!(request.user == caller, "Not your request");
        assert!(!request.completed, "Already withdrawn");
        assert!(self.env().get_block_time() >= request.unlock_time, "Still unbonding");

        request.completed = true;
        self.unstake_requests.set(&request_id, request.clone());

        let current_pooled = self.total_cspr_pooled.get_or_default();
        self.total_cspr_pooled.set(current_pooled.saturating_sub(request.cspr_amount));

        let current_reserved = self.reserved_for_unstakes.get_or_default();
        self.reserved_for_unstakes.set(current_reserved.saturating_sub(request.cspr_amount));

        self.env().transfer_tokens(&caller, &request.cspr_amount);

        self.env().emit_event(Withdrawn {
            user: caller,
            cspr_amount: request.cspr_amount,
            request_id,
        });
    }

    #[odra(payable)]
    pub fn distribute_rewards(&mut self) {
        self.assert_owner();
        let reward_amount = self.env().attached_value();
        assert!(reward_amount > U512::zero(), "Must send rewards");

        let current_pooled = self.total_cspr_pooled.get_or_default();
        self.total_cspr_pooled.set(current_pooled + reward_amount);

        let total_cscspr = self.total_cscspr_supply.get_or_default();
        if total_cscspr > U256::zero() {
            let new_total = self.total_cspr_pooled.get_or_default();
            let new_total_u256 = u512_to_u256(new_total);
            let new_rate = (new_total_u256 * U256::from(RATE_PRECISION)) / total_cscspr;
            self.exchange_rate.set(new_rate);

            self.env().emit_event(RewardsDistributed {
                amount: reward_amount,
                new_exchange_rate: new_rate,
            });
        }
    }

    /// Owner can add liquidity for instant unstakes
    #[odra(payable)]
    pub fn add_liquidity(&mut self) {
        self.assert_owner();
        let amount = self.env().attached_value();
        assert!(amount > U512::zero(), "Must send CSPR");
        
        let current_pooled = self.total_cspr_pooled.get_or_default();
        self.total_cspr_pooled.set(current_pooled + amount);
    }

    pub fn set_cscspr_token(&mut self, token_address: Address) {
        self.assert_owner();
        self.cscspr_token.set(token_address);
    }

    pub fn pause(&mut self) {
        self.assert_owner();
        self.paused.set(true);
    }

    pub fn unpause(&mut self) {
        self.assert_owner();
        self.paused.set(false);
    }

    pub fn set_unbonding_period(&mut self, period_ms: u64) {
        self.assert_owner();
        self.unbonding_period.set(period_ms);
    }

    pub fn emergency_withdraw(&mut self, amount: U512, recipient: Address) {
        self.assert_owner();
        self.env().transfer_tokens(&recipient, &amount);
    }

    fn assert_owner(&self) {
        assert!(
            self.env().caller() == self.owner.get().expect("Owner not set"),
            "Not owner"
        );
    }

    // VIEW FUNCTIONS
    pub fn get_total_staked(&self) -> U512 { self.total_cspr_pooled.get_or_default() }
    pub fn get_total_cscspr_supply(&self) -> U256 { self.total_cscspr_supply.get_or_default() }
    pub fn get_exchange_rate(&self) -> U256 { self.exchange_rate.get_or_default() }
    pub fn get_available_liquidity(&self) -> U512 {
        let total = self.total_cspr_pooled.get_or_default();
        let reserved = self.reserved_for_unstakes.get_or_default();
        total.saturating_sub(reserved)
    }
    pub fn get_instant_unstake_fee(&self) -> u64 { INSTANT_UNSTAKE_FEE_BPS }
    pub fn get_user_validator(&self, user: Address) -> String {
        self.user_validator.get(&user).unwrap_or_default()
    }
    pub fn get_unstake_request(&self, request_id: u64) -> Option<UnstakeRequest> {
        self.unstake_requests.get(&request_id)
    }
    pub fn is_withdrawal_ready(&self, request_id: u64) -> bool {
        if let Some(request) = self.unstake_requests.get(&request_id) {
            !request.completed && self.env().get_block_time() >= request.unlock_time
        } else { false }
    }
    pub fn get_unbonding_period(&self) -> u64 { self.unbonding_period.get_or_default() }
    pub fn is_paused(&self) -> bool { self.paused.get_or_default() }
    pub fn get_owner(&self) -> Option<Address> { self.owner.get() }
    pub fn get_cscspr_token(&self) -> Option<Address> { self.cscspr_token.get() }
}

fn u512_to_u256(value: U512) -> U256 { U256::from(value.low_u128()) }
fn u256_to_u512(value: U256) -> U512 { U512::from(value.low_u128()) }