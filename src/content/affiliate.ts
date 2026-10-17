// Copy for referral commissions (Commish). English and Indonesian; every
// other locale falls back to English until it is translated.
import type { Locale } from "@/lib/i18n";

const en = {
  title: "Referral commissions",
  poweredBy: "Held on-chain by Commish",
  // seller
  sellerHead: "Pay people who bring you buyers",
  sellerSub:
    "Set a rate and fund a budget in SOL. When a referred order completes, SolGig reserves the referrer's cut on-chain. It is paid out after your refund window; you can only take back what is not reserved.",
  rate: "Commission rate (%)",
  window: "Refund window",
  windows: { 120: "2 minutes (demo)", 86_400: "1 day", 604_800: "7 days", 1_209_600: "14 days", 2_592_000: "30 days" } as Record<number, string>,
  fund: "Starting budget (SOL)",
  open: "Open campaign",
  opening: "Approve in your wallet…",
  budget: "Budget",
  reserved: "Reserved",
  available: "Available",
  paid: "Paid out",
  addFunds: "Add SOL",
  withdraw: "Withdraw unreserved",
  amountSol: "Amount in SOL",
  referredSales: "Referred sales",
  noReferredSales: "No referred sales yet.",
  // referrer
  earnedHead: "Your referral earnings",
  noEarned: "Share a listing's referral link. When someone buys through it, your commission shows up here.",
  claim: "Claim",
  claiming: "Claiming…",
  due: (when: string) => `Claimable ${when}`,
  status: { recording: "Recording", recorded: "Held", released: "Paid", cancelled: "Refunded", failed: "Not recorded" } as Record<string, string>,
  feeNote: "Commish keeps 1% of each commission at payout.",
  // listing
  shareHead: (pct: string) => `Earn ${pct}% by sharing`,
  shareSub: "Anyone who buys through your link earns you a commission, held on-chain until the refund window closes.",
  copy: "Copy link",
  copied: "Copied",
  referredBy: (who: string) => `Referred by @${who}`,
  done: "Done",
  failed: "That did not go through.",
};

export type AffiliateCopy = typeof en;

const id: AffiliateCopy = {
  title: "Komisi referral",
  poweredBy: "Disimpan on-chain oleh Commish",
  sellerHead: "Bayar orang yang membawakan pembeli",
  sellerSub:
    "Tentukan persen komisi dan isi anggaran dalam SOL. Saat pesanan dari referral selesai, SolGig mencadangkan bagian perujuk di on-chain. Komisi dibayar setelah masa refund; kamu hanya bisa menarik yang belum dicadangkan.",
  rate: "Persen komisi (%)",
  window: "Masa refund",
  windows: { 120: "2 menit (demo)", 86_400: "1 hari", 604_800: "7 hari", 1_209_600: "14 hari", 2_592_000: "30 hari" },
  fund: "Anggaran awal (SOL)",
  open: "Buka campaign",
  opening: "Setujui di wallet…",
  budget: "Anggaran",
  reserved: "Dicadangkan",
  available: "Tersedia",
  paid: "Sudah dibayar",
  addFunds: "Tambah SOL",
  withdraw: "Tarik yang belum dicadangkan",
  amountSol: "Jumlah SOL",
  referredSales: "Penjualan dari referral",
  noReferredSales: "Belum ada penjualan dari referral.",
  earnedHead: "Pendapatan referralmu",
  noEarned: "Bagikan link referral sebuah produk. Kalau ada yang membeli lewat link itu, komisimu muncul di sini.",
  claim: "Klaim",
  claiming: "Mengklaim…",
  due: (when) => `Bisa diklaim ${when}`,
  status: { recording: "Mencatat", recorded: "Ditahan", released: "Dibayar", cancelled: "Direfund", failed: "Tidak tercatat" },
  feeNote: "Commish mengambil 1% dari tiap komisi saat dibayarkan.",
  shareHead: (pct) => `Dapat ${pct}% dengan membagikan`,
  shareSub: "Setiap pembelian lewat link-mu memberimu komisi, ditahan on-chain sampai masa refund selesai.",
  copy: "Salin link",
  copied: "Tersalin",
  referredBy: (who) => `Direferensikan oleh @${who}`,
  done: "Selesai",
  failed: "Transaksi tidak berhasil.",
};

export function affiliateCopy(locale: Locale | string): AffiliateCopy {
  return locale === "id" ? id : en;
}
