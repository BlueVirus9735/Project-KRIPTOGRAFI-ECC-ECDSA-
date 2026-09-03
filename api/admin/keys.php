<?php
// api/admin/keys.php — Otoritas Kunci (CA) Management API untuk Sysadmin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

// Verifikasi sesi dan role sysadmin
$token = $_GET['token'] ?? '';
if (!$token) {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = $input['token'] ?? '';
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['status'=>'error','message'=>'Token tidak ditemukan']);
    exit;
}

$stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE session_token = ? AND is_active = 1");
$stmt->execute([$token]);
$admin = $stmt->fetch();

if (!$admin || $admin['role'] !== 'sysadmin') {
    http_response_code(403);
    echo json_encode(['status'=>'error','message'=>'Akses ditolak: Hanya SYSADMIN (Otoritas CA) yang dapat mengelola kunci']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Ambil daftar seluruh user beserta status kuncinya
    $stmt = $pdo->query("
        SELECT 
            u.id, u.nama, u.username, u.role, u.wilayah_kph, u.wilayah_phw,
            u.key_status, u.public_key, u.pending_public_key,
            u.key_requested_at, u.key_approved_at, u.key_approved_by,
            approver.username as approver_username
        FROM users u
        LEFT JOIN users approver ON u.key_approved_by = approver.id
        ORDER BY 
            CASE 
                WHEN u.key_status = 'pending' THEN 1 
                WHEN u.key_status = 'approved' THEN 2 
                ELSE 3 
            END,
            u.key_requested_at DESC
    ");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $users
    ]);
    exit;
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $target_user_id = $data['user_id'] ?? 0;
    $action = $data['action'] ?? ''; // 'approve' | 'reject' | 'revoke'

    if (!$target_user_id || !$action) {
        http_response_code(400);
        echo json_encode(['status'=>'error','message'=>'User ID dan aksi wajib disertakan']);
        exit;
    }

    // Cek target user
    $stmt = $pdo->prepare("SELECT id, username, role, pending_public_key, public_key, key_status FROM users WHERE id = ?");
    $stmt->execute([$target_user_id]);
    $target = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$target) {
        http_response_code(404);
        echo json_encode(['status'=>'error','message'=>'User tidak ditemukan']);
        exit;
    }

    if ($action === 'approve') {
        if (empty($target['pending_public_key'])) {
            http_response_code(400);
            echo json_encode(['status'=>'error','message'=>'User tidak memiliki permohonan public key yang pending']);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE users 
            SET public_key = pending_public_key, 
                pending_public_key = NULL, 
                key_status = 'approved', 
                key_approved_at = NOW(), 
                key_approved_by = ? 
            WHERE id = ?
        ");
        $stmt->execute([$admin['id'], $target_user_id]);

        echo json_encode([
            'status' => 'success',
            'message' => "Public key untuk user '{$target['username']}' berhasil disetujui (Approved) dan telah aktif di sistem."
        ]);
        exit;
    }

    if ($action === 'reject') {
        $stmt = $pdo->prepare("
            UPDATE users 
            SET pending_public_key = NULL, 
                key_status = 'rejected' 
            WHERE id = ?
        ");
        $stmt->execute([$target_user_id]);

        echo json_encode([
            'status' => 'success',
            'message' => "Pengajuan public key untuk user '{$target['username']}' telah ditolak (Rejected)."
        ]);
        exit;
    }

    if ($action === 'revoke') {
        // Cabut kunci yang sudah aktif
        $stmt = $pdo->prepare("
            UPDATE users 
            SET public_key = NULL, 
                pending_public_key = NULL, 
                key_status = 'none',
                key_approved_at = NULL,
                key_approved_by = NULL
            WHERE id = ?
        ");
        $stmt->execute([$target_user_id]);

        echo json_encode([
            'status' => 'success',
            'message' => "Public key untuk user '{$target['username']}' telah dicabut (Revoked). User harus mengajukan key pair baru."
        ]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Aksi tidak dikenal']);
    exit;
}
?>
