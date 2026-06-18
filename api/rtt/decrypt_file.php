<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Method Not Allowed";
    exit;
}

if (!isset($_FILES['encrypted_file']) || !isset($_POST['private_key'])) {
    http_response_code(400);
    echo "File terenkripsi dan Private Key harus disertakan.";
    exit;
}

$private_key_content = $_POST['private_key'];
$uploaded_file = $_FILES['encrypted_file']['tmp_name'];

$temp_dir = __DIR__ . '/../uploads/temp/';
if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);

$temp_enc_file = $temp_dir . 'upload_' . uniqid() . '.enc';
$temp_key_file = $temp_dir . 'priv_' . uniqid() . '.pem';
$temp_dec_file = $temp_dir . 'decrypted_' . uniqid() . '.json';

move_uploaded_file($uploaded_file, $temp_enc_file);
file_put_contents($temp_key_file, $private_key_content);

$decrypt_script = realpath(__DIR__ . '/../../crypto/decrypt.py');
$python_exe = 'py';

if (file_exists($decrypt_script) && file_exists($temp_enc_file) && file_exists($temp_key_file)) {
    $cmd = escapeshellarg($python_exe) . " " . escapeshellarg($decrypt_script) . " " . escapeshellarg($temp_key_file) . " " . escapeshellarg($temp_enc_file) . " " . escapeshellarg($temp_dec_file) . " 2>&1";
    $python_output = shell_exec($cmd);
    
    if (file_exists($temp_dec_file) && filesize($temp_dec_file) > 0) {
        $decrypted_content = file_get_contents($temp_dec_file);

        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="Decrypted_RTT_Document.json"');
        header('Content-Length: ' . filesize($temp_dec_file));
        
        echo $decrypted_content;
    } else {
        http_response_code(400);
        echo "Gagal melakukan dekripsi. Pastikan Private Key benar dan sesuai dengan dokumen. Detail: " . substr($python_output, 0, 300);
    }
} else {
    http_response_code(500);
    echo "Sistem Kriptografi (decrypt.py) tidak ditemukan di server.";
}

@unlink($temp_enc_file);
@unlink($temp_key_file);
@unlink($temp_dec_file);
?>
