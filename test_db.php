<?php
include 'api/db.php';
try {
    $tables = ['rtt_nett', 'rtt_rekap_klem', 'rtt_klem_detail', 'rtt_berita_acara'];
    foreach ($tables as $t) {
        echo "=== $t ===\n";
        $stmt = $pdo->query("DESCRIBE $t");
        foreach ($stmt->fetchAll() as $row) {
            echo $row['Field'] . " => " . $row['Type'] . "\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
