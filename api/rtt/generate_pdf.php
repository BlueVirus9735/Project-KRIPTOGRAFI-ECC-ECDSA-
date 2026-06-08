<?php
// api/rtt/generate_pdf.php — Generate PDF from RTT data
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

// Support both GET and POST
$rtt_id = $_GET['id'] ?? 0;
if (!$rtt_id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $rtt_id = $data['rtt_id'] ?? 0;
}

if (!$rtt_id) { header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'RTT ID required']); exit; }

// Get all RTT data
$stmt = $pdo->prepare("SELECT r.*, rp.wilayah as rpkh_wilayah, rp.tahun_mulai, rp.tahun_selesai FROM rtt r LEFT JOIN rpkh rp ON r.rpkh_id = rp.id WHERE r.id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'RTT not found']); exit; }

$sk = $pdo->prepare("SELECT * FROM rtt_sk WHERE rtt_id=?"); $sk->execute([$rtt_id]); $sk = $sk->fetch();
$kep = $pdo->prepare("SELECT * FROM rtt_keputusan WHERE rtt_id=?"); $kep->execute([$rtt_id]); $kep = $kep->fetch();
$teb_stmt = $pdo->prepare("SELECT * FROM rtt_tebangan WHERE rtt_id=? ORDER BY nomor"); $teb_stmt->execute([$rtt_id]); $tebangan = $teb_stmt->fetchAll();
$rekap = $pdo->prepare("SELECT * FROM rtt_rekap WHERE rtt_id=?"); $rekap->execute([$rtt_id]); $rekap = $rekap->fetch();
$ba_stmt = $pdo->prepare("SELECT * FROM rtt_berita_acara WHERE rtt_id=?"); $ba_stmt->execute([$rtt_id]); $berita_acara = $ba_stmt->fetchAll();
$peng_stmt = $pdo->prepare("SELECT * FROM rtt_pengesahan WHERE rtt_id=?"); $peng_stmt->execute([$rtt_id]); $pengesahan = $peng_stmt->fetchAll();

$is_corrupt = false;
try {
    include_once __DIR__ . '/../crypto_utils.php';
    $payload = getCanonicalPayload($pdo, $rtt_id);
    if ($payload) {
        $json_data = encodeCanonicalJSON($payload);
        $calculated_hash = hash('sha256', $json_data);
        if ($calculated_hash !== $rtt['hash']) {
            $is_corrupt = true;
        }
    }
} catch (Exception $e) {}

// Generate HTML for PDF
$html = '<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.5; margin: 40px; color: #000; }
h1 { text-align: center; font-size: 16pt; margin-bottom: 5px; }
h2 { text-align: center; font-size: 14pt; margin-bottom: 20px; }
h3 { font-size: 13pt; margin: 20px 0 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
.center { text-align: center; }
.header-info { margin: 20px 0; }
.header-info td { padding: 3px 10px; vertical-align: top; }
table.data { width: 100%; border-collapse: collapse; margin: 15px 0; }
table.data th, table.data td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 11pt; }
table.data th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
.page-break { page-break-before: always; }
.sign-block { margin-top: 40px; }
.sign-block table { width: 100%; }
.sign-block td { width: 50%; text-align: center; vertical-align: top; padding: 10px; }
.ttd-space { height: 80px; }
.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 60pt; color: rgba(0,128,0,0.05); z-index: -1; }
.footer-hash { margin-top: 30px; font-size: 8pt; color: #666; border-top: 1px solid #ccc; padding-top: 5px; }
</style></head><body>';

// COVER PAGE
$html .= '<div class="watermark">PERHUTANI</div>';
if ($is_corrupt) {
    $html .= '<div style="background-color:#fee2e2; border: 4px solid #ef4444; color:#b91c1c; padding: 15px; text-align:center; font-weight:bold; margin-bottom: 20px; font-size:12pt; font-family: sans-serif;">';
    $html .= '⚠️ PERINGATAN KRIPTOGRAFI: DATA DOKUMEN INI TELAH DIMANIPULASI secara ilegal!<br>';
    $html .= '<span style="font-size:9pt; font-weight:normal;">Hash SHA-256 saat ini tidak cocok dengan Hash sertifikat digital atau database asli.</span>';
    $html .= '</div>';
}
$html .= '<div style="text-align:center; padding-top:50px;">';
$html .= '<h1>RENCANA TEKNIK TAHUNAN</h1>';
$html .= '<h2>(RTT)</h2>';
$html .= '<p style="font-size:14pt; margin:30px 0;"><strong>'.$rtt['kph'].'</strong></p>';
$html .= '<p>BKPH '.$rtt['bkph'].' — RPH '.$rtt['rph'].'</p>';
$html .= '<p style="margin-top:30px;">Nomor: <strong>'.$rtt['nomor_dokumen'].'</strong></p>';
$html .= '<p>Tanggal: '.date('d F Y', strtotime($rtt['tanggal'])).'</p>';
$html .= '<p style="margin-top:50px;">Berdasarkan RPKH '.$rtt['rpkh_wilayah'].' ('.$rtt['tahun_mulai'].'-'.$rtt['tahun_selesai'].')</p>';
$html .= '<p style="margin-top:80px;"><strong>PERUM PERHUTANI</strong><br>DIVISI REGIONAL JAWA BARAT DAN BANTEN</p>';
$html .= '</div>';

// SK PAGE
if ($sk) {
    $html .= '<div class="page-break"></div>';
    $html .= '<h1>SURAT KEPUTUSAN</h1>';
    $html .= '<p class="center">Nomor: '.$sk['nomor_sk'].'</p>';
    $html .= '<p class="center">Tanggal: '.($sk['tanggal_sk'] ? date('d F Y',strtotime($sk['tanggal_sk'])) : '-').'</p>';
    $html .= '<h3>TENTANG</h3><p>'.$sk['tentang'].'</p>';
}

// KEPUTUSAN PAGE
if ($kep) {
    $html .= '<div class="page-break"></div>';
    $html .= '<h1>KEPUTUSAN</h1>';
    $html .= '<h3>MENIMBANG</h3><p>'.$kep['menimbang'].'</p>';
    $html .= '<h3>MENGINGAT</h3><p>'.$kep['mengingat'].'</p>';
    $html .= '<h3>MEMUTUSKAN</h3><p>'.$kep['memutuskan'].'</p>';
}

// TEBANGAN TABLE
if (!empty($tebangan)) {
    $html .= '<div class="page-break"></div>';
    $html .= '<h1>DATA RENCANA TEBANGAN</h1>';
    $html .= '<table class="data"><thead><tr>';
    $html .= '<th>No</th><th>Petak</th><th>Anak Petak</th><th>Luas (Ha)</th><th>Jenis Tanaman</th><th>Volume (m³)</th><th>Jml Pohon</th><th>Keterangan</th>';
    $html .= '</tr></thead><tbody>';
    foreach ($tebangan as $t) {
        $html .= '<tr><td class="center">'.$t['nomor'].'</td><td>'.$t['petak'].'</td><td>'.$t['anak_petak'].'</td><td class="center">'.number_format($t['luas'],2).'</td><td>'.$t['jenis_tanaman'].'</td><td class="center">'.number_format($t['volume'],2).'</td><td class="center">'.$t['jumlah_pohon'].'</td><td>'.$t['keterangan'].'</td></tr>';
    }
    $html .= '</tbody></table>';
}

// REKAPITULASI
if ($rekap) {
    $html .= '<h3>REKAPITULASI</h3>';
    $html .= '<table class="data"><tr><th>Total Luas (Ha)</th><th>Total Volume (m³)</th><th>Total Pohon</th></tr>';
    $html .= '<tr><td class="center"><strong>'.number_format($rekap['total_luas'],2).'</strong></td><td class="center"><strong>'.number_format($rekap['total_volume'],2).'</strong></td><td class="center"><strong>'.number_format($rekap['total_pohon']).'</strong></td></tr></table>';
}

// BERITA ACARA
if (!empty($berita_acara)) {
    $html .= '<div class="page-break"></div>';
    $html .= '<h1>BERITA ACARA PEMERIKSAAN LAPANGAN</h1>';
    foreach ($berita_acara as $ba) {
        $html .= '<h3>Pemeriksaan '.($ba['tanggal'] ? date('d F Y',strtotime($ba['tanggal'])) : '').'</h3>';
        $html .= '<table class="header-info"><tr><td><strong>Nama Petugas</strong></td><td>: '.$ba['nama_petugas'].'</td></tr>';
        $html .= '<tr><td><strong>Jabatan</strong></td><td>: '.$ba['jabatan'].'</td></tr></table>';
        $html .= '<p><strong>Hasil Pemeriksaan:</strong></p><p>'.$ba['hasil_pemeriksaan'].'</p>';
    }
}

// PENGESAHAN
if (!empty($pengesahan)) {
    $html .= '<div class="page-break"></div>';
    $html .= '<h1>HALAMAN PENGESAHAN</h1>';
    $html .= '<div class="sign-block"><table>';
    $cols = array_chunk($pengesahan, 2);
    foreach ($cols as $row) {
        $html .= '<tr>';
        foreach ($row as $p) {
            $html .= '<td>'.$p['jabatan'].'<div class="ttd-space"></div><strong><u>'.$p['nama_pejabat'].'</u></strong><br>NPK: '.$p['npk'].'<br>'.(isset($p['tanggal'])&&$p['tanggal'] ? date('d F Y',strtotime($p['tanggal'])) : '').'</td>';
        }
        if (count($row) < 2) $html .= '<td></td>';
        $html .= '</tr>';
    }
    $html .= '</table></div>';
}

// FOOTER HASH
$html .= '<div class="footer-hash">';
$html .= '<strong>Integritas Dokumen</strong><br>';
$html .= 'SHA-256: '.$rtt['hash'].'<br>';
if ($is_corrupt) {
    $html .= 'Status: <strong style="color:#b91c1c;">INVALID / DATA DIMANIPULASI</strong><br>';
} else {
    $html .= 'Status: <strong style="color:#047857;">VALID (ECC Signed)</strong><br>';
}
$html .= 'Generated: '.date('Y-m-d H:i:s');
$html .= '</div>';

$html .= '</body></html>';

// Trigger print dialog if download requested
if (isset($_GET['download'])) {
    $html = str_replace('</body>', '<script>window.onload = function() { window.print(); }</script></body>', $html);
}

// Output as HTML (can be printed to PDF from browser or use a PDF library)
header('Content-Type: text/html; charset=utf-8');
echo $html;
?>
