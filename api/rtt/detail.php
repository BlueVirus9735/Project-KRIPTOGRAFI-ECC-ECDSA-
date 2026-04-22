<?php
// api/rtt/detail.php — Get all RTT document details (New Multi-Table Schema)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

$id = $_GET['id'] ?? 0;

try {
    // Master RTT
    $stmt = $pdo->prepare("
        SELECT r.*, rp.wilayah as rpkh_wilayah, rp.tahun as rpkh_tahun, u.nama as created_by_name 
        FROM rtt r 
        LEFT JOIN rpkh rp ON r.rpkh_id = rp.id 
        LEFT JOIN users u ON r.created_by = u.id 
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $rtt = $stmt->fetch();

    if (!$rtt) {
        echo json_encode(['status' => 'error', 'message' => 'Dokumen RTT tidak ditemukan']); 
        exit;
    }

    $data = ['status' => 'success', 'rtt' => $rtt];

    // 1. Summary
    $stmt = $pdo->prepare("SELECT * FROM rtt_summary WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $data['summary'] = $stmt->fetch() ?: null;
    
    // 2. Nett
    $stmt = $pdo->prepare("SELECT * FROM rtt_nett WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $data['nett'] = $stmt->fetch() ?: null;
    
    // 3. Peta
    $stmt = $pdo->prepare("SELECT * FROM rtt_peta WHERE rtt_id = ?"); 
    $stmt->execute([$id]); 
    $data['peta'] = $stmt->fetchAll() ?: [];
    
    // 4. Rekap Klem
    $stmt = $pdo->prepare("SELECT * FROM rtt_rekap_klem WHERE rtt_id = ?"); 
    $stmt->execute([$id]); 
    $data['rekap_klem'] = $stmt->fetchAll() ?: [];
    
    // 5. Klem Detail
    $stmt = $pdo->prepare("SELECT * FROM rtt_klem_detail WHERE rtt_id = ?"); 
    $stmt->execute([$id]); 
    $data['klem_detail'] = $stmt->fetchAll() ?: [];
    
    // 6. Berita Acara & Ba Details
    $stmt = $pdo->prepare("SELECT * FROM rtt_berita_acara WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $ba = $stmt->fetch();
    if($ba) {
        $stmt2 = $pdo->prepare("SELECT * FROM rtt_ba_detail WHERE berita_acara_id = ?"); 
        $stmt2->execute([$ba['id']]); 
        $ba['details'] = $stmt2->fetchAll() ?: [];
    }
    $data['berita_acara'] = $ba ?: null;
    
    // 7. Peta BAP
    $stmt = $pdo->prepare("SELECT * FROM rtt_peta_bap WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $data['peta_bap'] = $stmt->fetch() ?: null;

    // Workflow validations
    $stmt = $pdo->prepare("
        SELECT v.*, u.nama as validator 
        FROM validasi v 
        LEFT JOIN users u ON v.validated_by = u.id 
        WHERE v.rtt_id = ? 
        ORDER BY v.validated_at DESC
    ");
    $stmt->execute([$id]);
    $data['validasi'] = $stmt->fetchAll() ?: [];

    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
