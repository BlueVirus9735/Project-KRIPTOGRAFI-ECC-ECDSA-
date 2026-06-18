<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['rpkh_id'])) {
    echo json_encode(['status'=>'error','message'=>'ID RPKH tidak ada']); 
    exit;
}

if (!isset($data['private_key'])) {
    echo json_encode(['status'=>'error','message'=>'Private Key wajib disertakan untuk enkripsi ECDSA']);
    exit;
}

$rpkh_id = $data['rpkh_id'];
$private_key_content = $data['private_key'];

$stmt = $pdo->prepare("SELECT * FROM rpkh WHERE id = ?"); $stmt->execute([$rpkh_id]); 
$rpkh = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$rpkh) { echo json_encode(['status'=>'error','message'=>'RPKH tidak ditemukan']); exit; }

$stmt = $pdo->prepare("SELECT * FROM rpkh_detail WHERE rpkh_id = ?"); $stmt->execute([$rpkh_id]);
$details = $stmt->fetchAll(PDO::FETCH_ASSOC);

$hash_data = json_encode(['rpkh' => $rpkh, 'details' => $details]);
$hash = hash('sha256', $hash_data);

$temp_dir = __DIR__ . '/../uploads/temp/';
if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);

$temp_hash_file = $temp_dir . 'rpkh_' . $rpkh_id . '_data.json';
$temp_sig_file = $temp_dir . 'rpkh_' . $rpkh_id . '_data.sig';
$temp_key_file = $temp_dir . 'temp_key_' . uniqid() . '.pem';

file_put_contents($temp_hash_file, $hash_data);
file_put_contents($temp_key_file, $private_key_content);

$sign_script = realpath(__DIR__ . '/../../crypto/sign.py');
$signature = null;

$python_exe = 'py';
if (file_exists($sign_script) && file_exists($temp_key_file)) {
    $cmd = escapeshellarg($python_exe) . " " . escapeshellarg($sign_script) . " " . escapeshellarg($temp_key_file) . " " . escapeshellarg($temp_hash_file) . " " . escapeshellarg($temp_sig_file) . " 2>&1";
    $python_output = shell_exec($cmd);
    
    if (file_exists($temp_sig_file)) {
        $signature = base64_encode(file_get_contents($temp_sig_file));
    } else {
        $signature = null;
        $python_err = $python_output;
    }
} else {
    $signature = base64_encode(hash_hmac('sha256', $hash, 'Perhutani_Secret_Key_Demo_Only', true));
}

// Cleanup temp
@unlink($temp_hash_file);
@unlink($temp_sig_file);
@unlink($temp_key_file);

if (!$signature) {
    $err_msg = 'Gagal proses penandatanganan ECDSA.';
    if (isset($python_err)) $err_msg .= " Detail: " . substr($python_err, 0, 500);
    echo json_encode(['status'=>'error','message'=>$err_msg]); exit;
}

try {
    $pdo->prepare("UPDATE rpkh SET hash=?, signature=?, updated_at=NOW() WHERE id=?")
        ->execute([$hash, $signature, $rpkh_id]);

    echo json_encode([
        'status'=>'success',
        'message'=>'RPKH berhasil ditandatangani!',
        'hash' => $hash,
        'signature'=> substr($signature, 0, 50).'...'
    ]);
} catch (Exception $dbEx) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Database error: ' . $dbEx->getMessage()
    ]);
}
?>
