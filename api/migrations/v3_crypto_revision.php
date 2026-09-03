<?php
// api/migrations/v3_crypto_revision.php
// Revisi Kriptografi: per-user ECC encryption + multi-stage ECDSA signing
include __DIR__ . '/../db.php';

$migrations = [
    // === users table ===
    [
        'sql' => "ALTER TABLE users ADD COLUMN public_key TEXT NULL COMMENT 'ECC Public Key PEM milik user' AFTER role",
        'desc' => "users.public_key"
    ],

    // === rtt table — KPH signing ===
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN kph_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash canonical payload saat KPH submit' AFTER hash",
        'desc' => "rtt.kph_hash"
    ],
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN kph_signature TEXT NULL COMMENT 'ECDSA signature oleh KPH saat submit' AFTER kph_hash",
        'desc' => "rtt.kph_signature"
    ],
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN kph_public_key TEXT NULL COMMENT 'ECC Public key KPH untuk verifikasi signature' AFTER kph_signature",
        'desc' => "rtt.kph_public_key"
    ],

    // === rtt table — PHW signing ===
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN phw_hash VARCHAR(64) NULL COMMENT 'SHA-256 hash canonical payload saat PHW approve' AFTER kph_public_key",
        'desc' => "rtt.phw_hash"
    ],
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN phw_signature TEXT NULL COMMENT 'ECDSA signature oleh PHW saat approve' AFTER phw_hash",
        'desc' => "rtt.phw_signature"
    ],
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN phw_public_key TEXT NULL COMMENT 'ECC Public key PHW untuk verifikasi signature' AFTER phw_signature",
        'desc' => "rtt.phw_public_key"
    ],

    // === rtt table — encrypted payload ===
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN encrypted_payload LONGTEXT NULL COMMENT 'Payload JSON terenkripsi ECC (berubah per tahap)' AFTER phw_public_key",
        'desc' => "rtt.encrypted_payload"
    ],
    [
        'sql' => "ALTER TABLE rtt ADD COLUMN encrypted_for VARCHAR(20) NULL COMMENT 'Role yang bisa dekripsi: phw, divisi, admin' AFTER encrypted_payload",
        'desc' => "rtt.encrypted_for"
    ],
];

$success = 0;
$skipped = 0;
$errors   = 0;

foreach ($migrations as $m) {
    try {
        $pdo->exec($m['sql']);
        echo "OK Added: {$m['desc']}\n";
        $success++;
    } catch (PDOException $e) {
        if ($e->getCode() == '42S21') {
            echo "SKIP (already exists): {$m['desc']}\n";
            $skipped++;
        } else {
            echo "ERR on {$m['desc']}: " . $e->getMessage() . "\n";
            $errors++;
        }
    }
}

echo "\n=== Migration v3 selesai ===\n";
echo "Added: $success | Skipped: $skipped | Errors: $errors\n";
?>
