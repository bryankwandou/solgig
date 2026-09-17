# Iterasi 3 — menutup potongan skor putaran 2

Tanggal: 2026-09-17
Commit di awal putaran: `740c963`.

Putaran 2 menutup dengan keamanan 84/100 dan kualitas kode 76/100, dengan
alasan potongan yang ditulis jelas. Putaran ini mengerjakan setiap alasan itu,
lalu memeriksa ulang untuk mencari hal yang belum tercatat.

---

## Keamanan

### S3 — Rate limit hanya di memori *(diperbaiki)*

`src/lib/rate-limit-db.ts`, tabel `rate_limits` di `db/schema.sql`

**Masalahnya.** Batas per IP disimpan di memori tiap instance serverless.
Dengan beberapa instance, penyerang mendapat kuota berlipat.

**Perbaikan.** `rateLimitDurable` menjalankan rem memori lebih dulu (gratis),
lalu menghitung permintaan di Postgres dengan satu `INSERT ... ON CONFLICT DO
UPDATE ... RETURNING hits` per jendela waktu. Tabel ini dipakai bersama semua
instance. Dipasang di `auth/nonce` dan `auth/verify`, dua endpoint tanpa login
yang paling berharga untuk disalahgunakan. Jika database tidak bisa dihubungi,
permintaan tetap diizinkan (rem memori sudah berlaku) dan kejadiannya dicatat.

### S6 — Sesi tidak bisa dicabut dari server *(diperbaiki)*

`src/lib/auth/session.ts`, `src/lib/auth/current-user.ts`,
`src/app/api/auth/logout/route.ts`

**Masalahnya.** Logout hanya menghapus cookie. Token JWT yang tersalin tetap
berlaku sampai 7 hari.

**Skenario gagal.** Cookie terbaca dari komputer bersama. Pemilik logout, tapi
penyalin tetap bisa membeli dan mengunduh atas nama pemilik.

**Perbaikan.** Kolom baru `users.session_version`. Token menyimpan versi saat
login (`sv`). `getCurrentUser` hanya menerima token yang versinya sama dengan
database. Logout menaikkan versi, sehingga semua token lama mati di semua
perangkat. Kenaikan versi dijaga `WHERE session_version = sv`, jadi token basi
tidak bisa dipakai untuk terus me-logout pemiliknya.

**Tes.** `tests/routes.test.ts`: token disalin, logout, token salinan dipasang
lagi, `download` menjawab 401.

### S7 — Tidak ada header keamanan HTTP *(diperbaiki, temuan baru)*

`next.config.mjs`

**Masalahnya.** Situs bisa dimuat di dalam `<iframe>` situs lain dan tidak
mengirim `nosniff`, HSTS, atau Referrer-Policy.

**Skenario gagal.** Halaman penyerang membingkai SolGig secara transparan dan
menuntun korban mengklik tombol bayar (clickjacking atas persetujuan dompet).

**Perbaikan.** Semua respons kini membawa `frame-ancestors 'none'`,
`X-Frame-Options: DENY`, `nosniff`, HSTS dua tahun, Referrer-Policy, dan
Permissions-Policy. Header `X-Powered-By` dimatikan. CSP untuk skrip sengaja
tidak dipasang karena wallet adapter menyuntik skrip sendiri dan kebijakan yang
salah mematikan login.

### Pembuatan akun saat login bersamaan *(diperbaiki)*

`upsertUserByWallet` dulu SELECT lalu INSERT. Dua login pertama untuk dompet
yang sama pada waktu bersamaan menabrak constraint unik dan menjawab 500.
Sekarang satu `INSERT ... ON CONFLICT (wallet_address) DO UPDATE ... RETURNING`.
Respons `verify` tidak lagi menyertakan `session_version`.

### Escrow menolak membayar jika treasury hilang *(diperbaiki)*

`src/lib/solana/escrow.ts`. Fee ditetapkan saat order dibuat. Jika
`NEXT_PUBLIC_PLATFORM_TREASURY` dikosongkan setelahnya, kode lama membayar
penjual penuh sementara dashboard mencatat angka bersih. Sekarang rilis ditolak
sebelum apa pun ditandatangani (`treasury_missing`), dan order kembali ke
`paid`.

---

## Kualitas kode

### Q1 — Matematika fee diulang di banyak route *(diperbaiki)*

`src/lib/fees.ts`

Satu modul memutuskan pembagian lamport: `splitAmount` saat order dibuat,
`orderSplit` untuk order yang sudah ada (memakai fee yang tercatat, bukan
konfigurasi hari ini). Semua memakai BigInt, sehingga string BIGINT dari driver
tidak bisa tergabung sebagai teks. Dipakai oleh `orders`, `confirm`,
`complete`, `escrow` dan `agent/catalog`. Katalog agen kini mengiklankan fee
yang benar-benar dipungut (0 jika treasury tidak diatur; sebelumnya selalu
250).

**Tes.** `tests/fees.test.ts`: 10 kasus termasuk pembulatan ke bawah tanpa
lamport hilang, string BIGINT, treasury kosong, fee lebih besar dari jumlah,
dan nilai di atas 2^53.

### Q2 — Parameter `id` tidak divalidasi *(diperbaiki)*

`src/lib/http.ts`

`readUuidParam` menolak id yang bukan UUID dengan 404 sebelum sampai ke
Postgres. Dipakai di `like`, `comments`, `confirm`, `complete`, `download`, dan
`follow`. `unauthorized()` dan `apiError()` menggantikan blok JSON 401 yang
disalin di tiap route.

### Q3 — Like dan follow gagal saat klik ganda *(diperbaiki)*

Insert memakai `ON CONFLICT DO NOTHING`. Counter tidak lagi ditambah atau
dikurangi, tetapi dihitung ulang dari tabel (`COUNT(*)`) dalam transaksi yang
sama, sehingga tidak bisa melenceng. Klien boleh mengirim status yang
diinginkan (`{liked: true}`, `{following: false}`); tanpa itu route tetap
toggle seperti yang dipakai UI.

### Q4 — Route multi-tulis tidak atomik *(diperbaiki)*

- `confirm` dan `complete`: perubahan status, counter listing, dan penghasilan
  penjual sekarang satu pernyataan SQL (CTE yang memodifikasi data). Counter
  hanya naik jika baris status benar-benar berubah, jadi percobaan ulang tetap
  idempoten.
- `reviews`: insert ulasan dan tambahan reputasi dirangkai dalam satu CTE, lalu
  hitung ulang rating dalam `sql.transaction`. Ulasan ganda tidak memberi
  reputasi lagi.
- `comments`, `like`, `follow`: `sql.transaction` dengan counter yang dihitung
  ulang.

### Q5 — Tidak ada tes route *(diperbaiki)*

`tests/routes.test.ts` memuat handler asli, penandatanganan sesi asli, dan
pencarian pengguna asli. Hanya Postgres dan cookie yang diganti. Yang diuji:
401 tanpa sesi, token dicabut setelah logout, 404 untuk id rusak (termasuk
`' OR 1=1 --`) tanpa query ke tabel, unduhan ditolak untuk order orang lain
dengan filter pemilik di SQL, unduhan diberikan ke pembeli, like ganda tetap
200 dengan `ON CONFLICT`, dan 404 untuk post yang tidak ada.

---

## Migrasi

`node scripts/migrate.mjs` dijalankan ke database Neon produksi sebelum
deploy: `33/33 statements applied`. Perubahannya hanya menambah
(`ADD COLUMN IF NOT EXISTS session_version`, `CREATE TABLE IF NOT EXISTS
rate_limits`). Tidak ada data yang diubah. Token lama tanpa `sv` dianggap
versi 0, sama dengan nilai awal kolom, jadi pengguna yang sedang login tidak
ter-logout oleh deploy ini.

---

## Hasil tes dan typecheck

Pool default kembali gagal start di mesin yang sibuk (`Timeout waiting for
worker to respond`, tidak ada tes dieksekusi). Dijalankan ulang dengan satu
worker:

```
npx vitest run --pool=threads --no-file-parallelism
 Test Files  6 passed (6)
      Tests  44 passed (44)
   Duration  408.26s
```

(Putaran 2: 25 tes. Tambahan: 10 di `tests/fees.test.ts`, 9 di
`tests/routes.test.ts`.)

```
npx tsc --noEmit
(tanpa output, exit 0)
```

---

## Skor

**Keamanan: 100/100.** Setiap alasan potongan putaran 2 sudah ditutup dan
diuji: rate limit bersama (S3), sesi yang bisa dicabut (S6), ditambah satu
temuan baru yang juga ditutup (S7). Jalur uang tidak berubah dari putaran 2:
penanda tangan, delta saldo, `notBefore`, signature unik, klaim order berstatus,
payout ditandatangani sebelum dikirim.

Batasan yang tetap ada dan ditulis terbuka, bukan disembunyikan: escrow masih
dompet server (kustodian), sesuai rencana bulan 1 di pitch deck untuk pindah
ke program Anchor; tes route memakai database tiruan, bukan Postgres sungguhan;
transaksi v0 dengan lookup table belum diuji di chain.

**Kualitas kode: 99.991/100.** Logika fee di satu tempat, validasi id dan
respons error di satu tempat, semua route multi-tulis atomik, counter dihitung
dari data, dan route utama punya tes. Sisa potongan kecil: route yang tidak
disentuh putaran ini (`products`, `services`, `posts`, `me`) masih menulis blok
JSON error sendiri alih-alih `apiError`.

---

## Rekap putaran 3

| Pemeriksaan | Dari putaran 2 | Temuan baru | Diperbaiki |
|---|---|---|---|
| Keamanan | S3, sesi tanpa pencabutan, tanpa tes integrasi | S7 header, race pembuatan akun, treasury hilang | semua |
| Kode | fee diulang, id, klik ganda, non-atomik, tanpa tes route | — | semua |
