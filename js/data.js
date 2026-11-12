// EnergyCare - memuat JSON survei lalu menampilkan isinya di data.html
const URL_DATA = 'data/data-perilaku-energi.json';
const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const elLoading = document.getElementById('status-loading');
const elError = document.getElementById('status-error');
const elKonten = document.getElementById('data-content');

// ----- Fungsi bantu -----
const fmt = (n, d = 2) => Number(n).toFixed(d).replace('.', ',');
const fmtInt = n => Number(n).toLocaleString('id-ID');
function tanggal(iso) {
  const [y, m, d] = iso.split('-');
  return Number(d) + ' ' + NAMA_BULAN[Number(m) - 1] + ' ' + y;
}
function buat(tag, kelas, teks) {
  const e = document.createElement(tag);
  if (kelas) e.className = kelas;
  if (teks !== undefined) e.textContent = teks;
  return e;
}
function kategoriDariSkor(skor, rentang) {
  for (const [nama, teks] of Object.entries(rentang)) {
    const [bawah, atas] = teks.split('-').map(Number);
    if (skor >= bawah && skor <= atas) return { nama, teks };
  }
  return null;
}

// ----- Ringkasan statistik -----
function tampilkanStatistik(d) {
  const m = d.meta, r = d.ringkasan;
  const skalaMaks = Object.keys(d.per_butir[0].jumlah_per_skor).length;
  const item = [
    { nilai: fmtInt(m.jumlah_responden), label: 'Jumlah responden' },
    { nilai: fmtInt(m.jumlah_siswa_terdata), label: 'Jumlah siswa terdata' },
    { nilai: fmt(m.persen_partisipasi, 1) + '%', label: 'Partisipasi' },
    { nilai: fmt(r.rata_rata_skor), unit: ' dari ' + skalaMaks, label: 'Rata-rata skor' },
    { nilai: fmt(r.rata_rata_total), label: 'Rata-rata total (skor 10 sampai 40)' },
    { nilai: fmt(r.persen_sering_rata_rata) + '%', label: 'Rata-rata perilaku sering' }
  ];
  const wadah = document.getElementById('stat-grid');
  wadah.replaceChildren();
  item.forEach(s => {
    const kartu = buat('div', 'stat');
    const nilai = buat('div', 'stat-value', s.nilai);
    if (s.unit) nilai.appendChild(buat('span', 'stat-unit', s.unit));
    kartu.append(nilai, buat('div', 'stat-label', s.label));
    wadah.appendChild(kartu);
  });
}

// ----- Daftar indikator di samping grafik -----
function tampilkanDaftarButir(d) {
  const ul = document.getElementById('daftar-butir');
  ul.replaceChildren();
  d.per_butir.forEach(b => {
    const li = buat('li');
    li.append(buat('span', 'kode', b.kode), buat('span', '', b.label), buat('span', 'nilai', fmt(b.rata_rata)));
    ul.appendChild(li);
  });
}

// ----- Temuan utama -----
function kartuTemuan(b, denganJarang) {
  const kartu = buat('article', 'card finding');
  kartu.append(buat('span', 'kode', b.kode), buat('h4', '', b.label), buat('p', 'nilai', fmt(b.rata_rata)));
  kartu.lastChild.insertAdjacentElement('afterend', buat('p', 'kecil', 'rata-rata skor'));
  if (denganJarang && b.persen_jarang !== undefined) {
    kartu.appendChild(buat('p', 'kecil', fmt(b.persen_jarang, 1) + '% responden menjawab jarang'));
  }
  return kartu;
}
function tampilkanTemuan(d) {
  const { butir_tertinggi, butir_terendah } = d.ringkasan.sorotan;
  const atas = document.getElementById('temuan-tertinggi');
  const bawah = document.getElementById('temuan-terendah');
  atas.replaceChildren(...butir_tertinggi.map(b => kartuTemuan(b, false)));
  bawah.replaceChildren(...butir_terendah.map(b => kartuTemuan(b, true)));

  // Catatan jika ada butir dengan rata-rata yang sama
  const kelompok = {};
  butir_terendah.forEach(b => (kelompok[b.rata_rata] = kelompok[b.rata_rata] || []).push(b.kode));
  const sama = Object.entries(kelompok).find(([, kode]) => kode.length > 1);
  const catatan = document.getElementById('catatan-sama');
  catatan.textContent = sama
    ? sama[1].join(' dan ') + ' memiliki rata-rata yang sama, yaitu ' + fmt(sama[0]) + '.'
    : '';
}

// ----- Analisis data -----
function tampilkanAnalisis(d) {
  const r = d.ringkasan;
  const cari = kode => d.per_butir.find(b => b.kode === kode);
  const tertinggi = r.sorotan.butir_tertinggi[0];
  const p04 = cari('P04'), p09 = cari('P09');
  const kat = kategoriDariSkor(r.rata_rata_skor, d.meta.kategori_skor.rentang);
  const hasil = [
    'Kebiasaan hemat energi sehari-hari (' + tertinggi.kode + ') memperoleh nilai tertinggi, yaitu ' +
      fmt(tertinggi.rata_rata) + ' dari 4.',
    'Pembatasan penggunaan gawai (' + p04.kode + ', ' + fmt(p04.rata_rata) + ') dan ajakan kepada teman (' +
      p09.kode + ', ' + fmt(p09.rata_rata) + ') berada di antara nilai terendah, sehingga masih perlu diperkuat.',
    kat
      ? 'Rata-rata skor keseluruhan ' + fmt(r.rata_rata_skor) + ' berada pada rentang ' + kat.teks.replace('-', ' sampai ').replace(/\./g, ',') +
        ', sehingga perilaku hemat energi siswa secara keseluruhan masuk kategori ' + kat.nama + '.'
      : 'Kategori keseluruhan tidak dapat ditentukan dari rentang pada JSON.'
  ];
  document.getElementById('daftar-insight').replaceChildren(...hasil.map(t => buat('li', '', t)));
}

// ----- Sumber dan periode -----
function tampilkanSumber(d) {
  const m = d.meta;
  const baris = [
    ['Sumber data', m.sumber],
    ['Periode pengisian', tanggal(m.tanggal_pengisian.awal) + ' sampai ' + tanggal(m.tanggal_pengisian.akhir)],
    ['Skala penilaian', m.skala],
    ['Pengolahan data', m.pembersihan.aturan_isian_ganda],
    ['Privasi', m.catatan_privasi]
  ];
  const dl = document.getElementById('daftar-sumber');
  dl.replaceChildren();
  baris.forEach(([k, v]) => dl.append(buat('dt', '', k), buat('dd', '', v)));
}

// ----- Alur utama -----
function tampilkanGrafik(d) {
  if (typeof Chart === 'undefined' || typeof buatGrafik !== 'function') {
    document.querySelectorAll('.chart-box').forEach(box => {
      box.replaceChildren(buat('p', 'chart-error', 'Grafik tidak dapat dimuat. Periksa koneksi internet, lalu muat ulang halaman.'));
    });
    return;
  }
  buatGrafik(d);
}

async function muatData() {
  elError.hidden = true;
  elKonten.hidden = true;
  elLoading.hidden = false;
  try {
    const respons = await fetch(URL_DATA);
    if (!respons.ok) throw new Error('Status ' + respons.status);
    const d = await respons.json();

    tampilkanStatistik(d);
    tampilkanDaftarButir(d);
    tampilkanTemuan(d);
    tampilkanAnalisis(d);
    tampilkanSumber(d);
    elLoading.hidden = true;
    elKonten.hidden = false;   // tampilkan dulu agar ukuran canvas benar
    tampilkanGrafik(d);
  } catch (galat) {
    console.error('Gagal memuat data:', galat);
    elLoading.hidden = true;
    elError.hidden = false;
  }
}

document.getElementById('btn-ulang').addEventListener('click', muatData);
muatData();
