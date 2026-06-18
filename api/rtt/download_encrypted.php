<?php

header('Access-Control-Allow-Origin: *');

include __DIR__ . '/../db.php';
include __DIR__ . '/../crypto_utils.php';

$id = $_GET['id'] ?? 0;

if (!$id) {
    http_response_code(400);
    echo "ID RTT tidak valid.";
    exit;
}

$stmt = $pdo->prepare("SELECT public_key, status FROM rtt WHERE id = ?");
$stmt->execute([$id]);
$rtt = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$rtt) {
    http_response_code(404);
    echo "Dokumen RTT tidak ditemukan.";
    exit;
}

if (!$rtt['public_key']) {
    http_response_code(400);
    echo "Gagal: Dokumen ini belum disahkan sehingga belum dikunci menggunakan Public Key. Lakukan pengesahan terlebih dahulu.";
    exit;
}

$public_key_content = $rtt['public_key'];

$payload = getCanonicalPayload($pdo, $id);
if (!$payload) {
    http_response_code(500);
    echo "Gagal membuat payload dokumen.";
    exit;
}

$json_data = encodeCanonicalJSON($payload);

$temp_dir = __DIR__ . '/../uploads/temp/';
if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);

$temp_json_file = $temp_dir . 'rtt_' . $id . '_plain.json';
$temp_enc_file = $temp_dir . 'rtt_' . $id . '_encrypted.enc';
$temp_key_file = $temp_dir . 'temp_pubkey_' . uniqid() . '.pem';

file_put_contents($temp_json_file, $json_data);
file_put_contents($temp_key_file, $public_key_content);

$encrypt_script = realpath(__DIR__ . '/../../crypto/encrypt.py');
$python_exe = 'py'; 
if (file_exists($encrypt_script) && file_exists($temp_key_file)) {
    $cmd = escapeshellarg($python_exe) . " " . escapeshellarg($encrypt_script) . " " . escapeshellarg($temp_key_file) . " " . escapeshellarg($temp_json_file) . " " . escapeshellarg($temp_enc_file) . " 2>&1";
    $python_output = shell_exec($cmd);
    
    if (file_exists($temp_enc_file)) {

        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="RTT_' . $id . '_Encrypted.enc"');
        header('Content-Length: ' . filesize($temp_enc_file));
        
        readfile($temp_enc_file);
    } else {
        http_response_code(500);
        echo "Gagal melakukan enkripsi ECC. Detail: " . $python_output;
    }
} else {
    http_response_code(500);
    echo "Sistem Kriptografi (encrypt.py) tidak ditemukan di server.";
}


@unlink($temp_json_file);
@unlink($temp_enc_file);
@unlink($temp_key_file);
?>
