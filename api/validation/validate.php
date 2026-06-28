<?php
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
$session_user = $stmt->fetch();
if (!$session_user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
$validated_by = $session_user['id'];

// Get RTT
$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }

    include_once __DIR__ . '/../crypto_utils.php';
    $payload = getCanonicalPayload($pdo, $rtt_id);
    if (!$payload) { echo json_encode(['status'=>'error','message'=>'Gagal membuat payload']); exit; }
    $json_data = encodeCanonicalJSON($payload);
    $calculated_hash = hash('sha256', $json_data);

    // ===== 1. VALIDASI HASH =====
    if ($calculated_hash === $rtt['hash']) {
        $status_hash = 'valid';
        $hash_detail = 'Hash SHA-256 cocok (' . substr($calculated_hash, 0, 16) . '...)';
    } else {
        $status_hash = 'invalid';
        $hash_detail = 'Hash TIDAK COCOK. Data di database telah diubah secara ilegal!';
        file_put_contents(__DIR__ . '/hash_mismatch.log', "ID: $rtt_id\nCalc: $calculated_hash\nDB: {$rtt['hash']}\nJSON: $json_data\n\n", FILE_APPEND);
    }

    // ===== 2. VALIDASI SIGNATURE =====
    $status_sig = 'pending';
    $sig_detail = 'Belum ditandatangani';
    if ($rtt['signature'] && $rtt['public_key']) {
        $python_exe = 'py';
        $verify_script = realpath(__DIR__ . '/../../crypto/verify.py');
        $temp_dir = __DIR__ . '/../uploads/temp/';
        if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
        
        $temp_hash = $temp_dir . 'hash_' . $rtt_id . '.json';
        $temp_sig  = $temp_dir . 'sig_' . $rtt_id . '.bin';
        $temp_pub  = $temp_dir . 'pub_' . $rtt_id . '.pem';
        
        file_put_contents($temp_hash, $json_data);
        file_put_contents($temp_sig, base64_decode($rtt['signature']));
        file_put_contents($temp_pub, $rtt['public_key']);
        
        if (file_exists($verify_script)) {
            $cmd = "\"$python_exe\" \"$verify_script\" \"$temp_pub\" \"$temp_hash\" \"$temp_sig\" 2>&1";
            $output = shell_exec($cmd);
            if (strpos($output, 'INVALID') !== false) {
                $status_sig = 'invalid';
            } elseif (strpos($output, 'VALID') !== false) {
                $status_sig = 'valid';
            } else {
                $status_sig = 'invalid';
            }
            $sig_detail = trim($output);
        }
        @unlink($temp_hash); @unlink($temp_sig); @unlink($temp_pub);
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

    // Save validation result to DB matching current schema
    $total_valid = ($status_hash === 'valid' && $status_sig === 'valid' && $status_relasi === 'valid') ? 1 : 0;
    $catatan_json = json_encode([
        'hash'=> $hash_detail, 
        'signature'=>$sig_detail, 
        'relasi'=>$relasi_detail,
        'technical_status' => ['hash' => $status_hash, 'sig' => $status_sig, 'relasi' => $status_relasi]
    ]);

    $stmt = $pdo->prepare("INSERT INTO validasi (rtt_id, status_kph, status_phw, status_divisi, catatan, validated_by, validated_at) VALUES (?,?,?,?,?,?,NOW())");
    $stmt->execute([
        $rtt_id, 
        1, // status_kph
        1, // status_phw
        $total_valid, // status_divisi = final technical validity
        $catatan_json,
        $validated_by // user yang sedang login
    ]);

    echo json_encode([
        'status' => 'success',
        'validasi' => [
            'hash' => ['status' => $status_hash, 'detail' => $hash_detail],
            'signature' => ['status' => $status_sig, 'detail' => $sig_detail],
            'relasi' => ['status' => $status_relasi, 'detail' => $relasi_detail],
        ]
    ]);
?>
