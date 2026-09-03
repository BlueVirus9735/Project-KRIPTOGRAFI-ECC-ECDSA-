<?php
// api/rtt/sign.php — Final step: Kepala Divisi ECDSA Signing
// REVISI: Verifikasi signature PHW + KPH, sign final Divisi, set status disahkan
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';
include __DIR__ . '/../crypto_utils.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['rtt_id'])) { echo json_encode(['status'=>'error','message'=>'ID RTT tidak ada']); exit; }
if (!isset($data['private_key'])) { echo json_encode(['status'=>'error','message'=>'Private Key Kepala Divisi wajib disertakan']); exit; }

$rtt_id           = $data['rtt_id'];
$user_id          = $data['user_id'] ?? null;
$private_key      = $data['private_key'];
$token            = $data['token'] ?? '';

// Auth check
$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if ($user && $user_id === null) $user_id = $user['id'];

// Get RTT
$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?"); $stmt->execute([$rtt_id]);
$rtt = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }

// Build canonical payload
$payload   = getCanonicalPayload($pdo, $rtt_id);
if (!$payload) { echo json_encode(['status'=>'error','message'=>'Gagal membuat payload']); exit; }
$json_data = encodeCanonicalJSON($payload);
$final_hash = hash('sha256', $json_data);

$temp_dir  = __DIR__ . '/../uploads/temp/';
if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
$python_exe = 'py';

// ===================================================
// STEP 1: Dekripsi payload dengan private key Divisi (untuk verifikasi bisa buka)
// ===================================================
$decrypt_ok = false;
if (!empty($rtt['encrypted_payload'])) {
    $uid        = uniqid('divdec_', true);
    $temp_key   = $temp_dir . $uid . '_key.pem';
    $temp_enc   = $temp_dir . $uid . '_payload.b64';
    $temp_plain = $temp_dir . $uid . '_plain.json';
    file_put_contents($temp_key, $private_key);
    file_put_contents($temp_enc, $rtt['encrypted_payload']);

    $dec_script = realpath(__DIR__ . '/../../crypto/decrypt_payload.py');
    $cmd = escapeshellarg($python_exe) . " " . escapeshellarg($dec_script)
         . " " . escapeshellarg($temp_key)
         . " " . escapeshellarg($temp_enc)
         . " " . escapeshellarg($temp_plain) . " 2>&1";
    $dec_out = shell_exec($cmd);
    @unlink($temp_key); @unlink($temp_enc);

    if (file_exists($temp_plain) && filesize($temp_plain) > 0) {
        $decrypt_ok = true;
        @unlink($temp_plain);
    } else {
        @unlink($temp_plain);
        echo json_encode(['status'=>'error','message'=>'Gagal mendekripsi dokumen. Pastikan private key Kepala Divisi yang benar digunakan.','detail'=>trim($dec_out)]);
        exit;
    }
}

// ===================================================
// STEP 2: Verifikasi Signature PHW (jika ada)
// ===================================================
$phw_sig_status = 'pending';
if (!empty($rtt['phw_signature']) && !empty($rtt['phw_public_key'])) {
    $verify_script = realpath(__DIR__ . '/../../crypto/verify.py');
    $uid2      = uniqid('phwv_', true);
    $temp_hash = $temp_dir . $uid2 . '.json';
    $temp_sig  = $temp_dir . $uid2 . '.sig';
    $temp_pub  = $temp_dir . $uid2 . '.pem';
    file_put_contents($temp_hash, $json_data);
    file_put_contents($temp_sig,  base64_decode($rtt['phw_signature']));
    file_put_contents($temp_pub,  $rtt['phw_public_key']);
    if ($verify_script) {
        $cmd_v = escapeshellarg($python_exe) . " " . escapeshellarg($verify_script)
               . " " . escapeshellarg($temp_pub)
               . " " . escapeshellarg($temp_hash)
               . " " . escapeshellarg($temp_sig) . " 2>&1";
        $out = shell_exec($cmd_v);
        $phw_sig_status = strpos($out, 'VALID') !== false && strpos($out, 'INVALID') === false ? 'valid' : 'invalid';
    }
    @unlink($temp_hash); @unlink($temp_sig); @unlink($temp_pub);
}

// ===================================================
// STEP 3: Verifikasi Signature KPH (jika ada)
// ===================================================
$kph_sig_status = 'pending';
if (!empty($rtt['kph_signature']) && !empty($rtt['kph_public_key'])) {
    $verify_script = realpath(__DIR__ . '/../../crypto/verify.py');
    $uid3      = uniqid('kphv_', true);
    $temp_hash3 = $temp_dir . $uid3 . '.json';
    $temp_sig3  = $temp_dir . $uid3 . '.sig';
    $temp_pub3  = $temp_dir . $uid3 . '.pem';
    file_put_contents($temp_hash3, $json_data);
    file_put_contents($temp_sig3,  base64_decode($rtt['kph_signature']));
    file_put_contents($temp_pub3,  $rtt['kph_public_key']);
    if ($verify_script) {
        $cmd_v3 = escapeshellarg($python_exe) . " " . escapeshellarg($verify_script)
                . " " . escapeshellarg($temp_pub3)
                . " " . escapeshellarg($temp_hash3)
                . " " . escapeshellarg($temp_sig3) . " 2>&1";
        $out3 = shell_exec($cmd_v3);
        $kph_sig_status = strpos($out3, 'VALID') !== false && strpos($out3, 'INVALID') === false ? 'valid' : 'invalid';
    }
    @unlink($temp_hash3); @unlink($temp_sig3); @unlink($temp_pub3);
}

// ===================================================
// STEP 4: ECDSA Sign final oleh Kepala Divisi
// ===================================================
$uid4      = uniqid('divsign_', true);
$temp_key4 = $temp_dir . $uid4 . '_key.pem';
$temp_dat4 = $temp_dir . $uid4 . '_data.json';
$temp_sig4 = $temp_dir . $uid4 . '_data.sig';
file_put_contents($temp_key4, $private_key);
file_put_contents($temp_dat4, $json_data);

$sign_script = realpath(__DIR__ . '/../../crypto/sign.py');
$cmd_s = escapeshellarg($python_exe) . " " . escapeshellarg($sign_script)
       . " " . escapeshellarg($temp_key4)
       . " " . escapeshellarg($temp_dat4)
       . " " . escapeshellarg($temp_sig4) . " 2>&1";
$sign_out = shell_exec($cmd_s);

if (!file_exists($temp_sig4) || filesize($temp_sig4) === 0) {
    @unlink($temp_key4); @unlink($temp_dat4);
    echo json_encode(['status'=>'error','message'=>'Gagal membuat tanda tangan ECDSA Kepala Divisi.','detail'=>trim($sign_out)]); exit;
}
$final_signature = base64_encode(file_get_contents($temp_sig4));

// Ekstrak public key Divisi
$divisi_public_key = '';
$res_key = openssl_pkey_get_private($private_key);
if ($res_key) { $det = openssl_pkey_get_details($res_key); if (isset($det['key'])) $divisi_public_key = $det['key']; }
@unlink($temp_key4); @unlink($temp_dat4); @unlink($temp_sig4);

// ===================================================
// STEP 5: Simpan & update status disahkan
// ===================================================
try {
    $pdo->beginTransaction();
    $pdo->prepare("UPDATE rtt SET
        status         = 'disahkan',
        hash           = ?,
        signature      = ?,
        public_key     = ?,
        encrypted_for  = 'admin',
        updated_at     = NOW()
        WHERE id = ?")
        ->execute([$final_hash, $final_signature, $divisi_public_key, $rtt_id]);

    $pdo->prepare("INSERT INTO validasi (rtt_id, status_kph, status_phw, status_divisi, catatan, validated_by, validated_at) VALUES (?,?,?,?,?,?,NOW())")
        ->execute([
            $rtt_id,
            1, // kph approved
            1, // phw approved
            1, // divisi approved (final)
            json_encode([
                'action'        => 'Pengesahan Final oleh Kepala Divisi',
                'kph_sig_valid' => $kph_sig_status,
                'phw_sig_valid' => $phw_sig_status,
                'final_hash'    => $final_hash,
            ]),
            $user_id
        ]);

    $pdo->commit();

    echo json_encode([
        'status'          => 'success',
        'message'         => 'RTT berhasil disahkan! Tanda tangan digital Kepala Divisi telah dibubuhkan.',
        'hash'            => $final_hash,
        'signature'       => substr($final_signature, 0, 50) . '...',
        'kph_sig_status'  => $kph_sig_status,
        'phw_sig_status'  => $phw_sig_status,
    ]);
} catch (Exception $dbEx) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['status'=>'error','message'=>'Database error: ' . $dbEx->getMessage()]);
}
?>
