-- =========================
-- USERS & ROLE
-- =========================
SET FOREIGN_KEY_CHECKS = 0;

-- Drop old schema tables
DROP TABLE IF EXISTS rtt_sk;
DROP TABLE IF EXISTS rtt_keputusan;
DROP TABLE IF EXISTS rtt_tebangan;
DROP TABLE IF EXISTS rtt_rekap;
DROP TABLE IF EXISTS rtt_pengesahan;

-- Drop new schema tables
DROP TABLE IF EXISTS rtt_ba_detail;
DROP TABLE IF EXISTS rtt_berita_acara;
DROP TABLE IF EXISTS rtt_klem_detail;
DROP TABLE IF EXISTS rtt_rekap_klem;
DROP TABLE IF EXISTS rtt_peta;
DROP TABLE IF EXISTS rtt_nett;
DROP TABLE IF EXISTS rtt_summary;
DROP TABLE IF EXISTS rtt;
DROP TABLE IF EXISTS rpkh_detail;
DROP TABLE IF EXISTS rpkh;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255),
    role ENUM('ADMIN','KPH','PHW','DIVISI','GIS','LAPANGAN'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERTS DUMMY USERS
INSERT INTO users (nama, email, password, role) VALUES 
('Admin Tata Usaha', 'admin@kph.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN'), -- password
('Kepala KPH', 'kepala@kph.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'KPH'),
('Staf Lapangan', 'lapangan@kph.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'LAPANGAN'),
('Staf GIS Peta', 'gis@kph.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'GIS'),
('Verifikator PHW', 'phw@perhutani.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PHW'),
('Direksi Divisi', 'divisi@perhutani.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DIVISI');

-- =========================
-- RPKH (MASTER DATA)
-- =========================
CREATE TABLE rpkh (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tahun INT,
    wilayah VARCHAR(100),
    kph VARCHAR(100),
    bkph VARCHAR(100),
    rph VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE rpkh_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rpkh_id INT,
    petak VARCHAR(50),
    anak_petak VARCHAR(50),
    luas DECIMAL(10,2),
    jenis_tanaman VARCHAR(100),
    kelas_hutan VARCHAR(50),
    bon VARCHAR(50),
    kbd VARCHAR(50),
    dkn VARCHAR(50),
    n_per_ha DECIMAL(10,2),
    FOREIGN KEY (rpkh_id) REFERENCES rpkh(id) ON DELETE CASCADE
);

-- =========================
-- RTT (MAIN DOCUMENT WORKSPACE)
-- =========================
CREATE TABLE rtt (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rpkh_id INT,
    nomor_dokumen VARCHAR(100),
    tanggal DATE,
    kph VARCHAR(100),
    bkph VARCHAR(100),
    rph VARCHAR(100),
    status ENUM('DRAFT','DIAJUKAN','REVISI','DISETUJUI_KPH','DISETUJUI_PHW','SAH') DEFAULT 'DRAFT',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rpkh_id) REFERENCES rpkh(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================
-- RTT SUMMARY (DOKUMEN 1)
-- =========================
CREATE TABLE rtt_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    bentuk_tebangan VARCHAR(100),
    luas DECIMAL(10,2),
    jenis_kayu VARCHAR(100),
    kayu_perkakas DECIMAL(10,2),
    kayu_bakar DECIMAL(10,2),
    bambu DECIMAL(10,2),
    arang DECIMAL(10,2),
    jumlah_pohon INT,
    keterangan TEXT,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- =========================
-- RTT NETT (DOKUMEN 2 - INTI)
-- =========================
CREATE TABLE rtt_nett (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    bagian_hutan VARCHAR(100),
    bkph VARCHAR(100),
    rph VARCHAR(100),
    petak VARCHAR(50),
    anak_petak_lama VARCHAR(50),
    anak_petak_baru VARCHAR(50),
    longitude DECIMAL(10,6),
    latitude DECIMAL(10,6),
    luas_baku DECIMAL(10,2),
    jenis_tanaman VARCHAR(100),
    kelas_hutan VARCHAR(50),
    bon VARCHAR(50),
    kbd VARCHAR(50),
    dkn VARCHAR(50),
    n_per_ha DECIMAL(10,2),
    tahun_tanam INT,
    volume_kayu DECIMAL(10,2),
    telah_ditebang DECIMAL(10,2),
    akan_ditebang_teres DECIMAL(10,2),
    akan_ditebang_non_teres DECIMAL(10,2),
    tahun_yad DECIMAL(10,2),
    ai DECIMAL(10,2),
    aii DECIMAL(10,2),
    aiii DECIMAL(10,2),
    jumlah_volume DECIMAL(10,2),
    faktor_koreksi_kph DECIMAL(10,2),
    kayu_bakar DECIMAL(10,2),
    jumlah_pohon INT,
    xfaktor_klem DECIMAL(10,2),
    tunggak DECIMAL(10,2),
    kulit DECIMAL(10,2),
    hasil_lain_jenis VARCHAR(100),
    hasil_lain_satuan VARCHAR(50),
    hasil_lain_volume DECIMAL(10,2),
    alat_mekanis_jenis VARCHAR(100),
    alat_mekanis_volume DECIMAL(10,2),
    keterangan TEXT,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- =========================
-- PETA LOKASI (DOKUMEN 3)
-- =========================
CREATE TABLE rtt_peta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    bagian_hutan VARCHAR(100),
    kelompok_hutan VARCHAR(100),
    rph VARCHAR(100),
    bkph VARCHAR(100),
    jenis_tanaman VARCHAR(100),
    jarak_tanam VARCHAR(50),
    skala VARCHAR(50),
    petak VARCHAR(50),
    luas_baku DECIMAL(10,2),
    panjang DECIMAL(10,2),
    kelas_hutan VARCHAR(50),
    tahun_tanam INT,
    file_path TEXT,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- =========================
-- REKAP KLEM (DOKUMEN 4)
-- =========================
CREATE TABLE rtt_rekap_klem (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    kph VARCHAR(100),
    bkph VARCHAR(100),
    rph VARCHAR(100),
    kelas_hutan VARCHAR(50),
    petak VARCHAR(50),
    anak_petak VARCHAR(50),
    luas_baku DECIMAL(10,2),
    luas_rencana DECIMAL(10,2),
    tahun_tanam INT,
    jenis_tanaman VARCHAR(100),
    no_blok VARCHAR(50),
    luas_blok DECIMAL(10,2),
    jumlah_pohon INT,
    volume DECIMAL(10,2),
    keterangan TEXT,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- =========================
-- DETAIL KLEM (DOKUMEN 5)
-- =========================
CREATE TABLE rtt_klem_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    rtt_rekap_klem_id INT NULL,
    no_blok VARCHAR(50),
    no_pohon VARCHAR(50),
    keliling DECIMAL(10,2),
    volume DECIMAL(10,2),
    jenis_pohon VARCHAR(100),
    keterangan TEXT,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE,
    FOREIGN KEY (rtt_rekap_klem_id) REFERENCES rtt_rekap_klem(id) ON DELETE CASCADE
);

-- =========================
-- BERITA ACARA (DOKUMEN 6)
-- =========================
CREATE TABLE rtt_berita_acara (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    nama VARCHAR(100),
    jabatan VARCHAR(100),
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

CREATE TABLE rtt_ba_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    berita_acara_id INT,
    petak VARCHAR(50),
    anak_petak VARCHAR(50),
    luas_baku DECIMAL(10,2),
    luas_rencana DECIMAL(10,2),
    jenis_tebangan VARCHAR(100),
    jenis_tanaman VARCHAR(100),
    rencana_volume DECIMAL(10,2),
    keterangan TEXT,
    FOREIGN KEY (berita_acara_id) REFERENCES rtt_berita_acara(id) ON DELETE CASCADE
);

-- =========================
-- PETA BAP (DOKUMEN 7)
-- =========================
CREATE TABLE rtt_peta_bap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    file_path TEXT,
    keterangan TEXT,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
);

-- =========================
-- VALIDASI & WORKFLOW
-- =========================
CREATE TABLE validasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rtt_id INT,
    status_kph BOOLEAN DEFAULT FALSE,
    status_phw BOOLEAN DEFAULT FALSE,
    status_divisi BOOLEAN DEFAULT FALSE,
    catatan TEXT,
    validated_by INT,
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================
-- AUDIT LOG (OPSIONAL)
-- =========================
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    aksi VARCHAR(100),
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
