<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$rtt_id = $data['rtt_id'] ?? 0;
$action = $data['action'] ?? '';
$catatan = $data['catatan'] ?? '';

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
if ($user['role'] !== 'phw' && $user['role'] !== 'sysadmin') { echo json_encode(['status'=>'error','message'=>'Hanya PHW/Admin yang bisa mereview']); exit; }

$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }
if ($rtt['status'] !== 'menunggu_verifikasi_phw') { echo json_encode(['status'=>'error','message'=>'RTT tidak dalam status review']); exit; }

if ($action === 'approve') {
    $pdo->prepare("UPDATE rtt SET status='menunggu_pengesahan', edited_by_admin=? WHERE id=?")->execute([$user['id'], $rtt_id]);
    echo json_encode(['status'=>'success','message'=>'RTT disetujui, menunggu pengesahan Direksi']);
} elseif ($action === 'reject') {
    $pdo->prepare("UPDATE rtt SET status='revisi_phw' WHERE id=?")->execute([$rtt_id]);
    echo json_encode(['status'=>'success','message'=>'RTT dikembalikan untuk revisi. Catatan: ' . $catatan]);
} else {
    echo json_encode(['status'=>'error','message'=>'Action tidak valid (approve/reject)']);
}
?>
