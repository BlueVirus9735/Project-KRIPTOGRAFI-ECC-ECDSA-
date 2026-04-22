<?php
// api/rtt/submit.php — Submit RTT for review (KPH → PHW)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$rtt_id = $data['rtt_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
// RBAC: Admin, KPH, atau sysadmin boleh submit RTT
if ($user['role'] !== 'kph' && $user['role'] !== 'admin' && $user['role'] !== 'sysadmin') { 
    echo json_encode(['status'=>'error','message'=>'Hanya Admin Tata Usaha atau KPH yang bisa mengirim RTT']); 
    exit; 
}

$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }
if (!in_array($rtt['status'], ['draft','revisi'])) { echo json_encode(['status'=>'error','message'=>'RTT sudah disubmit sebelumnya']); exit; }

$pdo->prepare("UPDATE rtt SET status = 'menunggu_review_phw' WHERE id = ?")->execute([$rtt_id]);
echo json_encode(['status'=>'success','message'=>'RTT berhasil dikirim untuk review PHW']);
?>
