<?php
header("Content-Type: text/plain; charset=utf-8");
include 'db.php';

$tables = ['rtt', 'rtt_sk', 'rtt_keputusan', 'rtt_tebangan', 'rtt_rekap', 'rtt_berita_acara', 'rtt_pengesahan'];

foreach ($tables as $table) {
    echo "=== TABEL: $table ===\n";
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM $table");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
    } catch (Exception $e) {
        echo "  ERROR: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
?>
