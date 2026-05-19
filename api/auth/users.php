<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

include __DIR__ . '/../db.php';

// Helper: Verify token and get user
function getCurrentUser($pdo) {
    // Try multiple ways to get token
    $token = '';
    
    // Method 1: Authorization header
    $authHeader = '';
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    if (empty($authHeader)) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    }
    if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }
    
    // Method 2: Token from body JSON (for POST/PUT/DELETE)
    if (empty($token)) {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        $token = $data['token'] ?? '';
    }
    
    // Method 3: Token from query string (for GET requests)
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

// Helper: Check if user is SYSADMIN
function isSysadmin($user) {
    return $user && $user['role'] === 'sysadmin';
}

// Helper: Log audit (disabled sementara)
function logAudit($pdo, $userId, $action, $entityType, $entityId, $oldValues = null, $newValues = null) {
    // TODO: Fix audit_log table structure
    // Disabled temporarily due to column mismatch
    return;
}

$currentUser = getCurrentUser($pdo);

if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

if (!isSysadmin($currentUser)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Forbidden: Only SYSADMIN can manage users']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // List all users
        $stmt = $pdo->query("SELECT id, nama, username, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC");
        $users = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $users]);
        break;

    case 'POST':
        // Create new user
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['username']) || empty($data['password']) || empty($data['role']) || empty($data['nama'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Username, password, role, and nama are required']);
            exit;
        }
        
        $allowedRoles = ['sysadmin', 'kph', 'phw', 'direksi'];
        if (!in_array($data['role'], $allowedRoles)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid role']);
            exit;
        }
        
        try {
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (nama, username, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, 1)");
            $stmt->execute([
                $data['nama'],
                $data['username'],
                $data['email'] ?? null,
                $hashedPassword,
                $data['role']
            ]);
            
            $newUserId = $pdo->lastInsertId();
            logAudit($pdo, $currentUser['id'], 'CREATE', 'user', $newUserId, null, $data);
            
            echo json_encode(['status' => 'success', 'message' => 'User created successfully', 'id' => $newUserId]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                http_response_code(409);
                echo json_encode(['status' => 'error', 'message' => 'Username or email already exists']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Update user
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
            exit;
        }
        
        // Cannot modify own role (prevent locking yourself out)
        if ($data['id'] == $currentUser['id'] && isset($data['role']) && $data['role'] !== 'sysadmin') {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Cannot change your own SYSADMIN role']);
            exit;
        }
        
        // Get old data for audit
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$data['id']]);
        $oldData = $stmt->fetch();
        
        if (!$oldData) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
            exit;
        }
        
        $updates = [];
        $params = [];
        
        if (isset($data['nama'])) {
            $updates[] = "nama = ?";
            $params[] = $data['nama'];
        }
        if (isset($data['email'])) {
            $updates[] = "email = ?";
            $params[] = $data['email'];
        }
        if (isset($data['role'])) {
            $allowedRoles = ['sysadmin', 'kph', 'phw', 'direksi'];
            if (!in_array($data['role'], $allowedRoles)) {
                http_response_code(400);
                echo json_encode(['status' => 'error', 'message' => 'Invalid role']);
                exit;
            }
            $updates[] = "role = ?";
            $params[] = $data['role'];
        }
        if (isset($data['is_active'])) {
            $updates[] = "is_active = ?";
            $params[] = $data['is_active'] ? 1 : 0;
        }
        if (!empty($data['password'])) {
            $updates[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($updates)) {
            echo json_encode(['status' => 'success', 'message' => 'No changes made']);
            exit;
        }
        
        $params[] = $data['id'];
        $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            logAudit($pdo, $currentUser['id'], 'UPDATE', 'user', $data['id'], $oldData, $data);
            echo json_encode(['status' => 'success', 'message' => 'User updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete user
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'] ?? null;
        
        if (!$id) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
            exit;
        }
        
        // Cannot delete yourself
        if ($id == $currentUser['id']) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Cannot delete your own account']);
            exit;
        }
        
        // Get old data for audit
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $oldData = $stmt->fetch();
        
        if (!$oldData) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
            exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        
        logAudit($pdo, $currentUser['id'], 'DELETE', 'user', $id, $oldData, null);
        echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>
