# solgig-escrow

The on-chain half of SolGig: purchase receipts for digital goods and a
program-owned escrow for services. Written with [Pinocchio](https://github.com/anza-xyz/pinocchio)
instead of Anchor, so the program is small and cheap to run. It still has the
safety features you would get from Anchor: typed account records, PDA checks,
error codes, events and an IDL.

| | |
|---|---|
| Program id (devnet) | `Hci514Ans67Rfw8Dks8qKnVFjJF6MLLZmMV1owaFBo4L` |
| Config PDA | `CgeXXLs4BeQM2njfqxTCSToCBKqZKnsyZ6TmvjwesRUv` |
| Binary size | 14,056 bytes |
| Deploy cost (devnet, measured) | 0.07320644 SOL: rent 0.07228332 plus fees |
| Deploy transaction | [`4Qv7ovAv…Uo83NX`](https://explorer.solana.com/tx/4Qv7ovAvGACe3XJJSpAm7De9KoD4FQV1jDGAhRQibwAkaTmxnpuArFXJkNJoTWoo9Woa7grNWWdsbDWBQoUo83NX?cluster=devnet) |
| Config initialised | [`3HQQQCAi…j4Mg6Pa`](https://explorer.solana.com/tx/3HQQQCAiWSBnA6Hx8L15TkgB9G7oPARfgc3mRmTkfwN66cM4NAiify5hsK5wiqrtGex9fMKWeKtWWhCq6j4Mg6Pa?cluster=devnet) |

Rent on both devnet and mainnet is currently 5,080 lamports per byte, so a
mainnet deploy of this binary costs the same, about 0.073 SOL plus priority
fees.

## Build, test, deploy

```sh
# build (the build-std flags drop panic-formatting code, about 8 KB)
RUSTC_BOOTSTRAP=1 cargo build-sbf -- -Zbuild-std=core -Zbuild-std-features=panic_immediate_abort

# 24 end-to-end tests against the compiled binary (Mollusk SVM)
cd test-suite && cargo test

# deploy
solana program deploy target/deploy/solgig_escrow.so \
  --program-id <program keypair> --upgrade-authority <authority keypair>

# create the config (upgrade authority only), then inspect it
ESCROW_ADMIN_KEYPAIR=<authority keypair> node ../../scripts/escrow-admin.mts init
node ../../scripts/escrow-admin.mts show
```

The tests are a separate crate because `mollusk-svm` 0.15 pins an older
`solana-address` than `pinocchio` 0.11 needs. They only load the `.so`, so
they test exactly the bytes that get deployed.

## How it keeps the binary small

The rent you pay to deploy grows with every byte of the binary. The first
build was 43 KB (about 0.30 SOL at the old rate). These changes brought it
down to 14 KB without removing any checks:

- The entrypoint is written by hand on top of Pinocchio's lazy context.
  It reads at most 8 accounts and maps errors directly to `u32` codes.
- Errors inside the program are a `u32` enum, which fits in a register. A
  `ProgramError` is passed through memory at every `?`.
- Fee math uses only u64, never u128 (`amount / 10000 * bps + remainder`),
  so it is exact and cannot overflow. `overflow-checks` is off; every
  subtraction that could underflow is either `checked_*` or provably safe.
- One shared System Program CPI helper replaces a separate builder for each
  instruction.
- Each account record is assembled on the stack and written with a single
  copy. Events carry the whole record instead of separate fields.
- `panic_immediate_abort` through `build-std`.

## Accounts

All records are fixed-size and little-endian. Every record starts with
`tag u8, version u8, bump u8`. The program checks the owner, size, tag,
version and PDA address of a record every time it reads one.

**Config**, PDA `["config"]`, 72 bytes

| offset | field |
|---|---|
| 0 | tag = 1 |
| 1 | version = 1 |
| 2 | bump |
| 3 | paused (0 or 1) |
| 4..6 | fee_bps u16 (at most 1000) |
| 6..8 | padding, must be 0 |
| 8..40 | admin |
| 40..72 | treasury |

**Receipt**, PDA `["receipt", order_id]`, 112 bytes: written by Purchase and never closed.

**Escrow**, PDA `["escrow", order_id]`, 112 bytes: holds rent plus the amount until it is released, refunded or resolved.

| offset | receipt | escrow |
|---|---|---|
| 0 / 1 / 2 | tag 2, version, bump | tag 3, version, bump |
| 4..6 | – | fee_bps u16, fixed when the escrow opens |
| 8..24 | order_id (the order UUID's 16 bytes) | order_id |
| 24..56 | buyer | buyer |
| 56..88 | seller | seller |
| 88..96 | amount u64 | amount u64 |
| 96..104 | fee u64 | deadline i64 |
| 104..112 | paid_at i64 | opened_at i64 |

## Instructions

The first byte of instruction data selects the instruction. Signer is written
`s`, writable is written `w`.

| # | name | accounts | args |
|---|---|---|---|
| 0 | InitializeConfig | upgrade_authority (s,w), config (w), program_data, system | config args |
| 1 | UpdateConfig | admin (s), config (w) | config args |
| 2 | Purchase | buyer (s,w), seller (w), treasury (w), config, receipt (w), system | order_id [16], amount u64 |
| 3 | OpenEscrow | buyer (s,w), seller, config, escrow (w), system | order_id [16], amount u64, deadline i64 |
| 4 | Release | buyer (s,w), seller (w), treasury (w), config, escrow (w) | none |
| 5 | Refund | authority (s), buyer (w), escrow (w) | none |
| 6 | Resolve | admin (s), buyer (w), seller (w), treasury (w), config, escrow (w) | seller_share_bps u16 |

Config args are 69 bytes: `paused u8, fee_bps u16, [0,0], admin 32, treasury 32`.
This is the same byte layout as config offsets 3..72.

Rules the program enforces:

- **InitializeConfig.** Only the program's upgrade authority can call it.
  The program checks the ProgramData account's owner, its address and the
  authority stored inside it. This stops anyone from front-running the
  deployment and making themselves admin.
- **Purchase and OpenEscrow.** They fail if the program is paused, the
  amount is zero, the buyer and seller are the same wallet, or the treasury
  differs from the config. OpenEscrow also needs a deadline in the future.
- **Record accounts.** They are created with transfer, allocate and assign
  instead of CreateAccount. If someone sends lamports to the PDA address in
  advance, the order can still go through. An address that already holds
  data is refused, so the same order cannot be paid twice.
- **Release.** Only the buyer can release. The fee uses the rate saved when
  the escrow opened, so a later change to the config does not affect it.
- **Refund.** The seller can refund at any time. The buyer can refund only
  after the deadline.
- **Resolve.** Only the admin can resolve. `seller_share_bps` of the amount
  goes to the seller (minus the fee), and the rest goes back to the buyer.
- **Closing the escrow.** Release, Refund and Resolve all close the escrow
  account. Its rent always goes back to the buyer.

## Errors

Program errors come back as `InstructionError::Custom(code)`.

| code | name | code | name |
|---|---|---|---|
| 6000 | InvalidInstruction | 6012 | PartyMismatch |
| 6001 | InvalidAccountData | 6013 | DeadlineInPast |
| 6002 | AlreadyInitialized | 6014 | DeadlineNotReached |
| 6003 | MissingSigner | 6015 | InvalidShare |
| 6004 | NotWritable | 6016 | Overflow |
| 6005 | WrongOwner | 6017 | NotUpgradeAuthority |
| 6006 | InvalidPda | 6018 | SelfDeal |
| 6007 | Unauthorized | 6019 | WrongProgram |
| 6008 | FeeTooHigh | 6020 | TooManyAccounts |
| 6009 | Paused | 6021 | NotEnoughAccounts |
| 6010 | ZeroAmount | 6022 | AccountBorrowed |
| 6011 | TreasuryMismatch | 6023 | Runtime |

## Events

Events are emitted with `sol_log_data`. They appear in transaction logs as
`Program data: <base64> <base64> ...`. The first field is one byte, the
event number.

| # | event | fields after the event byte |
|---|---|---|
| 0 | ConfigInitialized | the 69-byte config args |
| 1 | ConfigUpdated | the 69-byte config args |
| 2 | Purchased | the 112-byte receipt |
| 3 | EscrowOpened | the 112-byte escrow |
| 4 | Released | the 112-byte escrow, payout (26 bytes) |
| 5 | Refunded | the 112-byte escrow, refunding authority (32 bytes) |
| 6 | Resolved | the 112-byte escrow, payout (26 bytes) |

The 26-byte payout is `to_seller u64, fee u64, to_buyer u64, seller_share_bps u16`.

## Clients

- TypeScript client: [`src/lib/solana/program.ts`](../../src/lib/solana/program.ts).
  It has PDA helpers, a builder for every instruction, account decoders, and
  JSON encoding for sending instructions through the API.
- Server-side checks: [`src/lib/solana/settle.ts`](../../src/lib/solana/settle.ts).
  An order counts as paid only when its record exists on-chain with matching
  parties, amount and fee, and the reported transaction touched that record.
- IDL: [`idl.json`](idl.json).
