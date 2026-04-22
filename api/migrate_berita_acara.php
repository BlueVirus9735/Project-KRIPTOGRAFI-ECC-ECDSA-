<?php
header("Content-Type: text/plain; charset=utf-8");
echo "=== MIGRASI TABEL RTT_BERITA_ACARA ===\n\n";

include 'db.php';

try {
    // Cek kolom yang ada
    $stmt = $pdo->query("SHOW COLUMNS FROM rtt_berita_acara");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Kolom yang ada: " . implode(', ', $columns) . "\n\n";
    
    // Tambah kolom tanggal
    if (!in_array('tanggal', $columns)) {
        echo "[+] Tambah kolom tanggal... ";
        $pdo->exec("ALTER TABLE rtt_berita_acara ADD COLUMN tanggal DATE DEFAULT NULL");
        echo "OK\n";
    }
    
    // Tambah kolom nama_petugas (kalau belum ada)
    if (!in_array('nama_petugas', $columns)) {
        // Kalau ada kolom 'nama', rename jadi 'nama_petugas'
        if (in_array('nama', $columns)) {
            echo "[+] Rename kolom nama -> nama_petugas... ";
            $pdo->exec("ALTER TABLE rtt_berita_acara CHANGE COLUMN nama nama_petugas VARCHAR(100)");
            echo "OK\n";
        } else {
            echo "[+] Tambah kolom nama_petugas... ";
            $pdo->exec("ALTER TABLE rtt_berita_acara ADD COLUMN nama_petugas VARCHAR(100) DEFAULT NULL");
            echo "OK\n";
        }
    }
    
    // Tambah kolom hasil_pemeriksaan
    if (!in_array('hasil_pemeriksaan', $columns)) {
        echo "[+] Tambah kolom hasil_pemeriksaan... ";
        $pdo->exec("ALTER TABLE rtt_berita_acara ADD COLUMN hasil_pemeriksaan TEXT DEFAULT NULL");
        echo "OK\n";
    }

    echo "\n=== MIGRASI SUKSES! ===\n";
    
} catch (PDOException $e) {
    echo "\n=== ERROR ===\n";
    echo $e->getMessage() . "\n";
}
?>
