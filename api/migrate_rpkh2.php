<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI RPKH TABLE (PART 2) ===\n\n";

include 'db.php';

try {
    // Tambah kolom keterangan
    echo "[+] Cek kolom keterangan... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rpkh' AND column_name = 'keterangan'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rpkh ADD COLUMN keterangan TEXT DEFAULT NULL");
        echo "DITAMBAHKAN\n";
    } else {
        echo "SUDAH ADA (skip)\n";
    }
    
    echo "\n=== MIGRASI PART 2 SUKSES! ===\n";
    
} catch (PDOException $e) {
    echo "\n=== ERROR ===\n";
    echo $e->getMessage() . "\n";
}
?>
