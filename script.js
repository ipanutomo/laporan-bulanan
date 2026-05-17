// KONFIGURASI
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbywHb7dBP05pihQGu7wQLwaIMiRkzExNLM3DQ5mphgYXEx3Qy-kcgFbDKqGhxu8VKLa/exec';

// DOM Elements
const lotSelect = document.getElementById('lotSelect');
const loadBtn = document.getElementById('loadBtn');
const printBtn = document.getElementById('printBtn');
const reportContainer = document.getElementById('reportContainer');
const errorDiv = document.getElementById('error');
const loadingDiv = document.getElementById('loading');

// Format tanggal ke dd/mm/yyyy
function formatTanggal(dateString) {
    if (!dateString) return '-';
    try {
        let date = new Date(dateString);
        if (isNaN(date.getTime())) {
            if (typeof dateString === 'string' && dateString.includes('-')) {
                let parts = dateString.split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
            return dateString;
        }
        let day = String(date.getDate()).padStart(2, '0');
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
}

// Format Rupiah
function formatRupiah(angka) {
    if (angka === undefined || angka === null || angka === '') return 'Rp0';
    let num = typeof angka === 'number' ? angka : parseFloat(angka);
    if (isNaN(num)) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num).replace(',00', '');
}

// Fetch data
async function fetchIuranDetail(lot) {
    const url = `${API_BASE_URL}?sheet=iuranDetail&lot=${lot}`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    return result.data;
}

async function fetchKasJeruk2() {
    const url = `${API_BASE_URL}?sheet=kasJeruk2`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    return result.data;
}

// Render Tabel IPL (Iuran Detail) - DITAMBAH KOLOM KAS
function renderTabelIPL(data, lot) {
    if (!data || data.length === 0) {
        return `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Tidak ada data Iuran untuk lot ${lot}</p></div>`;
    }

    let totalIPL = 0;
    let totalKasRT = 0;
    let totalTakziyah = 0;
    let totalLainLain = 0;
    let totalDendaKB = 0;
    let totalKas = 0;  // <-- TAMBAHAN TOTAL KAS
    let totalSemua = 0;

    let rows = '';
    data.forEach(item => {
        const ipl = Number(item['Iuran RW']) || 0;
        const kasRt = Number(item['Iuran RT']) || 0;
        const takziyah = Number(item['Takziyah']) || 0;
        const lainLain = Number(item['Lain - lain']) || 0;
        const dendaKb = Number(item['Denda KB']) || 0;
        const kas = Number(item['Kas']) || 0;  // <-- TAMBAHAN KAS
        const totalBaris = ipl + kasRt + takziyah + lainLain + dendaKb + kas;

        totalIPL += ipl;
        totalKasRT += kasRt;
        totalTakziyah += takziyah;
        totalLainLain += lainLain;
        totalDendaKB += dendaKb;
        totalKas += kas;  // <-- TAMBAHAN TOTAL KAS
        totalSemua += totalBaris;

        rows += `
            <tr>
                <td>${formatTanggal(item['Tanggal'])}</td>
                <td>${item['Periode'] || '-'}</td>
                <td>${item['Blok No'] || '-'}</td>
                <td style="text-align:left">${item['Nama'] || '-'}</td>
                <td>${formatRupiah(ipl)}</td>
                <td>${formatRupiah(kasRt)}</td>
                <td>${formatRupiah(takziyah)}</td>
                <td>${formatRupiah(lainLain)}</td>
                <td>${formatRupiah(dendaKb)}</td>
                <td>${formatRupiah(kas)}</td>   <!-- KOLOM KAS BARU -->
                <td>${formatRupiah(totalBaris)}</td>
            </tr>
        `;
    });

    // Baris TOTAL (ditambah kolom Kas)
    rows += `
        <tr class="total-row">
            <td colspan="4" style="text-align:right; font-weight:700">TOTAL</td>
            <td>${formatRupiah(totalIPL)}</td>
            <td>${formatRupiah(totalKasRT)}</td>
            <td>${formatRupiah(totalTakziyah)}</td>
            <td>${formatRupiah(totalLainLain)}</td>
            <td>${formatRupiah(totalDendaKB)}</td>
            <td>${formatRupiah(totalKas)}</td>   <!-- TOTAL KAS -->
            <td>${formatRupiah(totalSemua)}</td>
        </tr>
    `;

    return `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Periode</th>
                        <th>Blok No</th>
                        <th>Nama</th>
                        <th>IPL</th>
                        <th>Kas RT</th>
                        <th>Takziyah</th>
                        <th>Lain-lain</th>
                        <th>Denda KB</th>
                        <th>Kas</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Render Tabel Kas Jeruk 2
function renderTabelKasJeruk2(data) {
    if (!data || data.length === 0) {
        return `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Tidak ada data Kas Jeruk 2</p></div>`;
    }

    let rows = '';
    data.forEach(item => {
        rows += `
            <tr>
                <td>${formatTanggal(item['Tanggal'])}</td>
                <td style="text-align:left">${item['Uraian'] || '-'}</td>
                <td>${item['Kategori'] || '-'}</td>
                <td>${formatRupiah(item['Jumlah'])}</td>
                <td>${item['Satuan'] || '-'}</td>
                <td>${formatRupiah(item['Pemasukan'])}</td>
                <td>${formatRupiah(item['Pengeluaran'])}</td>
                <td>${formatRupiah(item['Saldo'])}</td>
                <td style="text-align:left">${item['Keterangan'] || '-'}</td>
            </tr>
        `;
    });

    return `
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Uraian</th>
                        <th>Kategori</th>
                        <th>Jumlah</th>
                        <th>Satuan</th>
                        <th>Pemasukan</th>
                        <th>Pengeluaran</th>
                        <th>Saldo</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

// Generate seluruh laporan
async function generateLaporan(lot) {
    try {
        const [dataIuran, dataKas] = await Promise.all([
            fetchIuranDetail(lot),
            fetchKasJeruk2()
        ]);

        const tanggalCetak = new Date();
        const formattedDate = `${tanggalCetak.getDate()}/${tanggalCetak.getMonth() + 1}/${tanggalCetak.getFullYear()}`;

        return `
            <div class="laporan">
                <div class="header-laporan">
                    <h1>
                        <i class="fas fa-chart-pie"></i> 
                        Laporan Bulanan Iuran & Kas
                    </h1>
                    <div class="lot-badge">
                        <i class="fas fa-tag"></i> Batch / Lot: ${lot}
                    </div>
                    <div class="subtitle">
                        <i class="fas fa-calendar-alt"></i> Dicetak: ${formattedDate}
                    </div>
                </div>

                <div class="sub-judul">
                    <h3><i class="fas fa-hand-holding-usd"></i> A. Laporan Iuran (IPL, Kas RT, & Kas)</h3>
                </div>
                ${renderTabelIPL(dataIuran, lot)}

                <div class="sub-judul">
                    <h3><i class="fas fa-money-bill-wave"></i> B. Laporan Kas Jeruk 2</h3>
                </div>
                ${renderTabelKasJeruk2(dataKas)}

                <div class="footer-laporan">
                    <span><i class="far fa-building"></i>https://github.com/ipanutomo/laporan-bulanan.git</span>
                    <span><i class="far fa-clock"></i> Laporan digenerate otomatis</span>
                </div>
            </div>
        `;
    } catch (err) {
        throw new Error(`Gagal membuat laporan: ${err.message}`);
    }
}

// Handler utama
async function loadAndPrint(doPrint = false) {
    const lot = lotSelect.value.trim();
    
    if (!lot) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Silakan masukkan nomor lot (0-39)';
        return;
    }
    
    if (lot < 0 || lot > 39) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Lot harus antara 0 - 39';
        return;
    }

    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'flex';
    reportContainer.innerHTML = '<div class="loading-message" style="display:flex"><i class="fas fa-spinner fa-pulse"></i> Menyusun laporan...</div>';

    try {
        const laporanHtml = await generateLaporan(lot);
        reportContainer.innerHTML = laporanHtml;
        loadingDiv.style.display = 'none';

        if (doPrint) {
            setTimeout(() => {
                window.print();
            }, 300);
        }
    } catch (err) {
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = `<i class="fas fa-times-circle"></i> Error: ${err.message}`;
        reportContainer.innerHTML = `<div class="empty-state"><i class="fas fa-bug"></i><p>Gagal memuat laporan: ${err.message}</p></div>`;
    }
}

// Event Listeners
loadBtn.addEventListener('click', () => loadAndPrint(false));
printBtn.addEventListener('click', () => loadAndPrint(true));

lotSelect.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadAndPrint(false);
    }
});