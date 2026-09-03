<?php
// api/migrations/v4_key_ca_approval.php
// Menambahkan kolom persetujuan otoritas kunci (Certificate Authority / Admin Approval)
include __DIR__ . '/../db.php';

$migrations = [
    [
        'sql' => "ALTER TABLE users ADD COLUMN pending_public_key TEXT NULL COMMENT 'Public Key yang diajukan dan menunggu persetujuan admin' AFTER public_key",
        'desc' => "users.pending_public_key"
    ],
    [
        'sql' => "ALTER TABLE users ADD COLUMN key_status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none' COMMENT 'Status verifikasi public key oleh CA/Admin' AFTER pending_public_key",
        'desc' => "users.key_status"
    ],
    [
        'sql' => "ALTER TABLE users ADD COLUMN key_requested_at DATETIME NULL COMMENT 'Waktu pengajuan public key' AFTER key_status",
        'desc' => "users.key_requested_at"
    ],
    [
        'sql' => "ALTER TABLE users ADD COLUMN key_approved_at DATETIME NULL COMMENT 'Waktu persetujuan public key' AFTER key_requested_at",
        'desc' => "users.key_approved_at"
    ],
    [
        'sql' => "ALTER TABLE users ADD COLUMN key_approved_by INT NULL COMMENT 'ID admin yang menyetujui public key' AFTER key_approved_at",
        'desc' => "users.key_approved_by"
    ]
];

$success = 0;
$skipped = 0;
$errors = 0;

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

// Update existing users who already have a public_key to 'approved'
try {
    $stmt = $pdo->exec("UPDATE users SET key_status = 'approved' WHERE public_key IS NOT NULL AND key_status = 'none'");
    echo "Updated existing keys to 'approved' status.\n";
} catch (Exception $e) {
    echo "Notice: " . $e->getMessage() . "\n";
}

echo "\n=== Migration v4 selesai ===\n";
echo "Added: $success | Skipped: $skipped | Errors: $errors\n";
?>
