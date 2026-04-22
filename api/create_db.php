<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create DB
    $pdo->exec("CREATE DATABASE IF NOT EXISTS perhutani_rtt");
    $pdo->exec("USE perhutani_rtt");
    
    // Read and run the SQL file
    $sql = file_get_contents(__DIR__ . '/init_db_rtt.sql');
    $pdo->exec($sql);
    
    echo "Successfully created database perhutani_rtt and ran init_db_rtt.sql\n";
} catch (PDOException $e) {
    echo "PDO Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
