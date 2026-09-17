# Review desain — /design-taste

Tanggal: 2026-09-17. Mode: review. Bahan: 40 tangkapan layar di
`docs/screenshots/`, cuplikan video walkthrough, dan pemindaian kode sesuai
aturan skill.

## Pemindaian kode

| Aturan | Hasil awal | Setelah perbaikan |
|---|---|---|
| Tidak ada `#000` literal | 3 (teks di atas gradasi) | 0, diganti token `--on-brand` |
| Tidak ada `text-black` | 12 (terlewat di pemindaian pertama) | 0, diganti `text-[var(--on-brand)]` |
| Tidak ada `transition-all` | 1 (`Nav.tsx`) | 0, dibatasi ke warna latar, garis, dan blur |
| Tidak ada nilai spasi arbitrer | 0 | 0 |

## Temuan visual

**D1 — Tombol Buy nonaktif tidak terbaca (diperbaiki).** Saat belum ada
dompet, seluruh tombol diredupkan ke 40%, jadi teks gelap di atas gradasi
redup hampir hilang (`03-product-*`). Sekarang keadaan nonaktif memakai
permukaan netral dengan teks terang dan kursor `not-allowed`.

**D2 — Rekaman walkthrough pertama kosong (diperbaiki).** Bagian yang muncul
lewat animasi tidak pernah terpicu di browser headless, sehingga frame berisi
halaman gelap. Perekam kini memakai mode gerak dikurangi, sama seperti alat
tangkapan layar.

**D3 — Gradasi ungu ke hijau (diterima).** Dua warna aksen adalah pola yang
sangat umum di situs kripto dan menjadi sinyal "generik" menurut
`anti-ai-slop.md`. Dipertahankan karena itu warna identitas Solana dan
logonya dibangun di atasnya, tetapi ini potongan nilai.

**D4 — Cahaya buram di hero (diperbaiki, putaran 2).** Bercak cahaya dan
gradasi yang bergeser dilepas dari hero. Gantinya grid bergaris ala buku besar
yang memudar ke tepi, plus satu garis tipis hijau di bawah navigasi. Latar ini
nyambung dengan isi produk (setiap order tercatat di chain).

**D5 — Halaman produk kosong di bawah lipatan (diperbaiki, putaran 2).**
Ditambahkan bagian "More from this seller"; bila penjual hanya punya satu
listing, tampil "Other listings on SolGig" berisi tiga kartu. Dua bahasa.

## Yang sudah kuat

- Teks spesifik dan bukan klise: "Your next customer might not be human",
  angka 2,5%, ~1s, 1 endpoint.
- Satu sistem token warna, tipografi display yang konsisten, grid rapi.
- Tata letak ponsel benar: navigasi pindah ke baris tab, tidak ada teks
  terpotong (`*-mobile.png`).
- Keadaan kosong jelas dan memberi langkah berikutnya (dasbor tanpa dompet).
- Dukungan gerak dikurangi dan dua bahasa di semua halaman.

## Skor

Putaran 1: **91/100.**

Putaran 2 (17 September 2026, 17:37 WITA, 40 tangkapan layar diambil ulang
dari situs live): **95/100.** D1, D2, D4, D5 selesai dan pemindaian token
bersih. Sisa potongan:

- D3, gradasi ungu–hijau yang umum di situs kripto: −3.
- Koin di orbit 3D tampak sebagai cakram datar di tangkapan statis, dan masih
  ada satu cahaya hijau lembut di atas bagian "How a payment clears": −2.

Angka 95 ada tepat di batas bawah pedoman, bukan di atasnya. Untuk naik lagi,
langkah berikut adalah mengganti gradasi identitas dan memberi koin bentuk
bervolume.
