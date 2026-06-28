# 🌲 Sistem Otentikasi Digital RTT & RPKH Perum Perhutani

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)
![Security](https://img.shields.io/badge/Security-ECC_ECDSA-red?style=for-the-badge&logo=security)

**Proyek Prototipe Keamanan Sistem Informasi Manajemen Rencana Teknik Tahunan (RTT) dan Rencana Pengaturan Kelestarian Hutan (RPKH) menggunakan Kriptografi Kurva Eliptik (Elliptic Curve Cryptography - ECDSA) dan Hashing SHA-256.**

---

## 📖 Deskripsi Proyek

Aplikasi ini merupakan sistem manajemen dokumen digital yang dibangun khusus untuk **Perum Perhutani Divisi Regional Jawa Barat dan Banten**. Tujuan utama dari sistem ini adalah mendigitalisasi proses pengajuan, persetujuan, dan pengesahan dokumen kelestarian hutan (RPKH & RTT) sembari memberikan lapisan keamanan militer tingkat tinggi untuk mencegah manipulasi, pemalsuan, dan perubahan data secara ilegal.

Sistem ini menerapkan **Kriptografi Asimetris (Elliptic Curve Cryptography)** dengan algoritma **ECDSA (SECP256K1)** untuk Tanda Tangan Digital (Digital Signature) dan **SHA-256** untuk menjamin integritas data (Hash Integrity).

## ✨ Fitur Utama

- 🔐 **Tanda Tangan Digital (ECDSA):** Setiap dokumen RTT yang disahkan akan ditandatangani secara digital menggunakan *Private Key* pengguna. Verifikasi dilakukan menggunakan *Public Key* untuk memastikan dokumen benar-benar disahkan oleh pihak yang berwenang.
- 🛡️ **Integritas Hash (SHA-256):** Data krusial seperti identitas dokumen, detail tebangan, dan parameter kelestarian hutan di-*hash* menjadi satu kesatuan payload kanonikal. Perubahan sekecil 1 karakter pada database akan membuat status dokumen menjadi **INVALID / PALSU**.
- 📄 **Pembuatan PDF Laporan Resmi (Real-time):** Men-generate laporan RTT secara instan dalam format PDF Lanskap A4 yang sangat elegan, lengkap dengan *Watermark* Otentikasi Digital dan stempel sah/palsu dinamis.
- 👥 **Role-Based Access Control (RBAC):** Akses multi-tier berjenjang mulai dari tingkat **KPH**, **PHW**, hingga **Divisi Regional**.
- 📂 **Enkripsi File Berkas:** Melindungi lampiran dan dokumen spasial (peta) dengan sistem enkripsi *Asymmetric* sehingga data tidak bisa bocor meski *server* diretas.

---

## 🛠️ Tech Stack & Arsitektur

Proyek ini dibangun menggunakan arsitektur modern terpisah (*decoupled architecture*):

### Frontend (Client-Side)
- **Framework:** Next.js (dengan fitur Turbopack untuk HMR super cepat)
- **Library UI:** React.js
- **Styling:** Tailwind CSS (Modern Glassmorphism UI)
- **Icons:** Lucide React

### Backend (API & Logika Bisnis)
- **Bahasa:** PHP (Native/Vanilla) via API RESTful
- **Database:** MySQL
- **Autentikasi:** Custom Secure Session Token Storage

### Core Cryptography Engine
- **Engine Utama:** Python Scripting terintegrasi dengan PHP (`shell_exec`)
- **Library Kriptografi:** `ecdsa`, `hashlib`, `cryptography`
- **Curve Standard:** SECP256K1 (Standar Keamanan Bitcoin)

---

## 🚀 Panduan Instalasi (Development Mode)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara lokal di laptop/komputer Anda:

### 1. Persiapan Sistem (Prerequisites)
Pastikan Anda sudah menginstal perangkat lunak berikut:
- **Node.js** (Minimal versi 18.x) & **npm** atau **pnpm**
- **Laragon / XAMPP** (Untuk menjalankan Apache/Nginx, PHP 8+, dan MySQL)
- **Python** (Minimal versi 3.10) beserta pip

### 2. Konfigurasi Database (MySQL)
1. Buka Laragon/XAMPP dan jalankan service MySQL.
2. Buat database baru dengan nama: `perhutani_rtt`.
3. Import schema database yang tersedia di folder root (atau migrasi manual).

### 3. Konfigurasi Library Python (Cryptography Engine)
Sistem membutuhkan *library* Python untuk menjalankan algoritma tanda tangan digital. Buka terminal (CMD/PowerShell) dan jalankan:
```bash
pip install ecdsa cryptography
```

### 4. Instalasi Dependencies Frontend
Buka terminal di dalam folder proyek, lalu jalankan:
```bash
npm install
# atau
pnpm install
```

### 5. Menjalankan Aplikasi
Sistem ini menggunakan fitur `concurrently` untuk menyalakan Backend PHP, Tailwind Watcher, dan Next.js secara bersamaan.
Jalankan perintah ajaib ini:
```bash
npm run dev
# atau
pnpm run dev
```

Server akan aktif secara otomatis pada:
- **Frontend (UI):** [http://localhost:3000](http://localhost:3000)
- **Backend (API PHP):** [http://localhost:8000](http://localhost:8000)

---

## 🔒 Alur Kerja Keamanan (Digital Signature Flow)

1. **Pembuatan Dokumen:** User menginput data RTT. Data disimpan di database.
2. **Kanonikalisasi JSON:** Backend PHP menarik seluruh struktur relasional RTT (Summary, Nett, Klem, Tebangan), mengurutkannya secara spesifik, dan mengubahnya menjadi JSON murni tanpa *whitespace*.
3. **Hashing:** JSON tersebut di-*hash* menggunakan `SHA-256`.
4. **Penandatanganan (Signing):** Hash tersebut dienkripsi oleh Python Engine menggunakan **Private Key** pejabat berwenang (ECC SECP256K1) menghasilkan *Digital Signature*.
5. **Verifikasi:** Ketika auditor menekan tombol "Validasi", sistem akan mereka-ulang payload JSON dari tabel, menghitung ulang *hash*, dan memverifikasi *signature* tersebut menggunakan **Public Key**. Jika hash cocok dan signature terverifikasi, dokumen dinyatakan **SAH**.

---

## 📞 Dukungan / Penulis
Proyek ini dikembangkan sebagai bagian dari Skripsi/Tugas Akhir untuk menjawab tantangan keamanan dokumen dan integritas data di sektor kehutanan nasional.

**"Melindungi kelestarian hutan dimulai dari melindungi integritas datanya."** 🌳
