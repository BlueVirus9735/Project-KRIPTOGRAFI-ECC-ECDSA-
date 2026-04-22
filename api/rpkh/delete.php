<?php
// api/rpkh/delete.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';
$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$rpkh_id = $data['rpkh_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }

// Check if any RTT is linked
$stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM rtt WHERE rpkh_id = ?");
$stmt->execute([$rpkh_id]); $cnt = $stmt->fetch()['cnt'];
if ($cnt > 0) { echo json_encode(['status'=>'error','message'=>'Tidak bisa dihapus, sudah ada '.$cnt.' RTT terkait']); exit; }

$pdo->prepare("DELETE FROM rpkh WHERE id = ?")->execute([$rpkh_id]);
echo json_encode(['status' => 'success', 'message' => 'RPKH berhasil dihapus']);
?>
