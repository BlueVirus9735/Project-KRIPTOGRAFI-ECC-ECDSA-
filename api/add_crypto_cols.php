<?php
require_once __DIR__ . '/db.php';

try {
    $pdo->exec("ALTER TABLE rtt ADD COLUMN hash VARCHAR(255) NULL, ADD COLUMN signature TEXT NULL");
    echo "Columns added array.";
} catch(PDOException $e) {
    echo "Notice: " . $e->getMessage();
}
?>
