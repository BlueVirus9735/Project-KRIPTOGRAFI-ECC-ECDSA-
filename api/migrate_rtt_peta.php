<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI TABEL RTT_PETA ===\n\n";

include 'db.php';

try {
    // Cek tabel rtt_peta
    echo "[1] Cek tabel rtt_peta... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_peta'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_peta (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            file_path VARCHAR(255),
            keterangan TEXT,
            bagian_hutan VARCHAR(100),
            rph VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    // Cek tabel rtt_lampiran (untuk peta_bap dan lampiran lain)
    echo "[2] Cek tabel rtt_lampiran... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'rtt_lampiran'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("CREATE TABLE rtt_lampiran (
            id INT AUTO_INCREMENT PRIMARY KEY,
            rtt_id INT NOT NULL,
            judul VARCHAR(255),
            keterangan TEXT,
            file_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (rtt_id) REFERENCES rtt(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        echo "DIBUAT\n";
    } else {
        echo "SUDAH ADA\n";
    }

    echo "\n=== MIGRASI SUKSES! ===\n";
    
} catch (PDOException $e) {
    echo "\n=== ERROR ===\n";
    echo $e->getMessage() . "\n";
}
?>
