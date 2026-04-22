<?php
// api/rpkh/list.php — Get all RPKH
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

$stmt = $pdo->query("
    SELECT r.*, u.nama as created_by_name,
    (SELECT COUNT(*) FROM rpkh_detail WHERE rpkh_id = r.id) as jumlah_petak,
    (SELECT COUNT(*) FROM rtt WHERE rpkh_id = r.id) as jumlah_rtt
    FROM rpkh r
    LEFT JOIN users u ON r.created_by = u.id
    ORDER BY r.created_at DESC
");
$data = $stmt->fetchAll();

echo json_encode(['status' => 'success', 'data' => $data]);
?>
