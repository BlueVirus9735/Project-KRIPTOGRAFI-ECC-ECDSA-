<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

$status_filter = $_GET['status'] ?? '';

$token = $_GET['token'] ?? '';
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) $token = $matches[1];

$currentUser = null;
if ($token) {
    $stmt = $pdo->prepare("SELECT id, role, wilayah_kph, wilayah_phw FROM users WHERE session_token = ? AND is_active = 1");
    $stmt->execute([$token]);
    $currentUser = $stmt->fetch();
}

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

$where_clauses = [];
$params = [];

if ($status_filter) {
    $where_clauses[] = "r.status = ?";
    $params[] = $status_filter;
}

if ($currentUser && $currentUser['role'] === 'kph' && !empty($currentUser['wilayah_kph'])) {
    $where_clauses[] = "r.kph = ?";
    $params[] = $currentUser['wilayah_kph'];
}

if ($currentUser && $currentUser['role'] === 'phw' && !empty($currentUser['wilayah_phw'])) {
    $where_clauses[] = "r.phw = ?";
    $params[] = $currentUser['wilayah_phw'];
}

if (!empty($where_clauses)) {
    $sql .= " WHERE " . implode(" AND ", $where_clauses);
}

$stmt = $pdo->prepare($sql . " ORDER BY r.created_at DESC");
$stmt->execute($params);

echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll()]);
?>
