<?php
// api/rtt/generate_pdf.php — Full Document RTT dengan ECC Decrypt Peta & Lampiran
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include __DIR__ . '/../db.php';

function safe_html($val) { return htmlspecialchars((string)($val ?? '')); }
function safe_num($val, $decimals = 0) { return number_format((float)($val ?? 0), $decimals, ',', '.'); }
function format_date($val) { return (!empty($val) && $val !== '0000-00-00') ? date('d F Y', strtotime($val)) : '-'; }

// ─────────────────────────────────────────────
// Dekripsi file .enc → Base64 image string
// ─────────────────────────────────────────────
function decrypt_to_base64($enc_relative_path) {
    $base_dir      = __DIR__ . '/../uploads/';
    $enc_full_path = $base_dir . $enc_relative_path;
    $private_key   = realpath(__DIR__ . '/../keys/system_keys/private_key.pem');
    $decrypt_script = realpath(__DIR__ . '/../../crypto/decrypt.py');

    if (!file_exists($enc_full_path) || !file_exists($private_key) || !file_exists($decrypt_script)) {
        return null;
    }

    // Tentukan ekstensi asli (hilangkan .enc)
    $original_name = preg_replace('/\.enc$/', '', basename($enc_relative_path));
    $ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    $allowed_img = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'];

    $temp_dir  = __DIR__ . '/../uploads/temp/';
    if (!is_dir($temp_dir)) mkdir($temp_dir, 0777, true);
    $temp_out  = $temp_dir . 'pdf_dec_' . uniqid() . '.' . $ext;

    $cmd    = '"python" ' . escapeshellarg($decrypt_script) . ' ' . escapeshellarg($private_key) . ' ' . escapeshellarg($enc_full_path) . ' ' . escapeshellarg($temp_out) . ' 2>&1';
    $output = shell_exec($cmd);

    if (!file_exists($temp_out)) {
        return ['type' => 'error', 'ext' => $ext, 'msg' => $output];
    }

    if (in_array($ext, $allowed_img)) {
        $raw    = file_get_contents($temp_out);
        $b64    = base64_encode($raw);
        $mime   = ($ext === 'jpg' || $ext === 'jpeg') ? 'image/jpeg' : 'image/' . $ext;
        @unlink($temp_out);
        return ['type' => 'image', 'ext' => $ext, 'data' => 'data:' . $mime . ';base64,' . $b64];
    } else {
        // PDF atau file lain — tidak bisa di-embed sebagai gambar
        @unlink($temp_out);
        return ['type' => 'file', 'ext' => $ext, 'name' => $original_name];
    }
}

// ─────────────────────────────────────────────
// Ambil RTT ID
// ─────────────────────────────────────────────
$rtt_id = (int)($_GET['id'] ?? 0);
if (!$rtt_id) {
    $data   = json_decode(file_get_contents('php://input'), true);
    $rtt_id = (int)($data['rtt_id'] ?? 0);
}
if (!$rtt_id) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'RTT ID required']);
    exit;
}

// ─────────────────────────────────────────────
// Ambil semua data RTT dari database
// ─────────────────────────────────────────────
$stmt = $pdo->prepare("SELECT r.*, rp.wilayah as rpkh_wilayah, rp.tahun_mulai, rp.tahun_selesai FROM rtt r LEFT JOIN rpkh rp ON r.rpkh_id = rp.id WHERE r.id = ?");
$stmt->execute([$rtt_id]); $rtt = $stmt->fetch();
if (!$rtt) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'RTT tidak ditemukan']);
    exit;
}

$sk        = $pdo->prepare("SELECT * FROM rtt_sk WHERE rtt_id=?");           $sk->execute([$rtt_id]);        $sk        = $sk->fetch();
$kep       = $pdo->prepare("SELECT * FROM rtt_keputusan WHERE rtt_id=?");    $kep->execute([$rtt_id]);       $kep       = $kep->fetch();
$sum       = $pdo->prepare("SELECT * FROM rtt_summary WHERE rtt_id=?");      $sum->execute([$rtt_id]);       $summary   = $sum->fetch();
$nett_stmt = $pdo->prepare("SELECT * FROM rtt_nett WHERE rtt_id=? ORDER BY id"); $nett_stmt->execute([$rtt_id]); $nett_rows = $nett_stmt->fetchAll();
$teb_stmt  = $pdo->prepare("SELECT * FROM rtt_tebangan WHERE rtt_id=? ORDER BY nomor"); $teb_stmt->execute([$rtt_id]); $tebangan  = $teb_stmt->fetchAll();
$klem_stmt = $pdo->prepare("SELECT * FROM rtt_rekap_klem WHERE rtt_id=? ORDER BY id"); $klem_stmt->execute([$rtt_id]); $rekap_klem = $klem_stmt->fetchAll();
$rekap     = $pdo->prepare("SELECT * FROM rtt_rekap WHERE rtt_id=?");        $rekap->execute([$rtt_id]);     $rekap     = $rekap->fetch();
$peta_stmt = $pdo->prepare("SELECT * FROM rtt_peta WHERE rtt_id=? ORDER BY id"); $peta_stmt->execute([$rtt_id]); $peta_rows = $peta_stmt->fetchAll();
$lamp_stmt = $pdo->prepare("SELECT * FROM rtt_lampiran WHERE rtt_id=? ORDER BY id"); $lamp_stmt->execute([$rtt_id]); $lampiran  = $lamp_stmt->fetchAll();
$ba_stmt   = $pdo->prepare("SELECT * FROM rtt_berita_acara WHERE rtt_id=?"); $ba_stmt->execute([$rtt_id]);   $berita_acara = $ba_stmt->fetchAll();
$peng_stmt = $pdo->prepare("SELECT * FROM rtt_pengesahan WHERE rtt_id=?");   $peng_stmt->execute([$rtt_id]); $pengesahan   = $peng_stmt->fetchAll();

// ─────────────────────────────────────────────
// Cek Integritas Hash SHA-256
// ─────────────────────────────────────────────
$is_corrupt = false;
try {
    include_once __DIR__ . '/../crypto_utils.php';
    $payload = getCanonicalPayload($pdo, $rtt_id);
    if ($payload) {
        $json_data       = encodeCanonicalJSON($payload);
        $calculated_hash = hash('sha256', $json_data);
        if ($calculated_hash !== $rtt['hash']) {
            $is_corrupt = true;
        }
    }
} catch (Exception $e) {}

// ─────────────────────────────────────────────
// Logo Perhutani → Base64
// ─────────────────────────────────────────────
$logo_path   = __DIR__ . '/../../public/logo_perhutani.jpg';
$logo_base64 = '';
if (file_exists($logo_path)) {
    $logo_base64 = 'data:image/jpeg;base64,' . base64_encode(file_get_contents($logo_path));
}

// ─────────────────────────────────────────────
// Dekripsi Peta & Lampiran di awal (satu kali)
// ─────────────────────────────────────────────
$peta_decoded    = [];
foreach ($peta_rows as $p) {
    $peta_decoded[] = array_merge($p, ['decoded' => decrypt_to_base64($p['file_path'])]);
}
$lampiran_decoded = [];
foreach ($lampiran as $l) {
    $lampiran_decoded[] = array_merge($l, ['decoded' => decrypt_to_base64($l['file_path'])]);
}

// ─────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────
$html = '<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Dokumen RTT - ' . safe_html($rtt['nomor_dokumen']) . '</title>
<style>
@page { size: A4 landscape; margin: 14mm 15mm; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.45; margin: 0; color: #1a1a1a; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.print-container { width: 100%; max-width: 1120px; margin: auto; }

/* Kop Surat */
.kop-surat { display: flex; align-items: center; border-bottom: 3px solid #1a3a5c; padding-bottom: 10px; margin-bottom: 4px; }
.kop-surat-inner { margin-bottom: 18px; padding-bottom: 4px; }
.kop-logo { width: 90px; height: auto; margin-right: 24px; }
.kop-text { text-align: center; flex: 1; }
.kop-text h1 { margin: 0; font-size: 17pt; font-weight: bold; letter-spacing: 2px; color: #1a3a5c; }
.kop-text h2 { margin: 0; font-size: 12pt; font-weight: normal; color: #333; }
.kop-text p  { margin: 3px 0 0; font-size: 10pt; color: #444; }

/* Small Header */
.small-header { font-size: 9pt; border-bottom: 1.5px solid #1a3a5c; border-top: 1.5px solid #1a3a5c; margin-bottom: 14px; padding: 5px 0; font-weight: bold; display: flex; justify-content: space-between; color: #1a3a5c; background: #f0f4f8; padding: 5px 10px; }

/* Judul Dokumen */
h3 { margin: 8px 0 14px 0; font-size: 13pt; text-transform: uppercase; text-align: center; font-weight: bold; letter-spacing: 0.5px; color: #1a3a5c; }
h3 span { font-size: 9.5pt; font-weight: normal; color: #555; display: block; margin-top: 3px; }

/* Section Heading */
h4 { font-size: 9.5pt; margin: 0 0 6px 0; background: #1a3a5c; color: #fff; padding: 6px 12px; letter-spacing: 0.3px; font-weight: bold; }

.section-box { margin-bottom: 20px; }

/* Info Table */
table.info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5pt; }
table.info-table td { padding: 5px 9px; vertical-align: top; border: 1px solid #dde3ea; }
table.info-table td.label { width: 26%; font-weight: bold; background: #f5f7fa; color: #1a3a5c; border-right: 1px solid #b0bec5; }

/* Data Table — modern thin border */
table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 8.8pt; }
table.data-table th, table.data-table td { border: 1px solid #cfd8dc; padding: 5px 7px; text-align: left; vertical-align: middle; }
table.data-table th { background: #1a3a5c; color: #fff; text-align: center; font-weight: 600; font-size: 8.3pt; letter-spacing: 0.2px; }
table.data-table th.sub { background: #2c5282; color: #e8eef5; font-size: 8pt; font-weight: normal; }
table.data-table td { background: #fff; color: #222; }
table.data-table tr:nth-child(even) td { background: #f9fbfc; }
table.data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
table.data-table td.cen { text-align: center; }
table.data-table tr.total-row td { background: #e8f0f7; font-weight: bold; color: #1a3a5c; border-top: 1.5px solid #1a3a5c; }

/* Peta Section */
.peta-box { border: 1px solid #374151; padding: 14px; margin-bottom: 20px; background: #fafafa; }
.peta-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 20px; margin-bottom: 12px; font-size: 10.5pt; }
.peta-meta-item { display: flex; gap: 6px; }
.peta-meta-item .mk { font-weight: bold; min-width: 110px; color: #374151; }
.peta-img-wrap { text-align: center; border: 1px dashed #9ca3af; padding: 10px; background: #fff; }
.peta-img-wrap img { max-width: 100%; max-height: 380px; object-fit: contain; }
.peta-no-img { text-align: center; padding: 40px; color: #6b7280; font-style: italic; border: 1px dashed #9ca3af; }

/* Signatures */
.sign-container { display: flex; justify-content: center; gap: 30px; margin-top: 20px; flex-wrap: wrap; }
.sign-box { text-align: center; width: 260px; border: 1px solid #d1d5db; padding: 12px; background: #fafafa; margin-bottom: 16px; }
.sign-role { font-weight: bold; text-transform: uppercase; font-size: 10.5pt; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px; display: block; }
.sign-space { height: 90px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-style: italic; font-size: 9pt; border: 1px dashed #d1d5db; margin-bottom: 8px; }
.sign-name { font-weight: bold; text-decoration: underline; display: block; font-size: 11pt; }
.sign-npk  { display: block; font-size: 10pt; color: #4b5563; margin-top: 3px; }

/* Crypto Footer */
.crypto-footer { margin-top: 30px; border: 2px solid #1f2937; font-family: "Courier New", monospace; font-size: 9pt; background: #f8fafc; padding: 0; page-break-inside: avoid; }
.crypto-header-bar { background: #1f2937; color: #fff; padding: 8px 16px; font-weight: bold; font-size: 10pt; letter-spacing: 1px; }
.crypto-body { display: flex; gap: 0; }
.crypto-details { padding: 12px 16px; flex: 1; border-right: 2px dashed #1f2937; }
.crypto-row { margin-bottom: 8px; }
.crypto-label { font-weight: bold; color: #374151; font-size: 9pt; }
.crypto-val { word-break: break-all; color: #1e3a5f; margin-top: 2px; font-size: 8.5pt; line-height: 1.4; }
.crypto-stamp-wrapper { width: 280px; padding: 16px; display: flex; align-items: center; justify-content: center; background: #fff; }
.real-stamp { border: 4px double; border-radius: 8px; padding: 12px 10px; text-align: center; font-family: "Times New Roman", Times, serif; transform: rotate(-3deg); width: 100%; }
.real-stamp.valid   { color: #047857; border-color: #047857; background-color: #ecfdf5; }
.real-stamp.invalid { color: #dc2626; border-color: #dc2626; background-color: #fef2f2; }
.stamp-head { font-size: 17pt; font-weight: 900; letter-spacing: 1px; margin-bottom: 3px; }
.stamp-sub  { font-size: 8.5pt; font-weight: bold; text-transform: uppercase; }
.stamp-algo { font-size: 8pt; margin-top: 4px; font-family: monospace; }
.stamp-dept { font-size: 7.5pt; margin-top: 5px; border-top: 1px solid; padding-top: 3px; }

/* Page break */
.page-break { page-break-after: always; }
.avoid-break { page-break-inside: avoid; }

/* Page numbers via CSS counter */
body { counter-reset: page; }
.page-num-footer { text-align: right; font-size: 9pt; color: #6b7280; margin-top: 10px; border-top: 1px solid #e5e7eb; padding-top: 4px; }

@media print { body { background: none; } .print-container { padding: 0; max-width: none; } }
</style>
</head><body>
<div class="print-container">';

// ═══════════════════════════════════════════════════════
// HALAMAN 1: KOP + IDENTITAS + DASAR SK
// ═══════════════════════════════════════════════════════
$html .= '<div class="kop-surat-inner">
    <div class="kop-surat">
        ' . ($logo_base64 ? '<img src="' . $logo_base64 . '" class="kop-logo" alt="Logo Perhutani" />' : '') . '
        <div class="kop-text">
            <h2>KEMENTERIAN BADAN USAHA MILIK NEGARA RI</h2>
            <h1>PERUM PERHUTANI</h1>
            <p>DIVISI REGIONAL JAWA BARAT DAN BANTEN</p>
            <p style="font-weight:bold; font-size:13pt;">' . strtoupper(safe_html($rtt['kph'])) . '</p>
        </div>
    </div>
</div>';

$html .= '<h3>RENCANA TEKNIK TAHUNAN (RTT)<br><span style="font-size:11pt; font-weight:normal;">Nomor Dokumen: ' . safe_html($rtt['nomor_dokumen']) . '</span></h3>';

// Identitas Dokumen
$html .= '<div class="section-box avoid-break">
    <h4>I. Identitas Dokumen &amp; Lokasi</h4>
    <table class="info-table">
        <tr><td class="label">Nomor Dokumen</td><td><strong>' . safe_html($rtt['nomor_dokumen']) . '</strong></td></tr>
        <tr><td class="label">KPH / BKPH / RPH</td><td>' . safe_html($rtt['kph']) . ' / ' . safe_html($rtt['bkph']) . ' / ' . safe_html($rtt['rph']) . '</td></tr>
        <tr><td class="label">Tanggal Diterbitkan</td><td>' . format_date($rtt['tanggal']) . '</td></tr>
        <tr><td class="label">Referensi RPKH</td><td>' . safe_html($rtt['rpkh_wilayah']) . ' &nbsp;|&nbsp; Periode: ' . safe_html($rtt['tahun_mulai']) . ' &ndash; ' . safe_html($rtt['tahun_selesai']) . '</td></tr>
        <tr><td class="label">Status Pengesahan</td><td><strong style="text-transform:uppercase; font-size:11pt;">' . safe_html($rtt['status']) . '</strong></td></tr>
        <tr><td class="label">Tanggal Dibuat</td><td>' . format_date($rtt['created_at']) . '</td></tr>
        <tr><td class="label">Terakhir Diperbarui</td><td>' . format_date($rtt['updated_at']) . '</td></tr>
    </table>
</div>';

// Dasar Keputusan (SK)
if ($sk || $kep) {
    $html .= '<div class="section-box avoid-break">
        <h4>II. Dasar Keputusan</h4>
        <table class="info-table">';
    if ($sk) {
        $html .= '<tr><td class="label">Nomor SK</td><td><strong>' . safe_html($sk['nomor_sk']) . '</strong></td></tr>
                  <tr><td class="label">Tanggal SK</td><td>' . format_date($sk['tanggal_sk']) . '</td></tr>
                  <tr><td class="label">Tentang</td><td>' . safe_html($sk['tentang']) . '</td></tr>';
    }
    if ($kep) {
        $html .= '<tr><td class="label">Menimbang</td><td>' . nl2br(safe_html($kep['menimbang'])) . '</td></tr>
                  <tr><td class="label">Mengingat</td><td>' . nl2br(safe_html($kep['mengingat'])) . '</td></tr>
                  <tr><td class="label">Memutuskan</td><td>' . nl2br(safe_html($kep['memutuskan'])) . '</td></tr>';
    }
    $html .= '</table></div>';
}

$html .= '<div class="page-num-footer">Halaman 1 | RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</div>';
$html .= '<div class="page-break"></div>';

// ═══════════════════════════════════════════════════════
// HALAMAN 2: SUMMARY + NETT AREA
// ═══════════════════════════════════════════════════════
$small_header = '<div class="small-header"><span>Lampiran RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</span><span>' . safe_html($rtt['kph']) . ' &nbsp;|&nbsp; ' . safe_html($rtt['bkph']) . ' &nbsp;|&nbsp; ' . safe_html($rtt['rph']) . '</span></div>';
$html .= $small_header;

// Summary Tebangan
if ($summary) {
    $html .= '<div class="section-box avoid-break">
        <h4>III. Summary Tebangan</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th rowspan="2" width="14%">Bentuk Tebangan</th>
                    <th rowspan="2" width="13%">Jenis Kayu</th>
                    <th colspan="2" style="text-align:center;">Volume Pohon</th>
                    <th colspan="3" style="text-align:center;">Estimasi Hasil</th>
                </tr>
                <tr>
                    <th class="sub" width="12%">Total Luas (Ha)</th>
                    <th class="sub" width="12%">Jumlah Pohon (Btg)</th>
                    <th class="sub" width="13%">Kayu Perkakas (m³)</th>
                    <th class="sub" width="12%">Kayu Bakar (sm)</th>
                    <th class="sub" width="12%">Bambu / Arang</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="cen">' . safe_html($summary['bentuk_tebangan']) . '</td>
                    <td class="cen">' . safe_html($summary['jenis_kayu']) . '</td>
                    <td class="num">' . safe_num($summary['luas'], 2) . '</td>
                    <td class="num">' . safe_num($summary['jumlah_pohon']) . '</td>
                    <td class="num">' . safe_num($summary['kayu_perkakas'], 2) . '</td>
                    <td class="num">' . safe_num($summary['kayu_bakar'], 2) . '</td>
                    <td class="cen">' . safe_num($summary['bambu'], 2) . ' / ' . safe_num($summary['arang'], 2) . '</td>
                </tr>
            </tbody>
        </table>
    </div>';
}

// NETT Area — LOOP multi-baris dengan sub-kolom
if (!empty($nett_rows)) {
    $html .= '<div class="section-box">
        <h4>IV. Detail NETT Area (Parameter Standar Hutan)</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th rowspan="2" width="4%">No</th>
                    <th colspan="4" style="text-align:center;">Identitas Lokasi</th>
                    <th colspan="5" style="text-align:center;">Parameter Teknis</th>
                    <th colspan="3" style="text-align:center;">Volume &amp; Kalkulasi</th>
                </tr>
                <tr>
                    <th class="sub" width="10%">Bagian Hutan</th>
                    <th class="sub" width="8%">Petak / Anak</th>
                    <th class="sub" width="8%">Luas Baku (Ha)</th>
                    <th class="sub" width="9%">Jenis Tanaman</th>
                    <th class="sub" width="7%">Kelas Hutan</th>
                    <th class="sub" width="8%">Thn / BON</th>
                    <th class="sub" width="7%">KBD / DKN</th>
                    <th class="sub" width="5%">N/Ha</th>
                    <th class="sub" width="7%">Ditebang (m³)</th>
                    <th class="sub" width="8%">AI / AII / AIII</th>
                    <th class="sub" width="9%">Klem / Tunggak</th>
                    <th class="sub" width="9%">Total Vol. (m³)</th>
                </tr>
            </thead>
            <tbody>';
    $total_vol_nett = 0;
    $total_luas_nett = 0;
    foreach ($nett_rows as $idx => $n) {
        $total_vol_nett  += (float)($n['volume_kayu'] ?? 0);
        $total_luas_nett += (float)($n['luas_baku'] ?? 0);
        $html .= '<tr>
            <td class="cen">' . ($idx + 1) . '</td>
            <td>' . safe_html($n['bagian_hutan']) . '</td>
            <td class="cen">' . safe_html($n['petak']) . ' / ' . safe_html($n['anak_petak_baru']) . '</td>
            <td class="num">' . safe_num($n['luas_baku'], 2) . '</td>
            <td>' . safe_html($n['jenis_tanaman']) . '</td>
            <td class="cen">' . safe_html($n['kelas_hutan']) . '</td>
            <td class="cen">' . safe_html($n['tahun_tanam']) . ' / ' . safe_html($n['bon']) . '</td>
            <td class="cen">' . safe_html($n['kbd']) . ' / ' . safe_html($n['dkn']) . '</td>
            <td class="num">' . safe_num($n['n_per_ha'], 2) . '</td>
            <td class="num">' . safe_num($n['telah_ditebang'], 2) . '</td>
            <td class="cen">' . safe_num($n['ai']) . ' / ' . safe_num($n['aii']) . ' / ' . safe_num($n['aiii']) . '</td>
            <td class="cen">' . safe_num($n['xfaktor_klem'], 2) . ' / ' . safe_num($n['tunggak'], 2) . '</td>
            <td class="num"><strong>' . safe_num($n['volume_kayu'], 2) . '</strong></td>
        </tr>';
    }
    $html .= '<tr class="total-row">
        <td colspan="3" class="cen">Total</td>
        <td class="num">' . safe_num($total_luas_nett, 2) . '</td>
        <td colspan="8"></td>
        <td class="num">' . safe_num($total_vol_nett, 2) . '</td>
    </tr>';
    $html .= '</tbody></table></div>';
}

$html .= '<div class="page-num-footer">Halaman 2 | RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</div>';
$html .= '<div class="page-break"></div>';

// ═══════════════════════════════════════════════════════
// HALAMAN 3: REKAPITULASI KLEM + RINCIAN TEBANGAN
// ═══════════════════════════════════════════════════════
$html .= $small_header;

// Rekap Klem
if (!empty($rekap_klem)) {
    $html .= '<div class="section-box">
        <h4>V. Rekapitulasi Klem Pohon</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th rowspan="2" width="4%">No</th>
                    <th colspan="3" style="text-align:center;">Lokasi &amp; Identitas</th>
                    <th colspan="3" style="text-align:center;">Data Hutan</th>
                    <th colspan="3" style="text-align:center;">Hasil Klem</th>
                </tr>
                <tr>
                    <th class="sub" width="13%">KPH / BKPH / RPH</th>
                    <th class="sub" width="8%">Petak / Anak</th>
                    <th class="sub" width="9%">Kelas Hutan</th>
                    <th class="sub" width="9%">Luas Baku / Rencana (Ha)</th>
                    <th class="sub" width="7%">Thn Tanam</th>
                    <th class="sub" width="12%">Jenis Tanaman</th>
                    <th class="sub" width="10%">No. Blok (Luas Ha)</th>
                    <th class="sub" width="9%">Jml Pohon (Btg)</th>
                    <th class="sub" width="9%">Volume (m³)</th>
                </tr>
            </thead>
            <tbody>';
    $tot_pohon_klem = 0; $tot_vol_klem = 0;
    foreach ($rekap_klem as $idx => $k) {
        $tot_pohon_klem += (float)($k['jumlah_pohon'] ?? 0);
        $tot_vol_klem   += (float)($k['volume'] ?? 0);
        $html .= '<tr>
            <td class="cen">' . ($idx + 1) . '</td>
            <td class="cen">' . safe_html($k['kph']) . ' / ' . safe_html($k['bkph']) . ' / ' . safe_html($k['rph']) . '</td>
            <td class="cen">' . safe_html($k['petak']) . ' - ' . safe_html($k['anak_petak']) . '</td>
            <td class="cen">' . safe_html($k['kelas_hutan']) . '</td>
            <td class="cen">' . safe_num($k['luas_baku'], 2) . ' / ' . safe_num($k['luas_rencana'], 2) . '</td>
            <td class="cen">' . safe_html($k['tahun_tanam']) . '</td>
            <td>' . safe_html($k['jenis_tanaman']) . '</td>
            <td class="cen">Blok ' . safe_html($k['no_blok']) . '<br>(' . safe_num($k['luas_blok'], 2) . ' Ha)</td>
            <td class="num">' . safe_num($k['jumlah_pohon']) . '</td>
            <td class="num">' . safe_num($k['volume'], 2) . '</td>
        </tr>';
    }
    $html .= '<tr class="total-row">
        <td colspan="8" class="cen">Total Keseluruhan</td>
        <td class="num">' . safe_num($tot_pohon_klem) . '</td>
        <td class="num">' . safe_num($tot_vol_klem, 2) . '</td>
    </tr>';
    $html .= '</tbody></table></div>';
}

// Rincian Tebangan
if (!empty($tebangan)) {
    $html .= '<div class="section-box">
        <h4>VI. Rincian Rencana Tebangan</h4>
        <table class="data-table">
            <thead>
                <tr>
                    <th rowspan="2" width="5%">No</th>
                    <th colspan="3" style="text-align:center;">Lokasi Petak</th>
                    <th colspan="3" style="text-align:center;">Data Tebangan</th>
                    <th rowspan="2" width="20%">Keterangan</th>
                </tr>
                <tr>
                    <th class="sub" width="9%">Petak</th>
                    <th class="sub" width="9%">Anak Petak</th>
                    <th class="sub" width="11%">Luas (Ha)</th>
                    <th class="sub" width="17%">Jenis Tanaman</th>
                    <th class="sub" width="10%">Jml Pohon (Btg)</th>
                    <th class="sub" width="11%">Volume (m³)</th>
                </tr>
            </thead>
            <tbody>';
    foreach ($tebangan as $t) {
        $html .= '<tr>
            <td class="cen">' . safe_html($t['nomor']) . '</td>
            <td class="cen">' . safe_html($t['petak']) . '</td>
            <td class="cen">' . safe_html($t['anak_petak']) . '</td>
            <td class="num">' . safe_num($t['luas'], 2) . '</td>
            <td>' . safe_html($t['jenis_tanaman']) . '</td>
            <td class="num">' . safe_num($t['jumlah_pohon']) . '</td>
            <td class="num">' . safe_num($t['volume'], 2) . '</td>
            <td>' . safe_html($t['keterangan']) . '</td>
        </tr>';
    }
    if ($rekap) {
        $html .= '<tr class="total-row">
            <td colspan="3" class="cen">Total Keseluruhan</td>
            <td class="num">' . safe_num($rekap['total_luas'], 2) . '</td>
            <td></td>
            <td class="num">' . safe_num($rekap['total_pohon']) . '</td>
            <td class="num">' . safe_num($rekap['total_volume'], 2) . '</td>
            <td></td>
        </tr>';
    }
    $html .= '</tbody></table></div>';
}

$html .= '<div class="page-num-footer">Halaman 3 | RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</div>';
$html .= '<div class="page-break"></div>';

// ═══════════════════════════════════════════════════════
// HALAMAN 4: PETA LOKASI (GAMBAR ASLI HASIL DEKRIPSI ECC)
// ═══════════════════════════════════════════════════════
$html .= $small_header;
$html .= '<h4 style="margin-bottom:16px;">VII. Peta Lokasi</h4>';

if (!empty($peta_decoded)) {
    foreach ($peta_decoded as $pi => $p) {
        $html .= '<div class="peta-box avoid-break">
            <p style="font-weight:bold; margin:0 0 10px 0; font-size:11pt; border-bottom:1px solid #d1d5db; padding-bottom:6px;">
                Peta ' . ($pi + 1) . (!empty($p['bagian_hutan']) ? ' &mdash; Bagian Hutan: ' . safe_html($p['bagian_hutan']) : '') . '
            </p>
            <div class="peta-meta">
                <div class="peta-meta-item"><span class="mk">Bagian Hutan</span><span>: ' . safe_html($p['bagian_hutan']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Kelompok Hutan</span><span>: ' . safe_html($p['kelompok_hutan']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Petak</span><span>: ' . safe_html($p['petak']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">BKPH</span><span>: ' . safe_html($p['bkph']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">RPH</span><span>: ' . safe_html($p['rph']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Kelas Hutan</span><span>: ' . safe_html($p['kelas_hutan']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Jenis Tanaman</span><span>: ' . safe_html($p['jenis_tanaman']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Tahun Tanam</span><span>: ' . safe_html($p['tahun_tanam']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Jarak Tanam</span><span>: ' . safe_html($p['jarak_tanam']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Skala Peta</span><span>: ' . safe_html($p['skala']) . '</span></div>
                <div class="peta-meta-item"><span class="mk">Luas Baku</span><span>: ' . safe_num($p['luas_baku'], 2) . ' Ha</span></div>
                <div class="peta-meta-item"><span class="mk">Panjang</span><span>: ' . safe_html($p['panjang']) . '</span></div>
            </div>';

        $dec = $p['decoded'];
        if ($dec && $dec['type'] === 'image') {
            $html .= '<div class="peta-img-wrap">
                <p style="font-size:9pt; color:#6b7280; margin:0 0 6px 0;">🔓 File peta berhasil didekripsi dari enkripsi ECC</p>
                <img src="' . $dec['data'] . '" alt="Peta Lokasi ' . ($pi + 1) . '" />
            </div>';
        } elseif ($dec && $dec['type'] === 'file') {
            $html .= '<div class="peta-no-img">
                📄 File peta berformat <strong>' . strtoupper($dec['ext']) . '</strong> (' . safe_html($dec['name']) . ')<br>
                File PDF tidak dapat ditampilkan sebagai gambar di sini.
            </div>';
        } else {
            $html .= '<div class="peta-no-img">⚠️ Gagal mendekripsi file peta. Pastikan Private Key sistem tersedia.</div>';
        }
        $html .= '</div>';
    }
} else {
    $html .= '<div class="peta-no-img">Belum ada peta lokasi yang diunggah.</div>';
}

$html .= '<div class="page-num-footer">Halaman 4 | RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</div>';
$html .= '<div class="page-break"></div>';

// ═══════════════════════════════════════════════════════
// HALAMAN 5: LAMPIRAN DOKUMEN (HASIL DEKRIPSI ECC)
// ═══════════════════════════════════════════════════════
$html .= $small_header;
$html .= '<h4 style="margin-bottom:16px;">VIII. Lampiran Dokumen</h4>';

if (!empty($lampiran_decoded)) {
    foreach ($lampiran_decoded as $li => $l) {
        $html .= '<div class="peta-box avoid-break">
            <p style="font-weight:bold; margin:0 0 10px 0; font-size:11pt; border-bottom:1px solid #d1d5db; padding-bottom:6px;">
                Lampiran ' . ($li + 1) . ': ' . safe_html($l['judul']) . '
            </p>';
        if (!empty($l['keterangan'])) {
            $html .= '<p style="margin:0 0 10px 0; font-size:10.5pt;"><strong>Keterangan:</strong> ' . safe_html($l['keterangan']) . '</p>';
        }

        $dec = $l['decoded'];
        if ($dec && $dec['type'] === 'image') {
            $html .= '<div class="peta-img-wrap">
                <p style="font-size:9pt; color:#6b7280; margin:0 0 6px 0;">🔓 File lampiran berhasil didekripsi dari enkripsi ECC</p>
                <img src="' . $dec['data'] . '" alt="Lampiran ' . ($li + 1) . '" />
            </div>';
        } elseif ($dec && $dec['type'] === 'file') {
            $html .= '<div class="peta-no-img">
                📄 File lampiran berformat <strong>' . strtoupper($dec['ext']) . '</strong> (' . safe_html($dec['name']) . ')<br>
                File PDF tidak dapat ditampilkan sebagai gambar.
            </div>';
        } else {
            $html .= '<div class="peta-no-img">⚠️ Gagal mendekripsi file lampiran.</div>';
        }
        $html .= '</div>';
    }
} else {
    $html .= '<p style="font-style:italic; padding:16px; border:1px dashed #d1d5db; color:#6b7280;">Tidak ada dokumen lampiran yang diunggah.</p>';
}

$html .= '<div class="page-num-footer">Halaman 5 | RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</div>';
$html .= '<div class="page-break"></div>';

// ═══════════════════════════════════════════════════════
// HALAMAN 6: BERITA ACARA + PENGESAHAN
// ═══════════════════════════════════════════════════════
$html .= $small_header;

// Berita Acara
$html .= '<div class="section-box avoid-break">
    <h4>IX. Berita Acara Pemeriksaan Lapangan</h4>';
if (!empty($berita_acara)) {
    $html .= '<table class="data-table" style="font-size:11pt;">
        <thead>
            <tr>
                <th width="5%">No</th>
                <th width="25%">Nama Petugas / Jabatan</th>
                <th width="18%">Tanggal Pemeriksaan</th>
                <th width="52%">Hasil Pemeriksaan</th>
            </tr>
        </thead>
        <tbody>';
    foreach ($berita_acara as $bi => $ba) {
        $html .= '<tr>
            <td class="cen">' . ($bi + 1) . '</td>
            <td><strong>' . safe_html($ba['nama_petugas']) . '</strong><br><em>' . safe_html($ba['jabatan']) . '</em></td>
            <td class="cen">' . format_date($ba['tanggal']) . '</td>
            <td>' . nl2br(safe_html($ba['hasil_pemeriksaan'])) . '</td>
        </tr>';
    }
    $html .= '</tbody></table>';
} else {
    $html .= '<p style="font-style:italic; padding:10px; border:1px dashed #d1d5db;">Belum ada berita acara pemeriksaan.</p>';
}
$html .= '</div>';

// Pengesahan + Tanda Tangan
$html .= '<div class="section-box avoid-break" style="margin-top:30px;">
    <h4>X. Pengesahan (Pihak yang Terlibat)</h4>
    <p style="text-align:center; margin-bottom:20px; font-style:italic;">
        Dokumen Rencana Teknik Tahunan ini telah disetujui, ditandatangani, dan disahkan oleh pihak-pihak berwenang di bawah ini:
    </p>
    <div class="sign-container">';
if (!empty($pengesahan)) {
    foreach ($pengesahan as $p) {
        $html .= '<div class="sign-box">
            <span class="sign-role">' . safe_html($p['jabatan']) . '</span>
            <div class="sign-space">Tanda Tangan / Cap</div>
            <span class="sign-name">' . safe_html($p['nama_pejabat']) . '</span>
            <span class="sign-npk">NPK: ' . safe_html($p['npk']) . '</span>
            <span class="sign-npk">Tanggal: ' . format_date($p['tanggal']) . '</span>
        </div>';
    }
}
$html .= '</div></div>';

$html .= '<div class="page-num-footer">Halaman 6 | RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . '</div>';
$html .= '<div class="page-break"></div>';

// ═══════════════════════════════════════════════════════
// HALAMAN 7: FOOTER KRIPTOGRAFI LENGKAP
// ═══════════════════════════════════════════════════════
$html .= $small_header;
$html .= '<h4 style="margin-bottom:16px;">XI. Otentikasi Digital — Kriptografi ECC &amp; ECDSA</h4>';

// Info box kriptografi
$html .= '<div class="section-box avoid-break">
    <table class="info-table" style="font-family: monospace; font-size: 10pt;">
        <tr><td class="label" style="width:22%">ID Transaksi</td><td>RTT-' . $rtt['id'] . '-' . date('Y', strtotime($rtt['created_at'] ?? 'now')) . '</td></tr>
        <tr><td class="label">Timestamp Cetak</td><td>' . date('d F Y H:i:s') . ' WIB</td></tr>
        <tr><td class="label">Tanggal Disahkan</td><td>' . format_date($rtt['updated_at']) . '</td></tr>
    </table>
</div>';

// Stempel + Hash dalam satu box
$html .= '<div class="crypto-footer avoid-break">
    <div class="crypto-header-bar">⚙ OTENTIKASI DIGITAL — SHA-256 &amp; ECDSA (SECP256K1)</div>
    <div class="crypto-body">
        <div class="crypto-details">
            <div class="crypto-row">
                <div class="crypto-label">🔐 HASH SHA-256 (Message Digest)</div>
                <div class="crypto-val">' . safe_html($rtt['hash'] ?? '-') . '</div>
            </div>';

if (!empty($rtt['signature'])) {
    // Tampilkan signature dengan wrap setiap 64 karakter
    $sig_wrapped = wordwrap($rtt['signature'], 64, "\n", true);
    $html .= '<div class="crypto-row" style="margin-top:10px;">
                <div class="crypto-label">✍️ ECDSA DIGITAL SIGNATURE (Base64)</div>
                <div class="crypto-val">' . nl2br(safe_html($sig_wrapped)) . '</div>
              </div>';
} else {
    $html .= '<div class="crypto-row" style="margin-top:10px;">
                <div class="crypto-label">✍️ ECDSA DIGITAL SIGNATURE</div>
                <div class="crypto-val" style="color:#9ca3af; font-style:italic;">Belum ditandatangani</div>
              </div>';
}

if (!empty($rtt['public_key'])) {
    $html .= '<div class="crypto-row" style="margin-top:10px;">
                <div class="crypto-label">🔑 PUBLIC KEY DIREKSI (PEM)</div>
                <div class="crypto-val">' . nl2br(safe_html(trim($rtt['public_key']))) . '</div>
              </div>';
}

$html .= '  </div>
        <div class="crypto-stamp-wrapper">';

if ($is_corrupt) {
    $html .= '<div class="real-stamp invalid">
        <div class="stamp-head">DOKUMEN PALSU</div>
        <div class="stamp-sub">Data Telah Dimanipulasi</div>
        <div class="stamp-algo">SHA-256 MISMATCH</div>
        <div class="stamp-dept">PERUM PERHUTANI<br>DIVISI REG. JABAR &amp; BANTEN</div>
    </div>';
} else {
    $html .= '<div class="real-stamp valid">
        <div class="stamp-head">DOKUMEN SAH</div>
        <div class="stamp-sub">Tidak Terubah (Valid)</div>
        <div class="stamp-algo">' . (!empty($rtt['signature']) ? 'ECDSA SECP256K1 ✓' : 'SHA-256 ✓') . '</div>
        <div class="stamp-dept">PERUM PERHUTANI<br>DIVISI REG. JABAR &amp; BANTEN</div>
    </div>';
}

$html .= '    </div>
    </div>
</div>';

$html .= '<div class="page-num-footer" style="margin-top:20px;">Halaman 7 (Terakhir) | RTT Nomor: ' . safe_html($rtt['nomor_dokumen']) . ' | Dicetak: ' . date('d-m-Y H:i:s') . '</div>';

$html .= '</div></body>';
$html .= '<script>window.onload = function() { window.print(); }</script>';
$html .= '</html>';

header('Content-Type: text/html; charset=utf-8');
echo $html;
?>
