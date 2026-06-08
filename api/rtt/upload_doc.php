<?php
// api/rtt/upload_doc.php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['rtt_id'], $data['doc_type'], $data['payload'])) {
    http_response_code(400);
    echo json_encode(['status'=>'error', 'message'=>'Incomplete data']); 
    exit;
}

$rtt_id = $data['rtt_id'];
$type = $data['doc_type']; // summary, nett, rekap_klem, klem_detail, berita_acara, peta, peta_bap
$payload = $data['payload'];

try {
    $pdo->beginTransaction();

    if ($type === 'summary') {
        $pdo->prepare("DELETE FROM rtt_summary WHERE rtt_id = ?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_summary (rtt_id, bentuk_tebangan, luas, jenis_kayu, kayu_perkakas, kayu_bakar, bambu, arang, jumlah_pohon, keterangan) VALUES (?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([$rtt_id, $payload['bentuk_tebangan']??'', $payload['luas']??0, $payload['jenis_kayu']??'', $payload['kayu_perkakas']??0, $payload['kayu_bakar']??0, $payload['bambu']??0, $payload['arang']??0, $payload['jumlah_pohon']??0, $payload['keterangan']??'']);
    } 
    else if ($type === 'nett') {
        $pdo->prepare("DELETE FROM rtt_nett WHERE rtt_id = ?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_nett (rtt_id, bagian_hutan, bkph, rph, petak, anak_petak_baru, volume_kayu, jumlah_pohon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$rtt_id, $payload['bagian_hutan']??'', $payload['bkph']??'', $payload['rph']??'', $payload['petak']??'', $payload['anak_petak_baru']??'', $payload['volume_kayu']??0, $payload['jumlah_pohon']??0]);
    }
    else if ($type === 'peta') {
        $pdo->prepare("DELETE FROM rtt_peta WHERE rtt_id = ?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_peta (rtt_id, file_path, bagian_hutan, rph) VALUES (?,?,?,?)");
        $stmt->execute([$rtt_id, $payload['file_path'] ?? 'peta_lokasi_'.time().'.pdf', $payload['bagian_hutan']??'', $payload['rph']??'']);
    }
    else if ($type === 'rekap_klem') {
        $pdo->prepare("DELETE FROM rtt_rekap_klem WHERE rtt_id = ?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_rekap_klem (rtt_id, no_blok, luas_blok, jumlah_pohon, volume) VALUES (?,?,?,?,?)");
        $stmt->execute([$rtt_id, $payload['no_blok']??'Blok 1', $payload['luas_blok']??0, $payload['jumlah_pohon']??0, $payload['volume']??0]);
    }
    else if ($type === 'klem_detail') {
        $pdo->prepare("DELETE FROM rtt_klem_detail WHERE rtt_id = ?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_klem_detail (rtt_id, no_pohon, keliling, volume, jenis_pohon) VALUES (?,?,?,?,?)");
        $stmt->execute([$rtt_id, $payload['no_pohon']??'001', $payload['keliling']??0, $payload['volume']??0, $payload['jenis_pohon']??'Jati']);
    }
    else if ($type === 'berita_acara') {
        $pdo->prepare("DELETE FROM rtt_berita_acara WHERE rtt_id = ?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_berita_acara (rtt_id, nama_petugas, jabatan, tanggal, hasil_pemeriksaan) VALUES (?,?,?,?,?)");
        $stmt->execute([$rtt_id, $payload['nama_petugas']??'', $payload['jabatan']??'', $payload['tanggal']??date('Y-m-d'), $payload['hasil_pemeriksaan']??'']);
    }
    else if ($type === 'peta_bap') {
        $pdo->prepare("DELETE FROM rtt_peta_bap WHERE rtt_id = ?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_peta_bap (rtt_id, file_path, keterangan) VALUES (?,?,?)");
        $stmt->execute([$rtt_id, $payload['file_path'] ?? 'peta_lampiran_bap_'.time().'.pdf', $payload['keterangan']??'']);
    }

    $pdo->commit();
    echo json_encode(['status'=>'success', 'message'=>"Data '$type' berhasil disimpan!"]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status'=>'error', 'message'=>$e->getMessage()]);
}
?>
