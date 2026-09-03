<?php
// api/auth/update_public_key.php — Pengajuan Public Key ke Administrator (CA)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$public_key = trim($data['public_key'] ?? '');

if (!$token) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Token tidak ada']); exit; }
if (!$public_key) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Public key tidak boleh kosong']); exit; }

// Validasi token
$stmt = $pdo->prepare("SELECT id, role, username FROM users WHERE session_token = ?");
$stmt->execute([$token]);
$user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }

// Validasi format PEM
if (strpos($public_key, '-----BEGIN PUBLIC KEY-----') === false) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Format public key tidak valid. Harus PEM (-----BEGIN PUBLIC KEY-----)']);
    exit;
}

// Jika user adalah sysadmin, kunci bisa langsung di-approve otomatis
if ($user['role'] === 'sysadmin') {
    $stmt = $pdo->prepare("UPDATE users SET public_key = ?, pending_public_key = NULL, key_status = 'approved', key_approved_at = NOW(), key_approved_by = ? WHERE id = ?");
    $stmt->execute([$public_key, $user['id'], $user['id']]);

    echo json_encode([
        'status' => 'success',
        'key_status' => 'approved',
        'message' => 'Public key Administrator berhasil diverifikasi dan diaktifkan secara langsung!',
        'user_id' => $user['id'],
        'role' => $user['role']
    ]);
    exit;
}

// Untuk role pengguna lain (kph, phw, divisi, admin, dll.):
// Kunci masuk ke status PENDING dan menunggu persetujuan Sysadmin (CA)
$stmt = $pdo->prepare("UPDATE users SET pending_public_key = ?, key_status = 'pending', key_requested_at = NOW() WHERE id = ?");
$stmt->execute([$public_key, $user['id']]);

echo json_encode([
    'status' => 'success',
    'key_status' => 'pending',
    'message' => 'Pengajuan Public Key berhasil dikirim! Menunggu verifikasi dan persetujuan dari Administrator (Otoritas CA). Kunci belum dapat digunakan sampai disetujui.',
    'user_id' => $user['id'],
    'role' => $user['role']
]);
?>
