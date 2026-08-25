# POS UMKM — Kasir Offline untuk Warung, Kedai & Kafe

Aplikasi kasir (Point of Sale) **Android** berbasis **React Native (Expo) + TypeScript**.
**100% offline** — semua data tersimpan di SQLite lokal di HP, tanpa server, tanpa internet.

![stack](https://img.shields.io/badge/Expo-57-black) ![rn](https://img.shields.io/badge/React_Native-0.86-blue) ![ts](https://img.shields.io/badge/TypeScript-strict-blue)

## Fitur

### 🧾 Kasir
- Grid produk dengan nama & harga besar (ramah jempol satu tangan)
- **Varian / Topping / Modifier**: Surabi (+Telor +3k, +Oncom +2k), Mie Tek-Tek (Pedas Lv 1–5, +Bakso +4k), Teh Manis (Es/Panas), dst.
- Sticky bottom bar melayang: total harga + tombol **BAYAR** hijau besar
- Checkout: hitung uang tunai & kembalian otomatis, tombol nominal cepat
- Metode bayar: Tunai / QRIS

### 📊 Laporan
- Ringkasan harian: jumlah transaksi, omzet, split tunai vs QRIS
- Riwayat transaksi lengkap per item + varian

### 🔐 Lisensi & Anti-Bajakan (offline)
- Setiap HP punya **Device ID** unik yang ditampilkan di layar aktivasi
- Aplikasi terkunci sampai dimasukkan **Kode Aktivasi** yang cocok
- Kode aktivasi = HMAC-SHA256(secret, device ID) — divalidasi offline di dalam app
- Vendor generate kode dengan script `keygen.mjs` (lihat bawah)

## Menjalankan Proyek

```bash
npm install
npx expo start          # scan QR pakai Expo Go
```

## Build APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # hasil: file .apk
```

Profil build ada di `eas.json`:
| Profil | Output | Kegunaan |
|---|---|---|
| `preview` | `.apk` | Distribusi langsung ke customer via WhatsApp |
| `production` | `.aab` | Upload ke Google Play |

## 🔑 Key Generator (untuk penjual/vendor)

Setiap pembeli akan melihat **Device ID** (format `XXXX-XXXX-XXXX`) di layar aktivasi dan mengirimkannya ke Anda. Generate kode aktivasi:

```bash
node keygen.mjs ABCD1234EFGH
# → 7RFX-WAXT-VZV9-C3DN
```

Kirim kode itu kembali ke pembeli — aplikasinya langsung terbuka.

> ⚠️ Ganti `APP_LICENSE_SECRET` (di `src/license/license.ts` DAN `keygen.mjs`) sebelum rilis agar key Anda unik & tidak bisa ditebak orang lain.

## Struktur

```
src/
├── db/database.ts        # schema SQLite + seed data demo
├── license/license.ts    # device ID, HMAC key gen, validasi offline
├── screens/
│   ├── ActivationGate.tsx  # layar kunci lisensi
│   ├── CashierScreen.tsx   # grid produk + keranjang
│   └── HistoryScreen.tsx   # laporan & riwayat
├── components/
│   ├── ModifierSheet.tsx   # pemilih varian/topping
│   ├── StickyCartBar.tsx   # panel bayar melayang
│   └── CheckoutSheet.tsx   # pembayaran + kembalian
├── theme/theme.ts         # Material Design 3, kontras tinggi
└── utils/pos.ts           # logika keranjang & transaksi
```

## Lisensi

MIT
