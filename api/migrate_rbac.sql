-- ============================================
-- MIGRASI: Role-Based Access Control (RBAC)
-- Update: 21 April 2026
-- ============================================

USE perhutani_rtt;

-- 1. Update tabel users: tambah kolom jika belum ada dan update enum role
-- Perbaikan untuk kompatibilitas MySQL lama (tanpa IF NOT EXISTS)

-- Tambah kolom nama (cek dulu apakah sudah ada)
SET @nama_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'nama');
SET @add_nama = IF(@nama_exists = 0, 'ALTER TABLE users ADD COLUMN nama VARCHAR(100) AFTER id', 'SELECT 1');
PREPARE stmt1 FROM @add_nama;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Tambah kolom is_active
SET @active_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'is_active');
SET @add_active = IF(@active_exists = 0, 'ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1', 'SELECT 1');
PREPARE stmt2 FROM @add_active;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Tambah kolom last_login
SET @login_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_login');
SET @add_login = IF(@login_exists = 0, 'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt3 FROM @add_login;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Update enum role (ini selalu dijalankan)
ALTER TABLE users 
    MODIFY COLUMN role ENUM('sysadmin','admin','kph','phw','divisi','gis','lapangan') NOT NULL DEFAULT 'lapangan';

-- 2. Tambahkan index untuk performa (dengan pengecekan)
SET @idx_role_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_role');
SET @add_idx_role = IF(@idx_role_exists = 0, 'CREATE INDEX idx_users_role ON users(role)', 'SELECT 1');
PREPARE stmt4 FROM @add_idx_role;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

SET @idx_active_exists = (SELECT COUNT(*) FROM information_schema.statistics 
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_active');
SET @add_idx_active = IF(@idx_active_exists = 0, 'CREATE INDEX idx_users_active ON users(is_active)', 'SELECT 1');
PREPARE stmt5 FROM @add_idx_active;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;

-- 3. Insert user SYSADMIN (Admin Sistem)
-- Password: 'sysadmin123' (hashed)
INSERT INTO users (nama, username, email, password, role, is_active) VALUES
('System Administrator', 'sysadmin', 'sysadmin@perhutani.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sysadmin', 1),
('Admin Tata Usaha', 'admin_tu', 'admin.tu@kph.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1),
('Staf Lapangan KRPH', 'lapangan1', 'krph@kph.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lapangan', 1),
('Staf GIS Peta', 'gis1', 'gis@kph.id', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gis', 1)
ON DUPLICATE KEY UPDATE role=VALUES(role);

-- 4. Update existing users yang role-nya lama
UPDATE users SET role = 'admin' WHERE role = 'kph' AND username LIKE '%admin%';
UPDATE users SET role = 'kph' WHERE role IN ('kph') AND username LIKE '%kph%' OR username LIKE '%kepala%';
UPDATE users SET role = 'divisi' WHERE role = 'direksi';

-- 5. Tabel untuk permission matrix (opsional untuk kontrol granular)
-- Cek apakah tabel sudah ada
SET @tbl_perm_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'role_permissions');
SET @create_perm = IF(@tbl_perm_exists = 0, 'CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM(\'sysadmin\',\'admin\',\'kph\',\'phw\',\'divisi\',\'gis\',\'lapangan\') NOT NULL,
    permission_key VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    description TEXT,
    UNIQUE KEY unique_role_permission (role, permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4', 'SELECT 1');
PREPARE stmt6 FROM @create_perm;
EXECUTE stmt6;
DEALLOCATE PREPARE stmt6;

-- 6. Seed permissions untuk setiap role
INSERT INTO role_permissions (role, permission_key, permission_name, description) VALUES
-- SYSADMIN: Full access
('sysadmin', 'user_manage', 'Kelola User', 'CRUD user dan hak akses'),
('sysadmin', 'system_config', 'Konfigurasi Sistem', 'Pengaturan sistem global'),
('sysadmin', 'all_access', 'Akses Penuh', 'Mengakses semua fitur'),

-- ADMIN (Tata Usaha): Input data utama
('admin', 'rtt_summary_edit', 'Edit RTT Summary', 'Mengisi data RTT Summary'),
('admin', 'rtt_nett_edit', 'Edit NETT RTT', 'Mengisi data NETT RTT'),
('admin', 'document_create', 'Buat Dokumen', 'Membuat dokumen RTT baru'),
('admin', 'document_view', 'Lihat Dokumen', 'Melihat semua dokumen'),
('admin', 'rpkh_view', 'Lihat RPKH', 'Akses data RPKH'),

-- KPH: Review dan approval
('kph', 'dashboard_view', 'Lihat Dashboard', 'Akses dashboard monitoring'),
('kph', 'document_review', 'Review Dokumen', 'Mereview dan memberi catatan'),
('kph', 'document_approve_kph', 'Setujui KPH', 'Menyetujui/menolak dokumen level KPH'),
('kph', 'document_view', 'Lihat Dokumen', 'Melihat semua dokumen'),
('kph', 'report_view', 'Lihat Laporan', 'Akses laporan dan statistik'),

-- PHW: Verifikasi teknis
('phw', 'document_verify', 'Verifikasi Teknis', 'Verifikasi kesesuaian RTT vs RPKH'),
('phw', 'document_approve_phw', 'Setujui PHW', 'Menyetujui/menolak dokumen level PHW'),
('phw', 'document_view', 'Lihat Dokumen', 'Melihat semua dokumen'),
('phw', 'rpkh_view', 'Lihat RPKH', 'Akses data RPKH'),

-- DIVISI: Pengesahan akhir
('divisi', 'document_finalize', 'Pengesahan Akhir', 'Pengesahan final dokumen'),
('divisi', 'document_approve_final', 'Setujui Final', 'Pengesahan akhir oleh Divisi'),
('divisi', 'pdf_generate', 'Generate PDF Final', 'Generate PDF final yang sah'),
('divisi', 'document_view', 'Lihat Dokumen', 'Melihat semua dokumen'),

-- GIS: Peta dan lokasi
('gis', 'peta_lokasi_edit', 'Edit Peta Lokasi', 'Menginput Peta Lokasi'),
('gis', 'peta_bap_edit', 'Edit Peta BAP', 'Menginput Peta Lampiran BAP'),
('gis', 'document_view', 'Lihat Dokumen', 'Melihat dokumen terkait peta'),

-- LAPANGAN: Data lapangan
('lapangan', 'klem_daftar_edit', 'Edit Daftar Klem', 'Menginput Daftar Klem'),
('lapangan', 'klem_rekap_edit', 'Edit Rekap Klem', 'Menginput Rekap Klem'),
('lapangan', 'berita_acara_edit', 'Edit Berita Acara', 'Menginput Berita Acara'),
('lapangan', 'document_view', 'Lihat Dokumen', 'Melihat dokumen terkait lapangan')
ON DUPLICATE KEY UPDATE permission_name=VALUES(permission_name);

-- 7. Tabel audit log untuk tracking aktivitas
SET @tbl_audit_exists = (SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = DATABASE() AND table_name = 'audit_log');
SET @create_audit = IF(@tbl_audit_exists = 0, 'CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4', 'SELECT 1');
PREPARE stmt7 FROM @create_audit;
EXECUTE stmt7;
DEALLOCATE PREPARE stmt7;

-- 8. Update RTT status enum untuk workflow yang lebih jelas
ALTER TABLE rtt 
    MODIFY COLUMN status ENUM(
        'draft',
        'menunggu_review_kph',
        'revisi_kph',
        'menunggu_verifikasi_phw',
        'revisi_phw',
        'menunggu_pengesahan',
        'disahkan',
        'ditolak'
    ) DEFAULT 'draft';

-- 9. Tambah kolom tracking siapa yang mengedit bagian mana
-- Cek dan tambah kolom edited_by_lapangan
SET @col_lap_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'edited_by_lapangan');
SET @add_col_lap = IF(@col_lap_exists = 0, 'ALTER TABLE rtt ADD COLUMN edited_by_lapangan INT NULL AFTER updated_at', 'SELECT 1');
PREPARE stmt10 FROM @add_col_lap;
EXECUTE stmt10;
DEALLOCATE PREPARE stmt10;

-- Cek dan tambah kolom edited_by_gis
SET @col_gis_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'edited_by_gis');
SET @add_col_gis = IF(@col_gis_exists = 0, 'ALTER TABLE rtt ADD COLUMN edited_by_gis INT NULL AFTER edited_by_lapangan', 'SELECT 1');
PREPARE stmt11 FROM @add_col_gis;
EXECUTE stmt11;
DEALLOCATE PREPARE stmt11;

-- Cek dan tambah kolom edited_by_admin
SET @col_admin_exists = (SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'edited_by_admin');
SET @add_col_admin = IF(@col_admin_exists = 0, 'ALTER TABLE rtt ADD COLUMN edited_by_admin INT NULL AFTER edited_by_gis', 'SELECT 1');
PREPARE stmt12 FROM @add_col_admin;
EXECUTE stmt12;
DEALLOCATE PREPARE stmt12;

-- 10. Foreign keys untuk tracking (dengan pengecekan)
SET @fk_lap_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() AND table_name = 'rtt' AND constraint_name = 'fk_edited_lapangan');
SET @add_fk_lap = IF(@fk_lap_exists = 0, 'ALTER TABLE rtt ADD CONSTRAINT fk_edited_lapangan FOREIGN KEY (edited_by_lapangan) REFERENCES users(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt13 FROM @add_fk_lap;
EXECUTE stmt13;
DEALLOCATE PREPARE stmt13;

SET @fk_gis_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() AND table_name = 'rtt' AND constraint_name = 'fk_edited_gis');
SET @add_fk_gis = IF(@fk_gis_exists = 0, 'ALTER TABLE rtt ADD CONSTRAINT fk_edited_gis FOREIGN KEY (edited_by_gis) REFERENCES users(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt14 FROM @add_fk_gis;
EXECUTE stmt14;
DEALLOCATE PREPARE stmt14;

SET @fk_admin_exists = (SELECT COUNT(*) FROM information_schema.table_constraints 
    WHERE table_schema = DATABASE() AND table_name = 'rtt' AND constraint_name = 'fk_edited_admin');
SET @add_fk_admin = IF(@fk_admin_exists = 0, 'ALTER TABLE rtt ADD CONSTRAINT fk_edited_admin FOREIGN KEY (edited_by_admin) REFERENCES users(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt15 FROM @add_fk_admin;
EXECUTE stmt15;
DEALLOCATE PREPARE stmt15;

SELECT 'RBAC Migration completed successfully!' AS message;
