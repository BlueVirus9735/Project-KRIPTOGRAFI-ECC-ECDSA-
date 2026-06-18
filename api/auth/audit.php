<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include __DIR__ . '/../db.php';

function getCurrentUser($pdo) {
    $token = '';

    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }

    if (empty($token)) {
        $token = $_GET['token'] ?? '';
    }
    
    if (empty($token)) {
        return null;
    }
    
    $stmt = $pdo->prepare("SELECT id, username, role, nama FROM users WHERE session_token = ? AND is_active = 1");
    $stmt->execute([$token]);
    return $stmt->fetch();
}

$currentUser = getCurrentUser($pdo);

if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

if ($currentUser['role'] !== 'sysadmin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Only SYSADMIN can view audit logs']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':

        $stmt = $pdo->query("
            SELECT a.*, u.username, u.nama 
            FROM audit_log a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT 100
        ");
        $logs = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $logs]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>
