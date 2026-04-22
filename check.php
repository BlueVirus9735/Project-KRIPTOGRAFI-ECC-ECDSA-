<?php
require 'api/db.php';
$stmt = $pdo->query('SELECT id, username, password FROM users');
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($users as $user) {
    echo $user['username'] . " : " . (password_verify('password', $user['password']) ? 'BISA' : 'TIDAK') . "\n";
}
