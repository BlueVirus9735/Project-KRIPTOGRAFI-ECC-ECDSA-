<?php
include 'api/db.php';
$id = 5;
$stmt = $pdo->prepare("SELECT status FROM rtt WHERE id = ?");
$stmt->execute([$id]);
echo "STATUS_RTT5: " . $stmt->fetchColumn() . "\n";
?>
