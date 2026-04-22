<?php
// cors_router.php — Laragon router for PERUM_PERHUTANI API
// Serves files from /api/ subdirectories

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Match /api/... requests
if (preg_match('#^/api/(.+)$#', $path, $matches)) {
    $file = __DIR__ . '/api/' . $matches[1];
    if (file_exists($file) && pathinfo($file, PATHINFO_EXTENSION) === 'php') {
        include $file;
        return true;
    }
}

// Default: serve static files
return false;
?>
