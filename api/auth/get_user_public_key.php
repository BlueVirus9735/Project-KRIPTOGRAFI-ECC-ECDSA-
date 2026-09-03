<?php
// api/auth/get_user_public_key.php — Ambil public key user yang telah disetujui (Approved) oleh CA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

// Bisa via GET atau POST
$token = $_GET['token'] ?? (json_decode(file_get_contents('php://input'), true)['token'] ?? '');
$role  = $_GET['role']  ?? (json_decode(file_get_contents('php://input'), true)['role']  ?? '');

if (!$token) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Token tidak ada']); exit; }

$stmt = $pdo->prepare("SELECT id FROM users WHERE session_token = ?");
$stmt->execute([$token]);
if (!$stmt->fetch()) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }

if (!$role) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Role tidak ada']); exit; }

// Cek apakah ada user dengan role ini yang kuncinya pending
$stmt_pending = $pdo->prepare("SELECT id, username, role FROM users WHERE role = ? AND key_status = 'pending' LIMIT 1");
$stmt_pending->execute([$role]);
$pending_user = $stmt_pending->fetch(PDO::FETCH_ASSOC);

// Ambil public key yang sudah disetujui (Approved)
$stmt = $pdo->prepare("SELECT id, username, role, public_key, key_status FROM users WHERE role = ? AND public_key IS NOT NULL AND key_status = 'approved' LIMIT 1");
$stmt->execute([$role]);
$target_user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$target_user) {
    if ($pending_user) {
        echo json_encode([
            'status' => 'error',
            'message' => "User dengan role '$role' ({$pending_user['username']}) telah mengajukan public key, namun statusnya masih MENUNGGU PERSETUJUAN Administrator (CA). Hubungi Administrator untuk melakukan persetujuan kunci terlebih dahulu."
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => "User dengan role '$role' belum memiliki public key yang disetujui. Minta user tersebut untuk mengajukan key pair di halaman Settings dan disetujui Administrator."
        ]);
    }
    exit;
}

echo json_encode([
    'status' => 'success',
    'user_id' => $target_user['id'],
    'username' => $target_user['username'],
    'role' => $target_user['role'],
    'public_key' => $target_user['public_key'],
    'key_status' => $target_user['key_status']
]);
?>
