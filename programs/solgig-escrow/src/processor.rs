//! Instruction handlers.
//!
//! Written for size as much as for speed: deploy rent is paid per byte of
//! the binary, so shared checks live in small out-of-line helpers and every
//! account record is assembled on the stack and written in one copy.

use core::mem::MaybeUninit;
use pinocchio::{
    cpi::{invoke_signed_unchecked, CpiAccount, Seed, Signer},
    error::ProgramError,
    instruction::{InstructionAccount, InstructionView},
    sysvars::{clock::Clock, rent::Rent, Sysvar},
    AccountView, Address, ProgramResult,
};

use crate::{error::EscrowError as E, event, ix, state::*, BPS_DENOM, MAX_FEE_BPS};

/// Internal result: a bare `u32`-sized error travels in a register, where a
/// `ProgramError` is passed through memory at every `?`. Converted once, in
/// `process_instruction`.
type R<T = ()> = Result<T, E>;

/// Scratch copy of an account record (Config uses the first 72 bytes).
type Rec = [u8; ESCROW_LEN];

/// BPFLoaderUpgradeab1e11111111111111111111111
const LOADER_ID: Address = Address::new_from_array([
    2, 168, 246, 145, 78, 136, 161, 176, 226, 16, 21, 62, 247, 99, 174, 43, 0, 194, 185, 61, 22,
    193, 36, 210, 192, 83, 122, 16, 4, 128, 0, 0,
]);

const SYS_ASSIGN: u32 = 1;
const SYS_TRANSFER: u32 = 2;
const SYS_ALLOCATE: u32 = 8;

pub fn process_instruction(program_id: &Address, accounts: &mut [AccountView], data: &[u8]) -> ProgramResult {
    dispatch(program_id, accounts, data).map_err(ProgramError::from)
}

fn dispatch(program_id: &Address, accounts: &mut [AccountView], data: &[u8]) -> R {
    let (&tag, args) = data.split_first().ok_or(E::InvalidInstruction)?;
    match tag {
        ix::INITIALIZE_CONFIG => set_config(program_id, accounts, arr(args)?, true),
        ix::UPDATE_CONFIG => set_config(program_id, accounts, arr(args)?, false),
        ix::PURCHASE => purchase(program_id, accounts, arr(args)?),
        ix::OPEN_ESCROW => open_escrow(program_id, accounts, arr(args)?),
        ix::RELEASE => settle(program_id, accounts, None, arr::<0>(args)?),
        ix::REFUND => refund(program_id, accounts, arr::<0>(args)?),
        ix::RESOLVE => {
            let (admin, rest) = accounts.split_first_mut().ok_or(E::NotEnoughAccounts)?;
            settle(program_id, rest, Some(admin), arr::<2>(args)?)
        }
        _ => Err(E::InvalidInstruction),
    }
}

// ---------------------------------------------------------------- checks

/// Instruction arguments must be exactly `N` bytes.
#[inline(always)]
fn arr<const N: usize>(a: &[u8]) -> R<&[u8; N]> {
    a.try_into().map_err(|_| E::InvalidInstruction)
}

#[inline(always)]
fn need(ok: bool, e: E) -> R {
    if ok {
        Ok(())
    } else {
        Err(e)
    }
}

#[inline(always)]
fn signer(a: &AccountView) -> R {
    need(a.is_signer(), E::MissingSigner)
}

#[inline(always)]
fn writable(a: &AccountView) -> R {
    need(a.is_writable(), E::NotWritable)
}

#[inline(always)]
fn key(a: &AccountView) -> &[u8; 32] {
    a.address().as_array()
}

/// `buf[off..off + 32] == k`
#[inline(never)]
fn same(buf: &[u8], off: usize, k: &[u8; 32]) -> bool {
    buf[off..off + 32] == k[..]
}

fn system_program(a: &AccountView) -> R {
    need(a.address() == &pinocchio_system::ID, E::WrongProgram)
}

/// `amount * bps / 10_000` without u128 (which drags ~5 KB of division
/// code into the binary). Exact for bps <= 10_000 and cannot overflow.
#[inline(never)]
fn bps_of(amount: u64, bps: u16) -> u64 {
    let b = bps.min(BPS_DENOM) as u64;
    let d = BPS_DENOM as u64;
    (amount / d) * b + (amount % d) * b / d
}

#[inline(never)]
fn now() -> R<i64> {
    Ok(Clock::get().map_err(|_| E::Runtime)?.unix_timestamp)
}

#[inline(never)]
fn emit(fields: &[&[u8]]) {
    #[cfg(any(target_os = "solana", target_arch = "bpf"))]
    unsafe {
        pinocchio::syscalls::sol_log_data(fields.as_ptr() as *const u8, fields.len() as u64);
    }
    #[cfg(not(any(target_os = "solana", target_arch = "bpf")))]
    let _ = fields;
}

// -------------------------------------------------------- system program

/// One shared System Program call instead of a typed builder per
/// instruction (each builder is compiled separately and adds to the rent).
/// `first` is the writable signer; `second`, when given, is writable.
#[inline(never)]
fn sys(kind: u32, first: &AccountView, second: Option<&AccountView>, arg: &[u8], signers: &[Signer]) -> R {
    let other = second.unwrap_or(first);
    need(!first.is_borrowed() && !other.is_borrowed(), E::AccountBorrowed)?;
    let mut data = [0u8; 36];
    data[..4].copy_from_slice(&kind.to_le_bytes());
    data[4..4 + arg.len()].copy_from_slice(arg);
    let metas = [
        InstructionAccount::writable_signer(first.address()),
        InstructionAccount::writable(other.address()),
    ];
    let n = if second.is_some() { 2 } else { 1 };
    let mut cpi = [const { MaybeUninit::<CpiAccount>::uninit() }; 2];
    CpiAccount::init_from_account_view(first, &mut cpi[0]);
    CpiAccount::init_from_account_view(other, &mut cpi[1]);
    let ix = InstructionView {
        program_id: &pinocchio_system::ID,
        accounts: &metas[..n],
        data: &data[..4 + arg.len()],
    };
    // SAFETY: both slots were initialised above and neither account is
    // borrowed. A failing CPI aborts the whole transaction.
    unsafe {
        let accts = core::slice::from_raw_parts(cpi.as_ptr() as *const CpiAccount, n);
        invoke_signed_unchecked(&ix, accts, signers);
    }
    Ok(())
}

fn transfer(from: &AccountView, to: &AccountView, lamports: u64) -> R {
    sys(SYS_TRANSFER, from, Some(to), &lamports.to_le_bytes(), &[])
}

// ------------------------------------------------------------- accounts

/// Copy a program-owned record into `buf` after checking owner, size, tag,
/// version and that the account sits at the PDA its own contents describe.
#[inline(never)]
fn load(a: &AccountView, program_id: &Address, tag: u8, buf: &mut Rec) -> R {
    need(a.owned_by(program_id), E::WrongOwner)?;
    let len = if tag == TAG_CONFIG { CONFIG_LEN } else { ESCROW_LEN };
    {
        let d = a.try_borrow().map_err(|_| E::AccountBorrowed)?;
        need(d.len() == len && d[0] == tag && d[1] == VERSION, E::InvalidAccountData)?;
        buf[..len].copy_from_slice(&d);
    }
    let bump = [buf[config::BUMP]];
    // Config lives at ["config"], orders at [seed, order_id]; an empty seed
    // adds nothing to the hash, so one call covers both.
    let (seed, id): (&[u8], &[u8]) = if tag == TAG_CONFIG {
        (SEED_CONFIG, &[])
    } else {
        (SEED_ESCROW, &buf[order::ORDER_ID..order::BUYER])
    };
    let pda = Address::create_program_address(&[seed, id, &bump], program_id);
    need(pda.as_ref() == Ok(a.address()), E::InvalidPda)
}

/// Overwrite a record that `load` already validated.
#[inline(never)]
fn store(a: &AccountView, rec: &[u8]) -> R {
    let mut a = a.clone();
    let mut d = a.try_borrow_mut().map_err(|_| E::AccountBorrowed)?;
    need(d.len() == rec.len(), E::InvalidAccountData)?;
    d.copy_from_slice(rec);
    Ok(())
}

/// Create the PDA `[seed, id]` owned by this program, holding rent plus
/// `extra` lamports, and write `rec` (tag, version and bump filled in here).
///
/// Built as transfer + allocate + assign rather than CreateAccount so that a
/// pre-funded address cannot block creation (lamport-dust DoS). Anything
/// that is not an empty system account is refused: the reinit guard.
#[inline(never)]
#[allow(clippy::too_many_arguments)]
fn create(
    payer: &AccountView,
    acct: &AccountView,
    program_id: &Address,
    tag: u8,
    seed: &[u8],
    id: &[u8],
    rec: &mut Rec,
    extra: u64,
) -> R {
    writable(acct)?;
    need(acct.owned_by(&pinocchio_system::ID) && acct.is_data_empty(), E::AlreadyInitialized)?;
    let (pda, bump) = Address::find_program_address(&[seed, id], program_id);
    need(&pda == acct.address(), E::InvalidPda)?;
    let len = match tag {
        TAG_CONFIG => CONFIG_LEN,
        TAG_RECEIPT => RECEIPT_LEN,
        _ => ESCROW_LEN,
    };
    // `len` is at most 112 bytes, so the unchecked form cannot overflow.
    let lamports = Rent::get().map_err(|_| E::Runtime)?
        .minimum_balance_unchecked(len)
        .checked_add(extra)
        .ok_or(E::Overflow)?;
    let have = acct.lamports();
    if lamports > have {
        transfer(payer, acct, lamports - have)?;
    }
    let b = [bump];
    let seeds = [Seed::from(seed), Seed::from(id), Seed::from(&b)];
    let signers = [Signer::from(&seeds)];
    sys(SYS_ALLOCATE, acct, None, &(len as u64).to_le_bytes(), &signers)?;
    sys(SYS_ASSIGN, acct, None, program_id.as_ref(), &signers)?;
    rec[0] = tag;
    rec[1] = VERSION;
    rec[config::BUMP] = bump;
    store(acct, &rec[..len])
}

#[inline(never)]
fn credit(a: &AccountView, lamports: u64) -> R {
    if lamports > 0 {
        writable(a)?;
        let v = a.lamports().checked_add(lamports).ok_or(E::Overflow)?;
        a.clone().set_lamports(v);
    }
    Ok(())
}

/// Pay `to_seller` and `to_treasury` out of the escrow, everything left
/// (unpaid amount + rent) to the buyer, then close the escrow.
#[inline(never)]
fn payout_and_close(escrow: &AccountView, buyer: &AccountView, seller: &AccountView, treasury: &AccountView, to_seller: u64, to_treasury: u64) -> R {
    let rest = escrow
        .lamports()
        .checked_sub(to_seller)
        .and_then(|v| v.checked_sub(to_treasury))
        .ok_or(E::Overflow)?;
    escrow.clone().set_lamports(0);
    credit(seller, to_seller)?;
    credit(treasury, to_treasury)?;
    credit(buyer, rest)?;
    escrow.clone().close().map_err(|_| E::AccountBorrowed)
}

// ---------------------------------------------------------- instructions

/// 0 InitializeConfig: [upgrade_authority(s,w), config(w), program_data, system]
/// 1 UpdateConfig:     [admin(s), config(w)]
///   args (69 bytes, the config record from offset 3):
///   paused u8, fee_bps u16, pad [0;2], admin 32, treasury 32
///
/// One handler for both: the argument block is written over the record in a
/// single copy, and the event carries it unchanged.
fn set_config(program_id: &Address, accounts: &mut [AccountView], a: &[u8; CONFIG_ARGS], init: bool) -> R {
    let [authority, cfg, rest @ ..] = accounts else {
        return Err(E::NotEnoughAccounts);
    };
    signer(authority)?;
    writable(cfg)?;
    need(rd_u16(a, 1) <= MAX_FEE_BPS, E::FeeTooHigh)?;
    need(a[0] <= 1 && a[3] == 0 && a[4] == 0, E::InvalidInstruction)?;
    let mut rec: Rec = [0; ESCROW_LEN];
    if init {
        let [program_data, sys_prog, ..] = rest else {
            return Err(E::NotEnoughAccounts);
        };
        system_program(sys_prog)?;
        // Only the program's upgrade authority may create the config, so
        // nobody can front-run the deployment and make themselves admin.
        need(program_data.owned_by(&LOADER_ID), E::NotUpgradeAuthority)?;
        let (pd, _) = Address::find_program_address(&[program_id.as_ref()], &LOADER_ID);
        need(&pd == program_data.address(), E::NotUpgradeAuthority)?;
        let d = program_data.try_borrow().map_err(|_| E::AccountBorrowed)?;
        need(
            d.len() >= 45 && d[0] == 3 && d[12] == 1 && same(&d, 13, key(authority)),
            E::NotUpgradeAuthority,
        )?;
    } else {
        load(cfg, program_id, TAG_CONFIG, &mut rec)?;
        need(same(&rec, config::ADMIN, key(authority)), E::Unauthorized)?;
    }
    rec[config::PAUSED..CONFIG_LEN].copy_from_slice(a);
    if init {
        create(authority, cfg, program_id, TAG_CONFIG, SEED_CONFIG, &[], &mut rec, 0)?;
    } else {
        store(cfg, &rec[..CONFIG_LEN])?;
    }
    let ev = if init { event::CONFIG_INITIALIZED } else { event::CONFIG_UPDATED };
    emit(&[&[ev], a]);
    Ok(())
}

/// Checks shared by Purchase and OpenEscrow. Loads the config into `cfg`,
/// starts the new record in `rec` (order id, parties, amount) and returns
/// the amount.
#[inline(never)]
#[allow(clippy::too_many_arguments)]
fn begin_order(
    program_id: &Address,
    buyer: &AccountView,
    seller: &AccountView,
    cfg_acct: &AccountView,
    sys_prog: &AccountView,
    a: &[u8],
    cfg: &mut Rec,
    rec: &mut Rec,
) -> R<u64> {
    signer(buyer)?;
    system_program(sys_prog)?;
    load(cfg_acct, program_id, TAG_CONFIG, cfg)?;
    need(cfg[config::PAUSED] == 0, E::Paused)?;
    need(key(buyer) != key(seller), E::SelfDeal)?;
    let amount = rd_u64(a, 16);
    need(amount > 0, E::ZeroAmount)?;
    rec[order::ORDER_ID..order::BUYER].copy_from_slice(&a[0..16]);
    rec[order::BUYER..order::SELLER].copy_from_slice(key(buyer));
    rec[order::SELLER..order::AMOUNT].copy_from_slice(key(seller));
    rec[order::AMOUNT..order::FIELD_96].copy_from_slice(&a[16..24]);
    Ok(amount)
}

/// 2: [buyer(s,w), seller(w), treasury(w), config, receipt(w), system]
///    args: order_id [u8;16], amount u64
fn purchase(program_id: &Address, accounts: &mut [AccountView], a: &[u8; 24]) -> R {
    let [buyer, seller, treasury, cfg_acct, receipt, sys_prog, ..] = accounts else {
        return Err(E::NotEnoughAccounts);
    };
    writable(seller)?;
    writable(treasury)?;
    let (mut cfg, mut rec): (Rec, Rec) = ([0; ESCROW_LEN], [0; ESCROW_LEN]);
    let amount = begin_order(program_id, buyer, seller, cfg_acct, sys_prog, a, &mut cfg, &mut rec)?;
    need(same(&cfg, config::TREASURY, key(treasury)), E::TreasuryMismatch)?;
    let fee = bps_of(amount, rd_u16(&cfg, config::FEE_BPS));
    let net = amount - fee;

    rec[order::FIELD_96..order::FIELD_104].copy_from_slice(&fee.to_le_bytes());
    rec[order::FIELD_104..RECEIPT_LEN].copy_from_slice(&now()?.to_le_bytes());
    create(buyer, receipt, program_id, TAG_RECEIPT, SEED_RECEIPT, &a[0..16], &mut rec, 0)?;
    transfer(buyer, seller, net)?;
    if fee > 0 {
        transfer(buyer, treasury, fee)?;
    }
    // Event: the receipt record (order id, parties, amount, fee, time).
    emit(&[&[event::PURCHASED], &rec[..RECEIPT_LEN]]);
    Ok(())
}

/// 3: [buyer(s,w), seller, config, escrow(w), system]
///    args: order_id [u8;16], amount u64, deadline i64
fn open_escrow(program_id: &Address, accounts: &mut [AccountView], a: &[u8; 32]) -> R {
    let [buyer, seller, cfg_acct, escrow, sys_prog, ..] = accounts else {
        return Err(E::NotEnoughAccounts);
    };
    let (mut cfg, mut rec): (Rec, Rec) = ([0; ESCROW_LEN], [0; ESCROW_LEN]);
    let amount = begin_order(program_id, buyer, seller, cfg_acct, sys_prog, a, &mut cfg, &mut rec)?;
    let ts = now()?;
    need(rd_u64(a, 24) as i64 > ts, E::DeadlineInPast)?;

    // The fee rate is frozen into the escrow when it opens.
    rec[order::FEE_BPS] = cfg[config::FEE_BPS];
    rec[order::FEE_BPS + 1] = cfg[config::FEE_BPS + 1];
    rec[order::FIELD_96..order::FIELD_104].copy_from_slice(&a[24..32]);
    rec[order::FIELD_104..ESCROW_LEN].copy_from_slice(&ts.to_le_bytes());
    create(buyer, escrow, program_id, TAG_ESCROW, SEED_ESCROW, &a[0..16], &mut rec, amount)?;
    emit(&[&[event::ESCROW_OPENED], &rec]);
    Ok(())
}

/// 4 Release: [buyer(s,w), seller(w), treasury(w), config, escrow(w)]
/// 6 Resolve: [admin(s), buyer(w), seller(w), treasury(w), config, escrow(w)]
///            args: seller_share_bps u16
fn settle(program_id: &Address, accounts: &mut [AccountView], admin: Option<&mut AccountView>, a: &[u8]) -> R {
    let [buyer, seller, treasury, cfg_acct, escrow, ..] = accounts else {
        return Err(E::NotEnoughAccounts);
    };
    let (mut cfg, mut esc): (Rec, Rec) = ([0; ESCROW_LEN], [0; ESCROW_LEN]);
    load(cfg_acct, program_id, TAG_CONFIG, &mut cfg)?;
    writable(escrow)?;
    load(escrow, program_id, TAG_ESCROW, &mut esc)?;
    need(
        same(&esc, order::BUYER, key(buyer)) && same(&esc, order::SELLER, key(seller)),
        E::PartyMismatch,
    )?;
    need(same(&cfg, config::TREASURY, key(treasury)), E::TreasuryMismatch)?;

    let share = match &admin {
        Some(admin) => {
            signer(admin)?;
            need(same(&cfg, config::ADMIN, key(admin)), E::Unauthorized)?;
            let s = rd_u16(a, 0);
            need(s <= BPS_DENOM, E::InvalidShare)?;
            s
        }
        // Release: only the buyer can sign off on the work.
        None => {
            need(buyer.is_signer(), E::Unauthorized)?;
            BPS_DENOM
        }
    };
    writable(buyer)?;

    let amount = rd_u64(&esc, order::AMOUNT);
    let gross = bps_of(amount, share);
    let fee = bps_of(gross, rd_u16(&esc, order::FEE_BPS));
    let (net, back) = (gross - fee, amount - gross);
    payout_and_close(escrow, buyer, seller, treasury, net, fee)?;

    // Event: the closed escrow record, then the payout
    // (to_seller u64, fee u64, to_buyer u64, seller_share_bps u16).
    let mut out = [0u8; 26];
    out[0..8].copy_from_slice(&net.to_le_bytes());
    out[8..16].copy_from_slice(&fee.to_le_bytes());
    out[16..24].copy_from_slice(&back.to_le_bytes());
    out[24..26].copy_from_slice(&share.to_le_bytes());
    let ev = if admin.is_some() { event::RESOLVED } else { event::RELEASED };
    emit(&[&[ev], &esc, &out]);
    Ok(())
}

/// 5: [authority(s), buyer(w), escrow(w)]
/// The seller may refund at any time; the buyer only after the deadline.
fn refund(program_id: &Address, accounts: &mut [AccountView], _a: &[u8; 0]) -> R {
    let [authority, buyer, escrow, ..] = accounts else {
        return Err(E::NotEnoughAccounts);
    };
    signer(authority)?;
    writable(buyer)?;
    writable(escrow)?;
    let mut esc: Rec = [0; ESCROW_LEN];
    load(escrow, program_id, TAG_ESCROW, &mut esc)?;
    need(same(&esc, order::BUYER, key(buyer)), E::PartyMismatch)?;
    if same(&esc, order::SELLER, key(authority)) {
        // the seller can always hand the money back
    } else if same(&esc, order::BUYER, key(authority)) {
        need(now()? >= rd_u64(&esc, order::FIELD_96) as i64, E::DeadlineNotReached)?;
    } else {
        return Err(E::Unauthorized);
    }
    // Amount and rent all go back to the buyer.
    payout_and_close(escrow, buyer, buyer, buyer, 0, 0)?;
    emit(&[&[event::REFUNDED], &esc, key(authority)]);
    Ok(())
}
