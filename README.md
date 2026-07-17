# Sistem Informasi Manajemen Pengelolaan RTT Perum Perhutani
**Terintegrasi dengan Algoritma Kriptografi Asimetris ECC & Tanda Tangan Digital ECDSA**

![Perum Perhutani](https://upload.wikimedia.org/wikipedia/id/thumb/7/7f/Logo_Perhutani.svg/1200px-Logo_Perhutani.svg.png)

Proyek ini merupakan **Sistem Informasi Manajemen Rencana Teknik Tahunan (RTT)** yang dikembangkan khusus untuk Perum Perhutani Divisi Regional Jawa Barat dan Banten. Sistem ini mendigitalisasi alur pengajuan, verifikasi, dan pengesahan dokumen RTT dari tingkat **KPH (Kesatuan Pemangkuan Hutan)**, divalidasi oleh **PHW (Perencanaan Hutan Wilayah)**, hingga disahkan secara final oleh **Direksi/Divisi Regional**.

Keunggulan utama dari sistem ini adalah implementasi **Keamanan Kriptografi Tingkat Lanjut** menggunakan algoritma *Elliptic Curve Cryptography (ECC)* dan *Elliptic Curve Digital Signature Algorithm (ECDSA)* untuk menjamin keaslian, integritas, dan anti-penyangkalan (*non-repudiation*) dari setiap dokumen yang diterbitkan.

---

## 🌟 Fitur Utama (Core Features)

### 1. Hierarchical Role-Based Access Control (RBAC)
Sistem memiliki kontrol akses ketat yang dibagi menjadi 4 tingkatan pengguna:
- **Sysadmin:** Mengelola akun pengguna (*User Management*) dan melihat Audit Log.
- **KPH (Kesatuan Pemangkuan Hutan):** Menginisiasi RTT, menyusun dokumen (Summary, NETT, Peta, Klem, BAP), dan mengunggah lampiran fisik.
- **PHW (Perencanaan Hutan Wilayah):** Melakukan validasi teknis dan *cross-check* kesesuaian luasan petak antara RTT dan RPKH.
- **Direksi / Divisi Regional:** Melakukan audit validasi digital kriptografi internal dan memberikan Pengesahan Final (Tanda Tangan Digital).

### 2. Multi-Layer Cryptography (Keamanan Berlapis)
- **BCRYPT Password Hashing:** Seluruh *password* pengguna dienkripsi searah agar tidak dapat dibaca oleh siapapun (termasuk *Database Administrator*).
- **SHA-256 Message Digest:** Menjamin integritas data (*Data Integrity*) dengan mengalkulasi *hash* setiap kali komponen dokumen RTT disimpan/diedit.
- **ECC Transparent Encryption:** Setiap file fisik (Peta Lokasi & Peta BAP) yang diunggah oleh KPH akan langsung dienkripsi menggunakan *Public Key* sistem ke format `.enc`. File mentah langsung dihapus dari *server*.
- **ECDSA Digital Signature:** Direksi menggunakan *Private Key* untuk men-*generate* Tanda Tangan Digital berbasis kurva matematis **SECP256K1**.

### 3. Portal Verifikasi Publik (Public Validation Portal)
Fasilitas terbuka (tanpa perlu *login*) bagi pihak eksternal (Auditor, Polhut, Instansi lain) untuk memverifikasi keaslian dokumen RTT. Sistem akan memvalidasi *Hash* dokumen, mencocokkan *Signature ECDSA* menggunakan *Public Key*, dan memverifikasi *Cross-Reference* luasan petak dengan RPKH.

### 4. Audit Trail Log (Rekam Jejak)
Seluruh aktivitas manipulasi data (Tambah, Edit, Hapus) yang dilakukan oleh pengguna dicatat secara *real-time* ke dalam tabel `audit_log`, mencakup Waktu, Alamat IP, dan Detail Perubahan Data.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

* **Frontend:** Next.js (React), Tailwind CSS, Lucide Icons (Untuk UI/UX yang modern & *responsive*).
* **Backend:** PHP 8+ Native API (RESTful).
* **Database:** MySQL / MariaDB (Relational Database Management System).
* **Cryptography Engine:** Python 3 (Modul `cryptography`, `hashlib`, dan `ecdsa`) dipanggil melalui *Shell Execution* oleh PHP.

---

## 📂 Struktur Direktori Utama

```
/
├── api/                  # Backend PHP API Endpoints
│   ├── auth/             # Autentikasi (Login, Register, Users, Audit)
│   ├── rtt/              # CRUD RTT, Upload File (Enkripsi), & Pengesahan ECDSA
│   ├── rpkh/             # CRUD RPKH Induk
│   ├── validation/       # Validasi Digital (Crosscheck Hash, Signature, Relasi)
│   ├── db.php            # Koneksi Database PDO MySQL
│   └── crypto_utils.php  # Utilitas Canonical JSON untuk Payload Kriptografi
├── crypto/               # Modul Python untuk Kriptografi ECC & ECDSA
│   ├── encrypt.py        # Algoritma Transparent Encryption ECC
│   ├── sign.py           # Algoritma Digital Signature ECDSA
│   └── verify.py         # Algoritma Verifikasi Signature
├── src/                  # Frontend Next.js Source Code
│   ├── app/              # Halaman / Pages (Login, Dashboard, Validasi, Verify)
│   ├── components/       # Reusable React Components (Sidebar, UI elements)
│   └── lib/              # Konfigurasi RBAC & Permissions (auth.ts)
└── public/               # Asset statis (Gambar, CSS)
```

---

## ⚙️ Cara Instalasi & Menjalankan Sistem Secara Lokal

### Persyaratan Sistem (*Prerequisites*):
1. **Node.js** (v18 atau lebih baru)
2. **PHP** (v8.1 atau lebih baru)
3. **MySQL / MariaDB** (Bawaan XAMPP / Laragon)
4. **Python** (v3.9 atau lebih baru) dengan library: `pip install cryptography ecdsa`

### Langkah-langkah:
1. **Clone Repository ini:**
   ```bash
   git clone https://github.com/BlueVirus9735/Project-KRIPTOGRAFI-ECC-ECDSA-.git
   cd Project-KRIPTOGRAFI-ECC-ECDSA-
   ```
2. **Siapkan Database MySQL:**
   - Buat *database* baru dengan nama `perhutani`.
   - Lakukan *import* struktur tabel dari file `.sql` yang tersedia (jika ada).
3. **Konfigurasi Backend:**
   - Sesuaikan *credentials* database di file `api/db.php`.
4. **Jalankan Frontend Next.js:**
   ```bash
   npm install
   npm run dev
   ```
5. Akses aplikasi melalui `http://localhost:3000`. Backend API otomatis berjalan di Laragon/XAMPP (biasanya `http://localhost/api` atau `http://localhost:8000/api`).

---

## 📜 Lisensi & Hak Cipta
Dikembangkan khusus untuk keperluan Penelitian Skripsi Keamanan Sistem Informasi & Kriptografi.
Hak Cipta © 2026. All rights reserved.
