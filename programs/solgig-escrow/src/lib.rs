//! SolGig escrow: non-custodial purchases and service escrow, written with
//! Pinocchio (no Anchor). See README.md for layouts, errors and events.
#![no_std]

pub mod error;
pub mod processor;
pub mod state;

pub use error::EscrowError;

/// Program id on devnet: Hci514Ans67Rfw8Dks8qKnVFjJF6MLLZmMV1owaFBo4L
pub const ID: [u8; 32] = [
    246, 224, 193, 136, 59, 83, 243, 215, 29, 229, 38, 155, 96, 173, 145, 51, 87, 197, 135, 21, 219,
    86, 162, 124, 40, 136, 40, 4, 40, 33, 223, 201,
];

/// Instruction discriminators (first byte of instruction data).
pub mod ix {
    pub const INITIALIZE_CONFIG: u8 = 0;
    pub const UPDATE_CONFIG: u8 = 1;
    pub const PURCHASE: u8 = 2;
    pub const OPEN_ESCROW: u8 = 3;
    pub const RELEASE: u8 = 4;
    pub const REFUND: u8 = 5;
    pub const RESOLVE: u8 = 6;
}

/// Event discriminators (first `sol_log_data` field).
pub mod event {
    pub const CONFIG_INITIALIZED: u8 = 0;
    pub const CONFIG_UPDATED: u8 = 1;
    pub const PURCHASED: u8 = 2;
    pub const ESCROW_OPENED: u8 = 3;
    pub const RELEASED: u8 = 4;
    pub const REFUNDED: u8 = 5;
    pub const RESOLVED: u8 = 6;
}

pub const MAX_FEE_BPS: u16 = 1_000;
pub const BPS_DENOM: u16 = 10_000;

/// Most accounts any instruction takes (Resolve uses 6).
pub const MAX_ACCOUNTS: usize = 8;

/// Hand-rolled entrypoint on top of the lazy context. Pinocchio's standard
/// one parses up to 255 accounts and maps every `ProgramError` variant, which
/// together cost about 4 KB of the binary, and binary size is deploy rent.
/// Duplicate accounts are resolved to the earlier copy, same as the standard
/// entrypoint does.
#[cfg(any(target_os = "solana", target_arch = "bpf"))]
#[no_mangle]
pub unsafe extern "C" fn entrypoint(input: *mut u8) -> u64 {
    use core::mem::MaybeUninit;
    use pinocchio::{
        entrypoint::lazy::{InstructionContext, MaybeAccount},
        error::ProgramError,
        AccountView,
    };
    let mut ctx = InstructionContext::new_unchecked(input);
    let n = ctx.remaining() as usize;
    if n > MAX_ACCOUNTS {
        return EscrowError::TooManyAccounts as u64;
    }
    let mut slots = [const { MaybeUninit::<AccountView>::uninit() }; MAX_ACCOUNTS];
    for i in 0..n {
        let a = match ctx.next_account_unchecked() {
            MaybeAccount::Account(a) => a,
            MaybeAccount::Duplicated(j) => slots[j as usize].assume_init_ref().clone(),
        };
        slots[i].write(a);
    }
    let accounts = core::slice::from_raw_parts_mut(slots.as_mut_ptr() as *mut AccountView, n);
    let data = ctx.instruction_data_unchecked();
    let program_id = ctx.program_id_unchecked();
    match processor::process_instruction(program_id, accounts, data) {
        Ok(()) => 0,
        Err(ProgramError::Custom(c)) => c as u64,
        // Only sysvar reads can land here; report them as one generic code.
        Err(_) => EscrowError::Runtime as u64,
    }
}

pinocchio::nostd_panic_handler!();
