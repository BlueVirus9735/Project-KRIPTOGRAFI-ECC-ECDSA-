<?php
// Script to migrate DB for RTT
require_once __DIR__ . '/db.php';

try {
    $sql = file_get_contents(__DIR__ . '/init_db_rtt.sql');
    
    // Attempt to execute all queries
    $pdo->exec($sql);
    
    echo "Database migrations for RTT completed successfully.\n";
} catch (PDOException $e) {
    echo "Error running migrations: " . $e->getMessage() . "\n";
}
?>
