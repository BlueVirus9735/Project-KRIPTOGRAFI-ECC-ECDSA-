<?php
// api/verify.php — Standalone ECDSA Verifier
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

include 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['document']) && isset($_FILES['signature']) && isset($_FILES['public_key'])) {
        $doc_file = $_FILES['document'];
        $sig_file = $_FILES['signature'];
        $pub_file = $_FILES['public_key'];
        
        $temp_dir = __DIR__ . '/uploads/temp/';
        if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
        
        $uid = time() . '_' . uniqid();
        $doc_path = $temp_dir . $uid . '_verify_' . basename($doc_file['name']);
        $sig_path = $doc_path . '.sig';
        $pub_path = $doc_path . '.pem';
        
        if (move_uploaded_file($doc_file['tmp_name'], $doc_path) && 
            move_uploaded_file($sig_file['tmp_name'], $sig_path) &&
            move_uploaded_file($pub_file['tmp_name'], $pub_path)) {
            
            $python_script = realpath(__DIR__ . '/../crypto/verify.py');
            $python_exe = 'py';
            
            $command = "\"$python_exe\" \"$python_script\" \"$pub_path\" \"$doc_path\" \"$sig_path\" 2>&1";
            $output = shell_exec($command);
            
            $is_valid = (strpos($output, 'Signature is VALID') !== false);
            
            echo json_encode([
                'status' => 'success',
                'is_valid' => $is_valid,
                'message' => $is_valid ? 'Signature is VALID' : 'Signature is INVALID or modified',
                'output' => trim($output)
            ]);
            
            // Cleanup temp files
            @unlink($doc_path);
            @unlink($sig_path);
            @unlink($pub_path);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to process files for verification']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Document, signature, and public key files are required']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
