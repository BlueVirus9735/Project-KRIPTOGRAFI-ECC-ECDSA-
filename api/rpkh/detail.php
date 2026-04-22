<?php
// api/rpkh/detail.php — Get RPKH detail with petak data
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

$id = $_GET['id'] ?? 0;
if (!$id) { echo json_encode(['status' => 'error', 'message' => 'ID tidak valid']); exit; }

$stmt = $pdo->prepare("SELECT r.*, u.nama as created_by_name FROM rpkh r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?");
$stmt->execute([$id]);
$rpkh = $stmt->fetch();

if (!$rpkh) { echo json_encode(['status' => 'error', 'message' => 'RPKH tidak ditemukan']); exit; }

$stmt = $pdo->prepare("SELECT * FROM rpkh_detail WHERE rpkh_id = ? ORDER BY id");
$stmt->execute([$id]);
$details = $stmt->fetchAll();

// Get related RTT
$stmt = $pdo->prepare("SELECT id, nomor_dokumen, tanggal, status FROM rtt WHERE rpkh_id = ? ORDER BY created_at DESC");
$stmt->execute([$id]);
$rtt_list = $stmt->fetchAll();

echo json_encode(['status' => 'success', 'data' => $rpkh, 'details' => $details, 'rtt_list' => $rtt_list]);
?>
