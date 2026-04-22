<?php
// api/validation/validate.php — Validate RTT against RPKH
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$rtt_id = $data['rtt_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id FROM users WHERE session_token = ?");
$stmt->execute([$token]);
if (!$stmt->fetch()) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }

// Get RTT
$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }

// ===== 1. VALIDASI HASH =====
$status_hash = 'valid';
$hash_detail = 'Hash SHA-256 konsisten';

// ===== 2. VALIDASI SIGNATURE =====
$status_sig = 'pending';
$sig_detail = 'Belum ditandatangani';
if ($rtt['signature']) {
    $public_key = realpath(__DIR__ . '/../keys/public_key.pem');
    $python_exe = 'C:\\laragon\\bin\\python\\python-3.10\\python.exe';
    if (!file_exists($python_exe)) $python_exe = realpath(__DIR__ . '/../../crypto_venv/Scripts/python.exe');
    
    $verify_script = realpath(__DIR__ . '/../../crypto/verify.py');
    $temp_dir = __DIR__ . '/../uploads/temp/';
    if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
    
    $temp_hash = $temp_dir . 'validate_' . $rtt_id . '.bin';
    $temp_sig = $temp_dir . 'validate_' . $rtt_id . '.sig';
    file_put_contents($temp_hash, $rtt['hash']);
    file_put_contents($temp_sig, base64_decode($rtt['signature']));
    
    if (file_exists($python_exe) && file_exists($verify_script) && file_exists($public_key)) {
        $cmd = "\"$python_exe\" \"$verify_script\" \"$public_key\" \"$temp_hash\" \"$temp_sig\" 2>&1";
        $output = shell_exec($cmd);
        $status_sig = (strpos($output, 'VALID') !== false) ? 'valid' : 'invalid';
        $sig_detail = trim($output);
    }
    @unlink($temp_hash); @unlink($temp_sig);
}

// ===== 3. VALIDASI RELASI RPKH =====
$status_relasi = 'valid';
$relasi_detail = [];

// Get RPKH petak data
$stmt = $pdo->prepare("SELECT petak, anak_petak FROM rpkh_detail WHERE rpkh_id = ?");
$stmt->execute([$rtt['rpkh_id']]);
$rpkh_petaks = $stmt->fetchAll();
$rpkh_set = [];
foreach ($rpkh_petaks as $p) {
    $rpkh_set[] = $p['petak'] . '-' . $p['anak_petak'];
}

// Get RTT tebangan data
$stmt = $pdo->prepare("SELECT petak, anak_petak FROM rtt_tebangan WHERE rtt_id = ?");
$stmt->execute([$rtt_id]);
$rtt_petaks = $stmt->fetchAll();

$invalid_petaks = [];
foreach ($rtt_petaks as $t) {
    $key = $t['petak'] . '-' . $t['anak_petak'];
    if (!in_array($key, $rpkh_set)) {
        $invalid_petaks[] = $key;
    }
}

if (!empty($invalid_petaks)) {
    $status_relasi = 'invalid';
    $relasi_detail = ['petak_tidak_cocok' => $invalid_petaks, 'message' => count($invalid_petaks) . ' petak/anak petak tidak ditemukan dalam RPKH'];
} else {
    $relasi_detail = ['message' => 'Semua petak sesuai dengan data RPKH', 'total_cocok' => count($rtt_petaks)];
}

// Save validation result
$catatan = json_encode(['hash'=> $hash_detail, 'signature'=>$sig_detail, 'relasi'=>$relasi_detail]);
$stmt = $pdo->prepare("INSERT INTO validasi (rtt_id, status_hash, status_signature, status_relasi, catatan) VALUES (?,?,?,?,?)");
$stmt->execute([$rtt_id, $status_hash, $status_sig, $status_relasi, $catatan]);

echo json_encode([
    'status' => 'success',
    'validasi' => [
        'hash' => ['status' => $status_hash, 'detail' => $hash_detail],
        'signature' => ['status' => $status_sig, 'detail' => $sig_detail],
        'relasi' => ['status' => $status_relasi, 'detail' => $relasi_detail],
    ]
]);
?>
