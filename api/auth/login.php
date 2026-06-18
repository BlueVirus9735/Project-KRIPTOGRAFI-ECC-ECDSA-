<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (!$username || !$password) {
    echo json_encode(['status' => 'error', 'message' => 'Username dan password harus diisi']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, username, nama, password, role FROM users WHERE username = ? AND is_active = 1");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Username tidak ditemukan di database']);
    exit;
}

if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Username atau password salah']);
    exit;
}

$token = bin2hex(random_bytes(32));
$stmt = $pdo->prepare("UPDATE users SET session_token = ?, last_login = NOW() WHERE id = ?")->execute([$token, $user['id']]);

echo json_encode([
    'status' => 'success',
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'nama' => $user['nama'],
        'role' => $user['role']
    ]
]);
?>
