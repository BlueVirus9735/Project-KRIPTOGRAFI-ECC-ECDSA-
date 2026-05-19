<?php
// api/rtt/submit.php — Submit RTT for review (KPH → PHW)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$rtt_id = $data['rtt_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }
// RBAC: Admin, KPH, atau sysadmin boleh submit RTT
if ($user['role'] !== 'kph' && $user['role'] !== 'admin' && $user['role'] !== 'sysadmin') { 
    echo json_encode(['status'=>'error','message'=>'Hanya Admin Tata Usaha atau KPH yang bisa mengirim RTT']); 
    exit; 
}

$stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { echo json_encode(['status'=>'error','message'=>'RTT tidak ditemukan']); exit; }
if (!in_array($rtt['status'], ['draft','revisi_phw','revisi_kph'])) { echo json_encode(['status'=>'error','message'=>'RTT sudah disubmit sebelumnya']); exit; }

try {
    // Validasi kelengkapan data sebelum submit
    if (empty($rtt['nomor_dokumen']) || empty($rtt['tanggal']) || empty($rtt['kph']) || empty($rtt['bkph']) || empty($rtt['rph'])) {
        http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Data Identitas belum lengkap.']); exit;
    }

    $stmt_sk = $pdo->prepare("SELECT * FROM rtt_sk WHERE rtt_id = ?"); $stmt_sk->execute([$rtt_id]); $sk = $stmt_sk->fetch();
    if (!$sk || empty($sk['nomor_sk']) || empty($sk['tanggal_sk']) || empty($sk['tentang'])) {
        http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Data SK belum lengkap.']); exit;
    }

    $stmt_keputusan = $pdo->prepare("SELECT * FROM rtt_keputusan WHERE rtt_id = ?"); $stmt_keputusan->execute([$rtt_id]); $keputusan = $stmt_keputusan->fetch();
    if (!$keputusan || empty($keputusan['menimbang']) || empty($keputusan['mengingat']) || empty($keputusan['memutuskan'])) {
        http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Data Keputusan belum lengkap.']); exit;
    }

    $stmt_tebangan = $pdo->prepare("SELECT COUNT(*) as cnt FROM rtt_tebangan WHERE rtt_id = ? AND petak != '' AND luas > 0"); $stmt_tebangan->execute([$rtt_id]); $tebangan = $stmt_tebangan->fetch();
    if ($tebangan['cnt'] == 0) {
        http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Data Tebangan belum lengkap (minimal 1 baris yang valid).']); exit;
    }

    $stmt_ba = $pdo->prepare("SELECT COUNT(*) as cnt FROM rtt_berita_acara WHERE rtt_id = ? AND tanggal IS NOT NULL AND nama_petugas != ''"); $stmt_ba->execute([$rtt_id]); $ba = $stmt_ba->fetch();
    if ($ba['cnt'] == 0) {
        http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Data Berita Acara belum lengkap (minimal 1 baris yang valid).']); exit;
    }

    $stmt_pengesahan = $pdo->prepare("SELECT COUNT(*) as cnt FROM rtt_pengesahan WHERE rtt_id = ? AND nama_pejabat != '' AND jabatan != ''"); $stmt_pengesahan->execute([$rtt_id]); $pengesahan = $stmt_pengesahan->fetch();
    if ($pengesahan['cnt'] == 0) {
        http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Data Pengesahan belum lengkap (minimal 1 pejabat yang valid).']); exit;
    }

    $pdo->prepare("UPDATE rtt SET status = 'menunggu_verifikasi_phw' WHERE id = ?")->execute([$rtt_id]);
    echo json_encode(['status'=>'success','message'=>'RTT berhasil dikirim untuk verifikasi PHW']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Internal Server Error: ' . $e->getMessage()]);
}
?>
