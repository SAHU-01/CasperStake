//! csCSPR Token - Liquid Staking Token

use odra::prelude::*;

#[odra::event]
pub struct Transfer {
    pub from: Option<Address>,
    pub to: Option<Address>,
    pub amount: u64,
}

#[odra::event]
pub struct Approval {
    pub owner: Address,
    pub spender: Address,
    pub amount: u64,
}

#[odra::module]
pub struct CsCSPRToken {
    name: Var<String>,
    symbol: Var<String>,
    decimals: Var<u8>,
    total_supply: Var<u64>,
    balances: Mapping<Address, u64>,
    allowances: Mapping<(Address, Address), u64>,
    minter: Var<Address>,
    owner: Var<Address>,
}

#[odra::module]
impl CsCSPRToken {
    pub fn init(&mut self) {
        self.name.set(String::from("CasperStake Liquid CSPR"));
        self.symbol.set(String::from("csCSPR"));
        self.decimals.set(9);
        self.total_supply.set(0);
        self.minter.set(self.env().caller());
        self.owner.set(self.env().caller());
    }

    pub fn name(&self) -> String { self.name.get_or_default() }
    pub fn symbol(&self) -> String { self.symbol.get_or_default() }
    pub fn decimals(&self) -> u8 { self.decimals.get_or_default() }
    pub fn total_supply(&self) -> u64 { self.total_supply.get_or_default() }
    pub fn balance_of(&self, account: Address) -> u64 { self.balances.get(&account).unwrap_or(0) }
    pub fn allowance(&self, owner: Address, spender: Address) -> u64 { 
        self.allowances.get(&(owner, spender)).unwrap_or(0) 
    }

    pub fn transfer(&mut self, to: Address, amount: u64) -> bool {
        let from = self.env().caller();
        self.do_transfer(from, to, amount);
        true
    }

    pub fn approve(&mut self, spender: Address, amount: u64) -> bool {
        let owner = self.env().caller();
        self.allowances.set(&(owner, spender), amount);
        self.env().emit_event(Approval { owner, spender, amount });
        true
    }

    pub fn transfer_from(&mut self, from: Address, to: Address, amount: u64) -> bool {
        let spender = self.env().caller();
        let allowance = self.allowance(from, spender);
        assert!(allowance >= amount, "Insufficient allowance");
        self.allowances.set(&(from, spender), allowance - amount);
        self.do_transfer(from, to, amount);
        true
    }

    pub fn mint(&mut self, to: Address, amount: u64) {
        assert!(self.env().caller() == self.minter.get().unwrap(), "Not minter");
        let bal = self.balances.get(&to).unwrap_or(0);
        self.balances.set(&to, bal + amount);
        let supply = self.total_supply.get_or_default();
        self.total_supply.set(supply + amount);
        self.env().emit_event(Transfer { from: None, to: Some(to), amount });
    }

    pub fn burn(&mut self, from: Address, amount: u64) {
        assert!(self.env().caller() == self.minter.get().unwrap(), "Not minter");
        let bal = self.balances.get(&from).unwrap_or(0);
        assert!(bal >= amount, "Insufficient balance");
        self.balances.set(&from, bal - amount);
        let supply = self.total_supply.get_or_default();
        self.total_supply.set(supply - amount);
        self.env().emit_event(Transfer { from: Some(from), to: None, amount });
    }

    fn do_transfer(&mut self, from: Address, to: Address, amount: u64) {
        let from_bal = self.balances.get(&from).unwrap_or(0);
        assert!(from_bal >= amount, "Insufficient balance");
        self.balances.set(&from, from_bal - amount);
        let to_bal = self.balances.get(&to).unwrap_or(0);
        self.balances.set(&to, to_bal + amount);
        self.env().emit_event(Transfer { from: Some(from), to: Some(to), amount });
    }
}

