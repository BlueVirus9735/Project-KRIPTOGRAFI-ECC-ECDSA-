<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); $user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); exit; }

if ($user['role'] !== 'kph' && $user['role'] !== 'admin' && $user['role'] !== 'sysadmin') { 
    http_response_code(403); 
    echo json_encode(['status'=>'error','message'=>'Hanya Admin Tata Usaha atau KPH yang bisa membuat RTT']); 
    exit; 
}

$rpkh_id = $data['rpkh_id'] ?? 0;
$nomor   = $data['nomor_dokumen'] ?? '';
$tanggal = $data['tanggal'] ?? date('Y-m-d');
$kph  = $data['kph'] ?? '';
$bkph = $data['bkph'] ?? '';
$rph  = $data['rph'] ?? '';

if (!$rpkh_id || !$nomor) {
    echo json_encode(['status'=>'error','message'=>'RPKH dan nomor dokumen harus diisi']); exit;
}

$stmt = $pdo->prepare("SELECT id FROM rpkh WHERE id = ?");
$stmt->execute([$rpkh_id]);
if (!$stmt->fetch()) { echo json_encode(['status'=>'error','message'=>'RPKH tidak ditemukan']); exit; }

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO rtt (rpkh_id, nomor_dokumen, tanggal, kph, bkph, rph, status, created_by) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute([$rpkh_id, $nomor, $tanggal, $kph, $bkph, $rph, 'draft', $user['id']]);
    $rtt_id = $pdo->lastInsertId();

    // Create empty sub-records
    $pdo->prepare("INSERT INTO rtt_sk (rtt_id) VALUES (?)")->execute([$rtt_id]);
    $pdo->prepare("INSERT INTO rtt_keputusan (rtt_id) VALUES (?)")->execute([$rtt_id]);
    $pdo->prepare("INSERT INTO rtt_rekap (rtt_id) VALUES (?)")->execute([$rtt_id]);

    $pdo->commit();
    echo json_encode(['status'=>'success','message'=>'RTT berhasil dibuat','rtt_id'=>$rtt_id]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status'=>'error','message'=>'Gagal: '.$e->getMessage()]);
}
?>
