<?php
// api/migrations/v2_add_public_key.php
include __DIR__ . '/../db.php';

try {
    $pdo->exec("ALTER TABLE rtt ADD COLUMN public_key TEXT NULL AFTER signature");
    echo "Column 'public_key' added successfully to 'rtt' table.\n";
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') {
        echo "Column 'public_key' already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
