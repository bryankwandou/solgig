//! Fixed little-endian account layouts. Every account starts with
//! `[tag: u8, version: u8, bump: u8, ...]`.

pub const VERSION: u8 = 1;

pub const TAG_CONFIG: u8 = 1;
pub const TAG_RECEIPT: u8 = 2;
pub const TAG_ESCROW: u8 = 3;

pub const SEED_CONFIG: &[u8] = b"config";
pub const SEED_RECEIPT: &[u8] = b"receipt";
pub const SEED_ESCROW: &[u8] = b"escrow";

/// Config (72 bytes)
/// 0 tag | 1 version | 2 bump | 3 paused | 4..6 fee_bps u16 | 6..8 pad
/// 8..40 admin | 40..72 treasury
pub const CONFIG_LEN: usize = 72;
/// InitializeConfig / UpdateConfig argument size: config bytes 3..72.
pub const CONFIG_ARGS: usize = CONFIG_LEN - 3;
pub mod config {
    pub const BUMP: usize = 2;
    pub const PAUSED: usize = 3;
    pub const FEE_BPS: usize = 4;
    pub const ADMIN: usize = 8;
    pub const TREASURY: usize = 40;
}

/// Receipt (112 bytes)
/// 0 tag | 1 version | 2 bump | 3..8 pad | 8..24 order_id | 24..56 buyer
/// 56..88 seller | 88..96 amount u64 | 96..104 fee u64 | 104..112 paid_at i64
pub const RECEIPT_LEN: usize = 112;

/// Escrow (112 bytes)
/// 0 tag | 1 version | 2 bump | 3 pad | 4..6 fee_bps u16 | 6..8 pad
/// 8..24 order_id | 24..56 buyer | 56..88 seller | 88..96 amount u64
/// 96..104 deadline i64 | 104..112 opened_at i64
pub const ESCROW_LEN: usize = 112;

/// Shared offsets for Receipt and Escrow.
pub mod order {
    pub const BUMP: usize = 2;
    pub const FEE_BPS: usize = 4;
    pub const ORDER_ID: usize = 8;
    pub const BUYER: usize = 24;
    pub const SELLER: usize = 56;
    pub const AMOUNT: usize = 88;
    pub const FIELD_96: usize = 96;
    pub const FIELD_104: usize = 104;
}

#[inline(always)]
pub fn rd32(d: &[u8], o: usize) -> [u8; 32] {
    let mut a = [0u8; 32];
    a.copy_from_slice(&d[o..o + 32]);
    a
}

#[inline(always)]
pub fn rd16(d: &[u8], o: usize) -> [u8; 16] {
    let mut a = [0u8; 16];
    a.copy_from_slice(&d[o..o + 16]);
    a
}

#[inline(always)]
pub fn rd_u64(d: &[u8], o: usize) -> u64 {
    let mut a = [0u8; 8];
    a.copy_from_slice(&d[o..o + 8]);
    u64::from_le_bytes(a)
}

#[inline(always)]
pub fn rd_u16(d: &[u8], o: usize) -> u16 {
    u16::from_le_bytes([d[o], d[o + 1]])
}
