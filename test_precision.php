<?php
// test_precision.php
include 'api/db.php';
$stmt = $pdo->query("SELECT luas, jumlah_pohon FROM rtt_summary LIMIT 1");
$row = $stmt->fetch();
echo "Luas: " . gettype($row['luas']) . " (" . $row['luas'] . ")\n";
echo "Jumlah: " . gettype($row['jumlah_pohon']) . " (" . $row['jumlah_pohon'] . ")\n";

$row_str = ["luas" => (string)$row['luas'], "jumlah" => (string)$row['jumlah_pohon']];
echo "Luas (str): " . $row_str['luas'] . "\n";
echo "Jumlah (str): " . $row_str['jumlah'] . "\n";
?>
