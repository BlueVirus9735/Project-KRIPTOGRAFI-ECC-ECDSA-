<?php
include 'db.php';
try {
    $pdo->exec('ALTER TABLE users ADD COLUMN wilayah_phw VARCHAR(100) NULL AFTER wilayah_kph');
    echo 'Success: users table updated. ';
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') echo 'Column exists in users. ';
    else echo 'Error in users: ' . $e->getMessage();
}

try {
    $pdo->exec('ALTER TABLE rtt ADD COLUMN phw VARCHAR(100) NULL AFTER kph');
    echo 'Success: rtt table updated. ';
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') echo 'Column exists in rtt. ';
    else echo 'Error in rtt: ' . $e->getMessage();
}

try {
    $pdo->exec('ALTER TABLE rpkh ADD COLUMN phw VARCHAR(100) NULL AFTER kph');
    echo 'Success: rpkh table updated. ';
} catch (PDOException $e) {
    if ($e->getCode() == '42S21') echo 'Column exists in rpkh. ';
    else echo 'Error in rpkh: ' . $e->getMessage();
}
?>
