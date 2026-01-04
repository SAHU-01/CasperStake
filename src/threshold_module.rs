//! Threshold Module - Multi-Sig for Large Withdrawals

use odra::prelude::*;

#[odra::event]
pub struct WithdrawRequested {
    pub request_id: u64,
    pub requester: Address,
    pub amount: u64,
}

#[odra::event]
pub struct WithdrawApproved {
    pub request_id: u64,
    pub guardian: Address,
    pub approvals: u8,
}

#[odra::event]
pub struct WithdrawExecuted {
    pub request_id: u64,
    pub amount: u64,
}

pub const PENDING: u8 = 0;
pub const APPROVED: u8 = 1;
pub const EXECUTED: u8 = 2;

#[odra::module]
pub struct ThresholdModule {
    owner: Var<Address>,
    threshold: Var<u8>,
    guardians: Mapping<Address, bool>,
    guardian_list: Var<Vec<Address>>,
    guardian_count: Var<u8>,
    request_requester: Mapping<u64, Address>,
    request_amount: Mapping<u64, u64>,
    request_expires: Mapping<u64, u64>,
    request_approvals: Mapping<u64, u8>,
    request_status: Mapping<u64, u8>,
    guardian_approved: Mapping<(u64, Address), bool>,
    next_request_id: Var<u64>,
}

#[odra::module]
impl ThresholdModule {
    pub fn init(&mut self) {
        let caller = self.env().caller();
        self.owner.set(caller.clone());
        self.threshold.set(1);
        self.guardians.set(&caller, true);
        self.guardian_list.set(vec![caller]);
        self.guardian_count.set(1);
        self.next_request_id.set(0);
    }

    pub fn request_withdraw(&mut self, amount: u64) -> u64 {
        let caller = self.env().caller();
        let id = self.next_request_id.get_or_default();
        let expires = self.env().get_block_time() + 86_400_000;

        self.request_requester.set(&id, caller);
        self.request_amount.set(&id, amount);
        self.request_expires.set(&id, expires);
        self.request_approvals.set(&id, 0);
        self.request_status.set(&id, PENDING);
        self.next_request_id.set(id + 1);

        self.env().emit_event(WithdrawRequested { request_id: id, requester: caller, amount });
        id
    }

    pub fn approve(&mut self, request_id: u64) {
        let caller = self.env().caller();
        assert!(self.guardians.get(&caller).unwrap_or(false), "Not guardian");
        assert!(self.request_status.get(&request_id).unwrap_or(99) == PENDING, "Not pending");
        assert!(self.env().get_block_time() < self.request_expires.get(&request_id).unwrap_or(0), "Expired");
        assert!(!self.guardian_approved.get(&(request_id, caller)).unwrap_or(false), "Already approved");

        self.guardian_approved.set(&(request_id, caller), true);
        let approvals = self.request_approvals.get(&request_id).unwrap_or(0) + 1;
        self.request_approvals.set(&request_id, approvals);

        if approvals >= self.threshold.get_or_default() {
            self.request_status.set(&request_id, APPROVED);
        }

        self.env().emit_event(WithdrawApproved { request_id, guardian: caller, approvals });
    }

    pub fn execute(&mut self, request_id: u64) {
        let caller = self.env().caller();
        let requester = self.request_requester.get(&request_id).expect("Not found");
        assert!(requester == caller, "Not requester");
        assert!(self.request_status.get(&request_id).unwrap_or(0) == APPROVED, "Not approved");
        assert!(self.env().get_block_time() < self.request_expires.get(&request_id).unwrap_or(0), "Expired");

        self.request_status.set(&request_id, EXECUTED);
        let amount = self.request_amount.get(&request_id).unwrap_or(0);
        self.env().emit_event(WithdrawExecuted { request_id, amount });
    }

    pub fn is_guardian(&self, addr: Address) -> bool { self.guardians.get(&addr).unwrap_or(false) }
    pub fn get_guardians(&self) -> Vec<Address> { self.guardian_list.get_or_default() }
    pub fn get_config(&self) -> (u8, u8) { (self.threshold.get_or_default(), self.guardian_count.get_or_default()) }
    pub fn get_approval_count(&self, id: u64) -> u8 { self.request_approvals.get(&id).unwrap_or(0) }
    pub fn get_request_status(&self, id: u64) -> u8 { self.request_status.get(&id).unwrap_or(0) }
    pub fn is_ready(&self, id: u64) -> bool {
        self.request_status.get(&id).unwrap_or(0) == APPROVED 
            && self.env().get_block_time() < self.request_expires.get(&id).unwrap_or(0)
    }
}

