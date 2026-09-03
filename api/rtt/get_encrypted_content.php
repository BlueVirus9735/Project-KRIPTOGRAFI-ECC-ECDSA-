<?php
// api/rtt/get_encrypted_content.php
// Return encrypted document structure where field values are masked with ciphertexts
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

$token  = $_GET['token'] ?? '';
$rtt_id = $_GET['rtt_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
if (!$rtt_id) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'RTT ID tidak ada']); exit; }

$stmt = $pdo->prepare("SELECT id, nomor_dokumen, kph, bkph, rph, tanggal, status,
    encrypted_payload, encrypted_for,
    kph_hash, kph_signature, kph_public_key,
    phw_hash, phw_signature, phw_public_key,
    hash, signature, public_key
    FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }

$enc = $rtt['encrypted_payload'] ?? '';
$salt = $rtt['kph_hash'] ?? 'perhutani_salt';

// Helper to generate field-level ciphertext representation
function maskCipher($val, $salt, $field) {
    if ($val === null || $val === '') return null;
    return '0x' . strtoupper(substr(hash('sha256', $salt . $field . $val), 0, 12)) . '...';
}

// Fetch tables for encrypted structure display
$stmt = $pdo->prepare("SELECT * FROM rtt_summary WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $raw_summary = $stmt->fetch(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_nett WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $raw_nett = $stmt->fetch(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_rekap_klem WHERE rtt_id = ? ORDER BY id"); $stmt->execute([$rtt_id]); $raw_rekap = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_berita_acara WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $raw_ba = $stmt->fetch(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_peta WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $raw_peta = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_peta_bap WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $raw_peta_bap = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt = $pdo->prepare("SELECT * FROM rtt_lampiran WHERE rtt_id = ?"); $stmt->execute([$rtt_id]); $raw_lampiran = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Masked files for visual encrypted view
$masked_files = [];
foreach ($raw_peta as $p) {
    $clean_name = basename(preg_replace('/\.enc$/', '', $p['file_path'] ?? 'peta.pdf'));
    $masked_files[] = [
        'id'        => $p['id'],
        'tipe'      => 'Peta Lokasi Tebangan',
        'nama_file' => $clean_name,
        'file_path' => $p['file_path'] ?? '',
        'rph'       => $p['rph'] ?? '',
        'bh'        => $p['bagian_hutan'] ?? '',
        'cipher'    => maskCipher($clean_name, $salt, 'peta'),
    ];
}
foreach ($raw_peta_bap as $pb) {
    $clean_name = basename(preg_replace('/\.enc$/', '', $pb['file_path'] ?? 'peta_bap.pdf'));
    $masked_files[] = [
        'id'        => $pb['id'],
        'tipe'      => 'Peta BAP',
        'nama_file' => $clean_name,
        'file_path' => $pb['file_path'] ?? '',
        'cipher'    => maskCipher($clean_name, $salt, 'peta_bap'),
    ];
}
foreach ($raw_lampiran as $l) {
    $clean_name = basename(preg_replace('/\.enc$/', '', $l['file_path'] ?? 'lampiran.pdf'));
    $masked_files[] = [
        'id'        => $l['id'],
        'tipe'      => 'Lampiran Dokumen',
        'nama_file' => $clean_name,
        'file_path' => $l['file_path'] ?? '',
        'judul'     => $l['judul'] ?? 'Lampiran',
        'cipher'    => maskCipher($clean_name, $salt, 'lampiran'),
    ];
}


// Masked versions (Mode Terkunci / Ciphertext)
$masked_summary = null;
if ($raw_summary) {
    $masked_summary = [];
    foreach ($raw_summary as $k => $v) {
        if (in_array($k, ['id', 'rtt_id'])) { $masked_summary[$k] = $v; continue; }
        $masked_summary[$k] = maskCipher($v, $salt, $k);
    }
}

$masked_nett = null;
if ($raw_nett) {
    $masked_nett = [];
    foreach ($raw_nett as $k => $v) {
        if (in_array($k, ['id', 'rtt_id'])) { $masked_nett[$k] = $v; continue; }
        $masked_nett[$k] = maskCipher($v, $salt, $k);
    }
}

$masked_rekap = [];
foreach ($raw_rekap as $r) {
    $row = [];
    foreach ($r as $k => $v) {
        if (in_array($k, ['id', 'rtt_id'])) { $row[$k] = $v; continue; }
        $row[$k] = maskCipher($v, $salt, $k);
    }
    $masked_rekap[] = $row;
}

$masked_ba = null;
if ($raw_ba) {
    $masked_ba = [];
    foreach ($raw_ba as $k => $v) {
        if (in_array($k, ['id', 'rtt_id'])) { $masked_ba[$k] = $v; continue; }
        $masked_ba[$k] = maskCipher($v, $salt, $k);
    }
}

$preview = $enc ? (strlen($enc) > 120 ? substr($enc, 0, 120) . '...' : $enc) : null;

echo json_encode([
    'status' => 'success',
    'rtt' => [
        'id'             => $rtt['id'],
        'nomor_dokumen'  => $rtt['nomor_dokumen'],
        'kph'            => $rtt['kph'],
        'bkph'           => $rtt['bkph'],
        'rph'            => $rtt['rph'],
        'tanggal'        => $rtt['tanggal'],
        'status'         => $rtt['status'],
        'encrypted_for'  => $rtt['encrypted_for'],
        'has_encrypted_payload' => !empty($rtt['encrypted_payload']),
        'ciphertext_preview'    => $preview,
        'ciphertext_length'     => strlen($enc),
        'kph_hash'       => $rtt['kph_hash'],
        'has_kph_signature'  => !empty($rtt['kph_signature']),
        'has_phw_signature'  => !empty($rtt['phw_signature']),
        'has_final_signature'=> !empty($rtt['signature']),
        // Masked Identitas
        'masked_identitas' => [
            'nomor_dokumen' => maskCipher($rtt['nomor_dokumen'], $salt, 'nomor_dokumen'),
            'tanggal'       => maskCipher($rtt['tanggal'], $salt, 'tanggal'),
            'kph'           => maskCipher($rtt['kph'], $salt, 'kph'),
            'bkph'          => maskCipher($rtt['bkph'], $salt, 'bkph'),
            'rph'           => maskCipher($rtt['rph'], $salt, 'rph'),
        ],
        // Masked structure for visual encrypted view
        'masked_summary' => $masked_summary,
        'masked_nett'    => $masked_nett,
        'masked_rekap'   => $masked_rekap,
        'masked_ba'      => $masked_ba,
        'masked_files'   => $masked_files,
        'peta_count'     => count($raw_peta),
        'peta_bap_count' => count($raw_peta_bap),
        'lampiran_count' => count($raw_lampiran),
    ]
]);

?>
