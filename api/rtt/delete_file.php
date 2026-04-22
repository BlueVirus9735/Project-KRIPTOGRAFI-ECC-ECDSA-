<?php
// api/rtt/delete_file.php — Delete peta or lampiran files
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$type = $data['type'] ?? ''; // 'peta' or 'lampiran'
$file_id = $data['file_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id FROM users WHERE session_token = ?");
$stmt->execute([$token]);
if (!$stmt->fetch()) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }

$table = $type === 'peta' ? 'rtt_peta' : 'rtt_lampiran';
$stmt = $pdo->prepare("SELECT file_path FROM $table WHERE id = ?");
$stmt->execute([$file_id]); $row = $stmt->fetch();

if ($row && $row['file_path']) {
    $fullpath = __DIR__ . '/../uploads/' . $row['file_path'];
    if (file_exists($fullpath)) @unlink($fullpath);
}

$pdo->prepare("DELETE FROM $table WHERE id = ?")->execute([$file_id]);
echo json_encode(['status'=>'success','message'=>'File berhasil dihapus']);
?>
