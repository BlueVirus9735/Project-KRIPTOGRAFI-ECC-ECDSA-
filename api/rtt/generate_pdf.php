<?php
// api/rtt/generate_pdf.php — Elegant Landscape, Multi-page PDF
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

function safe_html($val) { return htmlspecialchars((string)($val ?? '')); }
function safe_num($val, $decimals = 0) { return number_format((float)($val ?? 0), $decimals, ',', '.'); }

$rtt_id = $_GET['id'] ?? 0;
if (!$rtt_id) {
    $data = json_decode(file_get_contents('php://input'), true);
    $rtt_id = $data['rtt_id'] ?? 0;
}

if (!$rtt_id) { header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'RTT ID required']); exit; }

// Fetch RTT & all related data
$stmt = $pdo->prepare("SELECT r.*, rp.wilayah as rpkh_wilayah, rp.tahun_mulai, rp.tahun_selesai FROM rtt r LEFT JOIN rpkh rp ON r.rpkh_id = rp.id WHERE r.id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) { header('Content-Type: application/json'); echo json_encode(['status'=>'error','message'=>'RTT not found']); exit; }

$sk = $pdo->prepare("SELECT * FROM rtt_sk WHERE rtt_id=?"); $sk->execute([$rtt_id]); $sk = $sk->fetch();
$kep = $pdo->prepare("SELECT * FROM rtt_keputusan WHERE rtt_id=?"); $kep->execute([$rtt_id]); $kep = $kep->fetch();
$sum = $pdo->prepare("SELECT * FROM rtt_summary WHERE rtt_id=?"); $sum->execute([$rtt_id]); $summary = $sum->fetch();
$nett = $pdo->prepare("SELECT * FROM rtt_nett WHERE rtt_id=?"); $nett->execute([$rtt_id]); $rtt_nett = $nett->fetch();
$teb_stmt = $pdo->prepare("SELECT * FROM rtt_tebangan WHERE rtt_id=? ORDER BY nomor"); $teb_stmt->execute([$rtt_id]); $tebangan = $teb_stmt->fetchAll();
$klem_stmt = $pdo->prepare("SELECT * FROM rtt_rekap_klem WHERE rtt_id=? ORDER BY id"); $klem_stmt->execute([$rtt_id]); $rekap_klem = $klem_stmt->fetchAll();
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

$logo_path = __DIR__ . '/../../public/logo_perhutani.jpg';
$logo_base64 = '';
if (file_exists($logo_path)) {
    $logo_data = file_get_contents($logo_path);
    $logo_base64 = 'data:image/jpeg;base64,' . base64_encode($logo_data);
}

$html = '<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Dokumen RTT - ' . safe_html($rtt['nomor_dokumen']) . '</title>
<style>
@page { size: A4 landscape; margin: 15mm; }
body { font-family: "Times New Roman", Times, serif; font-size: 11pt; line-height: 1.5; margin: 0; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.print-container { width: 100%; max-width: 1100px; margin: auto; position: relative; }

/* Kop Surat (Only first page) */
.kop-surat { display: flex; align-items: center; border-bottom: 4px solid #000; padding-bottom: 8px; margin-bottom: 2px; }
.kop-surat-inner { border-bottom: 1px solid #000; margin-bottom: 30px; padding-bottom: 2px; }
.kop-logo { width: 110px; height: auto; margin-right: 30px; }
.kop-text { text-align: center; flex: 1; }
.kop-text h1 { margin: 0; font-size: 20pt; font-weight: bold; letter-spacing: 2px; }
.kop-text h2 { margin: 0; font-size: 16pt; font-weight: bold; }
.kop-text p { margin: 5px 0 0; font-size: 12pt; }

/* Small Header (For subsequent pages) */
.small-header { font-size: 10pt; border-bottom: 2px solid #000; margin-bottom: 20px; padding-bottom: 5px; font-weight: bold; display: flex; justify-content: space-between; }

/* Typography & Layout */
h3 { margin: 0 0 20px 0; font-size: 16pt; text-decoration: underline; text-transform: uppercase; text-align: center; font-weight: bold; }
h4 { font-size: 12pt; margin: 0 0 10px 0; text-transform: uppercase; background: #f3f4f6; padding: 8px 12px; border-left: 5px solid #1f2937; }
.section-box { margin-bottom: 30px; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Tables */
table.info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11pt; }
table.info-table td { padding: 8px 10px; vertical-align: top; border: 1px solid #d1d5db; }
table.info-table td.label { width: 30%; font-weight: bold; background: #f9fafb; border-right: 2px solid #9ca3af; }

table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
table.data-table th, table.data-table td { border: 1px solid #1f2937; padding: 8px; text-align: left; }
table.data-table th { background-color: #e5e7eb; text-align: center; font-weight: bold; text-transform: uppercase; }
table.data-table td.num { text-align: right; }
table.data-table td.cen { text-align: center; }

/* Signatures */
.sign-container { display: flex; justify-content: center; gap: 40px; margin-top: 20px; flex-wrap: wrap; }
.sign-box { text-align: center; width: 300px; border: 1px dashed #ccc; padding: 15px; background: #fafafa; margin-bottom: 20px; }
.sign-role { font-weight: bold; text-transform: uppercase; font-size: 11pt; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; display: block; }
.sign-space { height: 100px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-style: italic; font-size: 9pt; }
.sign-name { font-weight: bold; text-decoration: underline; display: block; font-size: 12pt; }
.sign-npk { display: block; font-size: 10pt; color: #4b5563; margin-top: 5px; }

/* Beautiful Crypto Footer Stamp */
.crypto-footer { 
    margin-top: 40px; 
    border: 3px solid #1f2937; 
    font-family: monospace; 
    font-size: 10pt; 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    background: #f8fafc; 
    padding: 0;
}
.crypto-details { padding: 15px 20px; flex: 1; }
.crypto-title { font-weight: bold; font-size: 12pt; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
.crypto-hash { word-break: break-all; color: #475569; margin-top: 5px; }

.crypto-stamp-wrapper {
    width: 350px;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 3px dashed #1f2937;
    background: #fff;
}

.real-stamp {
    border: 4px double;
    border-radius: 8px;
    padding: 10px 15px;
    text-align: center;
    font-family: "Times New Roman", Times, serif;
    transform: rotate(-3deg);
    width: 100%;
}
.real-stamp.valid { color: #047857; border-color: #047857; background-color: #ecfdf5; }
.real-stamp.invalid { color: #dc2626; border-color: #dc2626; background-color: #fef2f2; }
.stamp-head { font-size: 18pt; font-weight: 900; letter-spacing: 1px; margin-bottom: 3px; }
.stamp-sub { font-size: 9pt; font-weight: bold; text-transform: uppercase; }
.stamp-dept { font-size: 8pt; margin-top: 5px; border-top: 1px solid; padding-top: 3px; }

.page-break { page-break-after: always; }
@media print { body { background: none; } .print-container { padding: 0; max-width: none; } }
</style>
</head><body>
<div class="print-container">';

$html .= '<div class="kop-surat-inner">
    <div class="kop-surat">
        ' . ($logo_base64 ? '<img src="' . $logo_base64 . '" class="kop-logo" alt="Logo" />' : '') . '
        <div class="kop-text">
            <h2>KEMENTERIAN BADAN USAHA MILIK NEGARA RI</h2>
            <h1>PERUM PERHUTANI</h1>
            <p>DIVISI REGIONAL JAWA BARAT DAN BANTEN</p>
            <p style="font-weight:bold; font-size:13pt;">' . strtoupper(safe_html($rtt['kph'])) . '</p>
        </div>
    </div>
</div>';

$html .= '<h3>RENCANA TEKNIK TAHUNAN (RTT)<br><span style="font-size:12pt; font-weight:normal;">Nomor Dokumen: ' . safe_html($rtt['nomor_dokumen']) . '</span></h3>';

$html .= '<div class="section-box">
    <h4>I. IDENTITAS DOKUMEN & LOKASI</h4>
    <table class="info-table">
        <tr><td class="label">KPH / BKPH / RPH</td><td>' . safe_html($rtt['kph']) . ' / ' . safe_html($rtt['bkph']) . ' / ' . safe_html($rtt['rph']) . '</td></tr>
        <tr><td class="label">Tanggal Diterbitkan</td><td>' . ($rtt['tanggal'] ? date('d F Y', strtotime($rtt['tanggal'])) : '-') . '</td></tr>
        <tr><td class="label">Referensi RPKH</td><td>' . safe_html($rtt['rpkh_wilayah']) . ' (Periode ' . safe_html($rtt['tahun_mulai']) . ' - ' . safe_html($rtt['tahun_selesai']) . ')</td></tr>
        <tr><td class="label">Status Pengesahan</td><td style="font-weight:bold; text-transform:uppercase; font-size:12pt;">' . safe_html($rtt['status']) . '</td></tr>
    </table>
</div>';

if ($sk && $kep) {
    $html .= '<div class="section-box">
        <h4>II. DASAR KEPUTUSAN</h4>
        <table class="info-table">
            <tr><td class="label">Nomor & Tanggal SK</td><td><strong>' . safe_html($sk['nomor_sk']) . '</strong> (Tanggal: ' . (!empty($sk['tanggal_sk']) ? date('d F Y', strtotime($sk['tanggal_sk'])) : '-') . ')</td></tr>
            <tr><td class="label">Tentang</td><td>' . safe_html($sk['tentang']) . '</td></tr>
            <tr><td class="label">Mengingat</td><td>' . nl2br(safe_html($kep['mengingat'])) . '</td></tr>
            <tr><td class="label">Menimbang</td><td>' . nl2br(safe_html($kep['menimbang'])) . '</td></tr>
            <tr><td class="label">Memutuskan</td><td>' . nl2br(safe_html($kep['memutuskan'])) . '</td></tr>
        </table>
    </div>';
}

$html .= '<div class="page-break"></div>';

// ---------------------------------------------------------
// PAGE 2: SUMMARY & DETAIL NETT AREA
// ---------------------------------------------------------
$small_header = '<div class="small-header"><span>Lampiran RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</span><span>' . safe_html($rtt['kph']) . '</span></div>';
$html .= $small_header;

if ($summary) {
    $html .= '<div class="section-box">
        <h4>III. SUMMARY TEBANGAN</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Bentuk Tebangan</th>
                    <th>Jenis Kayu</th>
                    <th>Total Luas Area</th>
                    <th>Jumlah Pohon</th>
                    <th>Est. Kayu Perkakas</th>
                    <th>Est. Kayu Bakar</th>
                    <th>Bambu / Arang</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="cen">' . safe_html($summary['bentuk_tebangan']) . '</td>
                    <td class="cen">' . safe_html($summary['jenis_kayu']) . '</td>
                    <td class="num font-bold">' . safe_num($summary['luas'], 2) . ' Ha</td>
                    <td class="num font-bold">' . safe_num($summary['jumlah_pohon']) . ' Btg</td>
                    <td class="num">' . safe_num($summary['kayu_perkakas'], 2) . ' m³</td>
                    <td class="num">' . safe_num($summary['kayu_bakar'], 2) . ' sm</td>
                    <td class="num">' . safe_num($summary['bambu'], 2) . ' / ' . safe_num($summary['arang'], 2) . '</td>
                </tr>
            </tbody>
        </table>
    </div>';
}

if ($rtt_nett) {
    $html .= '<div class="section-box">
        <h4>IV. DETAIL NETT AREA (PARAMETER STANDAR HUTAN)</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Bagian Hutan</th>
                    <th>Lokasi (Petak/Anak)</th>
                    <th>Luas Baku</th>
                    <th>Jenis / Kelas</th>
                    <th>Tahun / Bon</th>
                    <th>KBD / DKN</th>
                    <th>N/Ha</th>
                    <th>Telah Ditebang</th>
                    <th>AI/AII/AIII</th>
                    <th>Faktor Klem/Tunggak</th>
                    <th>Tot. Volume</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="cen">' . safe_html($rtt_nett['bagian_hutan']) . '</td>
                    <td class="cen">' . safe_html($rtt_nett['petak']) . ' / ' . safe_html($rtt_nett['anak_petak_baru']) . '</td>
                    <td class="num">' . safe_num($rtt_nett['luas_baku'], 2) . ' Ha</td>
                    <td class="cen">' . safe_html($rtt_nett['jenis_tanaman']) . '<br>' . safe_html($rtt_nett['kelas_hutan']) . '</td>
                    <td class="cen">' . safe_html($rtt_nett['tahun_tanam']) . ' / ' . safe_html($rtt_nett['bon']) . '</td>
                    <td class="cen">' . safe_html($rtt_nett['kbd']) . ' / ' . safe_html($rtt_nett['dkn']) . '</td>
                    <td class="num">' . safe_num($rtt_nett['n_per_ha'], 2) . '</td>
                    <td class="num">' . safe_num($rtt_nett['telah_ditebang'], 2) . ' m³</td>
                    <td class="cen">' . safe_num($rtt_nett['ai']) . '/' . safe_num($rtt_nett['aii']) . '/' . safe_num($rtt_nett['aiii']) . '</td>
                    <td class="cen">' . safe_num($rtt_nett['xfaktor_klem'], 2) . ' / ' . safe_num($rtt_nett['tunggak'], 2) . '</td>
                    <td class="num font-bold" style="font-size:11pt;">' . safe_num($rtt_nett['volume_kayu'], 2) . ' m³</td>
                </tr>
            </tbody>
        </table>
    </div>';
}

$html .= '<div class="page-break"></div>';

// ---------------------------------------------------------
// PAGE 3: REKAPITULASI KLEM & RENCANA TEBANGAN
// ---------------------------------------------------------
$html .= $small_header;

if (!empty($rekap_klem)) {
    $html .= '<div class="section-box">
        <h4>V. REKAPITULASI KLEM POHON</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th width="5%">No</th>
                    <th width="15%">Lokasi (KPH/BKPH/RPH)</th>
                    <th width="10%">Petak / Anak</th>
                    <th width="10%">Kelas Hutan</th>
                    <th width="10%">Luas (Baku/Renc)</th>
                    <th width="10%">Thn Tanam</th>
                    <th width="15%">Jenis Tanaman</th>
                    <th width="10%">Blok (Luas)</th>
                    <th width="10%">Jml Pohon</th>
                    <th width="5%">Vol (m³)</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($rekap_klem as $idx => $k) {
            $html .= '<tr>
                <td class="cen">' . ($idx + 1) . '</td>
                <td class="cen">' . safe_html($k['kph']) . ' / ' . safe_html($k['bkph']) . ' / ' . safe_html($k['rph']) . '</td>
                <td class="cen">' . safe_html($k['petak']) . ' - ' . safe_html($k['anak_petak']) . '</td>
                <td class="cen">' . safe_html($k['kelas_hutan']) . '</td>
                <td class="cen">' . safe_num($k['luas_baku'], 2) . ' / ' . safe_num($k['luas_rencana'], 2) . '</td>
                <td class="cen">' . safe_html($k['tahun_tanam']) . '</td>
                <td class="cen">' . safe_html($k['jenis_tanaman']) . '</td>
                <td class="cen">Blok ' . safe_html($k['no_blok']) . '<br>(' . safe_num($k['luas_blok'], 2) . ' Ha)</td>
                <td class="num">' . safe_num($k['jumlah_pohon']) . '</td>
                <td class="num">' . safe_num($k['volume'], 2) . '</td>
            </tr>';
        }
        $html .= '</tbody></table>
    </div>';
}

if (!empty($tebangan)) {
    $html .= '<div class="section-box">
        <h4>VI. RINCIAN RENCANA TEBANGAN</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th width="5%">No</th>
                    <th width="10%">Petak</th>
                    <th width="10%">Anak Petak</th>
                    <th width="15%">Luas (Ha)</th>
                    <th width="20%">Jenis Tanaman</th>
                    <th width="10%">Jml Pohon</th>
                    <th width="10%">Volume (m³)</th>
                    <th width="20%">Keterangan</th>
                </tr>
            </thead>
            <tbody>';
        foreach ($tebangan as $t) {
            $html .= '<tr>
                <td class="cen">' . safe_html($t['nomor']) . '</td>
                <td class="cen">' . safe_html($t['petak']) . '</td>
                <td class="cen">' . safe_html($t['anak_petak']) . '</td>
                <td class="num">' . safe_num($t['luas'], 2) . '</td>
                <td class="cen">' . safe_html($t['jenis_tanaman']) . '</td>
                <td class="num">' . safe_num($t['jumlah_pohon']) . '</td>
                <td class="num">' . safe_num($t['volume'], 2) . '</td>
                <td>' . safe_html($t['keterangan']) . '</td>
            </tr>';
        }
        if ($rekap) {
            $html .= '<tr style="background:#e5e7eb; font-weight:bold; font-size:11pt;">
                <td colspan="3" class="cen">TOTAL KESELURUHAN</td>
                <td class="num">' . safe_num($rekap['total_luas'], 2) . '</td>
                <td></td>
                <td class="num">' . safe_num($rekap['total_pohon']) . '</td>
                <td class="num">' . safe_num($rekap['total_volume'], 2) . '</td>
                <td></td>
            </tr>';
        }
        $html .= '</tbody></table>
    </div>';
}

$html .= '<div class="page-break"></div>';

// ---------------------------------------------------------
// PAGE 4: BERITA ACARA & PENGESAHAN
// ---------------------------------------------------------
$html .= $small_header;

$html .= '<div class="section-box">
    <h4>VII. BERITA ACARA PEMERIKSAAN LAPANGAN</h4>';
if (!empty($berita_acara)) {
    $html .= '<table class="data-table" style="font-size:11pt;">
        <thead>
            <tr>
                <th width="30%">Nama Petugas / Jabatan</th>
                <th width="20%">Tanggal Pemeriksaan</th>
                <th width="50%">Hasil Pemeriksaan</th>
            </tr>
        </thead>
        <tbody>';
    foreach ($berita_acara as $ba) {
        $html .= '<tr>
            <td><strong>' . safe_html($ba['nama_petugas']) . '</strong><br><span style="font-style:italic;">' . safe_html($ba['jabatan']) . '</span></td>
            <td class="cen">' . (!empty($ba['tanggal']) ? date('d F Y', strtotime($ba['tanggal'])) : '-') . '</td>
            <td>' . nl2br(safe_html($ba['hasil_pemeriksaan'])) . '</td>
        </tr>';
    }
    $html .= '</tbody></table>';
} else {
    $html .= '<p style="font-style:italic; padding:10px; border:1px dashed #ccc;">Belum ada berita acara pemeriksaan.</p>';
}
$html .= '</div>';

$html .= '<div class="section-box" style="margin-top:40px;">
    <h4>VIII. PENGESAHAN (PIHAK YANG TERLIBAT)</h4>
    <p style="text-align:center; margin-bottom: 20px; font-style:italic;">Dokumen Rencana Teknik Tahunan ini telah disetujui, ditandatangani, dan disahkan oleh pihak-pihak berwenang di bawah ini:</p>
    <div class="sign-container">';
if (!empty($pengesahan)) {
    foreach ($pengesahan as $p) {
        $html .= '<div class="sign-box">
            <span class="sign-role">' . safe_html($p['jabatan']) . '</span>
            <div class="sign-space">Tanda Tangan / Cap</div>
            <span class="sign-name">' . safe_html($p['nama_pejabat']) . '</span>
            <span class="sign-npk">NPK: ' . safe_html($p['npk']) . '</span>
            <span class="sign-npk">Tanggal: ' . (!empty($p['tanggal']) ? date('d M Y', strtotime($p['tanggal'])) : '-') . '</span>
        </div>';
    }
}
$html .= '</div></div>';

// ---------------------------------------------------------
// CRYPTOGRAPHY FOOTER WITH STAMP INSIDE
// ---------------------------------------------------------
$html .= '<div class="crypto-footer">
    <div class="crypto-details">
        <div class="crypto-title">OTENTIKASI DIGITAL (ECDSA & SHA-256)</div>
        <table style="width:100%; font-size:10pt;">
            <tr><td width="150" style="font-weight:bold;">ID TRANSAKSI</td><td>: RTT-' . $rtt['id'] . '-' . date('Y', strtotime($rtt['created_at'])) . '</td></tr>
            <tr><td style="font-weight:bold;">TIMESTAMP CETAK</td><td>: ' . date('d M Y H:i:s') . ' WIB</td></tr>
            <tr><td style="font-weight:bold; vertical-align:top;">HASH SHA-256</td><td class="crypto-hash">: ' . safe_html($rtt['hash']) . '</td></tr>
        </table>
    </div>
    <div class="crypto-stamp-wrapper">';

if ($is_corrupt) {
    $html .= '<div class="real-stamp invalid">
        <div class="stamp-head">DOKUMEN PALSU</div>
        <div class="stamp-sub">DATA TELAH DIMANIPULASI</div>
        <div class="stamp-dept">PERUM PERHUTANI DIVISI REGIONAL JAWA BARAT DAN BANTEN</div>
    </div>';
} else {
    $html .= '<div class="real-stamp valid">
        <div class="stamp-head">DOKUMEN SAH</div>
        <div class="stamp-sub">TIDAK TERUBAH (VALID)</div>
        <div class="stamp-dept">PERUM PERHUTANI DIVISI REGIONAL JAWA BARAT DAN BANTEN</div>
    </div>';
}
$html .= '</div></div>';

$html .= '</div></body>';

if (isset($_GET['download']) || isset($_GET['print'])) {
    $html .= '<script>window.onload = function() { window.print(); }</script>';
} else {
    $html .= '<script>window.onload = function() { window.print(); }</script>';
}
$html .= '</html>';

header('Content-Type: text/html; charset=utf-8');
echo $html;
?>
