<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI KOLOM TANGGAL DI RTT ===\n\n";

include 'db.php';

try {
    // Cek kolom tanggal di tabel rtt
    echo "[1] Cek kolom tanggal di rtt... ";
    $stmt = $pdo->query("SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = DATABASE() AND table_name = 'rtt' AND column_name = 'tanggal'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("ALTER TABLE rtt ADD COLUMN tanggal DATE DEFAULT NULL");
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
