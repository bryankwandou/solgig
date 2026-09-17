//! End-to-end tests against the compiled SBF binary (run `cargo build-sbf`
//! first). Every instruction is exercised on its happy path and on the
//! failures that guard it.

use mollusk_svm::{program::keyed_account_for_system_program, Mollusk};
use solana_account::Account;
use solana_instruction::{error::InstructionError, AccountMeta, Instruction};
use solana_pubkey::Pubkey;

const SYSTEM: Pubkey = Pubkey::new_from_array([0; 32]);
const LOADER_V3: Pubkey = Pubkey::from_str_const("BPFLoaderUpgradeab1e11111111111111111111111");
const SOL: u64 = 1_000_000_000;
const FEE_BPS: u16 = 250; // 2.5 %
const NOW: i64 = 1_800_000_000;

// Error codes (src/error.rs)
const ALREADY_INITIALIZED: u32 = 6002;
const MISSING_SIGNER: u32 = 6003;
const WRONG_OWNER: u32 = 6005;
const INVALID_PDA: u32 = 6006;
const UNAUTHORIZED: u32 = 6007;
const FEE_TOO_HIGH: u32 = 6008;
const PAUSED: u32 = 6009;
const ZERO_AMOUNT: u32 = 6010;
const TREASURY_MISMATCH: u32 = 6011;
const PARTY_MISMATCH: u32 = 6012;
const DEADLINE_IN_PAST: u32 = 6013;
const DEADLINE_NOT_REACHED: u32 = 6014;
const INVALID_SHARE: u32 = 6015;
const NOT_UPGRADE_AUTHORITY: u32 = 6017;
const SELF_DEAL: u32 = 6018;

struct Env {
    m: Mollusk,
    pid: Pubkey,
    authority: Pubkey,
    treasury: Pubkey,
    buyer: Pubkey,
    seller: Pubkey,
    config: Pubkey,
    accounts: Vec<(Pubkey, Account)>,
}

fn wallet(lamports: u64) -> Account {
    Account::new(lamports, 0, &SYSTEM)
}

fn rent(len: usize) -> u64 {
    Mollusk::default().sysvars.rent.minimum_balance(len)
}

fn config_args(paused: u8, fee: u16, admin: &Pubkey, treasury: &Pubkey) -> Vec<u8> {
    let mut v = vec![paused];
    v.extend_from_slice(&fee.to_le_bytes());
    v.extend_from_slice(&[0, 0]);
    v.extend_from_slice(admin.as_ref());
    v.extend_from_slice(treasury.as_ref());
    v
}

fn order_id(n: u8) -> [u8; 16] {
    [n; 16]
}

impl Env {
    fn new() -> Self {
        let pid = Pubkey::new_unique();
        let mut m = Mollusk::default();
        let elf = include_bytes!("../../target/deploy/solgig_escrow.so");
        m.add_program_with_loader_and_elf(&pid, &LOADER_V3, elf);
        m.sysvars.clock.unix_timestamp = NOW;
        let authority = Pubkey::new_unique();
        let treasury = Pubkey::new_unique();
        let buyer = Pubkey::new_unique();
        let seller = Pubkey::new_unique();
        let config = Pubkey::find_program_address(&[b"config"], &pid).0;
        let (program_data, _) = Pubkey::find_program_address(&[pid.as_ref()], &LOADER_V3);
        let mut pd = vec![3, 0, 0, 0];
        pd.extend_from_slice(&0u64.to_le_bytes());
        pd.push(1);
        pd.extend_from_slice(authority.as_ref());
        let accounts = vec![
            (authority, wallet(10 * SOL)),
            (treasury, wallet(0)),
            (buyer, wallet(100 * SOL)),
            (seller, wallet(SOL)),
            (config, wallet(0)),
            (program_data, Account { lamports: rent(pd.len()), data: pd, owner: LOADER_V3, executable: false, rent_epoch: 0 }),
            keyed_account_for_system_program(),
        ];
        Env { m, pid, authority, treasury, buyer, seller, config, accounts }
    }

    fn program_data(&self) -> Pubkey {
        Pubkey::find_program_address(&[self.pid.as_ref()], &LOADER_V3).0
    }

    fn get(&self, k: &Pubkey) -> Account {
        self.accounts.iter().find(|(p, _)| p == k).map(|(_, a)| a.clone()).unwrap_or_else(|| wallet(0))
    }

    fn lamports(&self, k: &Pubkey) -> u64 {
        self.get(k).lamports
    }

    fn put(&mut self, k: Pubkey, a: Account) {
        match self.accounts.iter_mut().find(|(p, _)| *p == k) {
            Some(slot) => slot.1 = a,
            None => self.accounts.push((k, a)),
        }
    }

    /// Run `ix`; on success keep the resulting state. Returns the raw result.
    fn run(&mut self, ix: Instruction) -> Result<(), InstructionError> {
        for meta in &ix.accounts {
            if !self.accounts.iter().any(|(p, _)| *p == meta.pubkey) {
                self.accounts.push((meta.pubkey, wallet(0)));
            }
        }
        let res = self.m.process_instruction(&ix, &self.accounts);
        if res.raw_result.is_ok() {
            for (k, a) in res.resulting_accounts {
                self.put(k, a);
            }
        }
        res.raw_result
    }

    fn init_ix(&self, signer: Pubkey, args: Vec<u8>) -> Instruction {
        let mut data = vec![0];
        data.extend(args);
        Instruction::new_with_bytes(
            self.pid,
            &data,
            vec![
                AccountMeta::new(signer, true),
                AccountMeta::new(self.config, false),
                AccountMeta::new_readonly(self.program_data(), false),
                AccountMeta::new_readonly(SYSTEM, false),
            ],
        )
    }

    fn init(&mut self) {
        let ix = self.init_ix(self.authority, config_args(0, FEE_BPS, &self.authority, &self.treasury));
        self.run(ix).unwrap();
    }

    fn update_ix(&self, signer: Pubkey, args: Vec<u8>) -> Instruction {
        let mut data = vec![1];
        data.extend(args);
        Instruction::new_with_bytes(
            self.pid,
            &data,
            vec![AccountMeta::new_readonly(signer, true), AccountMeta::new(self.config, false)],
        )
    }

    fn receipt(&self, id: [u8; 16]) -> Pubkey {
        Pubkey::find_program_address(&[b"receipt", &id], &self.pid).0
    }

    fn escrow(&self, id: [u8; 16]) -> Pubkey {
        Pubkey::find_program_address(&[b"escrow", &id], &self.pid).0
    }

    fn purchase_ix(&self, id: [u8; 16], amount: u64, treasury: Pubkey) -> Instruction {
        let mut data = vec![2];
        data.extend_from_slice(&id);
        data.extend_from_slice(&amount.to_le_bytes());
        Instruction::new_with_bytes(
            self.pid,
            &data,
            vec![
                AccountMeta::new(self.buyer, true),
                AccountMeta::new(self.seller, false),
                AccountMeta::new(treasury, false),
                AccountMeta::new_readonly(self.config, false),
                AccountMeta::new(self.receipt(id), false),
                AccountMeta::new_readonly(SYSTEM, false),
            ],
        )
    }

    fn open_ix(&self, id: [u8; 16], amount: u64, deadline: i64) -> Instruction {
        let mut data = vec![3];
        data.extend_from_slice(&id);
        data.extend_from_slice(&amount.to_le_bytes());
        data.extend_from_slice(&deadline.to_le_bytes());
        Instruction::new_with_bytes(
            self.pid,
            &data,
            vec![
                AccountMeta::new(self.buyer, true),
                AccountMeta::new_readonly(self.seller, false),
                AccountMeta::new_readonly(self.config, false),
                AccountMeta::new(self.escrow(id), false),
                AccountMeta::new_readonly(SYSTEM, false),
            ],
        )
    }

    fn release_ix(&self, id: [u8; 16], buyer_signs: bool) -> Instruction {
        Instruction::new_with_bytes(
            self.pid,
            &[4],
            vec![
                AccountMeta::new(self.buyer, buyer_signs),
                AccountMeta::new(self.seller, false),
                AccountMeta::new(self.treasury, false),
                AccountMeta::new_readonly(self.config, false),
                AccountMeta::new(self.escrow(id), false),
            ],
        )
    }

    fn refund_ix(&self, id: [u8; 16], authority: Pubkey) -> Instruction {
        let mut metas = vec![AccountMeta::new_readonly(authority, true)];
        if authority == self.buyer {
            metas[0] = AccountMeta::new(authority, true);
        }
        metas.push(AccountMeta::new(self.buyer, authority == self.buyer));
        metas.push(AccountMeta::new(self.escrow(id), false));
        Instruction::new_with_bytes(self.pid, &[5], metas)
    }

    fn resolve_ix(&self, id: [u8; 16], admin: Pubkey, share: u16) -> Instruction {
        let mut data = vec![6];
        data.extend_from_slice(&share.to_le_bytes());
        Instruction::new_with_bytes(
            self.pid,
            &data,
            vec![
                AccountMeta::new_readonly(admin, true),
                AccountMeta::new(self.buyer, false),
                AccountMeta::new(self.seller, false),
                AccountMeta::new(self.treasury, false),
                AccountMeta::new_readonly(self.config, false),
                AccountMeta::new(self.escrow(id), false),
            ],
        )
    }
}

fn custom(code: u32) -> Result<(), InstructionError> {
    Err(InstructionError::Custom(code))
}

// ------------------------------------------------------------------ config

#[test]
fn initialize_writes_config() {
    let mut e = Env::new();
    e.init();
    let c = e.get(&e.config);
    assert_eq!(c.owner, e.pid);
    assert_eq!(c.data.len(), 72);
    assert_eq!(&c.data[0..2], &[1, 1]); // tag, version
    let bump = Pubkey::find_program_address(&[b"config"], &e.pid).1;
    assert_eq!(c.data[2], bump);
    assert_eq!(c.data[3], 0);
    assert_eq!(u16::from_le_bytes([c.data[4], c.data[5]]), FEE_BPS);
    assert_eq!(&c.data[8..40], e.authority.as_ref());
    assert_eq!(&c.data[40..72], e.treasury.as_ref());
    assert_eq!(c.lamports, rent(72));
}

#[test]
fn initialize_requires_upgrade_authority() {
    let mut e = Env::new();
    let stranger = Pubkey::new_unique();
    e.put(stranger, wallet(SOL));
    let ix = e.init_ix(stranger, config_args(0, FEE_BPS, &stranger, &stranger));
    assert_eq!(e.run(ix), custom(NOT_UPGRADE_AUTHORITY));
}

#[test]
fn initialize_rejects_fake_program_data() {
    let mut e = Env::new();
    // Right bytes, wrong owner.
    let pd = e.program_data();
    let mut acct = e.get(&pd);
    acct.owner = Pubkey::new_unique();
    e.put(pd, acct);
    let ix = e.init_ix(e.authority, config_args(0, FEE_BPS, &e.authority, &e.treasury));
    assert_eq!(e.run(ix), custom(NOT_UPGRADE_AUTHORITY));
}

#[test]
fn initialize_twice_fails() {
    let mut e = Env::new();
    e.init();
    let ix = e.init_ix(e.authority, config_args(0, FEE_BPS, &e.authority, &e.treasury));
    assert_eq!(e.run(ix), custom(ALREADY_INITIALIZED));
}

#[test]
fn initialize_rejects_high_fee() {
    let mut e = Env::new();
    let ix = e.init_ix(e.authority, config_args(0, 1_001, &e.authority, &e.treasury));
    assert_eq!(e.run(ix), custom(FEE_TOO_HIGH));
}

#[test]
fn update_by_admin_and_not_by_others() {
    let mut e = Env::new();
    e.init();
    let new_treasury = Pubkey::new_unique();
    let stranger = Pubkey::new_unique();
    e.put(stranger, wallet(SOL));

    let bad = e.update_ix(stranger, config_args(1, 0, &stranger, &stranger));
    assert_eq!(e.run(bad), custom(UNAUTHORIZED));

    let high = e.update_ix(e.authority, config_args(0, 5_000, &e.authority, &new_treasury));
    assert_eq!(e.run(high), custom(FEE_TOO_HIGH));

    let ok = e.update_ix(e.authority, config_args(1, 100, &e.authority, &new_treasury));
    e.run(ok).unwrap();
    let c = e.get(&e.config);
    assert_eq!(c.data[3], 1);
    assert_eq!(u16::from_le_bytes([c.data[4], c.data[5]]), 100);
    assert_eq!(&c.data[40..72], new_treasury.as_ref());
    assert_eq!(&c.data[0..3], &e.get(&e.config).data[0..3]);
}

#[test]
fn admin_can_hand_over() {
    let mut e = Env::new();
    e.init();
    let next = Pubkey::new_unique();
    e.put(next, wallet(SOL));
    let ix = e.update_ix(e.authority, config_args(0, FEE_BPS, &next, &e.treasury));
    e.run(ix).unwrap();
    let old = e.update_ix(e.authority, config_args(0, FEE_BPS, &e.authority, &e.treasury));
    assert_eq!(e.run(old), custom(UNAUTHORIZED));
    let new = e.update_ix(next, config_args(0, 10, &next, &e.treasury));
    e.run(new).unwrap();
}

// ---------------------------------------------------------------- purchase

#[test]
fn purchase_pays_seller_and_treasury_and_writes_receipt() {
    let mut e = Env::new();
    e.init();
    let (b0, s0) = (e.lamports(&e.buyer), e.lamports(&e.seller));
    let amount = 2 * SOL;
    let id = order_id(7);
    e.run(e.purchase_ix(id, amount, e.treasury)).unwrap();

    let fee = amount * FEE_BPS as u64 / 10_000;
    assert_eq!(e.lamports(&e.seller), s0 + amount - fee);
    assert_eq!(e.lamports(&e.treasury), fee);
    assert_eq!(e.lamports(&e.buyer), b0 - amount - rent(112));

    let r = e.get(&e.receipt(id));
    assert_eq!(r.owner, e.pid);
    assert_eq!(r.data[0], 2);
    assert_eq!(&r.data[8..24], &id);
    assert_eq!(&r.data[24..56], e.buyer.as_ref());
    assert_eq!(&r.data[56..88], e.seller.as_ref());
    assert_eq!(u64::from_le_bytes(r.data[88..96].try_into().unwrap()), amount);
    assert_eq!(u64::from_le_bytes(r.data[96..104].try_into().unwrap()), fee);
    assert_eq!(i64::from_le_bytes(r.data[104..112].try_into().unwrap()), NOW);
}

#[test]
fn purchase_same_order_twice_fails() {
    let mut e = Env::new();
    e.init();
    e.run(e.purchase_ix(order_id(1), SOL, e.treasury)).unwrap();
    assert_eq!(e.run(e.purchase_ix(order_id(1), SOL, e.treasury)), custom(ALREADY_INITIALIZED));
}

#[test]
fn purchase_survives_prefunded_receipt_address() {
    let mut e = Env::new();
    e.init();
    let id = order_id(9);
    // An attacker drops 1 lamport on the receipt address ahead of time.
    e.put(e.receipt(id), wallet(1));
    e.run(e.purchase_ix(id, SOL, e.treasury)).unwrap();
    assert_eq!(e.get(&e.receipt(id)).owner, e.pid);
    assert_eq!(e.lamports(&e.receipt(id)), rent(112));
}

#[test]
fn purchase_guards() {
    let mut e = Env::new();
    e.init();
    assert_eq!(e.run(e.purchase_ix(order_id(2), 0, e.treasury)), custom(ZERO_AMOUNT));
    assert_eq!(e.run(e.purchase_ix(order_id(2), SOL, Pubkey::new_unique())), custom(TREASURY_MISMATCH));

    let mut ix = e.purchase_ix(order_id(2), SOL, e.treasury);
    ix.accounts[4].pubkey = e.receipt(order_id(3));
    assert_eq!(e.run(ix), custom(INVALID_PDA));

    let mut ix = e.purchase_ix(order_id(2), SOL, e.treasury);
    ix.accounts[0].is_signer = false;
    assert_eq!(e.run(ix), custom(MISSING_SIGNER));

    let mut ix = e.purchase_ix(order_id(2), SOL, e.treasury);
    ix.accounts[1].pubkey = e.buyer;
    assert_eq!(e.run(ix), custom(SELF_DEAL));

    let pause = e.update_ix(e.authority, config_args(1, FEE_BPS, &e.authority, &e.treasury));
    e.run(pause).unwrap();
    assert_eq!(e.run(e.purchase_ix(order_id(2), SOL, e.treasury)), custom(PAUSED));
}

#[test]
fn purchase_rejects_forged_config() {
    let mut e = Env::new();
    e.init();
    // Same bytes, but owned by another program: must be refused.
    let mut forged = e.get(&e.config);
    forged.owner = Pubkey::new_unique();
    e.put(e.config, forged);
    assert_eq!(e.run(e.purchase_ix(order_id(4), SOL, e.treasury)), custom(WRONG_OWNER));
}

// ------------------------------------------------------------------ escrow

fn opened(amount: u64) -> (Env, [u8; 16]) {
    let mut e = Env::new();
    e.init();
    let id = order_id(5);
    e.run(e.open_ix(id, amount, NOW + 3_600)).unwrap();
    (e, id)
}

#[test]
fn open_escrow_locks_funds() {
    let amount = 3 * SOL;
    let (e, id) = opened(amount);
    let a = e.get(&e.escrow(id));
    assert_eq!(a.owner, e.pid);
    assert_eq!(a.lamports, rent(112) + amount);
    assert_eq!(a.data[0], 3);
    assert_eq!(u16::from_le_bytes([a.data[4], a.data[5]]), FEE_BPS);
    assert_eq!(i64::from_le_bytes(a.data[96..104].try_into().unwrap()), NOW + 3_600);
    assert_eq!(i64::from_le_bytes(a.data[104..112].try_into().unwrap()), NOW);
}

#[test]
fn open_escrow_rejects_past_deadline() {
    let mut e = Env::new();
    e.init();
    assert_eq!(e.run(e.open_ix(order_id(6), SOL, NOW)), custom(DEADLINE_IN_PAST));
}

#[test]
fn release_pays_out_and_closes() {
    let amount = 3 * SOL;
    let (mut e, id) = opened(amount);
    let (b0, s0) = (e.lamports(&e.buyer), e.lamports(&e.seller));
    e.run(e.release_ix(id, true)).unwrap();
    let fee = amount * FEE_BPS as u64 / 10_000;
    assert_eq!(e.lamports(&e.seller), s0 + amount - fee);
    assert_eq!(e.lamports(&e.treasury), fee);
    assert_eq!(e.lamports(&e.buyer), b0 + rent(112));
    let closed = e.get(&e.escrow(id));
    assert_eq!(closed.lamports, 0);
    // Closed: a second release finds nothing to pay.
    assert!(e.run(e.release_ix(id, true)).is_err());
}

#[test]
fn release_uses_fee_frozen_at_open() {
    let amount = 10 * SOL;
    let (mut e, id) = opened(amount);
    let hike = e.update_ix(e.authority, config_args(0, 1_000, &e.authority, &e.treasury));
    e.run(hike).unwrap();
    e.run(e.release_ix(id, true)).unwrap();
    assert_eq!(e.lamports(&e.treasury), amount * FEE_BPS as u64 / 10_000);
}

#[test]
fn release_needs_buyer_signature_and_right_parties() {
    let (mut e, id) = opened(SOL);
    assert_eq!(e.run(e.release_ix(id, false)), custom(UNAUTHORIZED));
    let mut ix = e.release_ix(id, true);
    ix.accounts[1].pubkey = Pubkey::new_unique();
    assert_eq!(e.run(ix), custom(PARTY_MISMATCH));
    let mut ix = e.release_ix(id, true);
    ix.accounts[2].pubkey = Pubkey::new_unique();
    assert_eq!(e.run(ix), custom(TREASURY_MISMATCH));
}

#[test]
fn seller_can_refund_any_time() {
    let amount = 2 * SOL;
    let (mut e, id) = opened(amount);
    let b0 = e.lamports(&e.buyer);
    e.run(e.refund_ix(id, e.seller)).unwrap();
    assert_eq!(e.lamports(&e.buyer), b0 + amount + rent(112));
    assert_eq!(e.lamports(&e.escrow(id)), 0);
}

#[test]
fn buyer_refund_waits_for_deadline() {
    let amount = 2 * SOL;
    let (mut e, id) = opened(amount);
    assert_eq!(e.run(e.refund_ix(id, e.buyer)), custom(DEADLINE_NOT_REACHED));
    e.m.sysvars.clock.unix_timestamp = NOW + 3_600;
    let b0 = e.lamports(&e.buyer);
    e.run(e.refund_ix(id, e.buyer)).unwrap();
    assert_eq!(e.lamports(&e.buyer), b0 + amount + rent(112));
}

#[test]
fn stranger_cannot_refund() {
    let (mut e, id) = opened(SOL);
    let stranger = Pubkey::new_unique();
    e.put(stranger, wallet(SOL));
    assert_eq!(e.run(e.refund_ix(id, stranger)), custom(UNAUTHORIZED));
}

#[test]
fn resolve_splits_by_share() {
    let amount = 4 * SOL;
    let (mut e, id) = opened(amount);
    let (b0, s0) = (e.lamports(&e.buyer), e.lamports(&e.seller));
    e.run(e.resolve_ix(id, e.authority, 2_500)).unwrap();
    let gross = amount / 4;
    let fee = gross * FEE_BPS as u64 / 10_000;
    assert_eq!(e.lamports(&e.seller), s0 + gross - fee);
    assert_eq!(e.lamports(&e.treasury), fee);
    assert_eq!(e.lamports(&e.buyer), b0 + amount - gross + rent(112));
    assert_eq!(e.lamports(&e.escrow(id)), 0);
}

#[test]
fn resolve_full_refund_and_guards() {
    let amount = SOL;
    let (mut e, id) = opened(amount);
    let stranger = Pubkey::new_unique();
    e.put(stranger, wallet(SOL));
    assert_eq!(e.run(e.resolve_ix(id, stranger, 0)), custom(UNAUTHORIZED));
    assert_eq!(e.run(e.resolve_ix(id, e.authority, 10_001)), custom(INVALID_SHARE));
    let b0 = e.lamports(&e.buyer);
    e.run(e.resolve_ix(id, e.authority, 0)).unwrap();
    assert_eq!(e.lamports(&e.buyer), b0 + amount + rent(112));
    assert_eq!(e.lamports(&e.treasury), 0);
}

#[test]
fn fee_math_is_exact_on_odd_amounts() {
    let amount = 1_234_567_891;
    let (mut e, id) = opened(amount);
    e.run(e.release_ix(id, true)).unwrap();
    assert_eq!(e.lamports(&e.treasury), (amount as u128 * FEE_BPS as u128 / 10_000) as u64);
}

#[test]
fn unknown_instruction_and_bad_lengths_fail() {
    let mut e = Env::new();
    e.init();
    let ix = Instruction::new_with_bytes(e.pid, &[9], vec![]);
    assert_eq!(e.run(ix), custom(6000));
    let mut ix = e.purchase_ix(order_id(8), SOL, e.treasury);
    ix.data.push(0);
    assert_eq!(e.run(ix), custom(6000));
}
