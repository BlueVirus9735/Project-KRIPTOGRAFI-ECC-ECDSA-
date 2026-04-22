<?php
// api/rtt/list.php — Get all RTT documents (New Schema)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

$status_filter = $_GET['status'] ?? '';

$sql = "
    SELECT 
        r.*, 
        rp.wilayah as rpkh_wilayah, 
        rp.tahun as rpkh_tahun,
        u1.nama as created_by_name
    FROM rtt r
    LEFT JOIN rpkh rp ON r.rpkh_id = rp.id
    LEFT JOIN users u1 ON r.created_by = u1.id
";

if ($status_filter) {
    $sql .= " WHERE r.status = ?";
    $stmt = $pdo->prepare($sql . " ORDER BY r.created_at DESC");
    $stmt->execute([$status_filter]);
} else {
    $stmt = $pdo->query($sql . " ORDER BY r.created_at DESC");
}

echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
?>
