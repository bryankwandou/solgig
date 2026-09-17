# Laporan SolGig

Tanggal: 17 September 2026
Situs: https://solgig.vercel.app (Solana devnet)
Repositori: https://github.com/bryankwandou/solgig

SolGig adalah marketplace tempat kreator menjual file dan jasa dengan SOL,
dan tempat agen AI bisa menemukan, membayar, dan menerima produk lewat satu
endpoint tanpa ada orang yang mengklik.

---

## 1. Ringkasan skor

| Pemeriksaan | Putaran 1 | Putaran 2 | Putaran 3 |
|---|---|---|---|
| Keamanan | — | 84 | **100** |
| Kualitas kode | — | 76 | **99.991** |
| Desain (`/design-taste`) | — | — | **95** (putaran 2 desain; 91 di putaran 1) |
| Tes otomatis | 16 | 25 | **44 lulus** |
| Typecheck | bersih | bersih | bersih |

Rincian: `docs/iterations/round-1.md`, `round-2.md`, `round-3.md`,
`design-review.md`.

---

## 2. Bukti pembayaran di chain

Tiga order berbayar, masing-masing 0,4 SOL, berstatus `finalized` di devnet:

| Signature | Explorer |
|---|---|
| `4Sp81mdZ…GNcbFh` | [lihat](https://explorer.solana.com/tx/4Sp81mdZg2mDGdQQGQP75yeqboKhy2TXmwHPRQ1RruycXHt9vXuGRpRRPNrvHAfCnYHGCYnEvSspU5cyK8GNcbFh?cluster=devnet) |
| `2VzLTr6m…ugbiCm` | [lihat](https://explorer.solana.com/tx/2VzLTr6m6hsY96HLvG8mqWdyZQbSXDZnn5y2gg3d5ffKSAXXSXxLGaGc81UsfxjA5kkJWLCAJwMLeKZbugaLiBCm?cluster=devnet) |
| `3DbD4FrZ…gwkjU1d2E` | [lihat](https://explorer.solana.com/tx/3DbD4FrZJ1QVR9ukXMejphuemBHcvK5rYjQvEsLhJxHJEz9Qw5TstSjxSVEJHTbZh6qvojauT9zdR9rgwkjU1d2E?cluster=devnet) |

Status layanan saat laporan ditulis (`/api/health`): database terhubung,
9 pengguna, 6 produk, 4 jasa, 6 post, escrow dan treasury terkonfigurasi,
`SESSION_SECRET` terpasang.

---

## 3. Arsitektur

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind 4,
  Framer Motion, Three.js (orbit koin 3D).
- **Backend:** route handler Next.js, Neon Postgres (driver HTTP), zod.
- **Solana:** `@solana/web3.js`, wallet adapter, Sign-In-With-Solana.
- **Alur beli:** login dengan tanda tangan dompet (nonce sekali pakai) →
  server menghitung transfer → pembeli menandatangani satu transaksi (penjual
  + fee 2,5% ke treasury) → server membaca transaksi dari chain: penanda
  tangan, tujuan, delta saldo, umur transaksi, signature unik → file terbuka.
- **Jasa:** pembayaran masuk escrow, dilepas ke penjual setelah pembeli
  menerima hasil kerja; klaim payout dijaga status agar tidak dibayar dua kali.
- **Agen:** `/api/agent/catalog` mengembalikan harga dan transfer persis yang
  harus dibuat.
- **Pengamanan:** sesi yang bisa dicabut, rate limit bersama di Postgres,
  header keamanan HTTP, validasi URL hanya http/https, validasi UUID,
  penulisan multi-tabel atomik.

Struktur berkas: `src/app` (halaman dan API), `src/lib` (logika),
`src/components` (per wilayah), `src/content` (teks EN/ID), `tests/`,
`scripts/`, `db/`, `docs/`.

---

## 4. Video dan presentasi

- Walkthrough: `docs/video/solgig-walkthrough.mp4` (±86 detik, 1280×720).
  Landing, marketplace, halaman produk dan checkout, jasa, order, feed,
  dasbor, profil, katalog agen, landing berbahasa Indonesia, galeri gerak.
  Direkam dari situs live dengan `scripts/walkthrough.mjs`.
- Pitch deck: `docs/pitch/SolGig-Pitch-Deck.pdf` (10 slide) dan sumbernya
  `docs/pitch/deck.html`.

---

## 5. Tangkapan layar

Semua diambil dari situs live dengan `scripts/shots.mjs`: viewport nyata
1440×900 (desktop) dan 390×844 (ponsel), halaman penuh.

| Halaman | EN desktop | EN ponsel | ID desktop | ID ponsel |
|---|---|---|---|---|
| Landing | ![](screenshots/01-landing-en-desktop.png) | ![](screenshots/01-landing-en-mobile.png) | ![](screenshots/01-landing-id-desktop.png) | ![](screenshots/01-landing-id-mobile.png) |
| Marketplace | ![](screenshots/02-marketplace-en-desktop.png) | ![](screenshots/02-marketplace-en-mobile.png) | ![](screenshots/02-marketplace-id-desktop.png) | ![](screenshots/02-marketplace-id-mobile.png) |
| Produk | ![](screenshots/03-product-en-desktop.png) | ![](screenshots/03-product-en-mobile.png) | ![](screenshots/03-product-id-desktop.png) | ![](screenshots/03-product-id-mobile.png) |
| Jasa | ![](screenshots/04-services-en-desktop.png) | ![](screenshots/04-services-en-mobile.png) | ![](screenshots/04-services-id-desktop.png) | ![](screenshots/04-services-id-mobile.png) |
| Feed | ![](screenshots/05-feed-en-desktop.png) | ![](screenshots/05-feed-en-mobile.png) | ![](screenshots/05-feed-id-desktop.png) | ![](screenshots/05-feed-id-mobile.png) |
| Order | ![](screenshots/06-orders-en-desktop.png) | ![](screenshots/06-orders-en-mobile.png) | ![](screenshots/06-orders-id-desktop.png) | ![](screenshots/06-orders-id-mobile.png) |
| Dasbor | ![](screenshots/07-dashboard-en-desktop.png) | ![](screenshots/07-dashboard-en-mobile.png) | ![](screenshots/07-dashboard-id-desktop.png) | ![](screenshots/07-dashboard-id-mobile.png) |
| Listing baru | ![](screenshots/08-new-listing-en-desktop.png) | ![](screenshots/08-new-listing-en-mobile.png) | ![](screenshots/08-new-listing-id-desktop.png) | ![](screenshots/08-new-listing-id-mobile.png) |
| Profil | ![](screenshots/09-profile-en-desktop.png) | ![](screenshots/09-profile-en-mobile.png) | ![](screenshots/09-profile-id-desktop.png) | ![](screenshots/09-profile-id-mobile.png) |
| Galeri gerak | ![](screenshots/10-animations-en-desktop.png) | ![](screenshots/10-animations-en-mobile.png) | ![](screenshots/10-animations-id-desktop.png) | ![](screenshots/10-animations-id-mobile.png) |

Seluruh 40 tangkapan diambil ulang pada 17 September 2026 pukul 17:37 WITA,
setelah perbaikan desain putaran 2 (tombol Buy, listing terkait, latar hero).

---

## 6. Pemeriksaan terhadap pedoman

| # | Syarat | Status | Bukti |
|---|---|---|---|
| 1 | Tiga iterasi dengan skill | Terpenuhi | `docs/iterations/round-1..3.md`, `design-review.md` |
| 2 | Desain tidak jelek, ≥95 `/design-taste` | Terpenuhi (batas bawah) | Skor 95; rincian potongan di `design-review.md` |
| 3 | Animasi cukup | Terpenuhi | 20 komponen gerak, orbit 3D, `/dev/animations` |
| 4 | Bebas bug dan error | Terpenuhi untuk yang ditemukan | Semua temuan tiga putaran diperbaiki, 44 tes lulus |
| 5 | Hasil tidak seadanya | Terpenuhi | 21 route API, 10 halaman, pembayaran dan escrow di chain |
| 6 | Ada pekerjaan nyata | Terpenuhi | Riwayat commit di GitHub |
| 7 | Ide kuat | Terpenuhi | Marketplace yang bisa dipakai agen AI untuk membeli sendiri |
| 8 | Bahasa default Inggris | Terpenuhi | `en` default di `src/content/copy.ts` |
| 9 | Video walkthrough | Terpenuhi | `docs/video/solgig-walkthrough.mp4` |
| 10 | Multibahasa | Terpenuhi | EN dan ID di semua halaman, `?lang=` |
| 11 | Struktur berkas rapi | Terpenuhi | Lihat bagian 3 |
| 12 | Laporan dengan gambar bukti | Terpenuhi | Dokumen ini |

## 7. Batasan yang diketahui

- Escrow masih dompet server (kustodian); rencana pindah ke program Anchor.
- Tes route memakai database tiruan.
- Transaksi v0 dengan lookup table belum diuji di chain.
- Skor desain 95, tepat di batas minimum; gradasi ungu–hijau masih dinilai generik.
