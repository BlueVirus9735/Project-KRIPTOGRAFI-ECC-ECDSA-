<?php
header('Content-Type: application/json');
include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$rtt_id = $data['rtt_id'] ?? 0;

$stmt = $pdo->prepare("SELECT id, role FROM users WHERE session_token = ?");
$stmt->execute([$token]); 
$user = $stmt->fetch();

if (!$user) { 
    echo json_encode(['status'=>'error','message'=>'Sesi tidak valid']); 
    exit; 
}

try {
    $pdo->beginTransaction();

    // 1. Identitas
    if (isset($data['identitas'])) {
        $d = $data['identitas'];
        $tanggal = !empty($d['tanggal']) ? $d['tanggal'] : null;
        $stmt = $pdo->prepare("UPDATE rtt SET nomor_dokumen=?, tanggal=?, kph=?, bkph=?, rph=?, rpkh_id=? WHERE id=?");
        $stmt->execute([$d['nomor_dokumen']??null, $tanggal, $d['kph']??null, $d['bkph']??null, $d['rph']??null, $d['rpkh_id']??null, $rtt_id]);
    }

    // 2. SK
    if (isset($data['sk'])) {
        $d = $data['sk'];
        $tanggal_sk = !empty($d['tanggal_sk']) ? $d['tanggal_sk'] : null;
        $stmt = $pdo->prepare("UPDATE rtt_sk SET nomor_sk=?, tanggal_sk=?, tentang=? WHERE rtt_id=?");
        $stmt->execute([$d['nomor_sk']??null, $tanggal_sk, $d['tentang']??null, $rtt_id]);
    }

    // 3. Keputusan
    if (isset($data['keputusan'])) {
        $d = $data['keputusan'];
        $stmt = $pdo->prepare("UPDATE rtt_keputusan SET menimbang=?, mengingat=?, memutuskan=? WHERE rtt_id=?");
        $stmt->execute([$d['menimbang']??null, $d['mengingat']??null, $d['memutuskan']??null, $rtt_id]);
    }

    // 4. Tebangan
    if (isset($data['tebangan'])) {
        $pdo->prepare("DELETE FROM rtt_tebangan WHERE rtt_id=?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_tebangan (rtt_id, nomor, petak, anak_petak, luas, jenis_tanaman, volume, jumlah_pohon, keterangan) VALUES (?,?,?,?,?,?,?,?,?)");
        $total_luas = 0; $total_volume = 0; $total_pohon = 0;
        foreach ($data['tebangan'] as $i => $t) {
            $stmt->execute([$rtt_id, $i+1, $t['petak']??'', $t['anak_petak']??'', $t['luas']??0, $t['jenis_tanaman']??'', $t['volume']??0, $t['jumlah_pohon']??0, $t['keterangan']??null]);
            $total_luas += floatval($t['luas'] ?? 0);
            $total_volume += floatval($t['volume'] ?? 0);
            $total_pohon += intval($t['jumlah_pohon'] ?? 0);
        }
        $pdo->prepare("UPDATE rtt_rekap SET total_luas=?, total_volume=?, total_pohon=? WHERE rtt_id=?")
            ->execute([$total_luas, $total_volume, $total_pohon, $rtt_id]);
    }

    // 5. Berita Acara
    if (isset($data['berita_acara'])) {
        $pdo->prepare("DELETE FROM rtt_berita_acara WHERE rtt_id=?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_berita_acara (rtt_id, tanggal, nama_petugas, jabatan, hasil_pemeriksaan) VALUES (?,?,?,?,?)");
        foreach ($data['berita_acara'] as $ba) {
            $tanggal_ba = !empty($ba['tanggal']) ? $ba['tanggal'] : null;
            $stmt->execute([$rtt_id, $tanggal_ba, $ba['nama_petugas']??'', $ba['jabatan']??'', $ba['hasil_pemeriksaan']??'']);
        }
    }

    // 6. Pengesahan
    if (isset($data['pengesahan'])) {
        $pdo->prepare("DELETE FROM rtt_pengesahan WHERE rtt_id=?")->execute([$rtt_id]);
        $stmt = $pdo->prepare("INSERT INTO rtt_pengesahan (rtt_id, nama_pejabat, jabatan, npk, tanggal) VALUES (?,?,?,?,?)");
        foreach ($data['pengesahan'] as $p) {
            $tanggal_p = !empty($p['tanggal']) ? $p['tanggal'] : null;
            $stmt->execute([$rtt_id, $p['nama_pejabat']??'', $p['jabatan']??'', $p['npk']??'', $tanggal_p]);
        }
    }

    // Generate hash
    $hash_data = json_encode($data);
    $hash = hash('sha256', $hash_data);
    $pdo->prepare("UPDATE rtt SET hash=?, updated_at=NOW() WHERE id=?")->execute([$hash, $rtt_id]);

    $pdo->commit();
    echo json_encode(['status'=>'success','message'=>'Data berhasil disimpan','hash'=>$hash]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['status'=>'error','message'=>$e->getMessage(),'code'=>$e->getCode()]);
}
?>
