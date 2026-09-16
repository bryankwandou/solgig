# Iterasi 2 — temuan audit

Tanggal: 2026-09-17
Commit di awal putaran: `6724ba0` (ditambah perubahan working tree yang belum di-commit).
Commit di akhir putaran: belum di-commit. Semua perbaikan di bawah ada di working tree.

Cakupan putaran ini hanya `src/app/api/**`, `src/lib/**` dan `tests/**`. Komponen
dan halaman tidak disentuh karena dipegang agen lain. Yang dicatat hanya cacat
yang punya skenario gagal nyata.

---

## Pemeriksaan keamanan

Yang diperiksa: nonce dan sesi SIWS, otorisasi di setiap route order dan
listing, verifikasi pembayaran (penanda tangan, jumlah, replay, tujuan),
pembayaran ganda dari escrow, aritmetika BIGINT, validasi zod, rate limit,
kebocoran rahasia di respons dan log, serta SQL injection.

Yang sudah benar dan tidak diubah:

- Semua query memakai tagged template `neon`, jadi nilai selalu terikat sebagai
  parameter. Pencarian `ILIKE` juga meng-escape `%`, `_` dan `\`. Tidak ada
  jalur SQL injection.
- `confirm`, `complete`, `download` dan `reviews` semuanya mengikat order ke
  `buyer_id` sesi. Bukan pembeli tidak bisa mengonfirmasi, menyelesaikan,
  mengunduh, atau memberi ulasan. Tidak ada IDOR di unduhan.
- `complete` mengklaim order dengan `UPDATE ... WHERE status = 'paid'`, jadi
  dua klik tidak memulai dua payout. Klaim ulang hanya boleh setelah 3 menit,
  saat blockhash payout lama sudah pasti kedaluwarsa.
- Kolom BIGINT sudah di-`Number()` sebelum dijumlahkan di `orders`, `confirm`
  dan `complete`. Harga maksimal realistis jauh di bawah 2^53, jadi presisi aman.
- `/api/health` hanya membuka alamat publik escrow dan treasury, bukan kunci.
  Tidak ada respons atau log yang memuat `ESCROW_SECRET_KEY` atau
  `SESSION_SECRET`.
- Model bisnis "siapa pun bisa jadi penjual" berarti tidak ada peran penjual
  yang perlu dicek. Tidak ada route "deliver" di API; order layanan ditutup
  oleh pembeli lewat `complete`.

### S2 — Transaksi v0 dengan address lookup table ditolak *(diperbaiki)*

`src/lib/solana/pay.ts:62` (dulu baris 41-43)

**Masalahnya.** `verifyPayment` hanya mencari penjual dan treasury di
`staticAccountKeys`. Pada transaksi v0, alamat yang ditarik lewat lookup table
tidak ada di sana, padahal `preBalances`/`postBalances` mencakup alamat statis
lalu alamat hasil lookup.

**Skenario gagal.** Agen atau dompet yang membangun transaksi v0 dan
meletakkan alamat penjual di lookup table membayar penuh, lalu `confirm`
menjawab `party_missing`. Uang sudah pindah, order tetap `pending`.

**Perbaikan.** Logika dipisah ke fungsi murni `checkPayment(tx, params)`.
Kunci akun diresolusi dengan
`message.getAccountKeys({ accountKeysFromLookups: tx.meta.loadedAddresses })`,
yang urutannya sama dengan array saldo. Pengecekan penanda tangan tidak
berubah karena penanda tangan selalu alamat statis. Dua pengaman tambahan:

- Jika transaksi memakai lookup tetapi RPC tidak mengirim `loadedAddresses`,
  hasilnya `lookups_unresolved`. Tanpa ini web3.js melempar error dan route
  menjawab 500. Tes pertama menangkap persis kasus ini.
- Jika panjang array saldo tidak sama dengan jumlah kunci, hasilnya
  `balances_mismatch`, bukan membaca indeks yang salah.

Tetap gagal-tertutup: alamat yang tidak bisa diresolusi ditolak, bukan diterima.

**Tes.** `tests/pay.test.ts` (7 tes) membangun pesan v0 asli lewat
`TransactionMessage.compileToV0Message` dengan lookup table berisi penjual,
memastikan penjual memang tidak ada di kunci statis, lalu menguji: diterima
dengan `loadedAddresses`, ditolak tanpa itu, kurang bayar, pembeli bukan
penanda tangan, transaksi lebih tua dari order, dan transaksi tidak ditemukan.
Jalur legacy juga diuji.

**Status:** diperbaiki. Belum diuji terhadap transaksi v0 di chain sungguhan;
tesnya memakai pesan yang dikompilasi oleh web3.js sendiri.

### S4 — Siapa pun bisa membatalkan login dompet orang lain *(diperbaiki)*

`src/app/api/auth/nonce/route.ts:28-34`

**Masalahnya.** Saat menerbitkan nonce, route menghapus semua nonce yang
masih hidup untuk dompet itu (`WHERE wallet_address = ${wallet}`). Route ini
tidak butuh login dan alamat dompet itu publik.

**Skenario gagal.** Penyerang meminta nonce untuk alamat korban setiap
beberapa detik (batas 10/menit per IP sudah cukup untuk itu). Nonce korban
terhapus sebelum korban selesai menandatangani di dompetnya, sehingga
`verify` selalu menjawab `bad_nonce`. Korban tidak bisa login selama
serangan berjalan.

**Perbaikan.** Hanya nonce kedaluwarsa yang disapu. Pertumbuhan tabel tetap
terbatas oleh rate limit per IP dan masa berlaku lima menit (paling banyak
sekitar 50 baris hidup per IP). Nonce tetap sekali pakai dan terikat ke dompet.

**Status:** diperbaiki. Tidak ada tes otomatis karena route menyentuh
database langsung dan proyek belum punya harness DB.

### S5 — URL `javascript:` dan `data:` lolos validasi *(diperbaiki)*

`src/app/api/products/route.ts:39,42`, `src/app/api/services/route.ts:28`,
`src/app/api/posts/route.ts:39`, `src/app/api/me/route.ts:24`

**Masalahnya.** `z.string().url()` (zod 4) menerima skema apa pun yang bisa
di-parse oleh `new URL`, termasuk `javascript:alert(1)` dan
`data:text/html,...`.

**Skenario gagal.** Penjual membuat produk dengan
`file_url = "javascript:..."`. Pembeli membayar lalu menekan unduh di
`/orders`, yang memanggil `window.open(d.fileUrl, ...)`. React 19 memblokir
`javascript:` di `href`, jadi tombol di halaman produk aman, tetapi
`window.open` tidak dilindungi React. Paling tidak pembeli yang sudah
membayar mendapat tautan rusak atau berbahaya, bukan file. Seberapa jauh
skrip bisa berjalan tergantung browser (jendela `noopener`), jadi dampak
penuhnya belum dibuktikan; yang pasti data seperti itu tidak boleh
tersimpan.

**Perbaikan.** Fungsi baru `isHttpUrl` di `src/lib/utils.ts` hanya menerima
`http:` dan `https:`. Semua field URL buatan pengguna memakai
`.refine(isHttpUrl)`. String kosong tetap diterima seperti sebelumnya.

**Tes.** `tests/utils.test.ts` menambah dua tes: http/https diterima,
`javascript:`, `data:` dan teks bukan URL ditolak.

**Status:** diperbaiki untuk data baru. Baris lama di database tidak
dibersihkan; itu perlu satu query cek terpisah.

### S3 — Rate limit per instance *(diterima, dari putaran 1)*

Tidak berubah. Masih rem spam kasar, bukan kuota.

---

## Pemeriksaan kode

### C3 — Penghasilan penjual layanan dicatat bruto *(diperbaiki)*

`src/app/api/orders/[id]/complete/route.ts:131-137`

**Masalahnya.** C1 di putaran 1 memperbaiki `confirm` agar mencatat
penghasilan bersih untuk produk. Route `complete` untuk layanan masih
menambahkan `amount_lamports` bruto ke `total_earned_lamports`.

**Skenario gagal.** Layanan 1 SOL dengan fee 2,5%. Penjual menerima
0,975 SOL (escrow memotong fee saat rilis, pembayaran langsung memotongnya
ke treasury), tetapi dashboard mencatat 1 SOL. Selisihnya menumpuk di
setiap order layanan.

**Perbaikan.** Mencatat `amount_lamports - platform_fee_lamports`, sama
dengan `confirm`. Saat treasury tidak diatur, `platform_fee_lamports`
sudah 0 sejak order dibuat, jadi hasilnya tetap benar.

**Status:** diperbaiki. Angka yang sudah tercatat salah di database tidak
dikoreksi otomatis.

### Catatan kecil yang tidak diubah

Beberapa route (`posts/[id]/like`, `confirm`, `complete`,
`posts/[id]/comments`) tidak memvalidasi `id` sebagai UUID, dan `like` tidak
menangani dua klik bersamaan. Akibatnya jawaban 500 alih-alih 404/409. Tidak
ada data yang bocor atau rusak, jadi tidak dihitung sebagai temuan
keamanan. Kandidat untuk putaran berikutnya.

---

## Skor

**Keamanan: 84/100.** Jalur uang solid: penanda tangan, delta saldo kedua
pihak, `notBefore`, signature unik, klaim order yang dijaga status, dan
payout yang ditandatangani sebelum dikirim. Tidak ditemukan cara mencuri
atau membayar dua kali. Nilai dikurangi karena putaran ini masih menemukan
DoS login yang bisa dipakai siapa pun (S4) dan validasi URL yang menerima
skema skrip (S5). Rate limit hanya di memori (S3). Sesi JWT 7 hari tidak
bisa dicabut dari server. Semua route yang menyentuh DB belum punya tes
integrasi.

**Kualitas kode: 76/100.** Kode mudah dibaca, komentarnya menjelaskan alasan,
dan pola error-nya konsisten. Nilai dikurangi karena logika fee dan
penghasilan bersih diulang di tiga route (C3 adalah salinan bug C1 yang
tertinggal), route mutasi menjalankan beberapa query tanpa transaksi DB
sehingga counter bisa melenceng jika proses mati di tengah, parameter `id`
tidak divalidasi, dan cakupan tes masih tipis: tes hanya mencakup fungsi
murni, tidak ada yang menguji route.

---

## Hasil tes dan typecheck

`npx vitest run` gagal dijalankan dengan pool default karena mesin sedang
menjalankan build lain. Worker tidak sempat start (`Timeout waiting for
worker to respond`) dan tidak ada tes yang dieksekusi. Dijalankan ulang
dengan satu worker:

```
npx vitest run --pool=threads --no-file-parallelism
 Test Files  4 passed (4)
      Tests  25 passed (25)
   Duration  269.16s (transform 37.56s, import 171.19s, tests 7.02s)
```

(Putaran 1: 16 tes. Tambahan: 7 di `tests/pay.test.ts`, 2 di
`tests/utils.test.ts`.)

```
npx tsc --noEmit
(tanpa output, exit 0)
```

---

## Rekap putaran 2

| Pemeriksaan | Ditemukan | Diperbaiki | Dibawa |
|---|---|---|---|
| Keamanan | 3 (S2 dari putaran 1, S4, S5) | 3 | S3 (diterima) |
| Kode | 1 (C3) | 1 | catatan validasi `id` |

## Pemeriksaan visual

(diisi terpisah)
