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

    $stmt = $pdo->prepare("SELECT id FROM rtt_berita_acara WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    $ba = $stmt->fetch();
    if (!$ba) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Berita Acara belum diisi.']); exit; }

    $stmt = $pdo->prepare("SELECT id FROM rtt_ba_detail WHERE berita_acara_id = ?"); $stmt->execute([$ba['id']]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Detail Berita Acara belum diisi.']); exit; }

    $stmt = $pdo->prepare("SELECT id FROM rtt_peta_bap WHERE rtt_id = ?"); $stmt->execute([$rtt_id]);
    if (!$stmt->fetch()) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'Gagal submit: Peta BAP belum diupload.']); exit; }

    // Validasi Kuota RPKH vs RTT NETT
    $stmt = $pdo->prepare("SELECT n.petak, n.luas_baku FROM rtt_nett n WHERE n.rtt_id = ?");
    $stmt->execute([$rtt_id]);
    $nett_rows = $stmt->fetchAll();
    
    foreach ($nett_rows as $nett) {
        $stmt = $pdo->prepare("SELECT luas FROM rpkh_detail WHERE rpkh_id = ? AND petak = ? LIMIT 1");
        $stmt->execute([$rtt['rpkh_id'], $nett['petak']]);
        $rpkh_target = $stmt->fetch();
        
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

    $pdo->prepare("UPDATE rtt SET status = 'menunggu_verifikasi_phw' WHERE id = ?")->execute([$rtt_id]);
    echo json_encode(['status'=>'success','message'=>'RTT berhasil dikirim untuk verifikasi PHW']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Internal Server Error: ' . $e->getMessage()]);
}
?>
