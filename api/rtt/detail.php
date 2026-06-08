<?php
// api/rtt/detail.php — Get all RTT document details (New Multi-Table Schema)
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include __DIR__ . '/../db.php';

$id = $_GET['id'] ?? 0;

try {
    // Master RTT
    $stmt = $pdo->prepare("
        SELECT r.*, rp.wilayah as rpkh_wilayah, rp.tahun as rpkh_tahun, u.nama as created_by_name 
        FROM rtt r 
        LEFT JOIN rpkh rp ON r.rpkh_id = rp.id 
        LEFT JOIN users u ON r.created_by = u.id 
        WHERE r.id = ?
    ");
    $stmt->execute([$id]);
    $rtt = $stmt->fetch();

    if (!$rtt) {
        echo json_encode(['status' => 'error', 'message' => 'Dokumen RTT tidak ditemukan']); 
        exit;
    }

    include_once __DIR__ . '/../crypto_utils.php';
    $payload = getCanonicalPayload($pdo, $id);
    $status_hash = 'invalid';
    $status_sig = 'invalid';
    if ($payload) {
        $json_data = encodeCanonicalJSON($payload);
        $calculated_hash = hash('sha256', $json_data);
        
        $status_hash = ($calculated_hash === $rtt['hash']) ? 'valid' : 'invalid';
        $status_sig = 'valid'; // default if signed and matches
        
        if ($status_hash === 'valid' && $rtt['signature'] && $rtt['public_key']) {
            $python_exe = 'py';
            $verify_script = realpath(__DIR__ . '/../../crypto/verify.py');
            $temp_dir = __DIR__ . '/../uploads/temp/';
            if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
            
            $temp_hash = $temp_dir . 'hash_' . $id . '.json';
            $temp_sig  = $temp_dir . 'sig_' . $id . '.bin';
            $temp_pub  = $temp_dir . 'pub_' . $id . '.pem';
            
            file_put_contents($temp_hash, $json_data);
            file_put_contents($temp_sig, base64_decode($rtt['signature']));
            file_put_contents($temp_pub, $rtt['public_key']);
            
            if (file_exists($verify_script)) {
                $cmd = "\"$python_exe\" \"$verify_script\" \"$temp_pub\" \"$temp_hash\" \"$temp_sig\" 2>&1";
                $output = shell_exec($cmd);
                if (strpos($output, 'INVALID') !== false) {
                    $status_sig = 'invalid';
                }
            }
            @unlink($temp_hash); @unlink($temp_sig); @unlink($temp_pub);
        } else if ($status_hash === 'invalid') {
            $status_sig = 'invalid';
        }
    }
    
    $rtt['crypto_status'] = ($status_hash === 'valid' && $status_sig === 'valid') ? 'valid' : 'corrupt';

    $data = ['status' => 'success', 'rtt' => $rtt];

    // 1. Summary
    $stmt = $pdo->prepare("SELECT * FROM rtt_summary WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $data['summary'] = $stmt->fetch() ?: null;
    
    // 2. Nett
    $stmt = $pdo->prepare("SELECT * FROM rtt_nett WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $data['nett'] = $stmt->fetch() ?: null;
    
    // Tebangan (Missing)
    $stmt = $pdo->prepare("SELECT * FROM rtt_tebangan WHERE rtt_id = ? ORDER BY nomor ASC"); 
    $stmt->execute([$id]); 
    $data['tebangan'] = $stmt->fetchAll() ?: [];
    
    // 3. Peta
    $stmt = $pdo->prepare("SELECT * FROM rtt_peta WHERE rtt_id = ?"); 
    $stmt->execute([$id]); 
    $data['peta'] = $stmt->fetchAll() ?: [];
    
    // 4. Rekap Klem
    $stmt = $pdo->prepare("SELECT * FROM rtt_rekap_klem WHERE rtt_id = ?"); 
    $stmt->execute([$id]); 
    $data['rekap_klem'] = $stmt->fetchAll() ?: [];
    
    // 5. Klem Detail
    $stmt = $pdo->prepare("SELECT * FROM rtt_klem_detail WHERE rtt_id = ?"); 
    $stmt->execute([$id]); 
    $data['klem_detail'] = $stmt->fetchAll() ?: [];
    
    // 6. Berita Acara & Ba Details
    $stmt = $pdo->prepare("SELECT * FROM rtt_berita_acara WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $ba = $stmt->fetch();
    if($ba) {
        $stmt2 = $pdo->prepare("SELECT * FROM rtt_ba_detail WHERE berita_acara_id = ?"); 
        $stmt2->execute([$ba['id']]); 
        $ba['details'] = $stmt2->fetchAll() ?: [];
    }
    $data['berita_acara'] = $ba ?: null;
    
    // 7. Peta BAP
    $stmt = $pdo->prepare("SELECT * FROM rtt_peta_bap WHERE rtt_id = ? LIMIT 1"); 
    $stmt->execute([$id]); 
    $data['peta_bap'] = $stmt->fetch() ?: null;

    // Workflow validations
    $stmt = $pdo->prepare("
        SELECT v.*, u.nama as validator 
        FROM validasi v 
        LEFT JOIN users u ON v.validated_by = u.id 
        WHERE v.rtt_id = ? 
        ORDER BY v.validated_at DESC
    ");
    $stmt->execute([$id]);
    $data['validasi'] = $stmt->fetchAll() ?: [];

    echo json_encode($data);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
