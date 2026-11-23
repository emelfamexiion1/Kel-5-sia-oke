// DATA MASTER PRODUK KETOPRAK RIZKI
const PRODUCTS = [
  { code: 'PRD-01', name: 'Ketoprak Telur', price: 18000, category: 'Makanan Utama' },
  { code: 'PRD-02', name: 'Ketoprak Biasa', price: 14000, category: 'Makanan Utama' },
  { code: 'PRD-03', name: 'Ketoprak Spesial (Telur + Kerupuk)', price: 21000, category: 'Makanan Utama' },
  { code: 'PRD-04', name: 'Es Teh Manis', price: 4000, category: 'Minuman' },
  { code: 'PRD-05', name: 'Es Jeruk Peras', price: 6000, category: 'Minuman' }
];

// DATA AWAL SESUAI LAPORAN TAHAP 2 (PER OKTOBER 2026)
const INITIAL_STATE = {
  janSepOmzet: 45000000,
  salesOct: 5200000,
  hppOct: 2300000,
  salaryOct: 2200000,
  rentOct: 350000,
  opsOct: 150000,
  // Posisi Keuangan Awal (sebelum transaksi baru di demo)
  cash: 1850000,
  inventory: 450000,
  equipment: 3500000,
  capital: 5600000,
  salesLog: [
    {
      id: 'FK-202610-0089',
      time: '31/10/2026 12:30',
      cashier: 'Karyawan 1',
      method: 'Tunai',
      items: '5x Ketoprak Telur, 5x Es Teh Manis',
      total: 110000
    }
  ],
  expenseLog: [
    {
      id: 'KK-202610-0034',
      vendor: 'Toko Bumbu Barokah',
      account: '5-1100 (Bahan Baku)',
      desc: 'Kacang Tanah 10kg, Tahu 100 potong, Bihun 5kg',
      amount: 350000,
      receipt: 'Nota_Barokah_311026.jpg'
    }
  ]
};

let state = JSON.parse(localStorage.getItem('ketoprakRizkiSIA')) || JSON.parse(JSON.stringify(INITIAL_STATE));
let cart = [];

// FORMAT RUPIAH
function formatRp(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

function saveState() {
  localStorage.setItem('ketoprakRizkiSIA', JSON.stringify(state));
  renderAll();
}

function resetDemoData() {
  if (confirm('Kembalikan seluruh angka ke saldo laporan awal Oktober 2026?')) {
    state = JSON.parse(JSON.stringify(INITIAL_STATE));
    cart = [];
    saveState();
  }
}

// NAVIGASI TAB
function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tabId}"]`).classList.add('active');

  const titles = {
    pos: 'Form Input Penjualan (POS)',
    expense: 'Form Pembelian & Kas Keluar',
    payroll: 'Form Slip Gaji & Pemotongan PPh 21',
    income: 'Laporan Laba Rugi (SAK EMKM)',
    balance: 'Laporan Posisi Keuangan (Neraca)',
    tax: 'Rekapitulasi Pajak UMKM (PP 55/2022)',
    master: 'Master Data Produk & Daftar Akun (COA)'
  };
  document.getElementById('pageTitle').textContent = titles[tabId];
}

// PENGENDALIAN INTERNAL: SEGREGATION OF DUTIES (SOD)
function changeRole() {
  const role = document.getElementById('roleSelect').value;
  const ownerElements = document.querySelectorAll('.owner-only');
  const hint = document.getElementById('roleHint');

  if (role === 'kasir') {
    ownerElements.forEach(el => (el.style.display = 'none'));
    hint.textContent = 'Mode Kasir: Hanya dapat menginput penjualan POS.';
    switchTab('pos');
  } else {
    ownerElements.forEach(el => (el.style.display = 'block'));
    hint.textContent = 'Mode Pemilik: Seluruh modul & laporan terbuka.';
  }
}

// INISIALISASI DROPDOWN & MASTER PRODUK
function initMaster() {
  const select = document.getElementById('posProductSelect');
  const tbody = document.getElementById('masterProductBody');
  select.innerHTML = '';
  tbody.innerHTML = '';

  PRODUCTS.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.textContent = `${p.code} - ${p.name} (${formatRp(p.price)})`;
    select.appendChild(opt);

    tbody.innerHTML += `
      <tr>
        <td><strong>${p.code}</strong></td>
        <td>${p.name}</td>
        <td>${formatRp(p.price)}</td>
        <td>${p.category}</td>
      </tr>
    `;
  });
}

// LOGIKA POS PENJUALAN
function addToCart() {
  const code = document.getElementById('posProductSelect').value;
  const qty = parseInt(document.getElementById('posQty').value) || 1;
  const prod = PRODUCTS.find(p => p.code === code);

  const existing = cart.find(item => item.code === code);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...prod, qty, discount: 0 });
  }
  renderCart();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById('cartBody');
  if (cart.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Belum ada item ditambahkan.</td></tr>';
    document.getElementById('posDpp').textContent = 'Rp 0';
    document.getElementById('posTotal').textContent = 'Rp 0';
    return;
  }

  let total = 0;
  tbody.innerHTML = '';
  cart.forEach((item, idx) => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    tbody.innerHTML += `
      <tr>
        <td>${item.code}</td>
        <td>${item.name}</td>
        <td>${formatRp(item.price)}</td>
        <td>${item.qty}</td>
        <td>0%</td>
        <td><strong>${formatRp(subtotal)}</strong></td>
        <td><button type="button" onclick="removeCartItem(${idx})" style="color:red;border:none;background:none;cursor:pointer;">✕</button></td>
      </tr>
    `;
  });

  document.getElementById('posDpp').textContent = formatRp(total);
  document.getElementById('posTotal').textContent = formatRp(total);
}

function submitSale() {
  if (cart.length === 0) {
    alert('Tambahkan minimal 1 item produk terlebih dahulu.');
    return;
  }

  const method = document.getElementById('posPayment').value;
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const invNo = 'FK-202610-00' + (90 + state.salesLog.length);
  const itemSummary = cart.map(i => `${i.qty}x ${i.name}`).join(', ');
  const now = new Date().toLocaleString('id-ID');

  // Update Jurnal & Saldo Otomatis (Kas bertambah, Penjualan bertambah)
  state.salesOct += total;
  state.cash += total;
  state.salesLog.unshift({
    id: invNo,
    time: now,
    cashier: 'Karyawan 1',
    method,
    items: itemSummary,
    total
  });

  // Tampilkan Struk 2 Rangkap (Pelanggan & Dapur)
  showReceiptModal(invNo, now, method, cart, total);

  cart = [];
  renderCart();
  saveState();
}

function showReceiptModal(invNo, time, method, items, total) {
  const itemLines = items.map(i => `${i.qty}x ${i.name} = ${formatRp(i.price * i.qty)}`).join('<br>');
  const createSlip = (copyTitle) => `
    <div class="receipt-box">
      <strong>KETOPRAK RIZKI - SEMARANG</strong><br>
      ${copyTitle}<br>
      ------------------------------<br>
      No: ${invNo}<br>
      Tgl: ${time}<br>
      Bayar: ${method}<br>
      ------------------------------<br>
      ${itemLines}<br>
      ------------------------------<br>
      <strong>TOTAL: ${formatRp(total)}</strong><br>
      PPN (Non-PKP): Rp 0
    </div>
  `;

  document.getElementById('receiptPrintArea').innerHTML =
    createSlip('RANGKAP 1: PELANGGAN') + createSlip('RANGKAP 2: DAPUR (PRODUKSI)');
  document.getElementById('receiptModal').classList.add('show');
}

function closeModal() {
  document.getElementById('receiptModal').classList.remove('show');
}

// LOGIKA PEMBELIAN & KAS KELUAR
function submitExpense(e) {
  e.preventDefault();
  const vendor = document.getElementById('expVendor').value;
  const account = document.getElementById('expAccount').value;
  const desc = document.getElementById('expDesc').value;
  const amount = parseInt(document.getElementById('expAmount').value) || 0;
  const fileInput = document.getElementById('expReceipt');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Pengendalian Internal: Wajib mengunggah foto bukti nota fisik!');
    return;
  }

  const fileName = fileInput.files[0].name;
  const voucherNo = 'KK-202610-00' + (35 + state.expenseLog.length);

  // Update akun beban & kurangi kas
  if (account === 'hpp') state.hppOct += amount;
  if (account === 'sewa') state.rentOct += amount;
  if (account === 'ops') state.opsOct += amount;
  state.cash -= amount;

  const accountLabels = {
    hpp: '5-1100 (Beban Bahan Baku)',
    sewa: '5-2200 (Sewa & Utilitas)',
    ops: '5-2300 (Operasional Lain)'
  };

  state.expenseLog.unshift({
    id: voucherNo,
    vendor,
    account: accountLabels[account],
    desc,
    amount,
    receipt: fileName
  });

  document.getElementById('expenseForm').reset();
  saveState();
  alert(`Pengeluaran ${voucherNo} berhasil disimpan dengan bukti nota: ${fileName}`);
}

// LOGIKA SLIP GAJI & PPh 21
function calculatePayroll() {
  const base = parseInt(document.getElementById('payBase').value) || 0;
  const meal = parseInt(document.getElementById('payMeal').value) || 0;
  const ded = parseInt(document.getElementById('payDeduction').value) || 0;

  const gross = base + meal;
  // PTKP TK/0 = Rp 4.500.000/bulan -> jika <= 4.500.000 maka PPh 21 = 0
  const pph21 = gross > 4500000 ? Math.round((gross - 4500000) * 0.05) : 0;
  const net = gross - pph21 - ded;

  document.getElementById('payGross').textContent = formatRp(gross);
  document.getElementById('payTax').textContent = formatRp(pph21);
  document.getElementById('payDedDisplay').textContent = formatRp(ded);
  document.getElementById('payNet').textContent = formatRp(net);
}

function recordPayroll() {
  const emp = document.getElementById('payEmployee').value;
  const base = parseInt(document.getElementById('payBase').value) || 0;
  const meal = parseInt(document.getElementById('payMeal').value) || 0;
  const gross = base + meal;

  state.salaryOct += gross;
  state.cash -= gross;
  saveState();
  alert(`Slip gaji ${emp} sebesar ${formatRp(gross)} berhasil dicatat ke Beban Gaji & mengurangi Kas.`);
}

// RENDER SELURUH LAPORAN & KPI SECARA OTOMATIS
function renderAll() {
  const grossProfit = state.salesOct - state.hppOct;
  const totalOpEx = state.salaryOct + state.rentOct + state.opsOct;
  const ebt = grossProfit - totalOpEx;

  // Pajak PP 55/2022 (Batas 500 Juta Kumulatif Setahun)
  const cumOmzet = state.janSepOmzet + state.salesOct;
  const taxableOmzet = Math.max(0, cumOmzet - 500000000);
  const pphFinal = Math.round(taxableOmzet * 0.005);
  const netIncome = ebt - pphFinal;

  // KPI Header
  document.getElementById('kpiKas').textContent = formatRp(state.cash);
  document.getElementById('kpiOmzet').textContent = formatRp(state.salesOct);
  document.getElementById('kpiLaba').textContent = formatRp(netIncome);

  // Laporan Laba Rugi
  document.getElementById('lrSales').textContent = formatRp(state.salesOct);
  document.getElementById('lrHpp').textContent = `(${formatRp(state.hppOct)})`;
  document.getElementById('lrGrossProfit').textContent = formatRp(grossProfit);
  document.getElementById('lrSalary').textContent = `(${formatRp(state.salaryOct)})`;
  document.getElementById('lrRent').textContent = `(${formatRp(state.rentOct)})`;
  document.getElementById('lrOps').textContent = `(${formatRp(state.opsOct)})`;
  document.getElementById('lrEbt').textContent = formatRp(ebt);
  document.getElementById('lrTax').textContent = `(${formatRp(pphFinal)})`;
  document.getElementById('lrNetIncome').textContent = formatRp(netIncome);

  // Laporan Posisi Keuangan (Neraca) -> Selalu Seimbang (Balanced)
  const currentAssets = state.cash + state.inventory;
  const totalAssets = currentAssets + state.equipment;
  const totalLiabEq = state.capital + netIncome;

  document.getElementById('nrCash').textContent = formatRp(state.cash);
  document.getElementById('nrInventory').textContent = formatRp(state.inventory);
  document.getElementById('nrCurrentAssets').textContent = formatRp(currentAssets);
  document.getElementById('nrEquipment').textContent = formatRp(state.equipment);
  document.getElementById('nrTotalAssets').textContent = formatRp(totalAssets);
  document.getElementById('nrRetainedEarnings').textContent = formatRp(netIncome);
  document.getElementById('nrTotalLiabEq').textContent = formatRp(totalLiabEq);

  // Dasbor Pajak PP 55/2022
  const pct = Math.min(100, (cumOmzet / 500000000) * 100).toFixed(2);
  document.getElementById('taxProgressText').textContent = `${formatRp(cumOmzet)} / Rp 500.000.000 (${pct}%)`;
  document.getElementById('taxProgressBar').style.width = `${pct}%`;
  document.getElementById('taxOctOmzet').textContent = formatRp(state.salesOct);
  document.getElementById('taxCumOmzet').textContent = formatRp(cumOmzet);
  document.getElementById('taxOctPayable').textContent = formatRp(pphFinal);
  document.getElementById('taxTotalYear').textContent = formatRp(pphFinal);

  if (cumOmzet > 500000000) {
    document.getElementById('taxStatusBadge').textContent = 'Kena PPh Final 0,5%';
    document.getElementById('taxOctStatus').innerHTML = '<span style="color:red;font-weight:600;">Melebihi Rp500 Jt</span>';
  } else {
    document.getElementById('taxStatusBadge').textContent = 'Fasilitas Bebas Pajak (0%)';
    document.getElementById('taxOctStatus').innerHTML = '<span class="pill-green">Fasilitas Bebas Pajak</span>';
  }

  // Render Riwayat Penjualan
  const salesContainer = document.getElementById('salesHistoryList');
  salesContainer.innerHTML = state.salesLog
    .map(
      s => `
      <div class="history-item">
        <div class="history-top">
          <span>${s.id} (${s.method})</span>
          <span style="color:var(--primary);">${formatRp(s.total)}</span>
        </div>
        <div class="history-meta">${s.items}</div>
        <div class="history-meta">${s.time} • Kasir: ${s.cashier}</div>
      </div>
    `
    )
    .join('');

  // Render Riwayat Kas Keluar
  const expContainer = document.getElementById('expenseHistoryList');
  expContainer.innerHTML = state.expenseLog
    .map(
      ex => `
      <div class="history-item">
        <div class="history-top">
          <span>${ex.id} - ${ex.vendor}</span>
          <span style="color:var(--danger);">${formatRp(ex.amount)}</span>
        </div>
        <div class="history-meta">${ex.account} • ${ex.desc}</div>
        <div class="history-meta">📎 Bukti Nota: <strong>${ex.receipt}</strong></div>
      </div>
    `
    )
    .join('');
}

// JALANKAN SAAT HALAMAN DIBUKA
initMaster();
calculatePayroll();
renderAll();