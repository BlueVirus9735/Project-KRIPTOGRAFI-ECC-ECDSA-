<?php
// manual_fix_pubkey.php
include __DIR__ . '/api/db.php';
$key_path = 'perum_perhutani_RTT.pem/private_key.pem';
if (!file_exists($key_path)) {
    echo "Key file $key_path not found.\n";
    exit;
}
$key = file_get_contents($key_path);
$res = openssl_pkey_get_private($key);
if (!$res) {
    echo "Failed to load private key.\n";
    exit;
}
$details = openssl_pkey_get_details($res);
$pub = $details['key'];
$stmt = $pdo->prepare('UPDATE rtt SET public_key=? WHERE id=5');
$stmt->execute([$pub]);
echo "Updated RTT 5 public key successfully.\n";
?>
