<?php
// api/validation/validate.php
// REVISI: PHW input private key -> dekripsi -> verif KPH signature -> verif hash -> approve -> PHW sign + re-enkripsi untuk Divisi
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token       = $data['token'] ?? '';
$rtt_id      = $data['rtt_id'] ?? 0;
$private_key = trim($data['private_key'] ?? '');
$action      = $data['action'] ?? 'validate'; // validate | approve | reject

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]);
$session_user = $stmt->fetch();
if (!$session_user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
if ($session_user['role'] !== 'phw' && $session_user['role'] !== 'sysadmin') {
    http_response_code(403); echo json_encode(['status'=>'error','message'=>'Hanya PHW yang bisa melakukan validasi']); exit;
}
$validated_by = $session_user['id'];

if (!$private_key) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Private key PHW wajib disertakan untuk mendekripsi dan memverifikasi dokumen.']); exit;
}

// Get RTT
$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }

// Siapkan temp dir
$temp_dir = __DIR__ . '/../uploads/temp/';
if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
$python_exe = 'py';

// ===================================================
// STEP 1: DEKRIPSI PAYLOAD dengan private key PHW
// ===================================================
$decrypted_json = null;
$status_decrypt = 'error';
$decrypt_detail = 'Belum didekripsi';

if (!empty($rtt['encrypted_payload'])) {
    $uid        = uniqid('phwdec_', true);
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
        $decrypted_json = file_get_contents($temp_plain);
        @unlink($temp_plain);
        $status_decrypt = 'success';
        $decrypt_detail = 'Payload berhasil didekripsi dengan private key PHW';
    } else {
        @unlink($temp_plain);
        $status_decrypt = 'error';
        $decrypt_detail = 'Gagal mendekripsi. Pastikan private key PHW yang benar digunakan. Detail: ' . trim($dec_out);
        echo json_encode(['status'=>'error','message'=>$decrypt_detail]); exit;
    }
}

// ===================================================
// STEP 2: VALIDASI HASH (integritas data)
// ===================================================
include_once __DIR__ . '/../crypto_utils.php';
$payload = getCanonicalPayload($pdo, $rtt_id);
$json_data = encodeCanonicalJSON($payload);
$calculated_hash = hash('sha256', $json_data);

if (empty($rtt['kph_hash'])) {
    $status_hash = 'pending';
    $hash_detail = 'Dokumen belum ditandatangani oleh KPH.';
} elseif ($calculated_hash === $rtt['kph_hash']) {
    $status_hash = 'valid';
    $hash_detail = 'Hash SHA-256 cocok (' . substr($calculated_hash, 0, 16) . '...) — Data tidak diubah sejak KPH submit.';
} else {
    $status_hash = 'invalid';
    $hash_detail = 'Hash TIDAK COCOK! Data di database telah diubah setelah KPH submit.';
    file_put_contents(__DIR__ . '/hash_mismatch.log', "ID: $rtt_id\nCalc: $calculated_hash\nDB: {$rtt['kph_hash']}\n\n", FILE_APPEND);
}

// ===================================================
// STEP 3: VERIFIKASI SIGNATURE ECDSA KPH
// ===================================================
$status_sig = 'pending';
$sig_detail = 'Dokumen belum ditandatangani oleh KPH.';

if (!empty($rtt['kph_signature']) && !empty($rtt['kph_public_key'])) {
    $verify_script = realpath(__DIR__ . '/../../crypto/verify.py');
    $uid2      = uniqid('sigv_', true);
    $temp_hash = $temp_dir . $uid2 . '.json';
    $temp_sig  = $temp_dir . $uid2 . '.sig';
    $temp_pub  = $temp_dir . $uid2 . '.pem';

    file_put_contents($temp_hash, $json_data);
    file_put_contents($temp_sig,  base64_decode($rtt['kph_signature']));
    file_put_contents($temp_pub,  $rtt['kph_public_key']);

    if ($verify_script) {
        $cmd_v = escapeshellarg($python_exe) . " " . escapeshellarg($verify_script)
               . " " . escapeshellarg($temp_pub)
               . " " . escapeshellarg($temp_hash)
               . " " . escapeshellarg($temp_sig) . " 2>&1";
        $verify_out = shell_exec($cmd_v);

        if (strpos($verify_out, 'INVALID') !== false) {
            $status_sig = 'invalid';
            $sig_detail = 'ECDSA KPH TIDAK VALID — Dokumen mungkin telah dimanipulasi!';
        } elseif (strpos($verify_out, 'VALID') !== false) {
            $status_sig = 'valid';
            $sig_detail = 'ECDSA KPH VALID — Dokumen asli, tidak diubah sejak KPH submit.';
        } else {
            $status_sig = 'invalid';
            $sig_detail = 'Tidak dapat memverifikasi tanda tangan KPH. ' . trim($verify_out);
        }
    }
    @unlink($temp_hash); @unlink($temp_sig); @unlink($temp_pub);
}

// ===================================================
// STEP 4: VALIDASI RELASI RPKH
// ===================================================
$status_relasi = 'valid';
$relasi_detail = [];
$stmt = $pdo->prepare("SELECT petak, anak_petak FROM rpkh_detail WHERE rpkh_id = ?");
$stmt->execute([$rtt['rpkh_id']]); $rpkh_petaks = $stmt->fetchAll();
$rpkh_set = [];
foreach ($rpkh_petaks as $p) $rpkh_set[] = $p['petak'] . '-' . $p['anak_petak'];
$stmt = $pdo->prepare("SELECT petak, anak_petak FROM rtt_tebangan WHERE rtt_id = ?");
$stmt->execute([$rtt_id]); $rtt_petaks = $stmt->fetchAll();
$invalid_petaks = [];
foreach ($rtt_petaks as $t) {
    if (!in_array($t['petak'] . '-' . $t['anak_petak'], $rpkh_set)) $invalid_petaks[] = $t['petak'] . '-' . $t['anak_petak'];
}
if (!empty($invalid_petaks)) {
    $status_relasi = 'invalid';
    $relasi_detail = ['petak_tidak_cocok'=>$invalid_petaks,'message'=>count($invalid_petaks).' petak tidak ditemukan dalam RPKH'];
} else {
    $relasi_detail = ['message'=>'Semua petak sesuai dengan data RPKH','total_cocok'=>count($rtt_petaks)];
}

// ===================================================
// STEP 5: JIKA ACTION = APPROVE — PHW Sign + Re-enkripsi untuk Divisi
// ===================================================
$phw_signature = null;
$phw_public_key = '';
$new_encrypted_payload = null;

if ($action === 'approve') {
    if ($status_sig === 'invalid' || $status_hash === 'invalid') {
        echo json_encode(['status'=>'error','message'=>'Tidak bisa approve: tanda tangan atau hash KPH tidak valid!']); exit;
    }

    // PHW sign
    $uid3      = uniqid('phwsign_', true);
    $temp_key3 = $temp_dir . $uid3 . '_key.pem';
    $temp_dat3 = $temp_dir . $uid3 . '_data.json';
    $temp_sig3 = $temp_dir . $uid3 . '_data.sig';

    file_put_contents($temp_key3, $private_key);
    file_put_contents($temp_dat3, $json_data);

    $sign_script = realpath(__DIR__ . '/../../crypto/sign.py');
    $cmd_s = escapeshellarg($python_exe) . " " . escapeshellarg($sign_script)
           . " " . escapeshellarg($temp_key3)
           . " " . escapeshellarg($temp_dat3)
           . " " . escapeshellarg($temp_sig3) . " 2>&1";
    $cmd_s_out = shell_exec($cmd_s);

    if (!file_exists($temp_sig3) || filesize($temp_sig3) === 0) {
        @unlink($temp_key3); @unlink($temp_dat3);
        echo json_encode(['status'=>'error','message'=>'Gagal membuat tanda tangan ECDSA PHW. Cek private key yang digunakan.','detail'=>trim($cmd_s_out)]); exit;
    }

    $phw_signature_b64 = base64_encode(file_get_contents($temp_sig3));
    $phw_hash_val      = hash('sha256', $json_data);
    $res_key = openssl_pkey_get_private($private_key);
    if ($res_key) { $det = openssl_pkey_get_details($res_key); if (isset($det['key'])) $phw_public_key = $det['key']; }
    @unlink($temp_key3); @unlink($temp_dat3); @unlink($temp_sig3);

    // Ambil public key Divisi / Direksi (yang sudah disetujui CA)
    $stmt = $pdo->prepare("SELECT id, public_key, key_status FROM users WHERE role IN ('divisi', 'direksi') AND public_key IS NOT NULL AND key_status = 'approved' LIMIT 1");
    $stmt->execute(); $divisi_user = $stmt->fetch();
    if (!$divisi_user || empty($divisi_user['public_key'])) {
        $stmt_pd = $pdo->prepare("SELECT id, username FROM users WHERE role IN ('divisi', 'direksi') AND key_status = 'pending' LIMIT 1");
        $stmt_pd->execute(); $pd_user = $stmt_pd->fetch();
        if ($pd_user) {
            echo json_encode(['status'=>'error','message'=>'Public key Kepala Divisi / Direksi (' . $pd_user['username'] . ') sedang menunggu persetujuan Administrator (CA). Hubungi Administrator untuk menyetujui kunci terlebih dahulu.']);
        } else {
            echo json_encode(['status'=>'error','message'=>'User Kepala Divisi / Direksi belum memiliki public key yang disetujui. Minta Kepala Divisi untuk mengajukan key pair di halaman Settings dan disetujui Administrator.']);
        }
        exit;
    }


    // Enkripsi payload untuk Divisi
    $uid4       = uniqid('divenc_', true);
    $temp_pub4  = $temp_dir . $uid4 . '_div_pub.pem';
    $temp_pl4   = $temp_dir . $uid4 . '_plain.json';
    $temp_ci4   = $temp_dir . $uid4 . '_cipher.b64';
    file_put_contents($temp_pub4, $divisi_user['public_key']);
    file_put_contents($temp_pl4,  $json_data);

    $enc_script = realpath(__DIR__ . '/../../crypto/encrypt_payload.py');
    $cmd_e = escapeshellarg($python_exe) . " " . escapeshellarg($enc_script)
           . " " . escapeshellarg($temp_pub4)
           . " " . escapeshellarg($temp_pl4)
           . " " . escapeshellarg($temp_ci4) . " 2>&1";
    shell_exec($cmd_e);

    if (!file_exists($temp_ci4) || filesize($temp_ci4) === 0) {
        @unlink($temp_pub4); @unlink($temp_pl4);
        echo json_encode(['status'=>'error','message'=>'Gagal mengenkripsi payload untuk Kepala Divisi.']); exit;
    }
    $new_encrypted_payload = file_get_contents($temp_ci4);
    @unlink($temp_pub4); @unlink($temp_pl4); @unlink($temp_ci4);

    // Re-enkripsi file-file dengan public key Divisi
    $divisi_pub_str  = $divisi_user['public_key'];
    $upload_dir      = __DIR__ . '/../uploads/';
    $enc_f_script    = realpath(__DIR__ . '/../../crypto/encrypt.py');
    $dec_f_script    = realpath(__DIR__ . '/../../crypto/decrypt.py');

    // PHW private key untuk dekripsi file PHW
    $uid5 = uniqid('phwpriv_', true);
    $temp_phw_priv = $temp_dir . $uid5 . '_phwkey.pem';
    file_put_contents($temp_phw_priv, $private_key);

    $file_tables = [
        ['table'=>'rtt_peta',     'col'=>'file_path'],
        ['table'=>'rtt_peta_bap', 'col'=>'file_path'],
        ['table'=>'rtt_lampiran', 'col'=>'file_path'],
    ];
    foreach ($file_tables as $ft) {
        $stmt_f = $pdo->prepare("SELECT id, {$ft['col']} FROM {$ft['table']} WHERE rtt_id = ?");
        $stmt_f->execute([$rtt_id]); $files = $stmt_f->fetchAll(PDO::FETCH_ASSOC);
        foreach ($files as $frow) {
            $rel_path = $frow[$ft['col']];
            if (empty($rel_path)) continue;
            $abs_path = realpath($upload_dir . $rel_path);
            if (!$abs_path || !file_exists($abs_path)) continue;

            $uid6 = uniqid('re2_', true);
            $base_name = str_ends_with($rel_path, '.enc') ? substr($rel_path, 0, -4) : $rel_path;
            $ext = pathinfo($base_name, PATHINFO_EXTENSION);
            $temp_dec6 = $temp_dir . $uid6 . '_plain.' . $ext;

            if (str_ends_with($rel_path, '.enc') && $dec_f_script) {
                $cmd_d = escapeshellarg($python_exe) . " " . escapeshellarg($dec_f_script)
                       . " " . escapeshellarg($temp_phw_priv)
                       . " " . escapeshellarg($abs_path)
                       . " " . escapeshellarg($temp_dec6) . " 2>&1";
                shell_exec($cmd_d);
                $src = file_exists($temp_dec6) ? $temp_dec6 : $abs_path;
            } else {
                $src = $abs_path; $temp_dec6 = null;
            }

            $uid6b = uniqid('divpub_', true);
            $temp_div_pub = $temp_dir . $uid6b . '_pub.pem';
            $new_enc_abs  = $upload_dir . $base_name . '.enc';
            file_put_contents($temp_div_pub, $divisi_pub_str);

            $cmd_e2 = escapeshellarg($python_exe) . " " . escapeshellarg($enc_f_script)
                    . " " . escapeshellarg($temp_div_pub)
                    . " " . escapeshellarg($src)
                    . " " . escapeshellarg($new_enc_abs) . " 2>&1";
            shell_exec($cmd_e2);
            @unlink($temp_div_pub);
            if ($temp_dec6 && file_exists($temp_dec6)) @unlink($temp_dec6);
            if (file_exists($new_enc_abs) && realpath($new_enc_abs) !== $abs_path) @unlink($abs_path);
        }
    }
    @unlink($temp_phw_priv);

    // Simpan ke DB
    $pdo->beginTransaction();
    $pdo->prepare("UPDATE rtt SET
        status            = 'menunggu_pengesahan',
        phw_hash          = ?,
        phw_signature     = ?,
        phw_public_key    = ?,
        encrypted_payload = ?,
        encrypted_for     = 'divisi',
        updated_at        = NOW()
        WHERE id = ?")
        ->execute([$phw_hash_val, $phw_signature_b64, $phw_public_key, $new_encrypted_payload, $rtt_id]);
    $pdo->commit();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Dokumen disetujui oleh PHW! Telah ditandatangani ECDSA dan dienkripsi ulang untuk Kepala Divisi.',
        'phw_signature' => substr($phw_signature_b64, 0, 50) . '...',
        'encrypted_for' => 'divisi',
    ]);
    exit;
}

// Action = reject
if ($action === 'reject') {
    $catatan = $data['catatan'] ?? 'Dokumen dikembalikan untuk revisi oleh PHW';
    $pdo->prepare("UPDATE rtt SET status = 'revisi_phw', updated_at = NOW() WHERE id = ?")
        ->execute([$rtt_id]);

    // Simpan catatan validasi
    $total_valid = 0;
    $catatan_json = json_encode(['status'=>'rejected', 'catatan'=>$catatan]);
    $pdo->prepare("INSERT INTO validasi (rtt_id, status_kph, status_phw, status_divisi, catatan, validated_by, validated_at) VALUES (?,?,?,?,?,?,NOW())")
        ->execute([$rtt_id, 1, 0, 0, $catatan_json, $validated_by]);

    echo json_encode(['status'=>'success','message'=>'Dokumen dikembalikan ke KPH untuk revisi.']);
    exit;
}

// Action = validate (default) — hanya return hasil validasi tanpa mengubah DB
$total_valid = ($status_hash === 'valid' && $status_sig === 'valid' && $status_relasi === 'valid') ? 1 : 0;
$catatan_json = json_encode([
    'hash'      => $hash_detail,
    'signature' => $sig_detail,
    'relasi'    => $relasi_detail,
    'technical_status' => ['hash'=>$status_hash,'sig'=>$status_sig,'relasi'=>$status_relasi]
]);

$pdo->prepare("INSERT INTO validasi (rtt_id, status_kph, status_phw, status_divisi, catatan, validated_by, validated_at) VALUES (?,?,?,?,?,?,NOW())")
    ->execute([$rtt_id, 1, $total_valid, 0, $catatan_json, $validated_by]);

echo json_encode([
    'status'   => 'success',
    'decrypted'=> $decrypted_json !== null,
    'validasi' => [
        'hash'      => ['status'=>$status_hash,    'detail'=>$hash_detail],
        'signature' => ['status'=>$status_sig,     'detail'=>$sig_detail],
        'relasi'    => ['status'=>$status_relasi,  'detail'=>$relasi_detail],
    ]
]);
?>
