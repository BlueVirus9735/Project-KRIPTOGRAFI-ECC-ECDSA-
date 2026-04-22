<?php
$data = json_encode(['username' => 'admin_kph', 'password' => 'password']);
$options = [
    'http' => [
        'method'  => 'POST',
        'content' => $data,
        'header'=>  "Content-Type: application/json\r\n" .
                    "Accept: application/json\r\n"
    ]
];
$context  = stream_context_create($options);
$result = @file_get_contents('http://localhost:8000/api/auth/login.php', false, $context);
echo "RESPONSE FROM HTTP HEADER: " . print_r($http_response_header, true) . "\n";
echo "RESPONSE FROM API:\n$result\n";
