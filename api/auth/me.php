<?php
// api/auth/me.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';

if (!$token) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Token tidak ditemukan']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, username, nama, role FROM users WHERE session_token = ? AND is_active = 1");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Sesi tidak valid']);
    exit;
}

echo json_encode(['status' => 'success', 'user' => $user]);
?>
