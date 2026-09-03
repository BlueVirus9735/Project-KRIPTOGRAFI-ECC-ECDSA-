<?php
// api/rtt/serve_file.php — Transparently decrypts and serves at-rest encrypted files
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$post_data = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    $json = json_decode($raw_input, true);
    if (is_array($json)) {
        $post_data = $json;
    }
}

// Basic auth check
$token = $_REQUEST['token'] ?? $post_data['token'] ?? '';
if (!$token) {
    http_response_code(401);
    die("Unauthorized");
}

require_once __DIR__ . '/../db.php';
$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]);
$user = $stmt->fetch();
if (!$user) {
    http_response_code(401);
    die("Sesi tidak valid");
}

$path = $_REQUEST['path'] ?? $post_data['path'] ?? '';
if (!$path || strpos($path, '..') !== false) {
    http_response_code(400);
    die("Invalid path");
}

$file = realpath(__DIR__ . '/../uploads/' . $path);
if (!$file || !file_exists($file)) {
    http_response_code(404);
    die("File not found");
}

$is_enc = str_ends_with($path, '.enc');
$original_ext = strtolower(pathinfo(preg_replace('/\.enc$/', '', $path), PATHINFO_EXTENSION));
$mime_types = [
    'pdf' => 'application/pdf',
    'jpg' => 'image/jpeg',
    'jpeg'=> 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif'
];
$mime = $mime_types[$original_ext] ?? 'application/octet-stream';
$filename = basename(preg_replace('/\.enc$/', '', $path));

// If file is not encrypted, serve directly
if (!$is_enc) {
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($file));
    header('Content-Disposition: inline; filename="' . $filename . '"');
    readfile($file);
    exit;
}

// Temp file for decrypted output
$temp_file = tempnam(sys_get_temp_dir(), 'dec_');
$python_script = realpath(__DIR__ . '/../../crypto/decrypt.py');
$python_exe = 'py';

// Keys to try:
$keys_to_try = [];

// 1. User supplied key if any (from GET or POST)
$supplied_key = $_REQUEST['key'] ?? $post_data['key'] ?? '';
if (!empty($supplied_key)) {
    $keys_to_try[] = trim($supplied_key);
}

// 2. System private key
$system_priv_key_path = realpath(__DIR__ . '/../keys/system_keys/private_key.pem');
if ($system_priv_key_path && file_exists($system_priv_key_path)) {
    $keys_to_try[] = file_get_contents($system_priv_key_path);
}

$decrypted = false;
foreach ($keys_to_try as $priv_content) {
    $temp_key = tempnam(sys_get_temp_dir(), 'k_');
    file_put_contents($temp_key, $priv_content);

    $cmd = escapeshellarg($python_exe) . " " . escapeshellarg($python_script) . " " . escapeshellarg($temp_key) . " " . escapeshellarg($file) . " " . escapeshellarg($temp_file) . " 2>&1";
    shell_exec($cmd);
    @unlink($temp_key);

    if (file_exists($temp_file) && filesize($temp_file) > 0) {
        $decrypted = true;
        break;
    }
}

if ($decrypted && file_exists($temp_file) && filesize($temp_file) > 0) {
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($temp_file));
    header('Content-Disposition: inline; filename="' . $filename . '"');
    readfile($temp_file);
    @unlink($temp_file);
    exit;
} else {
    // If decryption fails, offer downloading the encrypted file directly
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . filesize($file));
    header('Content-Disposition: attachment; filename="' . basename($path) . '"');
    readfile($file);
    exit;
}
?>
