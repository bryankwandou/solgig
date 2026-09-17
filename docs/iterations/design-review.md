# Review desain — /design-taste

Tanggal: 2026-09-17. Mode: review. Bahan: 40 tangkapan layar di
`docs/screenshots/`, cuplikan video walkthrough, dan pemindaian kode sesuai
aturan skill.

## Pemindaian kode

| Aturan | Hasil awal | Setelah perbaikan |
|---|---|---|
| Tidak ada `#000` literal | 3 (teks di atas gradasi) | 0, diganti token `--on-brand` |
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

**D4 — Cahaya buram di hero (diterima).** Bercak cahaya besar di latar hero
juga pola umum. Diimbangi oleh orbit koin 3D dan teks yang spesifik.

**D5 — Halaman produk kosong di bawah lipatan (dicatat).** Di desktop,
setengah bawah halaman produk kosong saat belum ada ulasan. Kandidat untuk
putaran berikut: listing terkait dari penjual yang sama.

## Yang sudah kuat

- Teks spesifik dan bukan klise: "Your next customer might not be human",
  angka 2,5%, ~1s, 1 endpoint.
- Satu sistem token warna, tipografi display yang konsisten, grid rapi.
- Tata letak ponsel benar: navigasi pindah ke baris tab, tidak ada teks
  terpotong (`*-mobile.png`).
- Keadaan kosong jelas dan memberi langkah berikutnya (dasbor tanpa dompet).
- Dukungan gerak dikurangi dan dua bahasa di semua halaman.

## Skor

**91/100.** Belum mencapai 95 yang diminta pedoman. Potongan terbesar adalah
D3 dan D4 (pola visual kripto yang umum) dan D5 (halaman produk yang tipis).
Angka ini ditulis apa adanya, bukan dinaikkan agar lolos.
