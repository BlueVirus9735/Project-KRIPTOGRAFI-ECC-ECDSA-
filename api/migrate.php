<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI RBAC PERHUTANI ===\n\n";

include 'db.php';

try {
    // Non-transactional migration (MySQL DDL auto-commits)
    
    // 1. Tambah kolom nama jika belum ada
    echo "[1] Cek kolom nama... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'nama'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN nama VARCHAR(100) AFTER id");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    // 2. Tambah kolom is_active
    echo "[2] Cek kolom is_active... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'is_active'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    // 3. Tambah kolom last_login
    echo "[3] Cek kolom last_login... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'last_login'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    // 4. Update enum role
    echo "[4] Update enum role... ";
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('sysadmin','admin','kph','phw','divisi','gis','lapangan') NOT NULL DEFAULT 'lapangan'");
    echo "OK\n";
    
    // 5. Insert default users
    echo "[5] Insert default users... ";
    $defaultUsers = [
        ['System Administrator', 'sysadmin', 'sysadmin@perhutani.id', 'sysadmin'],
        ['Admin Tata Usaha', 'admin_tu', 'admin.tu@kph.id', 'admin'],
        ['Staf Lapangan KRPH', 'lapangan1', 'krph@kph.id', 'lapangan'],
        ['Staf GIS Peta', 'gis1', 'gis@kph.id', 'gis'],
        ['Kepala KPH', 'kepala_kph', 'kph@kph.id', 'kph'],
        ['Verifikator PHW', 'phw1', 'phw@perhutani.id', 'phw'],
        ['Divisi Pengesahan', 'divisi1', 'divisi@perhutani.id', 'divisi'],
    ];
    
    $stmt = $pdo->prepare("INSERT INTO users (nama, username, email, password, role, is_active) 
        VALUES (?, ?, ?, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ?, 1)
        ON DUPLICATE KEY UPDATE role=VALUES(role), nama=VALUES(nama), is_active=1");
    
    foreach ($defaultUsers as $user) {
        $stmt->execute($user);
    }
    echo "OK (7 users)\n";
    
    // 6. Create tabel role_permissions
    echo "[6] Cek tabel role_permissions... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'role_permissions'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE role_permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role ENUM('sysadmin','admin','kph','phw','divisi','gis','lapangan') NOT NULL,
            permission_key VARCHAR(50) NOT NULL,
            permission_name VARCHAR(100) NOT NULL,
            description TEXT,
            UNIQUE KEY unique_role_permission (role, permission_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    // 7. Create tabel audit_log
    echo "[7] Cek tabel audit_log... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'audit_log'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE audit_log (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    // 8. Cek dan tambah kolom updated_at dulu (prasyarat)
    echo "[8] Cek kolom updated_at di rtt... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'updated_at'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rtt ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    // 9. Tambah kolom tracking di tabel rtt
    echo "[9] Cek kolom edited_by_lapangan... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'edited_by_lapangan'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rtt ADD COLUMN edited_by_lapangan INT NULL AFTER updated_at");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    echo "[10] Cek kolom edited_by_gis... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'edited_by_gis'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rtt ADD COLUMN edited_by_gis INT NULL AFTER edited_by_lapangan");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    echo "[11] Cek kolom edited_by_admin... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'edited_by_admin'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rtt ADD COLUMN edited_by_admin INT NULL AFTER edited_by_gis");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    // 12. Update enum status RTT
    echo "[12] Update enum status RTT... ";
    $pdo->exec("ALTER TABLE rtt MODIFY COLUMN status ENUM(
        'draft','menunggu_review_kph','revisi_kph','menunggu_verifikasi_phw',
        'revisi_phw','menunggu_pengesahan','disahkan','ditolak'
    ) DEFAULT 'draft'");
    echo "OK\n";
    
    echo "\n=== MIGRASI SUKSES! ===\n\n";
    echo "User default yang bisa login:\n";
    echo "- sysadmin / password (Admin Sistem)\n";
    echo "- admin_tu / password (Staf Tata Usaha)\n";
    echo "- lapangan1 / password (Staf Lapangan)\n";
    echo "- gis1 / password (Staf GIS)\n";
    echo "- kepala_kph / password (Kepala KPH)\n";
    echo "- phw1 / password (Verifikator PHW)\n";
    echo "- divisi1 / password (Divisi Pengesahan)\n";
    
} catch (PDOException $e) {
    echo "\n=== ERROR ===\n";
    echo $e->getMessage() . "\n";
}
?>
