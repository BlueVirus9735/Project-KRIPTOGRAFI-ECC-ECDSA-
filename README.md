# 🌲 Sistem Keamanan Digital RTT & RPKH Perum Perhutani

**Prototipe Enterprise Security Management System menggunakan Kriptografi Kurva Eliptik (ECC) & ECDSA**

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=for-the-badge&logo=php)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)
![Security](https://img.shields.io/badge/Security-ECC_ECDSA_SHA256-red?style=for-the-badge&logo=security)

---

## 📖 Deskripsi Proyek

Aplikasi ini merupakan sistem manajemen dokumen digital tingkat tinggi yang dibangun khusus untuk **Perum Perhutani Divisi Regional Jawa Barat dan Banten**. 

Tujuan utama sistem ini adalah mendigitalisasi proses pengajuan, persetujuan, dan pengesahan dokumen kelestarian hutan (RPKH & RTT) sembari memberikan **lapisan keamanan siber kelas militer (Military-Grade Security)** untuk mencegah manipulasi, pemalsuan dokumen, *illegal logging*, dan kebocoran data secara ilegal.

Sistem ini menerapkan **Kriptografi Asimetris (Elliptic Curve Cryptography)** dengan algoritma **ECDSA (SECP256K1)** untuk Tanda Tangan Digital (*Digital Signature*), **SHA-256** untuk menjamin integritas data (*Hash Integrity*), serta arsitektur **Transparent At-Rest Encryption** untuk mengamankan file *attachment*.

---

## ✨ Fitur Keamanan Tingkat Tinggi (Advanced Security)

- 🔐 **Tanda Tangan Digital (ECDSA SECP256K1):** 
  Setiap dokumen RTT yang disahkan akan ditandatangani secara digital menggunakan *Private Key* rahasia milik Kepala Divisi. Memastikan asas **Nir-Penyangkalan (Non-Repudiation)**.
- 🛡️ **Integritas Hash (SHA-256) & Avalanche Effect:** 
  Data krusial di-*hash* menjadi satu kesatuan payload kanonikal. Perubahan sekecil 1 karakter (misal: "Tebangan A" diubah *hacker* menjadi "Tebangan B") pada database akan merusak *Digital Signature* dan membuat status dokumen otomatis menjadi **🚨 INVALID / PALSU**.
- 🗄️ **Transparent At-Rest Encryption (Anti-Backdoor):** 
  Seluruh file sensitif (Peta Lokasi & Lampiran) dienkripsi secara *background* menggunakan *System Keys*. Ekstensi file diubah paksa menjadi `.enc` dan isinya diacak (Ciphertext). Sistem ini otomatis menggagalkan serangan *Upload Web Shell / Backdoor* karena file berbahaya tidak akan pernah dieksekusi oleh Web Server. File akan didekripsi secara transparan ke *Temporary Memory* saat diakses oleh pengguna yang memiliki *Session Token* valid.
- 🕵️ **Portal Verifikasi Publik (Independent Audit):** 
  Tersedia portal publik independen (`/verify`) bagi auditor, kepolisian hutan, atau pihak ketiga untuk membuktikan keaslian dokumen `.json` dan `.sig` secara matematis tanpa perlu memiliki akses *login* ke sistem internal perusahaan.
- 📄 **Cetak Laporan PDF Ber-Watermark:** 
  Men-*generate* laporan RTT instan (Real-time) dengan format Lanskap A4 elegan, dilengkapi QR Code dan status otentikasi dinamis (Sah/Palsu).

---

## 🛠️ Tech Stack & Arsitektur (Decoupled Architecture)

### 🎨 Frontend (Client-Side)
- **Framework:** Next.js (dengan Turbopack untuk HMR super cepat)
- **Library UI:** React.js
- **Styling:** Tailwind CSS (Modern Glassmorphism & Cyberpunk-lite UI)
- **UX Logic:** Auto-fill & relational Dropdown data (RPKH -> RTT) terintegrasi dengan backend.

### ⚙️ Backend (API & Logika Bisnis)
- **Bahasa:** PHP 8+ (Native/Vanilla RESTful API)
- **Database:** MySQL (Relational Mapping RPKH & RTT)
- **Autentikasi:** Custom Secure Session Token Storage (Anti-Hijacking)

### 🔐 Core Cryptography Engine
- **Engine Utama:** Python Scripting terintegrasi erat dengan PHP (menggunakan *tempnam isolation*)
- **Library Kriptografi:** `ecdsa`, `hashlib`, `cryptography`
- **Curve Standard:** SECP256K1 (Standar Keamanan Jaringan Bitcoin)

---

## 🚀 Panduan Instalasi (Development Mode)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara lokal:

### 1. Persiapan Sistem & Database
- Pastikan Anda memiliki **Node.js** (18.x), **Laragon/XAMPP** (PHP 8+, MySQL), dan **Python** (3.10+).
- Buat database `perum_perhutani` dan *import* skema SQL.

### 2. Install Dependencies
Buka terminal dan install *library* Kriptografi Python:
```bash
pip install ecdsa cryptography
```
Lalu install *dependencies* Frontend Next.js:
```bash
npm install
# atau
pnpm install
```

### 3. Menjalankan Aplikasi
Sistem menggunakan `concurrently` untuk menyalakan Backend PHP, Tailwind Watcher, dan Next.js secara bersamaan.
```bash
npm run dev
# atau
pnpm run dev
```

Server akan aktif secara otomatis pada:
- **Frontend (UI):** [http://localhost:3000](http://localhost:3000)
- **Backend (API PHP):** [http://localhost:8000](http://localhost:8000)

---

## 📞 Penutup

Proyek ini dikembangkan sebagai bagian dari Skripsi / Tugas Akhir untuk menjawab tantangan keamanan dokumen dan integritas data di sektor kehutanan nasional.

> **"Melindungi kelestarian hutan dimulai dari melindungi integritas datanya."** 🌳
