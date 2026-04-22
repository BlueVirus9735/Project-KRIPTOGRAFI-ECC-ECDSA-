<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI RPKH TABLE ===\n\n";

include 'db.php';

try {
    // Cek kolom yang ada di tabel rpkh
    $stmt = $pdo->query("SHOW COLUMNS FROM rpkh");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Kolom yang ada: " . implode(', ', $columns) . "\n\n";
    
    // Tambah kolom yang kurang
    $requiredColumns = [
        'tahun_mulai' => "YEAR NOT NULL DEFAULT 2024",
        'tahun_selesai' => "YEAR NOT NULL DEFAULT 2029",
        'hash' => "VARCHAR(255) DEFAULT NULL",
        'signature' => "TEXT DEFAULT NULL",
        'created_by' => "INT DEFAULT NULL",
        'created_at' => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        'updated_at' => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];
    
    foreach ($requiredColumns as $col => $def) {
        if (!in_array($col, $columns)) {
            echo "[+] Tambah kolom $col... ";
            $pdo->exec("ALTER TABLE rpkh ADD COLUMN $col $def");
            echo "OK\n";
        } else {
            echo "[~] Kolom $col sudah ada (skip)\n";
        }
    }
    
    // Tambah foreign key untuk created_by
    echo "\n[+] Cek foreign key created_by... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE table_schema = DATABASE() AND table_name = 'rpkh' AND constraint_name = 'fk_rpkh_created_by'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rpkh ADD CONSTRAINT fk_rpkh_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL");
        echo "OK\n";
    } else {
        echo "sudah ada (skip)\n";
    }
    
    echo "\n=== MIGRASI RPKH SUKSES! ===\n";
    
} catch (PDOException $e) {
    echo "\n=== ERROR ===\n";
    echo $e->getMessage() . "\n";
}
?>
