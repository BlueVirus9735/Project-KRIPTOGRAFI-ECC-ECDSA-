<?php
// api/rtt/serve_file.php — Transparently decrypts and serves at-rest encrypted files
header('Access-Control-Allow-Origin: *');

// Basic auth check
$token = $_GET['token'] ?? '';
if (!$token) {
    http_response_code(401);
    die("Unauthorized");
}

require_once __DIR__ . '/../db.php';
$stmt = $pdo->prepare("SELECT id FROM users WHERE session_token = ?");
$stmt->execute([$token]);
$user = $stmt->fetch();
if (!$user) {
    http_response_code(401);
    die("Sesi tidak valid");
}

$path = $_GET['path'] ?? '';
if (!$path || strpos($path, '..') !== false) {
    http_response_code(400);
    die("Invalid path");
}

$encrypted_file = realpath(__DIR__ . '/../uploads/' . $path);
if (!$encrypted_file || !file_exists($encrypted_file)) {
    http_response_code(404);
    die("File not found");
}

// Temp file for decrypted output
$temp_file = tempnam(sys_get_temp_dir(), 'dec_');

$system_priv_key = realpath(__DIR__ . '/../keys/system_keys/private_key.pem');
$python_script = realpath(__DIR__ . '/../../crypto/decrypt.py');

$cmd = escapeshellcmd("python") . " " . escapeshellarg($python_script) . " " . escapeshellarg($system_priv_key) . " " . escapeshellarg($encrypted_file) . " " . escapeshellarg($temp_file) . " 2>&1";
shell_exec($cmd);

if (file_exists($temp_file) && filesize($temp_file) > 0) {
    $original_ext = strtolower(pathinfo(preg_replace('/\.enc$/', '', $path), PATHINFO_EXTENSION));
    $mime_types = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg'=> 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif'
    ];
    $mime = $mime_types[$original_ext] ?? 'application/octet-stream';
    
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($temp_file));
    header('Content-Disposition: inline; filename="' . basename(preg_replace('/\.enc$/', '', $path)) . '"');
    
    readfile($temp_file);
    unlink($temp_file);
} else {
    http_response_code(500);
    die("Gagal mendekripsi file.");
}
?>
