<?php
$key = file_get_contents(__DIR__ . '/perum_perhutani_RTT.pem/private_key.pem');
$payload = json_encode([
    'rtt_id' => 1,
    'user_id' => 2,
    'private_key' => $key
]);
$ch = curl_init('http://localhost:8000/api/rtt/sign.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$resp = curl_exec($ch);
echo $resp;
?>
