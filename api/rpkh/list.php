<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

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
    SELECT r.*, u.nama as created_by_name,
    (SELECT COUNT(*) FROM rpkh_detail WHERE rpkh_id = r.id) as jumlah_petak,
    (SELECT COUNT(*) FROM rtt WHERE rpkh_id = r.id) as jumlah_rtt
    FROM rpkh r
    LEFT JOIN users u ON r.created_by = u.id
";

$where_clauses = [];
$params = [];

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

$sql .= " ORDER BY r.created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$data = $stmt->fetchAll();

echo json_encode(['status' => 'success', 'data' => $data]);
?>
