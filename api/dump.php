<?php
include 'c:/laragon/www/PERUM_PERHUTANI/api/db.php';
try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables:\n";
    print_r($tables);
    foreach(['rtt', 'validasi'] as $t) {
        $cols = $pdo->query("SHOW FULL COLUMNS FROM $t")->fetchAll();
        echo "--- $t ---\n";
        print_r($cols);
    }
} catch (Exception $e) { echo $e->getMessage(); }
?>
