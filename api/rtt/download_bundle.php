<?php

header('Access-Control-Allow-Origin: *');

include __DIR__ . '/../db.php';

$id = $_GET['id'] ?? 0;
$type = $_GET['type'] ?? 'sig'; // 'sig' or 'pub'

$stmt = $pdo->prepare("SELECT nomor_dokumen, signature, public_key FROM rtt WHERE id = ?");
$stmt->execute([$id]);
$rtt = $stmt->fetch();

if (!$rtt) {
    http_response_code(404);
    echo "RTT not found";
    exit;
}

if ($type === 'sig') {
    if (!$rtt['signature']) {
        echo "No signature available for this RTT.";
        exit;
    }
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="RTT_' . $id . '.sig"');
    echo base64_decode($rtt['signature']);
} elseif ($type === 'pub') {
    if (!$rtt['public_key']) {
        echo "No public key available for this RTT.";
        exit;
    }
    header('Content-Type: application/x-pem-file');
    header('Content-Disposition: attachment; filename="RTT_' . $id . '_public.pem"');
    echo $rtt['public_key'];
} elseif ($type === 'json') {
    include __DIR__ . '/../crypto_utils.php';
    $payload = getCanonicalPayload($pdo, $id);
    if (!$payload) { echo "Gagal membuat payload"; exit; }
    
    $json_data = encodeCanonicalJSON($payload);
    
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="RTT_' . $id . '_Data_Sertifikat.json"');
    echo $json_data;
} else {
    echo "Invalid type";
}
?>
