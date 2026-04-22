<?php
header("Content-Type: text/plain; charset=utf-8");
include 'db.php';

echo "=== KOLOM DI TABEL RTT ===\n\n";
$stmt = $pdo->query("SHOW COLUMNS FROM rtt");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($columns as $col) {
    echo "- {$col['Field']} ({$col['Type']})\n";
}
?>
