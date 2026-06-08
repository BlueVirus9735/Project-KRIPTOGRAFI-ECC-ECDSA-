<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['rpkh_id'], $data['kph'], $data['nomor_dokumen'])) {
    http_response_code(400);
    echo json_encode(['status'=>'error', 'message'=>'Incomplete data']); 
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO rtt (rpkh_id, nomor_dokumen, tanggal, kph, bkph, rph, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT')");
    $stmt->execute([
        $data['rpkh_id'], 
        $data['nomor_dokumen'], 
        $data['tanggal'] ?? date('Y-m-d'),
        $data['kph'], 
        $data['bkph'] ?? '', 
        $data['rph'] ?? '', 
        $data['user_id'] ?? null
    ]);
    
    $rtt_id = $pdo->lastInsertId();
    echo json_encode([
        'status'=>'success', 
        'message'=>'Workspace RTT berhasil dibuat', 
        'rtt_id'=>$rtt_id
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status'=>'error', 'message'=>$e->getMessage()]);
}
?>
