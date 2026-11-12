// EnergyCare - grafik Chart.js. Semua nilai dibaca dari objek data JSON.
let grafikKategori = null;
let grafikButir = null;

const WARNA_KATEGORI = {
  'Sangat Baik': '#1D5A40',
  'Baik': '#A8BEA0',
  'Cukup': '#DCE9B8',
  'Kurang': '#C9A66B'
};
const WARNA_TERTINGGI = '#1D5A40';
const WARNA_TERENDAH = '#C9A66B';
const WARNA_LAIN = '#A8BEA0';

// Pecah teks panjang menjadi beberapa baris agar tooltip tidak terpotong
function bungkusTeks(teks, maks = 32) {
  const baris = [];
  let sekarang = '';
  teks.split(' ').forEach(kata => {
    if ((sekarang + ' ' + kata).trim().length > maks) {
      baris.push(sekarang);
      sekarang = kata;
    } else {
      sekarang = (sekarang + ' ' + kata).trim();
    }
  });
  if (sekarang) baris.push(sekarang);
  return baris;
}

function buatGrafik(d) {
  Chart.defaults.font.family = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
  Chart.defaults.color = '#20352A';
  buatGrafikKategori(d);
  buatGrafikButir(d);
}

function buatGrafikKategori(d) {
  const nama = Object.keys(d.ringkasan.kategori);
  const jumlah = nama.map(n => d.ringkasan.kategori[n]);
  const persen = nama.map(n => d.ringkasan.kategori_persen[n]);
  if (grafikKategori) grafikKategori.destroy();

  grafikKategori = new Chart(document.getElementById('grafik-kategori'), {
    type: 'doughnut',
    data: {
      labels: nama,
      datasets: [{
        data: jumlah,
        backgroundColor: nama.map(n => WARNA_KATEGORI[n] || '#999'),
        borderColor: '#FFFFFF',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 18, usePointStyle: true, pointStyle: 'rectRounded' } },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + ctx.label + ': ' + ctx.parsed + ' siswa (' +
              persen[ctx.dataIndex].toFixed(1).replace('.', ',') + '%)'
          }
        }
      }
    }
  });
}

function buatGrafikButir(d) {
  const butir = d.per_butir;
  const kodeTertinggi = d.ringkasan.sorotan.butir_tertinggi.map(b => b.kode);
  const kodeTerendah = d.ringkasan.sorotan.butir_terendah.map(b => b.kode);
  const warna = butir.map(b =>
    kodeTertinggi.includes(b.kode) ? WARNA_TERTINGGI :
    kodeTerendah.includes(b.kode) ? WARNA_TERENDAH : WARNA_LAIN);
  if (grafikButir) grafikButir.destroy();

  grafikButir = new Chart(document.getElementById('grafik-butir'), {
    type: 'bar',
    data: {
      labels: butir.map(b => b.kode),
      datasets: [{
        label: 'Rata-rata skor',
        data: butir.map(b => b.rata_rata),
        backgroundColor: warna,
        borderRadius: 8,
        barThickness: 22
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 1,
          max: 4,
          ticks: { stepSize: 0.5, callback: v => String(v).replace('.', ',') },
          grid: { color: 'rgba(18,61,44,.08)' },
          title: { display: true, text: 'Rata-rata skor (skala 1 sampai 4)' }
        },
        y: { grid: { display: false }, ticks: { font: { weight: '700' } } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => {
              const b = butir[items[0].dataIndex];
              return bungkusTeks(b.kode + ': ' + b.label);
            },
            label: ctx => ' Rata-rata skor: ' + ctx.parsed.x.toFixed(2).replace('.', ',')
          }
        }
      }
    }
  });
}
