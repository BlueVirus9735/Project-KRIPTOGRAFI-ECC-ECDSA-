<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }
include 'db.php';

// Support GET and POST
$token = $_GET['token'] ?? '';
if (!$token) {
    $data = json_decode(file_get_contents("php://input"));
    $token = $data->token ?? '';
}

if ($token) {
    $stmt = $pdo->prepare("SELECT id, username, nama, role, public_key, pending_public_key, key_status, key_requested_at, key_approved_at FROM users WHERE session_token = ?");
    $stmt->execute([$token]);
    if ($user = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['status' => 'success', 'user' => $user]);
        exit;
    }
}
echo json_encode(['status' => 'error', 'message' => 'Invalid token']);
?>
