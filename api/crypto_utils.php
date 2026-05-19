<?php
// api/crypto_utils.php — Centralized utility for consistent cryptographic payloads

/**
 * Returns a stable, metadata-free associative array of RTT data for signing/verification.
 * Excludes all columns that might change and uses recursive ksort and stringification.
 */
function getCanonicalPayload($pdo, $rtt_id) {
    // 1. Fetch RTT Base Data
    $stmt = $pdo->prepare("SELECT * FROM rtt WHERE id = ?");
    $stmt->execute([$rtt_id]);
    $rtt = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$rtt) return null;

    $exclude_cols = [
        'id', 'status', 'hash', 'signature', 'public_key', 
        'created_at', 'updated_at', 'edited_by_lapangan', 
        'edited_by_gis', 'edited_by_admin', 'created_by'
    ];

    foreach ($exclude_cols as $col) unset($rtt[$col]);
    $payload = ["rtt" => $rtt];

    // 2. Fetch ALL Related Business Data Tables
    $tables_meta = [
        'summary' => ['table' => 'rtt_summary', 'multi' => false],
        'nett' => ['table' => 'rtt_nett', 'multi' => false],
        'rekap' => ['table' => 'rtt_rekap', 'multi' => false],
        'tebangan' => ['table' => 'rtt_tebangan', 'multi' => true, 'order' => 'nomor'],
        'rekap_klem' => ['table' => 'rtt_rekap_klem', 'multi' => true, 'order' => 'id'],
        'berita_acara' => ['table' => 'rtt_berita_acara', 'multi' => true, 'order' => 'id'],
        'pengesahan' => ['table' => 'rtt_pengesahan', 'multi' => true, 'order' => 'id']
    ];

    foreach ($tables_meta as $key => $meta) {
        $sql = "SELECT * FROM {$meta['table']} WHERE rtt_id = ?";
        if ($meta['multi']) $sql .= " ORDER BY " . ($meta['order'] ?? 'id');
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$rtt_id]);
        
        if ($meta['multi']) {
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($rows) {
                foreach ($rows as &$r) unset($r['id'], $r['rtt_id']);
                $payload[$key] = $rows;
            }
        } else {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                unset($row['id'], $row['rtt_id']);
                $payload[$key] = $row;
            }
        }
    }

    // 3. Stabilize: Recursive Stringification & Recursive Sorting
    stabilizePayload($payload);

    return $payload;
}

/**
 * Recursively cleans and stabilizes the payload:
 * - Converts all scalar values to strings (ensures consistency across environments)
 * - Sorts all associative arrays by key
 */
function stabilizePayload(&$item) {
    if (is_array($item)) {
        ksort($item);
        foreach ($item as &$value) {
            stabilizePayload($value);
        }
    } else {
        // Convert everything to string, handling nulls consistently
        if ($item === null) {
            $item = ""; // Treat null as empty string for hash stability
        } else {
            $item = (string)$item;
        }
    }
}

/**
 * Helper to encode payload to JSON string consistently.
 */
function encodeCanonicalJSON($payload) {
    return json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
?>
