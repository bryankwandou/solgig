use pinocchio::error::ProgramError;

/// Custom errors, returned as `ProgramError::Custom(code)`.
/// Codes start at 6000 like Anchor's `#[error_code]`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum EscrowError {
    InvalidInstruction = 6000,
    InvalidAccountData = 6001,
    AlreadyInitialized = 6002,
    MissingSigner = 6003,
    NotWritable = 6004,
    WrongOwner = 6005,
    InvalidPda = 6006,
    Unauthorized = 6007,
    FeeTooHigh = 6008,
    Paused = 6009,
    ZeroAmount = 6010,
    TreasuryMismatch = 6011,
    PartyMismatch = 6012,
    DeadlineInPast = 6013,
    DeadlineNotReached = 6014,
    InvalidShare = 6015,
    Overflow = 6016,
    NotUpgradeAuthority = 6017,
    SelfDeal = 6018,
    WrongProgram = 6019,
    TooManyAccounts = 6020,
    NotEnoughAccounts = 6021,
    AccountBorrowed = 6022,
    Runtime = 6023,
}

impl From<EscrowError> for ProgramError {
    #[inline(always)]
    fn from(e: EscrowError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
