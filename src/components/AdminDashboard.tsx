'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRw10 } from '@/context/Rw10Context';
import {
  BERITA_CATEGORIES,
  DEFAULT_BERITA_IMG,
  RT_LIST,
  UMKM_CATEGORIES,
} from '@/lib/defaultData';
import { formatRupiah, sanitizeWa, triggerCsvDownload } from '@/lib/utils';
import { AdminTab, BidangItem, RtKey } from '@/types/rw10';

export default function AdminDashboard() {
  const {
    session,
    setSession,
    setViewMode,
    adminTab,
    setAdminTab,
    warga,
    setWarga,
    surat,
    setSurat,
    aduan,
    setAduan,
    keuangan,
    setKeuangan,
    pengurusRw,
    setPengurusRw,
    pengurusRt,
    setPengurusRt,
    berita,
    setBerita,
    umkm,
    setUmkm,
    heroBg,
    setHeroBg,
    cctv,
    setCctv,
    openModal,
    openWargaFormModal,
    openDeleteWargaModal,
    openPrintLetterModal,
    downloadSuratDocx,
    showToast,
  } = useRw10();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tab 2: Warga Filters
  const [wargaSearch, setWargaSearch] = useState('');
  const [wargaFilterRt, setWargaFilterRt] = useState<string>('ALL');
  const [wargaFilterHunian, setWargaFilterHunian] = useState<string>('ALL');
  const [wargaFilterStatus, setWargaFilterStatus] = useState<string>('ALL');
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 4: Aduan tanggapan drafts
  const [tanggapanDrafts, setTanggapanDrafts] = useState<Record<string, string>>({});

  // Tab 5: Keuangan form
  const [trxTanggal, setTrxTanggal] = useState(() => new Date().toISOString().split('T')[0]);
  const [trxKeterangan, setTrxKeterangan] = useState('');
  const [trxTipe, setTrxTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [trxNominal, setTrxNominal] = useState('');

  // Tab 6: Pengurus RW form
  const [rwForm, setRwForm] = useState(pengurusRw);

  // Tab 7: Pengurus RT form
  const [selectedRtKey, setSelectedRtKey] = useState<RtKey>('RT 01');
  const [rtForm, setRtForm] = useState(pengurusRt['RT 01']);

  // Tab 8: Konten (Berita & UMKM)
  const [beritaJudul, setBeritaJudul] = useState('');
  const [beritaKategori, setBeritaKategori] = useState('Kegiatan Warga');
  const [beritaPenulis, setBeritaPenulis] = useState('Pengurus RW 10');
  const [beritaFotoData, setBeritaFotoData] = useState('');
  const [beritaFotoUrl, setBeritaFotoUrl] = useState('');
  const [beritaCaption, setBeritaCaption] = useState('');
  const [beritaIsi, setBeritaIsi] = useState('');
  const [editingBeritaId, setEditingBeritaId] = useState<string | null>(null);

  const [umkmNama, setUmkmNama] = useState('');
  const [umkmKategori, setUmkmKategori] = useState('Kuliner');
  const [umkmPemilik, setUmkmPemilik] = useState('');
  const [umkmWa, setUmkmWa] = useState('');
  const [umkmDeskripsi, setUmkmDeskripsi] = useState('');
  const [editingUmkmId, setEditingUmkmId] = useState<string | null>(null);
  const [cctvForm, setCctvForm] = useState(cctv);

  const isRt = session?.role === 'RT';
  const scopeRt = isRt ? session?.rtScope : null;

  const logoutAdmin = () => {
    setSession(null);
    setViewMode('public');
    showToast('Anda telah keluar dari Dashboard Pengurus.', 'info');
  };

  // Dashboard Metrics
  const dashboardStats = useMemo(() => {
    const aktif = warga.filter((w) => w.status === 'Aktif');
    const scopedWarga = scopeRt ? aktif.filter((w) => w.rt === scopeRt) : aktif;
    const uniqueKk = new Set(scopedWarga.map((w) => w.idRumah).filter(Boolean));
    const scopedSurat = scopeRt ? surat.filter((s) => s.rt === scopeRt) : surat;
    const menungguSurat = scopedSurat.filter((s) => s.status.includes('Menunggu')).length;
    const aduanAktif = aduan.filter((a) => a.status !== 'Selesai').length;
    const saldo = keuangan.reduce(
      (acc, t) => acc + (t.tipe === 'masuk' ? Number(t.nominal) : -Number(t.nominal)),
      0
    );
    const maxRtCount = Math.max(
      1,
      ...RT_LIST.map((r) => aktif.filter((w) => w.rt === r).length)
    );
    return {
      aktif,
      scopedWarga,
      uniqueKk: uniqueKk.size,
      scopedSurat,
      menungguSurat,
      aduanAktif,
      saldo,
      maxRtCount,
    };
  }, [warga, surat, aduan, keuangan, scopeRt]);

  // Filtered Warga
  const filteredWarga = useMemo(() => {
    const q = wargaSearch.trim().toLowerCase();
    return warga.filter((w) => {
      if (scopeRt && w.rt !== scopeRt) return false;
      if (!scopeRt && wargaFilterRt !== 'ALL' && w.rt !== wargaFilterRt) return false;
      if (wargaFilterHunian !== 'ALL' && w.hunian !== wargaFilterHunian) return false;
      if (wargaFilterStatus !== 'ALL' && w.status !== wargaFilterStatus) return false;
      if (q) {
        const match =
          w.nama.toLowerCase().includes(q) ||
          (w.idWarga || '').toLowerCase().includes(q) ||
          (w.idRumah || '').toLowerCase().includes(q) ||
          w.blok.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [warga, scopeRt, wargaFilterRt, wargaFilterHunian, wargaFilterStatus, wargaSearch]);

  const wargaSummary = useMemo(() => {
    const kk = new Set(filteredWarga.map((w) => w.idRumah).filter(Boolean)).size;
    const tetap = filteredWarga.filter((w) => w.hunian === 'Warga Tetap').length;
    return {
      jiwa: filteredWarga.length,
      kk,
      tetap,
      kontrak: filteredWarga.length - tetap,
    };
  }, [filteredWarga]);

  const handleDownloadCsvTemplate = () => {
    const header =
      'IDWarga,IDRumah,Nama,JenisKelamin,TanggalLahir,RT,Blok,StatusHunian,StatusKeluarga,NoWA,StatusKependudukan\n';
    const sample =
      'RW10-01A99-01,RW10-01A99,Contoh Warga,Laki-laki,1990-01-01,RT 01,Blok A-99,Warga Tetap,Kepala Keluarga,6281234567890,Aktif\n';
    triggerCsvDownload(header + sample, 'template_data_warga_rw10.csv');
    showToast('Template CSV berhasil diunduh.', 'success');
  };

  const handleExportWargaCsv = () => {
    if (filteredWarga.length === 0) {
      showToast('Tidak ada data warga untuk diekspor.', 'info');
      return;
    }
    const header =
      'IDWarga,IDRumah,Nama,JenisKelamin,TanggalLahir,RT,Blok,StatusHunian,StatusKeluarga,NoWA,StatusKependudukan\n';
    const rows = filteredWarga
      .map((w) =>
        [
          w.idWarga,
          w.idRumah,
          w.nama,
          w.jk,
          w.tgllahir,
          w.rt,
          w.blok,
          w.hunian,
          w.keluarga,
          w.wa,
          w.status,
        ]
          .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    triggerCsvDownload(
      header + rows,
      `data_warga_rw10_${new Date().toISOString().split('T')[0]}.csv`
    );
    showToast(`${filteredWarga.length} data warga berhasil diekspor ke CSV.`, 'success');
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || '');
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          showToast('File CSV kosong atau tidak memiliki baris data.', 'error');
          return;
        }
        const nextList = [...warga];
        let added = 0;
        let updated = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length < 7 || !cols[0]) continue;
          const rowRt = isRt && session?.rtScope ? session.rtScope : cols[5] || 'RT 01';
          const item = {
            id: 'WRG-' + Date.now().toString().slice(-5) + i,
            idWarga: cols[0].toUpperCase(),
            idRumah: (cols[1] || '').toUpperCase(),
            nama: cols[2] || 'Warga Baru',
            jk: cols[3] || 'Laki-laki',
            tgllahir: cols[4] || '',
            rt: rowRt,
            blok: cols[6] || '-',
            hunian: cols[7] || 'Warga Tetap',
            keluarga: cols[8] || 'Kepala Keluarga',
            wa: cols[9] ? sanitizeWa(cols[9]) : '',
            status: cols[10] || 'Aktif',
          };
          const existIdx = nextList.findIndex(
            (w) => (w.idWarga || '').toUpperCase() === item.idWarga
          );
          if (existIdx > -1) {
            item.id = nextList[existIdx].id;
            nextList[existIdx] = item;
            updated++;
          } else {
            nextList.unshift(item);
            added++;
          }
        }
        setWarga(nextList);
        showToast(`Import CSV berhasil: ${added} warga baru, ${updated} diperbarui.`, 'success');
      } catch {
        showToast('Gagal memproses file CSV.', 'error');
      }
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const updateSuratStatus = (kode: string, newStatus: string) => {
    setSurat(surat.map((s) => (s.kode === kode ? { ...s, status: newStatus } : s)));
    showToast(`Status surat ${kode}: ${newStatus}`, 'success');
  };

  const saveAduanTanggapan = (id: string) => {
    const note = (tanggapanDrafts[id] || '').trim();
    setAduan(aduan.map((a) => (a.id === id ? { ...a, tanggapan: note } : a)));
    showToast('Catatan tanggapan pengurus disimpan.', 'success');
  };

  const updateAduanStatus = (id: string, newStatus: string) => {
    setAduan(aduan.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    showToast(`Status pengaduan diperbarui: ${newStatus}`, 'success');
  };

  const handleExportKasCsv = () => {
    if (keuangan.length === 0) {
      showToast('Belum ada data kas untuk diekspor.', 'info');
      return;
    }
    const header = 'Tanggal,Keterangan,Tipe,Nominal\n';
    const rows = keuangan
      .map(
        (t) =>
          `"${t.tanggal}","${t.keterangan.replace(/"/g, '""')}","${t.tipe}","${t.nominal}"`
      )
      .join('\n');
    triggerCsvDownload(
      header + rows,
      `laporan_kas_rw10_${new Date().toISOString().split('T')[0]}.csv`
    );
    showToast('Laporan kas berhasil diekspor.', 'success');
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrx = {
      id: 'TRX-' + Date.now(),
      tanggal: trxTanggal,
      keterangan: trxKeterangan.trim(),
      tipe: trxTipe,
      nominal: Number(trxNominal),
    };
    setKeuangan([newTrx, ...keuangan]);
    setTrxKeterangan('');
    setTrxNominal('');
    showToast('Transaksi kas baru berhasil dicatat.', 'success');
  };

  const handleUploadHeroBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '');
      try {
        setHeroBg(dataUrl);
        showToast('Foto latar beranda berhasil diperbarui!', 'success');
      } catch {
        showToast('Ukuran gambar terlalu besar untuk browser storage.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBeritaFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.72);
        setBeritaFotoData(compressed);
        setBeritaFotoUrl('');
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleAddBerita = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = editingBeritaId ? berita.find((b) => b.id === editingBeritaId) : null;
    const payload = {
      id: editingBeritaId || 'BRT-' + Date.now(),
      tanggal: existing?.tanggal || new Date().toISOString().split('T')[0],
      kategori: beritaKategori,
      penulis: beritaPenulis.trim() || 'Pengurus RW 10',
      foto: beritaFotoData || beritaFotoUrl.trim() || DEFAULT_BERITA_IMG,
      caption: beritaCaption.trim(),
      judul: beritaJudul.trim(),
      isi: beritaIsi.trim(),
    };
    const nextList = editingBeritaId
      ? berita.map((b) => (b.id === editingBeritaId ? payload : b))
      : [payload, ...berita];
    const ok = setBerita(nextList);
    if (!ok) {
      showToast('Penyimpanan browser penuh. Hapus berita lama atau gunakan URL foto.', 'error');
      return;
    }
    setEditingBeritaId(null);
    setBeritaJudul('');
    setBeritaFotoData('');
    setBeritaFotoUrl('');
    setBeritaCaption('');
    setBeritaIsi('');
    showToast(
      editingBeritaId ? 'Berita berhasil diperbarui!' : 'Berita kegiatan berhasil dipublikasikan!',
      'success'
    );
  };

  const handleAddUmkm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editingUmkmId || 'UMKM-' + Date.now(),
      nama: umkmNama.trim(),
      kategori: umkmKategori,
      pemilik: umkmPemilik.trim(),
      wa: sanitizeWa(umkmWa),
      deskripsi: umkmDeskripsi.trim(),
    };
    if (editingUmkmId) {
      setUmkm(umkm.map((u) => (u.id === editingUmkmId ? payload : u)));
      showToast('Data UMKM berhasil diperbarui.', 'success');
    } else {
      setUmkm([payload, ...umkm]);
      showToast('UMKM berhasil ditambahkan ke direktori.', 'success');
    }
    setEditingUmkmId(null);
    setUmkmNama('');
    setUmkmPemilik('');
    setUmkmWa('');
    setUmkmDeskripsi('');
  };

  const navBtnClass = (tab: AdminTab) =>
    adminTab === tab
      ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white shadow transition'
      : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition';

  const selectTab = (tab: AdminTab) => {
    setAdminTab(tab);
    setSidebarOpen(false);
  };

  const beritaPreviewSrc = beritaFotoData || beritaFotoUrl.trim();

  return (
    <div id="admin-view" className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Admin Topbar */}
      <div className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-slate-800 transition"
            aria-label="Toggle Sidebar"
          >
            <i className="fa-solid fa-bars text-lg" />
          </button>
          <div className="leading-tight">
            <span className="font-extrabold text-sm block">Dashboard RW 10</span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {session?.label || 'Pengurus RW'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={logoutAdmin}
          className="px-2.5 py-1 rounded-lg bg-rose-600/30 text-rose-300 text-xs font-semibold hover:bg-rose-600 hover:text-white transition"
        >
          <i className="fa-solid fa-right-from-bracket" /> Keluar
        </button>
      </div>

      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Responsive Admin Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col transform transition-transform duration-200 shrink-0 border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md">
              <i className="fa-solid fa-shield-halved text-base" />
            </div>
            <div className="leading-tight">
              <h2 className="font-black text-white text-sm tracking-tight">Panel Pengurus</h2>
              <p className="text-xs text-emerald-400 font-semibold">
                {session?.label || 'Pengurus RW 10'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Akses Wilayah:</span>
            <span className="font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60">
              {scopeRt ? `Khusus ${scopeRt}` : 'Seluruh Wilayah RW 10'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            type="button"
            onClick={() => selectTab('dashboard')}
            className={navBtnClass('dashboard')}
          >
            <i className="fa-solid fa-gauge-high w-5 text-center text-emerald-400" /> Dashboard Utama
          </button>
          <button type="button" onClick={() => selectTab('warga')} className={navBtnClass('warga')}>
            <i className="fa-solid fa-users w-5 text-center text-sky-400" /> Data Kependudukan
          </button>
          <button type="button" onClick={() => selectTab('surat')} className={navBtnClass('surat')}>
            <i className="fa-solid fa-file-signature w-5 text-center text-teal-400" /> Verifikasi
            Surat
          </button>
          <button
            type="button"
            onClick={() => selectTab('pengaduan')}
            className={navBtnClass('pengaduan')}
          >
            <i className="fa-solid fa-bullhorn w-5 text-center text-amber-400" /> Pengaduan Warga
          </button>

          {!isRt && (
            <>
              <button
                type="button"
                onClick={() => selectTab('keuangan')}
                className={navBtnClass('keuangan')}
              >
                <i className="fa-solid fa-wallet w-5 text-center text-emerald-400" /> Keuangan Kas
                RW
              </button>

              <div className="pt-3 pb-1 px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Tata Kelola &amp; Konten
              </div>
              <button
                type="button"
                onClick={() => selectTab('pengurus-rw')}
                className={navBtnClass('pengurus-rw')}
              >
                <i className="fa-solid fa-sitemap w-5 text-center text-indigo-400" /> Pengurus RW
                &amp; Bidang
              </button>
              <button
                type="button"
                onClick={() => selectTab('pengurus-rt')}
                className={navBtnClass('pengurus-rt')}
              >
                <i className="fa-solid fa-people-roof w-5 text-center text-purple-400" /> Pengurus RT
                (01 - 05)
              </button>
              <button
                type="button"
                onClick={() => selectTab('konten')}
                className={navBtnClass('konten')}
              >
                <i className="fa-solid fa-newspaper w-5 text-center text-rose-400" /> Berita, Agenda
                &amp; UMKM
              </button>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setViewMode('public')}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <i className="fa-solid fa-globe" /> Lihat Portal Publik
          </button>
          <button
            type="button"
            onClick={logoutAdmin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition"
          >
            <i className="fa-solid fa-right-from-bracket" /> Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Admin Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden space-y-6">
        {/* TAB 1: DASHBOARD */}
        {adminTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Dashboard Utama</h1>
                <p className="text-sm text-slate-500">
                  {isRt
                    ? `Ringkasan kependudukan dan operasional khusus wilayah ${scopeRt} RW 10 Permata Hijau.`
                    : 'Ringkasan menyeluruh demografi dan pelayanan seluruh RW 10 Perumahan Permata Hijau.'}
                </p>
              </div>
              <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shrink-0 font-medium">
                <i className="fa-regular fa-clock mr-1 text-emerald-600" /> Pembaruan Real-Time
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-500">Warga Aktif</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <i className="fa-solid fa-users" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">
                  {dashboardStats.scopedWarga.length}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Jiwa terdata aktif</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-500">Total KK Unik</span>
                  <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                    <i className="fa-solid fa-house-user" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{dashboardStats.uniqueKk}</p>
                <p className="text-[11px] text-slate-400 mt-1">Kepala Keluarga aktif</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-500">Surat Menunggu</span>
                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <i className="fa-solid fa-envelope-open-text" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{dashboardStats.menungguSurat}</p>
                <p className="text-[11px] text-slate-400 mt-1">Perlu tindakan</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Pengaduan Aktif
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <i className="fa-solid fa-triangle-exclamation" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{dashboardStats.aduanAktif}</p>
                <p className="text-[11px] text-slate-400 mt-1">Belum terselesaikan</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-500">Saldo Kas RW</span>
                  <div className="w-9 h-9 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <i className="fa-solid fa-vault" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-700">
                  {formatRupiah(dashboardStats.saldo)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Kas operasional</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-chart-column text-emerald-600" /> Rekap Kependudukan
                    per RT (01 - 05)
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">Jiwa &amp; KK</span>
                </div>
                <div className="space-y-3.5">
                  {RT_LIST.map((rtKey) => {
                    const rtWarga = dashboardStats.aktif.filter((w) => w.rt === rtKey);
                    const rtKk = new Set(rtWarga.map((w) => w.idRumah).filter(Boolean)).size;
                    const pct = Math.round((rtWarga.length / dashboardStats.maxRtCount) * 100);
                    return (
                      <div key={rtKey}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-800">
                            {rtKey}{' '}
                            {scopeRt === rtKey && (
                              <span className="text-emerald-700 font-extrabold">
                                (Wilayah Anda)
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500">
                            {rtWarga.length} Jiwa • {rtKk} KK
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              scopeRt === rtKey ? 'bg-emerald-600' : 'bg-emerald-500'
                            } rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left text-emerald-600" /> Aktivitas
                    Permohonan &amp; Aduan Terbaru
                  </h3>
                  <button
                    type="button"
                    onClick={() => selectTab('surat')}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Kelola Surat &rarr;
                  </button>
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  {dashboardStats.scopedSurat.slice(0, 4).map((s) => (
                    <div key={s.kode} className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800 text-xs sm:text-sm">
                          {s.nama}{' '}
                          <span className="font-normal text-slate-500">({s.jenis})</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {s.kode} • {s.rt} • {s.tanggal}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          s.status.includes('Disetujui')
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status.includes('Ditolak')
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                  {dashboardStats.scopedSurat.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-400">
                      Belum ada aktivitas surat terbaru.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATA WARGA */}
        {adminTab === 'warga' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  Database Kependudukan Warga
                </h1>
                <p className="text-sm text-slate-500">
                  Database kependudukan berbasis ID Warga &amp; ID Rumah (Zero-NIK, aman
                  perlindungan data pribadi).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openWargaFormModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow transition inline-flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-user-plus" /> Tambah Warga
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <i className="fa-solid fa-file-csv text-emerald-600" /> Template CSV
                </button>
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs sm:text-sm font-semibold transition inline-flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-file-import" /> Import CSV
                </button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleImportCsv}
                />
                <button
                  type="button"
                  onClick={handleExportWargaCsv}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition inline-flex items-center gap-1.5 shadow"
                >
                  <i className="fa-solid fa-file-export" /> Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <p className="text-[11px] font-bold uppercase text-slate-500">Total Jiwa (Filter)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{wargaSummary.jiwa}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <p className="text-[11px] font-bold uppercase text-slate-500">Total KK Terdata</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{wargaSummary.kk}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <p className="text-[11px] font-bold uppercase text-slate-500">Warga Tetap</p>
                <p className="text-2xl font-black text-sky-700 mt-1">{wargaSummary.tetap}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
                <p className="text-[11px] font-bold uppercase text-slate-500">Kontrak / Kos</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{wargaSummary.kontrak}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-5 relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={wargaSearch}
                    onChange={(e) => setWargaSearch(e.target.value)}
                    placeholder="Cari Nama, ID Warga, ID Rumah, atau Blok..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {!isRt && (
                  <div className="lg:col-span-2">
                    <select
                      value={wargaFilterRt}
                      onChange={(e) => setWargaFilterRt(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="ALL">Semua RT</option>
                      {RT_LIST.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="lg:col-span-2">
                  <select
                    value={wargaFilterHunian}
                    onChange={(e) => setWargaFilterHunian(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="ALL">Semua Hunian</option>
                    <option value="Warga Tetap">Warga Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Kos">Kos</option>
                  </select>
                </div>
                <div className={isRt ? 'lg:col-span-5' : 'lg:col-span-3'}>
                  <select
                    value={wargaFilterStatus}
                    onChange={(e) => setWargaFilterStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="ALL">Semua Status Kependudukan</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Pindah">Pindah</option>
                    <option value="Meninggal">Meninggal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Nama Lengkap &amp; Identitas</th>
                      <th className="py-3.5 px-4">ID Warga / ID Rumah</th>
                      <th className="py-3.5 px-4">Domisili &amp; Status Hunian</th>
                      <th className="py-3.5 px-4">Peran Keluarga &amp; Kontak</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWarga.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ada data warga yang sesuai filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredWarga.map((w) => {
                        const statusBadge =
                          w.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'Pindah'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700';
                        const hunianBadge =
                          w.hunian === 'Warga Tetap'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-purple-100 text-purple-800';
                        return (
                          <tr key={w.id} className="hover:bg-slate-50 transition">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{w.nama}</p>
                              <p className="text-xs text-slate-500">
                                {w.jk} • Lahir: {w.tgllahir || '-'}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs">
                              <p className="text-emerald-800 font-bold">{w.idWarga}</p>
                              <p className="text-slate-500">Rumah: {w.idRumah}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-800">
                                {w.rt} • {w.blok}
                              </p>
                              <span
                                className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${hunianBadge}`}
                              >
                                {w.hunian}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs">
                              <p className="font-semibold text-slate-700">{w.keluarga}</p>
                              <p className="text-slate-500">
                                {w.wa ? (
                                  <>
                                    <i className="fa-brands fa-whatsapp text-emerald-600 mr-1" />
                                    {w.wa}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge}`}
                              >
                                {w.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                              <button
                                type="button"
                                onClick={() => openWargaFormModal(w.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition"
                                title="Edit Data"
                              >
                                <i className="fa-solid fa-pen-to-square" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteWargaModal(w.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                                title="Hapus Data"
                              >
                                <i className="fa-solid fa-trash-can" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VERIFIKASI SURAT */}
        {adminTab === 'surat' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Verifikasi &amp; Cetak Surat Resmi
              </h1>
              <p className="text-sm text-slate-500">
                Alur berjenjang: <b>Pemohon</b> &rarr; <b>Verifikasi Ketua RT</b> &rarr;{' '}
                <b>Pengesahan Ketua RW</b> &rarr; <b>Cetak PDF / Word (.docx)</b>.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Kode &amp; Tanggal</th>
                      <th className="py-3.5 px-4">Pemohon</th>
                      <th className="py-3.5 px-4">Jenis &amp; Keperluan</th>
                      <th className="py-3.5 px-4">Status Alur</th>
                      <th className="py-3.5 px-4 text-right">Tindakan &amp; Unduh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardStats.scopedSurat.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada permohonan surat.
                        </td>
                      </tr>
                    ) : (
                      dashboardStats.scopedSurat.map((s) => {
                        const matchedWarga = warga.find(
                          (w) =>
                            (w.idWarga || '').toUpperCase() === (s.idWarga || '').toUpperCase()
                        );
                        const statusClass = s.status.includes('Disetujui')
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status.includes('Ditolak')
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800';
                        const waText = `Halo ${s.nama}, permohonan ${s.jenis} (${s.kode}) Anda di RW 10 Permata Hijau telah DISETUJUI dan siap dicetak/diambil.`;
                        const waLink = `https://wa.me/${sanitizeWa(
                          s.wa
                        )}?text=${encodeURIComponent(waText)}`;

                        return (
                          <tr key={s.kode} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <p className="font-mono font-black text-emerald-800 text-xs">
                                {s.kode}
                              </p>
                              <p className="text-[11px] text-slate-400">{s.tanggal}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">
                                {s.nama}{' '}
                                <span className="text-xs font-bold text-emerald-700">({s.rt})</span>
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                ID: {s.idWarga || '-'}
                              </p>
                              {matchedWarga ? (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <i className="fa-solid fa-check-double mr-0.5" />
                                  Terdata di DB ({matchedWarga.blok})
                                </span>
                              ) : (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                                  Belum di DB
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <p className="font-bold text-slate-800 text-xs">{s.jenis}</p>
                              <p className="text-xs text-slate-500 line-clamp-2">{s.keperluan}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                              {s.status === 'Menunggu Verifikasi RT' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSuratStatus(s.kode, 'Menunggu Pengesahan RW')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
                                >
                                  Verifikasi RT
                                </button>
                              )}
                              {s.status === 'Menunggu Pengesahan RW' && !isRt && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSuratStatus(s.kode, 'Disetujui & Siap Cetak')
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                                >
                                  Sahkan RW
                                </button>
                              )}
                              {s.status === 'Disetujui & Siap Cetak' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openPrintLetterModal(s.kode)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-sm"
                                    title="Pratinjau & Cetak PDF"
                                  >
                                    <i className="fa-solid fa-print" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadSuratDocx(s.kode)}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                                    title="Unduh File .docx (Word)"
                                  >
                                    <i className="fa-solid fa-file-word" />
                                  </button>
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-block transition shadow-sm"
                                    title="Kirim WA ke Pemohon"
                                  >
                                    <i className="fa-brands fa-whatsapp" />
                                  </a>
                                </>
                              )}
                              {!s.status.includes('Disetujui') &&
                                !s.status.includes('Ditolak') && (
                                  <button
                                    type="button"
                                    onClick={() => updateSuratStatus(s.kode, 'Ditolak')}
                                    className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition"
                                    title="Tolak"
                                  >
                                    <i className="fa-solid fa-xmark" />
                                  </button>
                                )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PENGADUAN WARGA */}
        {adminTab === 'pengaduan' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Pengaduan &amp; Aspirasi Warga</h1>
              <p className="text-sm text-slate-500">
                Pantau keluhan lingkungan warga, perbarui status tindakan, dan simpan catatan
                tanggapan resmi.
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Tanggal &amp; Pelapor</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Uraian Aduan &amp; Tanggapan Pengurus</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aduan.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada pengaduan warga.
                        </td>
                      </tr>
                    ) : (
                      aduan.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 align-top">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-bold text-slate-900">{a.nama}</p>
                            <p className="text-xs text-slate-400 font-mono">{a.tanggal}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              {a.kategori}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 min-w-[240px] space-y-2">
                            <p className="text-xs text-slate-700 leading-relaxed">{a.deskripsi}</p>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={tanggapanDrafts[a.id] ?? a.tanggapan ?? ''}
                                onChange={(e) =>
                                  setTanggapanDrafts((prev) => ({
                                    ...prev,
                                    [a.id]: e.target.value,
                                  }))
                                }
                                placeholder="Tulis catatan tindakan pengurus..."
                                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => saveAduanTanggapan(a.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm"
                              >
                                Simpan
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={a.status}
                              onChange={(e) => updateAduanStatus(a.id, e.target.value)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Baru">Baru</option>
                              <option value="Diproses">Diproses</option>
                              <option value="Selesai">Selesai</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <a
                              href={`https://wa.me/${sanitizeWa(a.wa)}?text=${encodeURIComponent(
                                `Halo ${a.nama}, terkait pengaduan Anda (${a.kategori}), status saat ini: ${a.status}${
                                  a.tanggapan ? `. Catatan pengurus: ${a.tanggapan}` : ''
                                }`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                            >
                              <i className="fa-brands fa-whatsapp" /> Balas WA
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KEUANGAN KAS RW */}
        {adminTab === 'keuangan' && !isRt && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Manajemen Kas RW 10</h1>
                <p className="text-sm text-slate-500">
                  Setiap mutasi kas tersinkronisasi otomatis dengan transparansi publik di beranda
                  portal.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportKasCsv}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 self-start"
              >
                <i className="fa-solid fa-file-csv" /> Unduh Rekap CSV
              </button>
            </div>

            <form
              onSubmit={handleAddTransaction}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4"
            >
              <h3 className="font-extrabold text-slate-900 text-base">Catat Transaksi Kas Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={trxTanggal}
                    onChange={(e) => setTrxTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Keterangan Transaksi
                  </label>
                  <input
                    type="text"
                    required
                    value={trxKeterangan}
                    onChange={(e) => setTrxKeterangan(e.target.value)}
                    placeholder="Cth: Iuran Warga RT 02 / Pembelian Obat Fogging"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jenis Transaksi
                  </label>
                  <select
                    value={trxTipe}
                    onChange={(e) => setTrxTipe(e.target.value as 'masuk' | 'keluar')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="masuk">Pemasukan (+)</option>
                    <option value="keluar">Pengeluaran (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={trxNominal}
                    onChange={(e) => setTrxNominal(e.target.value)}
                    placeholder="500000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition shadow flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-plus" /> Tambah Transaksi Kas
                </button>
              </div>
            </form>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Tanggal</th>
                      <th className="py-3.5 px-4">Keterangan</th>
                      <th className="py-3.5 px-4">Tipe</th>
                      <th className="py-3.5 px-4 text-right">Nominal</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {keuangan.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Belum ada transaksi kas.
                        </td>
                      </tr>
                    ) : (
                      keuangan.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                            {t.tanggal}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                            {t.keterangan}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                t.tipe === 'masuk'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {t.tipe === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-black whitespace-nowrap text-xs sm:text-sm ${
                              t.tipe === 'masuk' ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {t.tipe === 'masuk' ? '+' : '-'} {formatRupiah(t.nominal)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setKeuangan(keuangan.filter((item) => item.id !== t.id));
                                showToast('Transaksi kas dihapus.', 'info');
                              }}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1"
                            >
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: KELOLA PENGURUS RW */}
        {adminTab === 'pengurus-rw' && !isRt && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Kelola Pengurus RW 10</h1>
              <p className="text-sm text-slate-500">
                Perubahan otomatis terintegrasi ke <b>Struktur Organogram</b>,{' '}
                <b>Kontak Pengurus</b>, dan <b>Tanda Tangan Surat Resmi (PDF &amp; Word)</b>.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPengurusRw({
                  ketua: { nama: rwForm.ketua.nama.trim(), wa: sanitizeWa(rwForm.ketua.wa) },
                  sekretaris: {
                    nama: rwForm.sekretaris.nama.trim(),
                    wa: sanitizeWa(rwForm.sekretaris.wa),
                  },
                  bendahara: {
                    nama: rwForm.bendahara.nama.trim(),
                    wa: sanitizeWa(rwForm.bendahara.wa),
                  },
                  bidang: rwForm.bidang.filter((b) => b.bidang.trim() && b.koordinator.trim()),
                });
                showToast('Struktur Pengurus RW 10 berhasil disimpan!', 'success');
              }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <i className="fa-solid fa-user-tie text-emerald-600" /> Pengurus Inti RW 10
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-3 md:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Ketua RW 10
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Nama Lengkap Ketua RW
                        </label>
                        <input
                          type="text"
                          required
                          value={rwForm.ketua.nama}
                          onChange={(e) =>
                            setRwForm({
                              ...rwForm,
                              ketua: { ...rwForm.ketua, nama: e.target.value },
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          No. WhatsApp (628...)
                        </label>
                        <input
                          type="text"
                          required
                          value={rwForm.ketua.wa}
                          onChange={(e) =>
                            setRwForm({
                              ...rwForm,
                              ketua: { ...rwForm.ketua, wa: e.target.value },
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Sekretaris RW
                    </span>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={rwForm.sekretaris.nama}
                        onChange={(e) =>
                          setRwForm({
                            ...rwForm,
                            sekretaris: { ...rwForm.sekretaris, nama: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        No. WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={rwForm.sekretaris.wa}
                        onChange={(e) =>
                          setRwForm({
                            ...rwForm,
                            sekretaris: { ...rwForm.sekretaris, wa: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Bendahara RW
                    </span>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        required
                        value={rwForm.bendahara.nama}
                        onChange={(e) =>
                          setRwForm({
                            ...rwForm,
                            bendahara: { ...rwForm.bendahara, nama: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        No. WhatsApp
                      </label>
                      <input
                        type="text"
                        required
                        value={rwForm.bendahara.wa}
                        onChange={(e) =>
                          setRwForm({
                            ...rwForm,
                            bendahara: { ...rwForm.bendahara, wa: e.target.value },
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                    <i className="fa-solid fa-sitemap text-teal-600" /> Koordinator Bidang RW
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setRwForm({
                        ...rwForm,
                        bidang: [...rwForm.bidang, { bidang: '', koordinator: '' }],
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition inline-flex items-center gap-1"
                  >
                    <i className="fa-solid fa-plus" /> Tambah Bidang
                  </button>
                </div>
                <div className="space-y-3">
                  {rwForm.bidang.map((b: BidangItem, idx: number) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-2xl bg-slate-50 border border-slate-200"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Nama Seksi Bidang"
                          value={b.bidang}
                          onChange={(e) => {
                            const next = [...rwForm.bidang];
                            next[idx] = { ...next[idx], bidang: e.target.value };
                            setRwForm({ ...rwForm, bidang: next });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Nama Koordinator"
                          value={b.koordinator}
                          onChange={(e) => {
                            const next = [...rwForm.bidang];
                            next[idx] = { ...next[idx], koordinator: e.target.value };
                            setRwForm({ ...rwForm, bidang: next });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div className="sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setRwForm({
                              ...rwForm,
                              bidang: rwForm.bidang.filter((_, i) => i !== idx),
                            })
                          }
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                          title="Hapus Bidang"
                        >
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-floppy-disk" /> Simpan Struktur Pengurus RW
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: KELOLA PENGURUS RT */}
        {adminTab === 'pengurus-rt' && !isRt && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Kelola Pengurus RT (01 - 05)</h1>
              <p className="text-sm text-slate-500">
                Pilih RT untuk memperbarui susunan kepengurusan tingkat RT.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPengurusRt({
                  ...pengurusRt,
                  [selectedRtKey]: {
                    ketua: rtForm.ketua.trim(),
                    sekretaris: rtForm.sekretaris.trim(),
                    bendahara1: rtForm.bendahara1.trim(),
                    bendahara2: rtForm.bendahara2.trim(),
                  },
                });
                showToast(`Data pengurus ${selectedRtKey} berhasil diperbarui.`, 'success');
              }}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 max-w-2xl space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Pilih Wilayah RT
                </label>
                <select
                  value={selectedRtKey}
                  onChange={(e) => {
                    const nextKey = e.target.value as RtKey;
                    setSelectedRtKey(nextKey);
                    setRtForm(pengurusRt[nextKey]);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                >
                  {RT_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ketua RT
                  </label>
                  <input
                    type="text"
                    required
                    value={rtForm.ketua}
                    onChange={(e) => setRtForm({ ...rtForm, ketua: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Sekretaris RT
                  </label>
                  <input
                    type="text"
                    required
                    value={rtForm.sekretaris}
                    onChange={(e) => setRtForm({ ...rtForm, sekretaris: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bendahara 1
                  </label>
                  <input
                    type="text"
                    required
                    value={rtForm.bendahara1}
                    onChange={(e) => setRtForm({ ...rtForm, bendahara1: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bendahara 2
                  </label>
                  <input
                    type="text"
                    required
                    value={rtForm.bendahara2}
                    onChange={(e) => setRtForm({ ...rtForm, bendahara2: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center gap-2 shadow"
                >
                  <i className="fa-solid fa-floppy-disk" /> Simpan Pengurus RT
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 8: BERITA, AGENDA & UMKM */}
        {adminTab === 'konten' && !isRt && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Kelola Tampilan &amp; Konten</h1>
              <p className="text-sm text-slate-500">
                Atur foto latar beranda, berita pengumuman, dan direktori UMKM warga.
              </p>
            </div>

            {/* Hero Background */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900">
                  <i className="fa-solid fa-image text-emerald-600 mr-2" />
                  Background Beranda Hero
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setHeroBg(null);
                    showToast('Foto latar beranda dikembalikan ke default.', 'info');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  <i className="fa-solid fa-rotate-left mr-1" /> Kembalikan ke Default
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-5">
                  <div
                    className="h-36 rounded-2xl bg-cover bg-center border border-slate-200 relative overflow-hidden flex items-end p-3 shadow-inner"
                    style={{ backgroundImage: `url('${heroBg}')` }}
                  >
                    <div className="absolute inset-0 bg-slate-950/60" />
                    <span className="relative z-10 text-xs font-bold text-white">
                      Pratinjau Foto Latar Beranda
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-500 self-center">
                      Preset:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroBg(
                          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80'
                        );
                        showToast('Background preset diterapkan!', 'success');
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      Perumahan Asri
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroBg(
                          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80'
                        );
                        showToast('Background preset diterapkan!', 'success');
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      Pegunungan Wonosobo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroBg(
                          'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1920&q=80'
                        );
                        showToast('Background preset diterapkan!', 'success');
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      Taman Hijau
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Unggah Foto Sendiri
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadHeroBg}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl p-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CCTV RW 10 Stream Manager */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    <i className="fa-solid fa-video text-rose-600 mr-2" />
                    Pengaturan Livestream CCTV RW 10 ({cctvForm.length} Kamera)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tempel URL Embed (YouTube Live / WebRTC / IP Cam) untuk setiap kamera. Kosongkan
                    untuk mode pratinjau simulasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('modal-cctv')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition self-start sm:self-auto"
                >
                  <i className="fa-solid fa-eye mr-1" /> Pratinjau CCTV
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const cleaned = cctvForm.map((cam) => ({
                    ...cam,
                    nama: cam.nama.trim(),
                    lokasi: cam.lokasi.trim(),
                    streamUrl: cam.streamUrl.trim(),
                  }));
                  setCctv(cleaned);
                  showToast('Konfigurasi 4 kamera CCTV RW 10 berhasil disimpan!', 'success');
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cctvForm.map((cam, idx) => (
                    <div
                      key={cam.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-800 font-mono">
                          {cam.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Kamera #{idx + 1}
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={cam.nama}
                        onChange={(e) => {
                          const next = [...cctvForm];
                          next[idx] = { ...next[idx], nama: e.target.value };
                          setCctvForm(next);
                        }}
                        placeholder="Nama Kamera"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        required
                        value={cam.lokasi}
                        onChange={(e) => {
                          const next = [...cctvForm];
                          next[idx] = { ...next[idx], lokasi: e.target.value };
                          setCctvForm(next);
                        }}
                        placeholder="Lokasi Titik Kamera"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="url"
                        value={cam.streamUrl}
                        onChange={(e) => {
                          const next = [...cctvForm];
                          next[idx] = { ...next[idx], streamUrl: e.target.value };
                          setCctvForm(next);
                        }}
                        placeholder="URL Embed Livestream (YouTube Live / IP Cam)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-floppy-disk" /> Simpan Konfigurasi CCTV
                  </button>
                </div>
              </form>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Berita Manager */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  <i className="fa-solid fa-newspaper text-emerald-600 mr-2" />
                  Tambah Berita / Pengumuman
                </h3>
                <form onSubmit={handleAddBerita} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={beritaJudul}
                    onChange={(e) => setBeritaJudul(e.target.value)}
                    placeholder="Judul Berita / Liputan Kegiatan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={beritaKategori}
                      onChange={(e) => setBeritaKategori(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                    >
                      {BERITA_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={beritaPenulis}
                      onChange={(e) => setBeritaPenulis(e.target.value)}
                      placeholder="Penulis / Pewarta"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        <i className="fa-solid fa-camera text-emerald-600 mr-1" /> Foto Kegiatan
                      </label>
                      {beritaPreviewSrc && (
                        <button
                          type="button"
                          onClick={() => {
                            setBeritaFotoData('');
                            setBeritaFotoUrl('');
                          }}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBeritaFotoUpload}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={beritaFotoUrl}
                      onChange={(e) => {
                        setBeritaFotoData('');
                        setBeritaFotoUrl(e.target.value);
                      }}
                      placeholder="Atau tempel URL foto (opsional)..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {beritaPreviewSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={beritaPreviewSrc}
                        alt="Pratinjau foto"
                        className="w-full h-36 object-cover rounded-xl border border-slate-200"
                      />
                    )}
                    <input
                      type="text"
                      value={beritaCaption}
                      onChange={(e) => setBeritaCaption(e.target.value)}
                      placeholder="Keterangan foto (misal: Warga RT 01-05 membersihkan saluran air)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={beritaIsi}
                    onChange={(e) => setBeritaIsi(e.target.value)}
                    placeholder="Tulis isi berita lengkap (gunakan Enter untuk membuat paragraf baru)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition shadow flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-paper-plane" />{' '}
                      {editingBeritaId ? 'Simpan Perubahan Berita' : 'Publikasikan Berita'}
                    </button>
                    {editingBeritaId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBeritaId(null);
                          setBeritaJudul('');
                          setBeritaFotoData('');
                          setBeritaFotoUrl('');
                          setBeritaCaption('');
                          setBeritaIsi('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-sm">
                  {berita.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">Belum ada berita.</p>
                  ) : (
                    berita.map((b) => (
                      <div key={b.id} className="py-3 flex justify-between items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.foto || DEFAULT_BERITA_IMG}
                          alt={b.judul}
                          className="w-16 h-12 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                            {b.judul}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {b.kategori || 'Pengumuman'} • {b.tanggal}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBeritaId(b.id);
                              setBeritaJudul(b.judul);
                              setBeritaKategori(b.kategori || 'Pengumuman');
                              setBeritaPenulis(b.penulis || 'Pengurus RW 10');
                              if (b.foto && b.foto.startsWith('data:')) {
                                setBeritaFotoData(b.foto);
                                setBeritaFotoUrl('');
                              } else {
                                setBeritaFotoData('');
                                setBeritaFotoUrl(b.foto || '');
                              }
                              setBeritaCaption(b.caption || '');
                              setBeritaIsi(b.isi);
                            }}
                            className="text-emerald-600 hover:text-emerald-800 text-xs p-1"
                            title="Edit Berita"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBerita(berita.filter((item) => item.id !== b.id));
                              if (editingBeritaId === b.id) setEditingBeritaId(null);
                              showToast('Berita dihapus.', 'info');
                            }}
                            className="text-rose-500 hover:text-rose-700 text-xs p-1"
                            title="Hapus Berita"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* UMKM Manager */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                  <i className="fa-solid fa-store text-indigo-600 mr-2" />
                  Tambah UMKM Warga
                </h3>
                <form onSubmit={handleAddUmkm} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={umkmNama}
                      onChange={(e) => setUmkmNama(e.target.value)}
                      placeholder="Nama Usaha"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={umkmKategori}
                      onChange={(e) => setUmkmKategori(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {UMKM_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={umkmPemilik}
                      onChange={(e) => setUmkmPemilik(e.target.value)}
                      placeholder="Pemilik & Blok/RT"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      required
                      value={umkmWa}
                      onChange={(e) => setUmkmWa(e.target.value)}
                      placeholder="No. WA (08...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={umkmDeskripsi}
                    onChange={(e) => setUmkmDeskripsi(e.target.value)}
                    placeholder="Deskripsi produk / layanan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow"
                    >
                      {editingUmkmId ? 'Simpan Perubahan UMKM' : 'Simpan UMKM'}
                    </button>
                    {editingUmkmId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUmkmId(null);
                          setUmkmNama('');
                          setUmkmPemilik('');
                          setUmkmWa('');
                          setUmkmDeskripsi('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-sm">
                  {umkm.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">Belum ada UMKM.</p>
                  ) : (
                    umkm.map((u) => (
                      <div key={u.id} className="py-3 flex justify-between items-start gap-3">
                        <div>
                          <p className="font-bold text-slate-800 text-xs sm:text-sm">
                            {u.nama}{' '}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                              {u.kategori}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {u.pemilik} • WA: {u.wa}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUmkmId(u.id);
                              setUmkmNama(u.nama);
                              setUmkmKategori(u.kategori);
                              setUmkmPemilik(u.pemilik);
                              setUmkmWa(u.wa);
                              setUmkmDeskripsi(u.deskripsi);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-xs p-1"
                            title="Edit UMKM"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUmkm(umkm.filter((item) => item.id !== u.id));
                              if (editingUmkmId === u.id) setEditingUmkmId(null);
                              showToast('UMKM dihapus.', 'info');
                            }}
                            className="text-rose-500 hover:text-rose-700 text-xs p-1"
                            title="Hapus UMKM"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
