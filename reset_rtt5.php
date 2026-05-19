<?php
// reset_rtt5.php
include 'api/db.php';
$id = 5;
$stmt = $pdo->prepare("UPDATE rtt SET status='menunggu_pengesahan', hash=NULL, signature=NULL, public_key=NULL WHERE id = ?");
if ($stmt->execute([$id])) {
    echo "SUCCESS: RTT ID $id has been UNLOCKED. The 'Sign & Patenkan' button should reappear now.\n";
} else {
    echo "ERROR: Failed to unlock RTT ID $id.\n";
}
?>
