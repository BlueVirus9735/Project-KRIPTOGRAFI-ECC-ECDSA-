<?php
// api/rtt/upload_file.php — Upload peta or lampiran files for RTT
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$token = $_POST['token'] ?? '';
$rtt_id = $_POST['rtt_id'] ?? 0;
$type = $_POST['type'] ?? ''; // 'peta' or 'lampiran'
$keterangan = $_POST['keterangan'] ?? '';
$judul = $_POST['judul'] ?? '';

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status'=>'error','message'=>'File tidak ditemukan']); exit;
}

$file = $_FILES['file'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['pdf','jpg','jpeg','png','gif','bmp','tiff'];
if (!in_array($ext, $allowed)) {
    echo json_encode(['status'=>'error','message'=>'Format file tidak didukung']); exit;
}

$upload_dir = __DIR__ . '/../uploads/' . $type . '/';
if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

$filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($file['name']));
$filepath = $upload_dir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    echo json_encode(['status'=>'error','message'=>'Gagal menyimpan file']); exit;
}

$relative_path = $type . '/' . $filename;

if ($type === 'peta') {
    $stmt = $pdo->prepare("INSERT INTO rtt_peta (rtt_id, file_path) VALUES (?,?)");
    $stmt->execute([$rtt_id, $relative_path]);
} elseif ($type === 'lampiran') {
    $stmt = $pdo->prepare("INSERT INTO rtt_lampiran (rtt_id, judul, keterangan, file_path) VALUES (?,?,?,?)");
    $stmt->execute([$rtt_id, $judul, $keterangan, $relative_path]);
} elseif ($type === 'peta_bap') {
    $stmt = $pdo->prepare("INSERT INTO rtt_peta_bap (rtt_id, file_path, keterangan) VALUES (?,?,?)");
    $stmt->execute([$rtt_id, $relative_path, $keterangan]);
}

echo json_encode(['status'=>'success','message'=>'File berhasil diupload','file_path'=>$relative_path,'id'=>$pdo->lastInsertId()]);
?>
