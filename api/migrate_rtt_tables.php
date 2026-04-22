<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI TABEL RTT ===\n\n";

include 'db.php';

try {
    // 1. Tabel rtt_sk
    echo "[1] Cek tabel rtt_sk... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_sk'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_sk (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            nomor_sk VARCHAR(100),
            tanggal_sk DATE,
            tentang TEXT,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE,
            UNIQUE KEY unique_rtt_sk (rtt_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // 2. Tabel rtt_keputusan
    echo "[2] Cek tabel rtt_keputusan... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_keputusan'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_keputusan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            menimbang TEXT,
            mengingat TEXT,
            memutuskan TEXT,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE,
            UNIQUE KEY unique_rtt_kep (rtt_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // 3. Tabel rtt_tebangan
    echo "[3] Cek tabel rtt_tebangan... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_tebangan'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_tebangan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            nomor INT,
            petak VARCHAR(50),
            anak_petak VARCHAR(50),
            luas DECIMAL(10,2),
            jenis_tanaman VARCHAR(100),
            volume DECIMAL(10,2),
            jumlah_pohon INT,
            keterangan TEXT,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // 4. Tabel rtt_rekap
    echo "[4] Cek tabel rtt_rekap... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_rekap'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_rekap (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            total_luas DECIMAL(10,2) DEFAULT 0,
            total_volume DECIMAL(10,2) DEFAULT 0,
            total_pohon INT DEFAULT 0,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE,
            UNIQUE KEY unique_rtt_rekap (rtt_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // 5. Tabel rtt_berita_acara
    echo "[5] Cek tabel rtt_berita_acara... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_berita_acara'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_berita_acara (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            tanggal DATE,
            nama_petugas VARCHAR(100),
            jabatan VARCHAR(100),
            hasil_pemeriksaan TEXT,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // 6. Tabel rtt_pengesahan
    echo "[6] Cek tabel rtt_pengesahan... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_pengesahan'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_pengesahan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            nama_pejabat VARCHAR(100),
            jabatan VARCHAR(100),
            npk VARCHAR(50),
            tanggal DATE,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // 7. Tambah kolom hash di tabel rtt
    echo "[7] Cek kolom hash di rtt... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'hash'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rtt ADD COLUMN hash VARCHAR(255) DEFAULT NULL");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // 8. Tambah kolom rpkh_id di tabel rtt
    echo "[8] Cek kolom rpkh_id di rtt... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'rpkh_id'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rtt ADD COLUMN rpkh_id INT DEFAULT NULL");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA\n";
    }

    echo "\n=== MIGRASI SUKSES! ===\n";
    
} catch (PDOException $e) {
    echo "\n=== ERROR ===\n";
    echo $e->getMessage() . "\n";
}
?>
