<?php
include 'c:/laragon/www/PERUM_PERHUTANI/api/db.php';
try {
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('sysadmin', 'admin', 'kph', 'phw', 'divisi', 'direksi', 'gis', 'lapangan') DEFAULT 'kph'");
    $pdo->exec("UPDATE users SET role = 'direksi' WHERE role = 'divisi'");
    $pdo->exec("UPDATE users SET role = 'kph' WHERE role IN ('admin', 'gis', 'lapangan')");
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('sysadmin', 'kph', 'phw', 'direksi') DEFAULT 'kph'");
    echo "DB Roles updated.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
