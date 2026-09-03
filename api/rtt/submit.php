<?php
// api/rtt/submit.php — Submit RTT for review (KPH → PHW)
// REVISI: ECDSA signing oleh KPH + ECC enkripsi payload untuk PHW
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token   = $data['token'] ?? '';
$rtt_id  = $data['rtt_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
if ($user['role'] !== 'kph' && $user['role'] !== 'admin' && $user['role'] !== 'sysadmin') {
    echo json_encode(['status'=>'error','message'=>'Hanya Admin Tata Usaha atau KPH yang bisa mengirim RTT']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }
if (!in_array($rtt['status'], ['draft','revisi_phw','revisi_kph'])) {
    echo json_encode(['status'=>'error','message'=>'RTT sudah disubmit sebelumnya']); exit;
}

// =============================================
// WAJIB: Private key KPH untuk ECDSA signing
// =============================================
$private_key = trim($data['private_key'] ?? '');
if (empty($private_key)) {
    http_response_code(400);
    echo json_encode(['status'=>'error','message'=>'Private key KPH wajib disertakan untuk menandatangani dokumen secara digital (ECDSA).']);
    exit;
}

try {
    // ---- Validasi kelengkapan data ----
    if (empty($rtt['nomor_dokumen']) || empty($rtt['tanggal']) || empty($rtt['kph']) || empty($rtt['bkph']) || empty($rtt['rph'])) {
        http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Data Identitas belum lengkap.']); exit;
    }
    $stmt = $pdo->prepare("SELECT id FROM rtt_summary WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Summary belum diisi.']); exit; }
    $stmt = $pdo->prepare("SELECT id FROM rtt_nett WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: NETT belum diisi.']); exit; }
    $stmt = $pdo->prepare("SELECT id FROM rtt_peta WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Peta belum diupload.']); exit; }
    $stmt = $pdo->prepare("SELECT id FROM rtt_rekap_klem WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Rekap Klem belum diisi.']); exit; }
    $stmt = $pdo->prepare("SELECT id FROM rtt_klem_detail WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Klem Detail belum diisi.']); exit; }
    $stmt = $pdo->prepare("SELECT id FROM rtt_berita_acara WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $ba = $stmt->fetch();
    if (!$ba) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Berita Acara belum diisi.']); exit; }
    $stmt = $pdo->prepare("SELECT id FROM rtt_ba_detail WHERE berita_acara_id = ?"); $stmt->execute([$ba['id']]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Detail Berita Acara belum diisi.']); exit; }
    $stmt = $pdo->prepare("SELECT id FROM rtt_peta_bap WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Peta BAP belum diupload.']); exit; }

    // Validasi Kuota RPKH vs RTT NETT
    $stmt = $pdo->prepare("SELECT n.petak, n.luas_baku FROM rtt_nett n WHERE n.rtt_id = ?");
    $stmt->execute([$rtt_id]); $nett_rows = $stmt->fetchAll();
    foreach ($nett_rows as $nett) {
        $stmt = $pdo->prepare("SELECT luas FROM rpkh_detail WHERE rpkh_id = ? AND petak = ? LIMIT 1");
        $stmt->execute([$rtt['rpkh_id'], $nett['petak']]); $rpkh_target = $stmt->fetch();
        if ($rpkh_target) {
            if ($nett['luas_baku'] > $rpkh_target['luas']) {
                http_response_code(400);
                echo json_encode(['status'=>'error','message'=>"Gagal submit: Luas Petak {$nett['petak']} ({$nett['luas_baku']} Ha) melebihi kuota RPKH ({$rpkh_target['luas']} Ha)."]);
                exit;
            }
        } else {
            http_response_code(400);
            echo json_encode(['status'=>'error','message'=>"Gagal submit: Petak {$nett['petak']} tidak ditemukan dalam dokumen RPKH."]);
            exit;
        }
    }

    // =============================================
    // STEP 1: Buat Canonical Payload & ECDSA Sign oleh KPH
    // =============================================
    include_once __DIR__ . '/../crypto_utils.php';
    $payload   = getCanonicalPayload($pdo, $rtt_id);
    if (!$payload) { echo json_encode(['status'=>'error','message'=>'Gagal membuat canonical payload']); exit; }
    $json_data = encodeCanonicalJSON($payload);
    $kph_hash  = hash('sha256', $json_data);

    $temp_dir = __DIR__ . '/../uploads/temp/';
    if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
    $uid      = uniqid('kph_', true);
    $temp_key = $temp_dir . $uid . '_key.pem';
    $temp_dat = $temp_dir . $uid . '_data.json';
    $temp_sig = $temp_dir . $uid . '_data.sig';

    file_put_contents($temp_key, $private_key);
    file_put_contents($temp_dat, $json_data);

    $python_exe  = 'py';
    $sign_script = realpath(__DIR__ . '/../../crypto/sign.py');
    $cmd = escapeshellarg($python_exe) . " " . escapeshellarg($sign_script)
         . " " . escapeshellarg($temp_key)
         . " " . escapeshellarg($temp_dat)
         . " " . escapeshellarg($temp_sig) . " 2>&1";
    $sign_out = shell_exec($cmd);

    if (!file_exists($temp_sig) || filesize($temp_sig) === 0) {
        file_put_contents(__DIR__ . '/error.log', "SIGN ERROR: " . $sign_out . "\nKEY LENGTH: " . strlen($private_key) . "\nKEY PREVIEW: " . substr($private_key, 0, 50));
        @unlink($temp_key); @unlink($temp_dat);
        echo json_encode(['status'=>'error','message'=>'Gagal membuat tanda tangan ECDSA KPH. Pastikan private key yang dimasukkan benar.','detail'=>trim($sign_out)]);
        exit;
    }

    $kph_signature = base64_encode(file_get_contents($temp_sig));

    // Ekstrak public key dari private key KPH
    $kph_public_key = '';
    $res_key = openssl_pkey_get_private($private_key);
    if ($res_key) { $det = openssl_pkey_get_details($res_key); if (isset($det['key'])) $kph_public_key = $det['key']; }

    @unlink($temp_key); @unlink($temp_dat); @unlink($temp_sig);

    // =============================================
    // STEP 2: Enkripsi Payload JSON dengan Public Key PHW (yang sudah di-approve CA)
    // =============================================
    $stmt = $pdo->prepare("SELECT id, public_key, key_status FROM users WHERE role = 'phw' AND public_key IS NOT NULL AND key_status = 'approved' LIMIT 1");
    $stmt->execute(); $phw_user = $stmt->fetch();
    if (!$phw_user || empty($phw_user['public_key'])) {
        // Cek apakah ada yang statusnya pending
        $stmt_p = $pdo->prepare("SELECT id, username FROM users WHERE role = 'phw' AND key_status = 'pending' LIMIT 1");
        $stmt_p->execute(); $p_user = $stmt_p->fetch();
        if ($p_user) {
            echo json_encode(['status'=>'error','message'=>'Public key PHW (' . $p_user['username'] . ') sedang menunggu verifikasi/persetujuan Administrator (CA). Hubungi Administrator untuk menyetujui kunci PHW terlebih dahulu.']);
        } else {
            echo json_encode(['status'=>'error','message'=>'User PHW belum memiliki public key yang disetujui. Minta PHW untuk mengajukan key pair di halaman Settings dan disetujui Administrator.']);
        }
        exit;
    }

    $uid2       = uniqid('enc_', true);
    $temp_pub   = $temp_dir . $uid2 . '_phw_pub.pem';
    $temp_plain = $temp_dir . $uid2 . '_plain.json';
    $temp_ciph  = $temp_dir . $uid2 . '_cipher.b64';

    file_put_contents($temp_pub,   $phw_user['public_key']);
    file_put_contents($temp_plain, $json_data);

    $enc_script = realpath(__DIR__ . '/../../crypto/encrypt_payload.py');
    $cmd2 = escapeshellarg($python_exe) . " " . escapeshellarg($enc_script)
          . " " . escapeshellarg($temp_pub)
          . " " . escapeshellarg($temp_plain)
          . " " . escapeshellarg($temp_ciph) . " 2>&1";
    $enc_out = shell_exec($cmd2);

    if (!file_exists($temp_ciph) || filesize($temp_ciph) === 0) {
        @unlink($temp_pub); @unlink($temp_plain);
        echo json_encode(['status'=>'error','message'=>'Gagal mengenkripsi payload untuk PHW.','detail'=>trim($enc_out)]);
        exit;
    }
    $encrypted_payload = file_get_contents($temp_ciph);
    @unlink($temp_pub); @unlink($temp_plain); @unlink($temp_ciph);

    // =============================================
    // STEP 3: Re-enkripsi semua file dengan Public Key PHW
    // =============================================
    $phw_pub_str    = $phw_user['public_key'];
    $upload_dir     = __DIR__ . '/../uploads/';
    $enc_file_script= realpath(__DIR__ . '/../../crypto/encrypt.py');
    $dec_file_script= realpath(__DIR__ . '/../../crypto/decrypt.py');
    $system_priv    = realpath(__DIR__ . '/../keys/system_keys/private_key.pem');

    $file_tables = [
        ['table'=>'rtt_peta',     'col'=>'file_path', 'rtt_col'=>'rtt_id'],
        ['table'=>'rtt_peta_bap', 'col'=>'file_path', 'rtt_col'=>'rtt_id'],
        ['table'=>'rtt_lampiran', 'col'=>'file_path', 'rtt_col'=>'rtt_id'],
    ];

    foreach ($file_tables as $ft) {
        $stmt_f = $pdo->prepare("SELECT id, {$ft['col']} FROM {$ft['table']} WHERE {$ft['rtt_col']} = ?");
        $stmt_f->execute([$rtt_id]);
        $files = $stmt_f->fetchAll(PDO::FETCH_ASSOC);

        foreach ($files as $frow) {
            $rel_path = $frow[$ft['col']];
            if (empty($rel_path)) continue;
            $abs_path = realpath($upload_dir . $rel_path);
            if (!$abs_path || !file_exists($abs_path)) continue;

            $uid3 = uniqid('re_', true);
            $is_enc = str_ends_with($rel_path, '.enc');
            $base_name = $is_enc ? substr($rel_path, 0, -4) : $rel_path;
            $ext = pathinfo($base_name, PATHINFO_EXTENSION);
            $temp_decrypted = $temp_dir . $uid3 . '_plain.' . $ext;

            // Dekripsi dulu jika masih pakai system key
            if ($is_enc && $system_priv && $dec_file_script) {
                $cmd_d = escapeshellarg($python_exe) . " " . escapeshellarg($dec_file_script)
                       . " " . escapeshellarg($system_priv)
                       . " " . escapeshellarg($abs_path)
                       . " " . escapeshellarg($temp_decrypted) . " 2>&1";
                shell_exec($cmd_d);
                $src = file_exists($temp_decrypted) ? $temp_decrypted : $abs_path;
            } else {
                $src = $abs_path;
                $temp_decrypted = null;
            }

            // Enkripsi ulang dengan public key PHW
            $temp_phw_pub = $temp_dir . $uid3 . '_pub.pem';
            $new_enc_abs  = $upload_dir . $base_name . '.enc';
            file_put_contents($temp_phw_pub, $phw_pub_str);

            $cmd_e = escapeshellarg($python_exe) . " " . escapeshellarg($enc_file_script)
                   . " " . escapeshellarg($temp_phw_pub)
                   . " " . escapeshellarg($src)
                   . " " . escapeshellarg($new_enc_abs) . " 2>&1";
            shell_exec($cmd_e);

            @unlink($temp_phw_pub);
            if ($temp_decrypted && file_exists($temp_decrypted)) @unlink($temp_decrypted);

            // Hapus file lama jika berbeda path
            if (file_exists($new_enc_abs) && realpath($new_enc_abs) !== $abs_path) {
                @unlink($abs_path);
            }

            // Update path di DB jika perlu
            $new_rel = $base_name . '.enc';
            if ($new_rel !== $rel_path) {
                $pdo->prepare("UPDATE {$ft['table']} SET {$ft['col']} = ? WHERE id = ?")
                    ->execute([$new_rel, $frow['id']]);
            }
        }
    }

    // =============================================
    // STEP 4: Simpan ke database & update status
    // =============================================
    $pdo->beginTransaction();
    $pdo->prepare("UPDATE rtt SET
        status            = 'menunggu_verifikasi_phw',
        kph_hash          = ?,
        kph_signature     = ?,
        kph_public_key    = ?,
        encrypted_payload = ?,
        encrypted_for     = 'phw',
        updated_at        = NOW()
        WHERE id = ?")
        ->execute([$kph_hash, $kph_signature, $kph_public_key, $encrypted_payload, $rtt_id]);
    $pdo->commit();

    echo json_encode([
        'status'        => 'success',
        'message'       => 'RTT berhasil dikirim ke PHW! Dokumen telah ditandatangani secara digital (ECDSA) dan dienkripsi menggunakan ECC untuk PHW.',
        'kph_hash'      => $kph_hash,
        'kph_signature' => substr($kph_signature, 0, 60) . '...',
        'encrypted_for' => 'phw',
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Internal Server Error: ' . $e->getMessage()]);
}
?>
