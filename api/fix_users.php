<?php
require_once __DIR__ . '/db.php';

try {
    // Add missing columns
    $pdo->exec("ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL");
    $pdo->exec("ALTER TABLE users ADD COLUMN session_token VARCHAR(255) NULL");
    
    // Setup usernames for the existing users based on roles
    $pdo->exec("UPDATE users SET username = 'admin_kph' WHERE role = 'ADMIN'");
    $pdo->exec("UPDATE users SET username = 'kepala_kph' WHERE role = 'KPH'");
    $pdo->exec("UPDATE users SET username = 'admin_phw' WHERE role = 'PHW'");
    $pdo->exec("UPDATE users SET username = 'admin_direksi' WHERE role = 'DIVISI'");
    $pdo->exec("UPDATE users SET username = 'admin_lapangan' WHERE role = 'LAPANGAN'");
    $pdo->exec("UPDATE users SET username = 'admin_gis' WHERE role = 'GIS'");
    
    echo "Users fixed.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
