<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI RPKH_DETAIL TABLE ===\n\n";

include 'db.php';

try {
    // Cek kolom yang ada di tabel rpkh_detail
    $stmt = $pdo->query("SHOW COLUMNS FROM rpkh_detail");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Kolom rpkh_detail yang ada: " . implode(', ', $columns) . "\n\n";
    
    // Tambah kolom yang kurang
    if (!in_array('keterangan', $columns)) {
        echo "[+] Tambah kolom keterangan... ";
        $pdo->exec("ALTER TABLE rpkh_detail ADD COLUMN keterangan TEXT DEFAULT NULL");
        echo "OK\n";
    } else {
        echo "[~] Kolom keterangan sudah ada (skip)\n";
    }
    
    echo "\n=== MIGRASI RPKH_DETAIL SUKSES! ===\n";
    
} catch (PDOException $e) {
    echo "\n=== ERROR ===\n";
    echo $e->getMessage() . "\n";
}
?>
