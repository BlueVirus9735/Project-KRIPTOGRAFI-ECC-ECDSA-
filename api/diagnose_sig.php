<?php
// api/diagnose_sig.php
header('Content-Type: text/plain');
include 'db.php';
include 'crypto_utils.php';

$id = $_GET['id'] ?? 5;
echo "Diagnosing RTT ID: $id\n";

$payload = getCanonicalPayload($pdo, $id);
if (!$payload) { echo "ID $id not found.\n"; exit; }

$json = encodeCanonicalJSON($payload);
$hash = hash('sha256', $json);
echo "1. Payload Generated (Length: " . strlen($json) . " bytes)\n";
echo "2. Hash SHA-256: $hash\n";

$stmt = $pdo->prepare("SELECT signature, public_key, hash FROM rtt WHERE id = ?");
$stmt->execute([$id]);
$rtt = $stmt->fetch();

echo "3. Stored Hash in DB: " . $rtt['hash'] . "\n";
echo "   Match: " . ($hash === $rtt['hash'] ? "YES ✅" : "NO ❌") . "\n";

if ($rtt['signature'] && $rtt['public_key']) {
    $sig_bin = base64_decode($rtt['signature']);
    echo "4. Stored Signature Length: " . strlen($sig_bin) . " bytes\n";
    
    // Check if it's a real DER signature (starts with 0x30)
    if (strlen($sig_bin) > 0 && ord($sig_bin[0]) === 0x30) {
        echo "   Format: Real ECDSA (DER/BER) ✅\n";
    } else {
        echo "   Format: Invalid or Pseudo-Signature ❌\n";
    }
    
    // Internal Python Verification
    $temp_dir = __DIR__ . '/uploads/temp/';
    if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
    
    $uid = uniqid();
    $temp_json = $temp_dir . $uid . '_debug.json';
    $temp_sig = $temp_dir . $uid . '_debug.sig';
    $temp_pub = $temp_dir . $uid . '_debug.pem';
    
    file_put_contents($temp_json, $json);
    file_put_contents($temp_sig, $sig_bin);
    file_put_contents($temp_pub, $rtt['public_key']);
    
    $verify_script = realpath(__DIR__ . '/../crypto/verify.py');
    $python_exe = 'py';
    
    $cmd = "\"$python_exe\" \"$verify_script\" \"$temp_pub\" \"$temp_json\" \"$temp_sig\" 2>&1";
    $output = shell_exec($cmd);
    
    echo "5. Internal Python Verification Result:\n";
    echo "----------------------------------------\n";
    echo $output;
    echo "----------------------------------------\n";
    
    @unlink($temp_json);
    @unlink($temp_sig);
    @unlink($temp_pub);
} else {
    echo "4. Error: No signature/public_key in DB for this RTT.\n";
}
?>
