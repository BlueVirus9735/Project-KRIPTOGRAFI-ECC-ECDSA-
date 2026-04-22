-- ============================================
-- DATABASE: perhutani_rtt
-- Sistem Pengelolaan Dokumen RTT Berbasis RPKH
-- ============================================
CREATE DATABASE IF NOT EXISTS perhutani_rtt;
USE perhutani_rtt;

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('kph','phw','direksi') NOT NULL DEFAULT 'kph',
    session_token VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed users (password: 'password')
INSERT INTO users (nama, username, password, role) VALUES
('Kepala KPH', 'admin_kph', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kph'),
('Reviewer PHW', 'admin_phw', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'phw'),
('Kadep Perencanaan', 'admin_direksi', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'direksi');

-- 2. RPKH (Dokumen Induk / Master)
CREATE TABLE IF NOT EXISTS rpkh (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tahun_mulai YEAR NOT NULL,
    tahun_selesai YEAR NOT NULL,
    wilayah VARCHAR(255) NOT NULL,
    kph VARCHAR(255) NOT NULL,
    bkph VARCHAR(255) NOT NULL,
    rph VARCHAR(255) NOT NULL,
    hash VARCHAR(255) DEFAULT NULL,
    signature TEXT DEFAULT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. RPKH DETAIL (data petak per RPKH)
CREATE TABLE IF NOT EXISTS rpkh_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rpkh_id INT NOT NULL,
    petak VARCHAR(100) NOT NULL,
    anak_petak VARCHAR(100) NOT NULL,
    luas DECIMAL(10,2) NOT NULL,
    jenis_tanaman VARCHAR(255) NOT NULL,
    keterangan TEXT DEFAULT NULL,
    FOREIGN KEY (rpkh_id) REFERENCES rpkh(id) ON DELETE CASCADE
);

-- 4. RTT (Dokumen Turunan)
CREATE TABLE IF NOT EXISTS rtt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rpkh_id INT NOT NULL,
    nomor_dokumen VARCHAR(100) NOT NULL,
    tanggal DATE NOT NULL,
    kph VARCHAR(255) NOT NULL,
    bkph VARCHAR(255) NOT NULL,
    rph VARCHAR(255) NOT NULL,
    status ENUM('draft','menunggu_review_phw','revisi','menunggu_pengesahan','disahkan') DEFAULT 'draft',
    hash VARCHAR(255) DEFAULT NULL,
    signature TEXT DEFAULT NULL,
    encrypted_pdf_path VARCHAR(255) DEFAULT NULL,
    catatan_revisi TEXT DEFAULT NULL,
    created_by INT,
    verified_by INT DEFAULT NULL,
    signed_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rpkh_id) REFERENCES rpkh(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (signed_by) REFERENCES users(id)
);

-- 5. RTT SK
CREATE TABLE IF NOT EXISTS rtt_sk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL UNIQUE,
    nomor_sk VARCHAR(100) DEFAULT NULL,
    tanggal_sk DATE DEFAULT NULL,
    tentang TEXT DEFAULT NULL,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 6. RTT KEPUTUSAN
CREATE TABLE IF NOT EXISTS rtt_keputusan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL UNIQUE,
    menimbang TEXT DEFAULT NULL,
    mengingat TEXT DEFAULT NULL,
    memutuskan TEXT DEFAULT NULL,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 7. RTT TEBANGAN (multi-row, tabel dinamis)
CREATE TABLE IF NOT EXISTS rtt_tebangan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL,
    nomor INT DEFAULT NULL,
    petak VARCHAR(100) DEFAULT NULL,
    anak_petak VARCHAR(100) DEFAULT NULL,
    luas DECIMAL(10,2) DEFAULT NULL,
    jenis_tanaman VARCHAR(255) DEFAULT NULL,
    volume DECIMAL(10,2) DEFAULT NULL,
    jumlah_pohon INT DEFAULT NULL,
    keterangan TEXT DEFAULT NULL,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 8. RTT REKAPITULASI (auto-calculated)
CREATE TABLE IF NOT EXISTS rtt_rekap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL UNIQUE,
    total_luas DECIMAL(12,2) DEFAULT 0,
    total_volume DECIMAL(12,2) DEFAULT 0,
    total_pohon INT DEFAULT 0,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 9. RTT PETA LOKASI
CREATE TABLE IF NOT EXISTS rtt_peta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    keterangan TEXT DEFAULT NULL,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 10. RTT BERITA ACARA
CREATE TABLE IF NOT EXISTS rtt_berita_acara (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL,
    tanggal DATE DEFAULT NULL,
    nama_petugas VARCHAR(255) DEFAULT NULL,
    jabatan VARCHAR(255) DEFAULT NULL,
    hasil_pemeriksaan TEXT DEFAULT NULL,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 11. RTT LAMPIRAN
CREATE TABLE IF NOT EXISTS rtt_lampiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL,
    judul VARCHAR(255) DEFAULT NULL,
    keterangan TEXT DEFAULT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 12. RTT PENGESAHAN
CREATE TABLE IF NOT EXISTS rtt_pengesahan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL,
    nama_pejabat VARCHAR(255) DEFAULT NULL,
    jabatan VARCHAR(255) DEFAULT NULL,
    npk VARCHAR(100) DEFAULT NULL,
    tanggal DATE DEFAULT NULL,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 13. VALIDASI
CREATE TABLE IF NOT EXISTS validasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT NOT NULL,
    status_hash ENUM('valid','invalid','pending') DEFAULT 'pending',
    status_signature ENUM('valid','invalid','pending') DEFAULT 'pending',
    status_relasi ENUM('valid','invalid','pending') DEFAULT 'pending',
    catatan TEXT DEFAULT NULL,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- 14. KEYS INFO
CREATE TABLE IF NOT EXISTS keys_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_type VARCHAR(50) DEFAULT 'ECC-SECP256K1',
    public_key_path VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
