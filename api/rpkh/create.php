<?php
// api/rpkh/create.php — Create new RPKH with details
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]);
$user = $stmt->fetch();
if (!$user) { http_response_code(401); echo json_encode(['status' => 'error', 'message' => 'Sesi tidak valid']); exit; }

$tahun_mulai  = $data['tahun_mulai'] ?? '';
$tahun_selesai = $data['tahun_selesai'] ?? '';
$wilayah = $data['wilayah'] ?? '';
$kph  = $data['kph'] ?? '';
$bkph = $data['bkph'] ?? '';
$rph  = $data['rph'] ?? '';
$keterangan = $data['keterangan'] ?? '';
$details = $data['details'] ?? [];

if (!$tahun_mulai || !$tahun_selesai || !$wilayah || !$kph || !$bkph || !$rph) {
    echo json_encode(['status' => 'error', 'message' => 'Semua field identitas RPKH harus diisi']);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO rpkh (tahun_mulai, tahun_selesai, wilayah, kph, bkph, rph, created_by, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$tahun_mulai, $tahun_selesai, $wilayah, $kph, $bkph, $rph, $user['id'], $keterangan]);
    $rpkh_id = $pdo->lastInsertId();

    if (!empty($details)) {
        $stmt = $pdo->prepare("INSERT INTO rpkh_detail (rpkh_id, petak, anak_petak, luas, jenis_tanaman, kelas_hutan, bon, kbd, dkn, n_per_ha, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($details as $d) {
            $stmt->execute([$rpkh_id, $d['petak'] ?? '', $d['anak_petak'] ?? '', $d['luas'] ?? 0, $d['jenis_tanaman'] ?? '', $d['kelas_hutan'] ?? '', $d['bon'] ?? '', $d['kbd'] ?? '', $d['dkn'] ?? '', $d['n_per_ha'] ?? null, $d['keterangan'] ?? null]);
        }
    }

    $hash_data = json_encode(['rpkh' => $data, 'details' => $details]);
    $hash = hash('sha256', $hash_data);
    $pdo->prepare("UPDATE rpkh SET hash = ? WHERE id = ?")->execute([$hash, $rpkh_id]);

    $pdo->commit();

    echo json_encode(['status' => 'success', 'message' => 'RPKH berhasil dibuat', 'rpkh_id' => $rpkh_id, 'hash' => $hash]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan RPKH: ' . $e->getMessage()]);
}
?>
