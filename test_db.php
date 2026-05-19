<?php
include 'api/db.php';
$stmt = $pdo->query("SELECT session_token FROM users WHERE role = 'sysadmin' AND session_token IS NOT NULL LIMIT 1");
$token = $stmt->fetchColumn();
$stmt = $pdo->query("SELECT id FROM rtt WHERE status = 'menunggu_verifikasi_phw' LIMIT 1");
$rtt_id = $stmt->fetchColumn();
echo "RTT ID: $rtt_id\n";

$ch = curl_init('http://localhost:8000/api/rtt/review.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['rtt_id' => $rtt_id, 'token' => $token, 'action' => 'approve']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
echo "HTTP " . curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\n$response\n";

// Reset back for user to test in browser
$pdo->prepare("UPDATE rtt SET status='menunggu_verifikasi_phw' WHERE id=?")->execute([$rtt_id]);
echo "Reset status back to menunggu_verifikasi_phw for browser testing.\n";
