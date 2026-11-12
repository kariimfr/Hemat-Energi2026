// EnergyCare - skrip bersama: menu mobile dan penanda halaman aktif
const tombol = document.querySelector('.nav-toggle');
const menu = document.querySelector('.nav-menu');

tombol.addEventListener('click', () => {
  const terbuka = menu.classList.toggle('open');
  tombol.setAttribute('aria-expanded', terbuka);
  tombol.setAttribute('aria-label', terbuka ? 'Tutup menu' : 'Buka menu');
});

// Tombol Escape menutup menu
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.classList.contains('open')) {
    menu.classList.remove('open');
    tombol.setAttribute('aria-expanded', 'false');
    tombol.setAttribute('aria-label', 'Buka menu');
    tombol.focus();
  }
});

// Tutup menu setelah tautan diklik (untuk mobile)
menu.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    menu.classList.remove('open');
    tombol.setAttribute('aria-expanded', 'false');
  })
);

// Tandai tautan halaman yang sedang dibuka
const halaman = location.pathname.split('/').pop() || 'index.html';
menu.querySelectorAll('a:not(.btn)').forEach(a => {
  if (a.getAttribute('href') === halaman) {
    a.classList.add('active');
    a.setAttribute('aria-current', 'page');
  }
});

// ===== Tantangan 7 hari (hanya berjalan di aksi.html) =====
const daftar = document.querySelector('.check-list');
if (daftar) {
  const KUNCI = 'energycare-tantangan-7-hari';
  const kotak = daftar.querySelectorAll('input[type="checkbox"]');
  const teks = document.getElementById('progress-text');
  const isi = document.getElementById('progress-fill');
  const bar = document.getElementById('progress-bar');
  const selesai = document.getElementById('challenge-done');
  const reset = document.getElementById('btn-reset');

  // Baca progres tersimpan (aman jika localStorage tidak tersedia)
  function baca() {
    try { return JSON.parse(localStorage.getItem(KUNCI)) || []; }
    catch (e) { return []; }
  }
  function simpan() {
    const terpilih = [...kotak].filter(k => k.checked).map(k => k.id);
    try { localStorage.setItem(KUNCI, JSON.stringify(terpilih)); } catch (e) {}
  }
  function perbarui() {
    const jumlah = [...kotak].filter(k => k.checked).length;
    teks.textContent = jumlah + ' dari ' + kotak.length + ' hari selesai';
    isi.style.width = (jumlah / kotak.length * 100) + '%';
    bar.setAttribute('aria-valuenow', jumlah);
    selesai.classList.toggle('show', jumlah === kotak.length);
  }

  const tersimpan = baca();
  kotak.forEach(k => {
    k.checked = tersimpan.includes(k.id);
    k.addEventListener('change', () => { simpan(); perbarui(); });
  });
  reset.addEventListener('click', () => {
    kotak.forEach(k => (k.checked = false));
    simpan(); perbarui();
  });
  perbarui();
}

// ===== Statistik ringkas di Beranda (hanya berjalan di index.html) =====
const wadahStat = document.getElementById('beranda-stat');
if (wadahStat) {
  const koma = (n, d) => Number(n).toFixed(d).replace('.', ',');
  fetch('data/data-perilaku-energi.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
      const m = d.meta, r = d.ringkasan, top = r.sorotan.butir_tertinggi[0];
      const item = [
        [Number(m.jumlah_responden).toLocaleString('id-ID'), 'siswa kelas XI mengisi kuesioner'],
        [koma(m.persen_partisipasi, 1) + '%', 'partisipasi dari ' + Number(m.jumlah_siswa_terdata).toLocaleString('id-ID') + ' siswa terdata'],
        [koma(r.rata_rata_skor, 2) + ' dari 4', 'rata-rata skor perilaku hemat energi'],
        [koma(r.kategori_persen['Sangat Baik'], 1) + '%', 'siswa berada pada kategori Sangat Baik']
      ];
      wadahStat.replaceChildren(...item.map(([nilai, label]) => {
        const k = document.createElement('div'); k.className = 'stat';
        const v = document.createElement('div'); v.className = 'stat-value'; v.textContent = nilai;
        const l = document.createElement('div'); l.className = 'stat-label'; l.textContent = label;
        k.append(v, l); return k;
      }));
      const t = document.getElementById('beranda-temuan');
      if (t) t.textContent = top.label + ' (' + top.kode + ') memperoleh nilai tertinggi, yaitu ' + koma(top.rata_rata, 2) + ' dari 4.';
    })
    .catch(() => {
      wadahStat.replaceChildren();
      const p = document.createElement('p');
      p.textContent = 'Statistik survei belum dapat dimuat. Buka halaman Data & Fakta untuk melihat hasilnya.';
      wadahStat.appendChild(p);
    });
}
