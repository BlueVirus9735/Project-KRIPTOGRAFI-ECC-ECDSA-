<?php
// api/rtt/decrypt_view.php
// Dekripsi encrypted_payload dengan private key user dan kembalikan data dokumen RTT
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token       = $data['token'] ?? '';
$rtt_id      = $data['rtt_id'] ?? 0;
$private_key = $data['private_key'] ?? '';

// Auth
$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
if (!$private_key) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Private key wajib disertakan']); exit; }
if (!$rtt_id) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'RTT ID tidak ada']); exit; }

// Ambil RTT
$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }

if (empty($rtt['encrypted_payload'])) {
    echo json_encode(['status'=>'error','message'=>'Dokumen belum terenkripsi. Pastikan KPH sudah submit dokumen.']); exit;
}

// Tulis file sementara
$temp_dir = __DIR__ . '/../uploads/temp/';
if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
$uid = uniqid('dec_', true);
$temp_key    = $temp_dir . $uid . '_key.pem';
$temp_enc    = $temp_dir . $uid . '_payload.b64';
$temp_plain  = $temp_dir . $uid . '_plain.json';

file_put_contents($temp_key, $private_key);
file_put_contents($temp_enc, $rtt['encrypted_payload']);

$python_exe    = 'py';
$decrypt_script = realpath(__DIR__ . '/../../crypto/decrypt_payload.py');

$cmd = escapeshellarg($python_exe) . " " . escapeshellarg($decrypt_script)
     . " " . escapeshellarg($temp_key)
     . " " . escapeshellarg($temp_enc)
     . " " . escapeshellarg($temp_plain) . " 2>&1";

$output = shell_exec($cmd);

@unlink($temp_key);
@unlink($temp_enc);

if (!file_exists($temp_plain) || filesize($temp_plain) === 0) {
    @unlink($temp_plain);
    echo json_encode(['status'=>'error','message'=>'Gagal mendekripsi. Pastikan private key yang digunakan benar.', 'detail'=>trim($output)]);
    exit;
}

$plaintext = file_get_contents($temp_plain);
@unlink($temp_plain);

$payload = json_decode($plaintext, true);
if (!$payload) {
    echo json_encode(['status'=>'error','message'=>'Data terdekripsi tidak valid (bukan JSON)']); exit;
}

// Ambil data-data terkait dari database untuk tampilan lengkap
$stmt = $pdo->prepare("SELECT * FROM rtt_summary WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $summary = $stmt->fetch(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_nett WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $nett = $stmt->fetch(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_rekap_klem WHERE rtt_id = ? ORDER BY id"); $stmt->execute([$rtt_id]); $rekap_klem = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_klem_detail WHERE rtt_id = ? ORDER BY id LIMIT 50"); $stmt->execute([$rtt_id]); $klem_detail = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_berita_acara WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $ba = $stmt->fetch(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_peta WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $peta = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_peta_bap WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $peta_bap = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_lampiran WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $lampiran = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'status'       => 'success',
    'message'      => 'Dokumen berhasil didekripsi',
    'rtt'          => $rtt,
    'decrypted_payload' => $payload,
    'summary'      => $summary,
    'nett'         => $nett,
    'rekap_klem'   => $rekap_klem,
    'klem_detail'  => $klem_detail,
    'berita_acara' => $ba,
    'peta'         => $peta,
    'peta_bap'     => $peta_bap,
    'lampiran'     => $lampiran,
    'encrypted_for'=> $rtt['encrypted_for'],
]);

?>
