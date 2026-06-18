<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

try {
    $stmt = $pdo->query("SELECT 
        COUNT(*) as total_dokumen,
        SUM(CASE WHEN status = 'disahkan' THEN 1 ELSE 0 END) as total_disahkan,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as total_draft,
        SUM(CASE WHEN status = 'menunggu_verifikasi_phw' THEN 1 ELSE 0 END) as total_pending
    FROM rtt");
    $stats = $stmt->fetch();

    $stmt = $pdo->query("SELECT 
        COALESCE(SUM(s.luas), 0) as total_luas,
        COALESCE(SUM(s.jumlah_pohon), 0) as total_pohon,
        COALESCE(SUM(s.kayu_perkakas + s.kayu_bakar), 0) as total_volume
    FROM rtt r
    JOIN rtt_summary s ON r.id = s.rtt_id
    WHERE r.status = 'disahkan'");
    $prod_stats = $stmt->fetch();

    $stmt = $pdo->query("SELECT 
        kph, 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'disahkan' THEN 1 ELSE 0 END) as disahkan
    FROM rtt 
    GROUP BY kph 
    ORDER BY disahkan DESC 
    LIMIT 5");
    $kph_stats = $stmt->fetchAll();

    $stmt = $pdo->query("SELECT 
        r.id, r.nomor_dokumen, r.tanggal, r.kph, r.status, r.hash,
        s.luas, s.jumlah_pohon
    FROM rtt r
    LEFT JOIN rtt_summary s ON r.id = s.rtt_id
    WHERE r.status = 'disahkan'
    ORDER BY r.tanggal DESC");
    $documents = $stmt->fetchAll();

    include_once __DIR__ . '/../crypto_utils.php';
    foreach ($documents as &$doc) {
        $payload = getCanonicalPayload($pdo, $doc['id']);
        $json_data = encodeCanonicalJSON($payload);
        $calculated_hash = hash('sha256', $json_data);
        
        if ($calculated_hash !== $doc['hash']) {
            $doc['crypto_status'] = 'corrupt'; 
        } else {
            $doc['crypto_status'] = 'valid';
        }
        unset($doc['hash']);
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'overview' => $stats,
            'production' => $prod_stats,
            'kph_performance' => $kph_stats,
            'documents' => $documents
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
