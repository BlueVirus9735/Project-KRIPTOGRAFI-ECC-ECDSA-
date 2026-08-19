<?php
// api/rtt/delete.php — Hapus dokumen RTT (hanya sysadmin, tidak bisa hapus yang sudah disahkan)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data  = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$rtt_id = intval($data['rtt_id'] ?? 0);

// Auth
$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ? AND is_active = 1");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Sesi tidak valid']);
    exit;
}

// Hanya sysadmin
if ($user['role'] !== 'sysadmin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Hanya Sysadmin yang dapat menghapus dokumen RTT']);
    exit;
}

if (!$rtt_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID RTT tidak valid']);
    exit;
}

// Cek RTT ada
$stmt = $pdo->prepare("SELECT id, status, nomor_dokumen FROM rtt WHERE id = ?");
$stmt->execute([$rtt_id]);
$rtt = $stmt->fetch();

if (!$rtt) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Dokumen RTT tidak ditemukan']);
    exit;
}

// Dokumen yang sudah disahkan tidak boleh dihapus
if ($rtt['status'] === 'disahkan') {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Dokumen yang sudah disahkan (bertanda tangan ECDSA) tidak dapat dihapus'
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Hapus semua tabel relasi RTT (urut dari anak ke induk)
    $tables = [
        "DELETE FROM rtt_ba_detail       WHERE berita_acara_id IN (SELECT id FROM rtt_berita_acara WHERE rtt_id = ?)",
        "DELETE FROM rtt_berita_acara    WHERE rtt_id = ?",
        "DELETE FROM rtt_klem_detail     WHERE rtt_id = ?",
        "DELETE FROM rtt_rekap_klem      WHERE rtt_id = ?",
        "DELETE FROM rtt_peta_bap        WHERE rtt_id = ?",
        "DELETE FROM rtt_peta            WHERE rtt_id = ?",
        "DELETE FROM rtt_tebangan        WHERE rtt_id = ?",
        "DELETE FROM rtt_nett            WHERE rtt_id = ?",
        "DELETE FROM rtt_summary         WHERE rtt_id = ?",
        "DELETE FROM rtt_rekap           WHERE rtt_id = ?",
        "DELETE FROM rtt_pengesahan      WHERE rtt_id = ?",
        "DELETE FROM rtt_keputusan       WHERE rtt_id = ?",
        "DELETE FROM rtt_sk              WHERE rtt_id = ?",
        "DELETE FROM validasi            WHERE rtt_id = ?",
        "DELETE FROM rtt                 WHERE id = ?",
    ];

    foreach ($tables as $sql) {
        $pdo->prepare($sql)->execute([$rtt_id]);
    }

    $pdo->commit();

    echo json_encode([
        'status'  => 'success',
        'message' => "Dokumen RTT \"{$rtt['nomor_dokumen']}\" berhasil dihapus"
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Gagal menghapus: ' . $e->getMessage()]);
}
?>
