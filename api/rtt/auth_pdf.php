<?php
// api/rtt/auth_pdf.php — Otorisasi Private Key ECC untuk Cetak Dokumen RTT
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../db.php';

function normalize_pem($pem) {
    if (!$pem) return '';
    $clean = preg_replace('/-----BEGIN [A-Z ]+-----|-----END [A-Z ]+-----/', '', $pem);
    return preg_replace('/\s+/', '', $clean);
}

$raw_input = file_get_contents('php://input');
$data = json_decode($raw_input, true);

$token       = trim($data['token'] ?? '');
$rtt_id      = (int)($data['rtt_id'] ?? 0);
$private_key = trim($data['private_key'] ?? '');

// 1. Validasi Autentikasi Pengguna
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Sesi tidak ditemukan. Silakan login kembali.']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE session_token = ? AND is_active = 1");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Sesi tidak valid atau telah kedaluwarsa.']);
    exit;
}

// 2. Validasi Dokumen RTT
if (!$rtt_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID Dokumen RTT wajib disertakan.']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]);
$rtt = $stmt->fetch();

if (!$rtt) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Dokumen RTT tidak ditemukan dalam sistem.']);
    exit;
}

// 3. Validasi Format & Struktur Private Key
if (empty($private_key)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'File atau teks Private Key ECC wajib diunggah/dimasukkan.']);
    exit;
}

if (!str_contains($private_key, '-----BEGIN') || !str_contains($private_key, 'PRIVATE KEY-----')) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Format Private Key tidak valid! Pastikan file mengandung header "-----BEGIN PRIVATE KEY-----" atau "-----BEGIN EC PRIVATE KEY-----".'
    ]);
    exit;
}

// Ekstrak Public Key berpasangan dari Private Key menggunakan OpenSSL
$res_key = openssl_pkey_get_private($private_key);
$derived_pub = '';

if ($res_key) {
    $details = openssl_pkey_get_details($res_key);
    $derived_pub = $details['key'] ?? '';
}

// Jika OpenSSL PHP gagal membaca EC curve tertentu, fallback menggunakan Python crypto
if (empty($derived_pub)) {
    $temp_dir = __DIR__ . '/../uploads/temp/';
    if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
    $uid = uniqid('keychk_', true);
    $tmp_priv = $temp_dir . $uid . '_priv.pem';
    $tmp_pub  = $temp_dir . $uid . '_pub.pem';
    file_put_contents($tmp_priv, $private_key);

    $py_code = "import sys\n"
             . "from cryptography.hazmat.primitives import serialization\n"
             . "try:\n"
             . "    with open(sys.argv[1], 'rb') as f:\n"
             . "        pk = serialization.load_pem_private_key(f.read(), password=None)\n"
             . "    pub = pk.public_key()\n"
             . "    with open(sys.argv[2], 'wb') as f:\n"
             . "        f.write(pub.public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo))\n"
             . "    sys.exit(0)\n"
             . "except Exception as e:\n"
             . "    print(e)\n"
             . "    sys.exit(1)\n";
    $tmp_script = $temp_dir . $uid . '_getpub.py';
    file_put_contents($tmp_script, $py_code);

    shell_exec("py " . escapeshellarg($tmp_script) . " " . escapeshellarg($tmp_priv) . " " . escapeshellarg($tmp_pub));

    if (file_exists($tmp_pub)) {
        $derived_pub = file_get_contents($tmp_pub);
        @unlink($tmp_pub);
    }
    @unlink($tmp_priv);
    @unlink($tmp_script);
}

if (empty($derived_pub)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal memverifikasi Private Key! Kunci yang dimasukkan bukan Private Key ECC yang valid atau rusak.'
    ]);
    exit;
}

// 4. Verifikasi Kecocokan Kunci & Hak Akses
$norm_derived = normalize_pem($derived_pub);

// Kunci pembanding
$norm_user_pub   = normalize_pem($user['public_key'] ?? '');
$norm_kph_pub    = normalize_pem($rtt['kph_public_key'] ?? '');
$norm_phw_pub    = normalize_pem($rtt['phw_public_key'] ?? '');
$norm_div_pub    = normalize_pem($rtt['public_key'] ?? '');

// Ambil system public key
$system_pub_path = realpath(__DIR__ . '/../keys/system_keys/public_key.pem');
$norm_sys_pub    = $system_pub_path && file_exists($system_pub_path) ? normalize_pem(file_get_contents($system_pub_path)) : '';

$is_authorized = false;
$auth_via = '';

if ($norm_user_pub && $norm_derived === $norm_user_pub) {
    $is_authorized = true;
    $auth_via = 'Sertifikat Akun Pengguna (' . $user['username'] . ')';
} elseif ($norm_kph_pub && $norm_derived === $norm_kph_pub) {
    $is_authorized = true;
    $auth_via = 'Penandatangan Digital KPH';
} elseif ($norm_phw_pub && $norm_derived === $norm_phw_pub) {
    $is_authorized = true;
    $auth_via = 'Penandatangan Verifikasi PHW';
} elseif ($norm_div_pub && $norm_derived === $norm_div_pub) {
    $is_authorized = true;
    $auth_via = 'Penandatangan Pengesahan Kepala Divisi';
} elseif ($norm_sys_pub && $norm_derived === $norm_sys_pub) {
    $is_authorized = true;
    $auth_via = 'Kunci Induk Sistem (Perhutani Master Key)';
} elseif (in_array($user['role'], ['sysadmin', 'admin', 'direksi']) && $res_key) {
    // Administrator & Direksi dengan kunci privat ECC sah
    $is_authorized = true;
    $auth_via = 'Otoritas Khusus ' . strtoupper($user['role']);
}

if (!$is_authorized) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Otorisasi Gagal: Private Key yang Anda masukkan tidak cocok dengan sertifikat digital yang terdaftar untuk dokumen ini maupun akun Anda. Pastikan Anda mengunggah Private Key ECC yang benar.'
    ]);
    exit;
}

// 5. Buat Print Token Sementara (Berlaku 3 Menit)
$temp_dir = __DIR__ . '/../uploads/temp/';
if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);

$print_token = bin2hex(random_bytes(32));
$token_payload = [
    'print_token'   => $print_token,
    'rtt_id'        => $rtt_id,
    'user_id'       => (int)$user['id'],
    'username'      => $user['username'],
    'nama'          => $user['nama'] ?: $user['username'],
    'role'          => $user['role'],
    'auth_via'      => $auth_via,
    'nomor_dokumen' => $rtt['nomor_dokumen'],
    'created_at'    => time(),
    'expires_at'    => time() + 180, // 3 menit
];

$token_file = $temp_dir . 'print_token_' . $print_token . '.json';
file_put_contents($token_file, json_encode($token_payload, JSON_PRETTY_PRINT));

// 6. Catat Jejak Keamanan ke Audit Log
try {
    $stmt_log = $pdo->prepare("INSERT INTO audit_log (user_id, aksi, deskripsi) VALUES (?, ?, ?)");
    $log_desc = "User {$token_payload['nama']} ({$user['username']} - {$user['role']}) berhasil mengotorisasi cetak dokumen RTT No: {$rtt['nomor_dokumen']} via {$auth_via}.";
    $stmt_log->execute([$user['id'], 'CETAK_PDF_AUTH', $log_desc]);
} catch (Exception $e) {
    // Jika logging gagal, tetap izinkan proses cetak
}

// 7. Kembalikan Response Sukses
$pdf_url = "http://localhost:8000/api/rtt/generate_pdf.php?id={$rtt_id}&token={$print_token}";

echo json_encode([
    'status'      => 'success',
    'message'     => 'Kunci privat ECC berhasil diverifikasi! Dokumen siap dicetak.',
    'print_token' => $print_token,
    'auth_via'    => $auth_via,
    'url'         => $pdf_url,
]);
