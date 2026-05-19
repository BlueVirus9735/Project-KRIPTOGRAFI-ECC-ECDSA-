<?php
$files = [
    'api/db.php',
    'api/crypto_utils.php',
    'api/rtt/sign.php',
    'api/rtt/download_bundle.php',
    'api/verify.php',
    'api/validation/validate.php'
];

foreach ($files as $f) {
    if (!file_exists($f)) {
        echo "File NOT FOUND: $f\n";
        continue;
    }
    $c = file_get_contents($f);
    $bom = pack('H*', 'EFBBBF');
    if (substr($c, 0, 3) === $bom) {
        echo "BOM FOUND: $f\n";
    } else {
        echo "NO BOM: $f\n";
    }
}
?>
