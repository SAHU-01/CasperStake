// //! csCSPR Token - CEP-18 Compatible Liquid Staking Token

// use odra::prelude::*;
// use odra::casper_types::U256;

// #[odra::event]
// pub struct Transfer {
//     pub from: Option<Address>,
//     pub to: Option<Address>,
//     pub amount: U256,
// }

// #[odra::event]
// pub struct Approval {
//     pub owner: Address,
//     pub spender: Address,
//     pub amount: U256,
// }

// #[odra::module(events = [Transfer, Approval])]
// pub struct CsCSPRToken {
//     name: Var<String>,
//     symbol: Var<String>,
//     decimals: Var<u8>,
//     total_supply: Var<U256>,
//     balances: Mapping<Address, U256>,
//     allowances: Mapping<(Address, Address), U256>,
//     minter: Var<Address>,
//     owner: Var<Address>,
// }

// #[odra::module]
// impl CsCSPRToken {
//     pub fn init(&mut self, minter: Address) {
//         self.name.set("CasperStake Liquid CSPR".to_string());
//         self.symbol.set("csCSPR".to_string());
//         self.decimals.set(9);
//         self.total_supply.set(U256::zero());
//         self.minter.set(minter);
//         self.owner.set(self.env().caller());
//     }

//     pub fn name(&self) -> String { self.name.get_or_default() }
//     pub fn symbol(&self) -> String { self.symbol.get_or_default() }
//     pub fn decimals(&self) -> u8 { self.decimals.get_or_default() }
//     pub fn total_supply(&self) -> U256 { self.total_supply.get_or_default() }
//     pub fn balance_of(&self, owner: Address) -> U256 {
//         self.balances.get(&owner).unwrap_or(U256::zero())
//     }
//     pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
//         self.allowances.get(&(owner, spender)).unwrap_or(U256::zero())
//     }

//     pub fn transfer(&mut self, to: Address, amount: U256) {
//         let caller = self.env().caller();
//         self.transfer_internal(caller, to, amount);
//     }

//     pub fn transfer_from(&mut self, from: Address, to: Address, amount: U256) {
//         let caller = self.env().caller();
//         let current_allowance = self.allowances.get(&(from, caller)).unwrap_or(U256::zero());
//         assert!(current_allowance >= amount, "Insufficient allowance");
//         self.allowances.set(&(from, caller), current_allowance - amount);
//         self.transfer_internal(from, to, amount);
//     }

//     pub fn approve(&mut self, spender: Address, amount: U256) {
//         let caller = self.env().caller();
//         self.allowances.set(&(caller, spender), amount);
//         self.env().emit_event(Approval { owner: caller, spender, amount });
//     }

//     pub fn mint(&mut self, to: Address, amount: U256) {
//         let minter = self.minter.get().expect("Minter not set");
//         assert!(self.env().caller() == minter, "Only minter can mint");

//         let balance = self.balances.get(&to).unwrap_or(U256::zero());
//         self.balances.set(&to, balance + amount);

//         let supply = self.total_supply.get_or_default();
//         self.total_supply.set(supply + amount);

//         self.env().emit_event(Transfer { from: None, to: Some(to), amount });
//     }

//     pub fn burn(&mut self, from: Address, amount: U256) {
//         let minter = self.minter.get().expect("Minter not set");
//         assert!(self.env().caller() == minter, "Only minter can burn");

//         let balance = self.balances.get(&from).unwrap_or(U256::zero());
//         assert!(balance >= amount, "Insufficient balance to burn");

//         self.balances.set(&from, balance - amount);

//         let supply = self.total_supply.get_or_default();
//         self.total_supply.set(supply - amount);

//         self.env().emit_event(Transfer { from: Some(from), to: None, amount });
//     }

//     pub fn set_minter(&mut self, new_minter: Address) {
//         let owner = self.owner.get().expect("Owner not set");
//         assert!(self.env().caller() == owner, "Only owner can set minter");
//         self.minter.set(new_minter);
//     }

//     pub fn get_minter(&self) -> Option<Address> { self.minter.get() }

//     fn transfer_internal(&mut self, from: Address, to: Address, amount: U256) {
//         let from_balance = self.balances.get(&from).unwrap_or(U256::zero());
//         assert!(from_balance >= amount, "Insufficient balance");

//         self.balances.set(&from, from_balance - amount);
//         let to_balance = self.balances.get(&to).unwrap_or(U256::zero());
//         self.balances.set(&to, to_balance + amount);

//         self.env().emit_event(Transfer { from: Some(from), to: Some(to), amount });
//     }
// }

//! csCSPR Token - Using Odra's standard CEP-18 for CSPR.live compatibility

use odra::prelude::*;
use odra::casper_types::U256;
use odra_modules::cep18_token::Cep18;

/// Wrapper around Odra's CEP-18 with minter control
#[odra::module]
pub struct CsCSPRToken {
    token: SubModule<Cep18>,
    minter: Var<Address>,
    owner: Var<Address>,
}

#[odra::module]
impl CsCSPRToken {
    pub fn init(&mut self, minter: Address) {
        self.token.init(
            "CasperStake Liquid CSPR".to_string(),
            "csCSPR".to_string(),
            9u8,
            U256::zero()
        );
        self.minter.set(minter);
        self.owner.set(self.env().caller());
    }

    // CEP-18 standard functions - delegate to inner token
    pub fn name(&self) -> String { self.token.name() }
    pub fn symbol(&self) -> String { self.token.symbol() }
    pub fn decimals(&self) -> u8 { self.token.decimals() }
    pub fn total_supply(&self) -> U256 { self.token.total_supply() }
    
    pub fn balance_of(&self, address: Address) -> U256 {
        self.token.balance_of(&address)
    }
    
    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.token.allowance(&owner, &spender)
    }

    pub fn transfer(&mut self, recipient: Address, amount: U256) {
        self.token.transfer(&recipient, &amount);
    }

    pub fn transfer_from(&mut self, owner: Address, recipient: Address, amount: U256) {
        self.token.transfer_from(&owner, &recipient, &amount);
    }

    pub fn approve(&mut self, spender: Address, amount: U256) {
        self.token.approve(&spender, &amount);
    }

    // Minter-only functions
    pub fn mint(&mut self, to: Address, amount: U256) {
        let minter = self.minter.get().expect("Minter not set");
        assert!(self.env().caller() == minter, "Only minter can mint");
        self.token.raw_mint(&to, &amount);
    }

    pub fn burn(&mut self, from: Address, amount: U256) {
        let minter = self.minter.get().expect("Minter not set");
        assert!(self.env().caller() == minter, "Only minter can burn");
        self.token.raw_burn(&from, &amount);
    }

    pub fn set_minter(&mut self, new_minter: Address) {
        let owner = self.owner.get().expect("Owner not set");
        assert!(self.env().caller() == owner, "Only owner can set minter");
        self.minter.set(new_minter);
    }

    pub fn get_minter(&self) -> Option<Address> { self.minter.get() }
}