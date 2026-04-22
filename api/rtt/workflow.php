<?php
// api/rtt/workflow.php
// Endpoint to update RTT status (DRAFT -> DIAJUKAN -> REVISI -> DISETUJUI, etc.)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['rtt_id'], $data['new_status'], $data['user_id'])) {
    http_response_code(400);
    echo json_encode(['status'=>'error', 'message'=>'Incomplete data']); 
    exit;
}

try {
    $pdo->beginTransaction();
    
    // Update RTT status
    $stmt = $pdo->prepare("UPDATE rtt SET status = ? WHERE id = ?");
    $stmt->execute([$data['new_status'], $data['rtt_id']]);
    
    // Log this action in validasi table
    $stmt2 = $pdo->prepare("INSERT INTO validasi (rtt_id, catatan, validated_by) VALUES (?, ?, ?)");
    $stmt2->execute([$data['rtt_id'], $data['catatan'] ?? '', $data['user_id']]);
    
    $pdo->commit();
    echo json_encode([
        'status'=>'success', 
        'message'=>'Status RTT berhasil diperbarui ke ' . $data['new_status']
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status'=>'error', 'message'=>$e->getMessage()]);
}
?>
