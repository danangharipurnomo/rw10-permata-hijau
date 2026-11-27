'use client';

import React, { useEffect, useState } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import { useRw10 } from '@/context/Rw10Context';
import { DEFAULT_BERITA_IMG, RT_LIST, UMKM_CATEGORIES } from '@/lib/defaultData';
import {
  addToGoogleCalendar,
  formatRupiah,
  getBeritaCategoryColor,
  maskPublicName,
  sanitizeWa,
  triggerCsvDownload,
} from '@/lib/utils';
import { RtKey } from '@/types/rw10';

export default function PublicModals() {
  const {
    activeModal,
    closeModal,
    openModal,
    pengurusRw,
    pengurusRt,
    warga,
    surat,
    setSurat,
    aduan,
    setAduan,
    keuangan,
    berita,
    umkm,
    setUmkm,
    cctv,
    authConfig,
    serviceJenis,
    openServiceModal,
    regSuccessData,
    setRegSuccessData,
    statusQuery,
    setStatusQuery,
    selectedBeritaId,
    openBeritaDetail,
    umkmModalCategory,
    openUmkmCategoryModal,
    openPrintLetterModal,
    downloadSuratDocx,
    setSession,
    setViewMode,
    setAdminTab,
    showToast,
  } = useRw10();

  // Service Form State
  const [srvIdWarga, setSrvIdWarga] = useState('');
  const [srvPin, setSrvPin] = useState('');
  const [srvIdMatched, setSrvIdMatched] = useState(false);
  const [srvNama, setSrvNama] = useState('');
  const [srvRt, setSrvRt] = useState<RtKey>('RT 01');
  const [srvWa, setSrvWa] = useState('');
  const [srvKeperluan, setSrvKeperluan] = useState('');
  const [srvEmail, setSrvEmail] = useState('');

  // Pengaduan Form State
  const [aduNama, setAduNama] = useState('');
  const [aduKategori, setAduKategori] = useState('Keamanan');
  const [aduWa, setAduWa] = useState('');
  const [aduDeskripsi, setAduDeskripsi] = useState('');

  // Status Search State
  const [modalSearchInput, setModalSearchInput] = useState('');

  // Daftar UMKM Warga Form State
  const [wargaUmkmNama, setWargaUmkmNama] = useState('');
  const [wargaUmkmKategori, setWargaUmkmKategori] = useState('Kuliner');
  const [wargaUmkmWa, setWargaUmkmWa] = useState('');
  const [wargaUmkmPemilik, setWargaUmkmPemilik] = useState('');
  const [wargaUmkmDeskripsi, setWargaUmkmDeskripsi] = useState('');

  // Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // CCTV Live Clock
  const [cctvTime, setCctvTime] = useState({ header: '--:--:-- WIB', cam: '--:--:-- WIB' });

  useEffect(() => {
    if (activeModal !== 'modal-cctv') return;
    const tick = () => {
      const now = new Date();
      const timeStr = `${now.toLocaleTimeString('id-ID', { hour12: false })} WIB`;
      const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      setCctvTime({
        header: `${dateStr} • ${timeStr}`,
        cam: `${dateStr} ${timeStr}`,
      });
    };
    const raf = window.requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [activeModal]);

  // Smart ID Warga + PIN (HHBB) Lookup
  const tryLookupWarga = (nextId: string, nextPin: string) => {
    const idClean = nextId.trim().toUpperCase();
    const pinClean = nextPin.trim();
    if (idClean.length >= 10 && pinClean.length === 4) {
      const found = warga.find((w) => {
        if (w.status !== 'Aktif') return false;
        if ((w.idWarga || '').toUpperCase() !== idClean) return false;
        if (!w.tgllahir) return false;
        const parts = w.tgllahir.split('-');
        const ddmm = parts.length === 3 ? parts[2] + parts[1] : '';
        return ddmm === pinClean;
      });
      if (found) {
        setSrvIdMatched(true);
        setSrvNama(found.nama);
        setSrvRt((found.rt as RtKey) || 'RT 01');
        if (found.wa) setSrvWa(found.wa);
        showToast(`Verifikasi berhasil: ${found.nama} (${found.rt})`, 'info');
        return;
      }
    }
    setSrvIdMatched(false);
  };

  const getServiceGuideText = () => {
    if (serviceJenis.includes('Pengantar')) {
      return 'Syarat umum: ID Warga RW 10 terdaftar, bawa KTP asli saat pengambilan/penandatanganan, dan keterangan keperluan jelas.';
    }
    if (serviceJenis.includes('Perlindungan')) {
      return 'Syarat usulan DTKS/Bansos: ID Warga RW 10 terdaftar, tunjukkan KK asli ke Ketua RT saat verifikasi lapangan.';
    }
    if (serviceJenis.includes('Mutasi')) {
      return 'Syarat mutasi: Surat pindah dari wilayah asal (jika pindah masuk) atau alamat tujuan (jika pindah keluar).';
    }
    return 'Portal menggunakan ID Warga (tanpa NIK) demi keamanan data pribadi. Kolom NIK pada surat cetak diisi manual saat penandatanganan.';
  };

  const handleSubmitServiceForm = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = String(surat.length + 1).padStart(3, '0');
    const uniqueSuffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    const kode = `RW10-2026-${nextNum}-${uniqueSuffix}`;
    const today = new Date().toISOString().split('T')[0];

    const newItem = {
      kode,
      tanggal: today,
      jenis: serviceJenis,
      nama: srvNama.trim(),
      idWarga: srvIdWarga.trim().toUpperCase(),
      rt: srvRt,
      keperluan: srvKeperluan.trim(),
      wa: sanitizeWa(srvWa),
      email: srvEmail.trim(),
      status: 'Menunggu Verifikasi RT',
    };

    setSurat([newItem, ...surat]);
    setSrvIdWarga('');
    setSrvPin('');
    setSrvIdMatched(false);
    setSrvNama('');
    setSrvWa('');
    setSrvKeperluan('');
    setSrvEmail('');

    const waMsg = `Halo Pengurus RW 10 / Ketua ${newItem.rt}, saya mengajukan ${newItem.jenis} dengan kode registrasi: ${kode} atas nama ${newItem.nama} (ID Warga: ${newItem.idWarga}). Mohon verifikasinya. Terima kasih.`;
    const waLink = `https://wa.me/${sanitizeWa(
      pengurusRw.sekretaris.wa || '6281234567002'
    )}?text=${encodeURIComponent(waMsg)}`;
    setRegSuccessData({ kode, waLink });
    openModal('modal-reg-success');
    showToast('Permohonan surat berhasil dikirim!', 'success');
  };

  const handleSubmitPengaduan = (e: React.FormEvent) => {
    e.preventDefault();
    const uniqueSuffix = Math.random().toString(36).slice(2, 4).toUpperCase();
    const newAduan = {
      id: `ADU-${Date.now().toString().slice(-5)}-${uniqueSuffix}`,
      tanggal: new Date().toISOString().split('T')[0],
      nama: aduNama.trim(),
      kategori: aduKategori,
      deskripsi: aduDeskripsi.trim(),
      wa: sanitizeWa(aduWa),
      status: 'Baru',
      tanggapan: '',
    };
    setAduan([newAduan, ...aduan]);
    setAduNama('');
    setAduWa('');
    setAduDeskripsi('');
    closeModal();
    showToast('Laporan pengaduan berhasil dikirim!', 'success');
  };

  const handleWargaSubmitUmkm = (e: React.FormEvent) => {
    e.preventDefault();
    const newUmkm = {
      id: 'UMKM-' + Date.now(),
      nama: wargaUmkmNama.trim(),
      kategori: wargaUmkmKategori,
      pemilik: wargaUmkmPemilik.trim(),
      wa: sanitizeWa(wargaUmkmWa),
      deskripsi: wargaUmkmDeskripsi.trim(),
    };
    setUmkm([newUmkm, ...umkm]);
    setWargaUmkmNama('');
    setWargaUmkmWa('');
    setWargaUmkmPemilik('');
    setWargaUmkmDeskripsi('');
    closeModal();
    showToast('Usaha Anda berhasil didaftarkan ke Direktori UMKM!', 'success');
  };

  const attemptLogin = (rawUser: string, rawPass: string) => {
    const cleanUser = rawUser.trim().toLowerCase();
    const cleanPass = rawPass.trim();
    const normalizedRt = /^rt[1-5]$/.test(cleanUser)
      ? 'rt0' + cleanUser.slice(2)
      : cleanUser;

    const matched = authConfig.accounts.find(
      (acc) =>
        (acc.username.toLowerCase() === cleanUser ||
          acc.username.toLowerCase() === normalizedRt) &&
        acc.password === cleanPass
    );

    if (!matched) {
      showToast('Username atau password salah!', 'error');
      return;
    }

    const nextSession = {
      username: matched.username,
      role: matched.role,
      rtScope: matched.rtScope,
      label: matched.label,
    };

    setSession(nextSession);
    setLoginUser('');
    setLoginPass('');
    closeModal();
    setViewMode('admin');
    setAdminTab('dashboard');
    showToast(`Selamat datang di Dashboard, ${nextSession.label}!`, 'success');
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

  const activeQuery = statusQuery.trim();
  const statusMatches = activeQuery
    ? surat.filter(
        (s) =>
          s.kode.toLowerCase() === activeQuery.toLowerCase() ||
          (s.idWarga || '').toLowerCase() === activeQuery.toLowerCase()
      )
    : [];

  const activeBerita = selectedBeritaId ? berita.find((b) => b.id === selectedBeritaId) : null;
  const filteredUmkm =
    umkmModalCategory === 'ALL'
      ? umkm
      : umkm.filter((u) => u.kategori === umkmModalCategory);

  return (
    <>
      {/* MODAL: SEJARAH & VISI MISI */}
      <ModalWrapper id="modal-sejarah">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-landmark text-emerald-600 mr-2" />
              Sejarah &amp; Visi Misi RW 10
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-5 text-sm text-slate-600 leading-relaxed">
            <div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1.5">Profil Wilayah</h4>
              <p>
                RW 10 Perumahan Permata Hijau berlokasi di Kelurahan Mudal, Kecamatan Mojotengah,
                Kabupaten Wonosobo, Jawa Tengah (Kode Pos 56351). Berada di dataran tinggi yang asri
                dan sejuk dengan panorama pegunungan, lingkungan kami menaungi 5 Rukun Tetangga (RT
                01 sampai RT 05) dengan prinsip kerukunan, kemandirian, dan pelayanan digital
                terdepan.
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4">
              <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                Visi
              </span>
              <p className="text-emerald-950 font-medium italic mt-1">
                &ldquo;Terwujudnya lingkungan Perumahan Permata Hijau RW 10 yang rukun, aman, asri,
                transparan, dan mandiri berlandaskan semangat kebersamaan dan pelayanan publik
                modern.&rdquo;
              </p>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 mb-2">Misi Pembangunan Lingkungan</h4>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Memberikan pelayanan administrasi kependudukan yang cepat, transparan, dan
                  terintegrasi antar RT 01-05.
                </li>
                <li>
                  Menjaga akuntabilitas dan keterbukaan tata kelola kas lingkungan kepada seluruh
                  warga.
                </li>
                <li>
                  Memperkuat kerukunan sosial melalui kegiatan gotong royong, posyandu, dan olahraga
                  bersama.
                </li>
                <li>
                  Mengembangkan kemandirian ekonomi warga melalui promosi direktori UMKM lokal.
                </li>
                <li>
                  Menjaga kelestarian lingkungan melalui pengelolaan Bank Sampah terpilah dan
                  kebersihan TPS.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: ORGANOGRAM */}
      <ModalWrapper id="modal-organogram">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h3 className="font-black text-lg text-slate-900">
                <i className="fa-solid fa-sitemap text-emerald-600 mr-2" />
                Struktur Pengurus RW 10
              </h3>
              <p className="text-xs text-slate-500">
                Perumahan Permata Hijau • Periode Aktif 2024 - 2029
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6">
            <p className="text-xs text-slate-400 mb-3 sm:hidden">
              <i className="fa-solid fa-arrows-left-right mr-1" /> Geser layar untuk melihat bagan
              lengkap.
            </p>
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[640px] flex flex-col items-center py-4">
                <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl px-6 py-4 text-center shadow-lg min-w-[240px] border-2 border-emerald-400">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full mb-1">
                    Ketua RW 10
                  </span>
                  <h4 className="font-black text-base tracking-tight">{pengurusRw.ketua.nama}</h4>
                </div>
                <div className="w-0.5 h-7 bg-emerald-400" />
                <div className="relative flex items-start justify-center gap-8 border-t-2 border-emerald-400 pt-5 px-4">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-emerald-400 -mt-5" />
                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-5 py-3 text-center shadow-sm min-w-[200px]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Sekretaris RW
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {pengurusRw.sekretaris.nama}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-5 bg-emerald-400 -mt-5" />
                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-5 py-3 text-center shadow-sm min-w-[200px]">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Bendahara RW
                      </span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {pengurusRw.bendahara.nama}
                      </p>
                    </div>
                  </div>
                </div>
                {pengurusRw.bidang.length > 0 ? (
                  <>
                    <div className="w-0.5 h-6 bg-emerald-400" />
                    <div className="w-full max-w-3xl border-t-2 border-emerald-400 relative pt-6">
                      <div
                        className="grid gap-3"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(
                            pengurusRw.bidang.length,
                            4
                          )}, minmax(150px, 1fr))`,
                        }}
                      >
                        {pengurusRw.bidang.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center relative">
                            <div className="w-0.5 h-6 bg-emerald-400 -mt-6 mb-0" />
                            <div className="w-full bg-white border-2 border-emerald-200 rounded-2xl p-3.5 text-center shadow-sm hover:border-emerald-500 transition">
                              <span className="block text-[10px] font-black uppercase tracking-wider text-emerald-700 mb-1">
                                {item.bidang}
                              </span>
                              <p className="font-bold text-slate-800 text-xs sm:text-sm">
                                {item.koordinator}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 mt-4">Belum ada seksi bidang.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: DAFTAR RT */}
      <ModalWrapper id="modal-daftar-rt">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h3 className="font-black text-lg text-slate-900">
                <i className="fa-solid fa-people-roof text-emerald-600 mr-2" />
                Daftar Pengurus RT 01 - RT 05
              </h3>
              <p className="text-xs text-slate-500">
                Jajaran Pengurus Rukun Tetangga di wilayah RW 10 Permata Hijau
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RT_LIST.map((rtKey) => {
              const rt = pengurusRt[rtKey];
              return (
                <div
                  key={rtKey}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5 hover:border-emerald-300 transition shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-black text-emerald-800 text-base">{rtKey}</span>
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      RW 10
                    </span>
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ketua RT:</span>
                      <span className="font-bold text-slate-900">{rt.ketua}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sekretaris:</span>
                      <span className="font-semibold text-slate-700">{rt.sekretaris}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bendahara 1:</span>
                      <span className="font-semibold text-slate-700">{rt.bendahara1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bendahara 2:</span>
                      <span className="font-semibold text-slate-700">{rt.bendahara2}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: FASILITAS LINGKUNGAN */}
      <ModalWrapper id="modal-fasilitas">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-building-circle-check text-emerald-600 mr-2" />
              Fasilitas Lingkungan RW 10
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <i className="fa-solid fa-building-columns" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Gedung Serba Guna (GSG) Permata Hijau
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dapat digunakan warga untuk rapat, arisan, resepsi keluarga, dan olahraga
                  badminton. Hubungi Sekretaris RW 10 untuk reservasi jadwal.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <i className="fa-solid fa-recycle" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Bank Sampah &ldquo;Berkah&rdquo;</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Penimbangan sampah anorganik (kardus, botol plastik, minyak jelantah, logam)
                  setiap Hari Minggu pekan ke-2 &amp; ke-4 di halaman GSG.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <i className="fa-solid fa-dumpster" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Tempat Pembuangan Sementara (TPS)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Jadwal armada gerobak sampah mengambil sampah rumah tangga di depan rumah setiap
                  hari <b>Selasa, Kamis, dan Sabtu</b> pagi.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Pos Satpam Utama &amp; Portal Masuk
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Penjagaan 24 jam dengan sistem portal tertutup pukul 23.00 - 05.00 WIB demi keamanan
                  bersama. Petugas dapat dihubungi melalui nomor darurat portal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: SHORTCUT LAYANAN */}
      <ModalWrapper id="modal-shortcut-layanan">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">Pilih Layanan Warga</h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-3">
            <button
              type="button"
              onClick={() => openServiceModal('Surat Pengantar')}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/70 flex items-center gap-4 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <i className="fa-solid fa-file-signature text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Surat Pengantar RT / RW</h4>
                <p className="text-xs text-slate-500">KTP, KK, SKCK, Domisili, Nikah, SKU</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openServiceModal('Usulan Perlindungan Sosial')}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/70 flex items-center gap-4 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                <i className="fa-solid fa-hand-holding-heart text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Usulan Perlindungan Sosial</h4>
                <p className="text-xs text-slate-500">DTKS, KIS / BPJS, PIP, Bantuan Sosial</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openServiceModal('Mutasi Kependudukan')}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/70 flex items-center gap-4 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                <i className="fa-solid fa-truck-moving text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Mutasi Kependudukan</h4>
                <p className="text-xs text-slate-500">Warga Baru, Pindah Keluar, Kelahiran</p>
              </div>
            </button>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => openModal('modal-cek-status')}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-magnifying-glass" /> Lacak Status Permohonan
              </button>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: FORMULIR LAYANAN SURAT (ZERO-NIK) */}
      <ModalWrapper id="modal-service-form">
        <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Formulir Layanan Mandiri
              </span>
              <h3 className="font-black text-lg text-slate-900 mt-0.5">{serviceJenis}</h3>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <form onSubmit={handleSubmitServiceForm} className="p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-circle-info text-emerald-700" /> Ketentuan Permohonan:
              </p>
              <p>{getServiceGuideText()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">ID Warga RW 10 *</label>
                  {srvIdMatched && (
                    <span className="text-[10px] font-bold text-emerald-700">
                      <i className="fa-solid fa-shield-check" /> Terverifikasi
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={srvIdWarga}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSrvIdWarga(v);
                    tryLookupWarga(v, srvPin);
                  }}
                  placeholder="Cth: RW10-01A04-01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono uppercase"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Tgl Lahir (HHBB)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={srvPin}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSrvPin(v);
                    tryLookupWarga(srvIdWarga, v);
                  }}
                  placeholder="Cth: 1205 (12 Mei)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 -mt-2">
              <p className="text-[11px] text-slate-400">
                <i className="fa-solid fa-lock text-emerald-600 mr-1" />
                <b>Zero-NIK:</b> Masukkan ID Warga + 4 digit tgl/bln lahir untuk isi otomatis.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSrvIdWarga('WARGA-BARU');
                  setSrvPin('');
                  setSrvIdMatched(false);
                  showToast('Mode warga baru dipilih. Lanjutkan mengisi data diri Anda.', 'info');
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline shrink-0"
              >
                Belum punya ID Warga?
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Pemohon *
              </label>
              <input
                type="text"
                required
                value={srvNama}
                onChange={(e) => setSrvNama(e.target.value)}
                placeholder="Nama lengkap sesuai KTP"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RT *</label>
                <select
                  required
                  value={srvRt}
                  onChange={(e) => setSrvRt(e.target.value as RtKey)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold"
                >
                  {RT_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. WhatsApp Aktif *
                </label>
                <input
                  type="text"
                  required
                  value={srvWa}
                  onChange={(e) => setSrvWa(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keperluan Lengkap Surat *
              </label>
              <textarea
                rows={3}
                required
                value={srvKeperluan}
                onChange={(e) => setSrvKeperluan(e.target.value)}
                placeholder="Contoh: Pengantar pembuatan SKCK di Polsek Mojotengah untuk melamar pekerjaan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Pemohon (Opsional)
              </label>
              <input
                type="email"
                value={srvEmail}
                onChange={(e) => setSrvEmail(e.target.value)}
                placeholder="nama@email.com (untuk menerima surat via email)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-paper-plane" /> Kirim Permohonan Surat
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>

      {/* MODAL: REGISTRASI BERHASIL */}
      <ModalWrapper id="modal-reg-success">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 text-center shadow-2xl space-y-5 border border-slate-100">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
            <i className="fa-solid fa-circle-check" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Permohonan Berhasil Dikirim!</h3>
            <p className="text-xs text-slate-500 mt-1">
              Simpan kode registrasi Anda di bawah ini untuk melacak status verifikasi RT dan RW
              secara berkala.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-inner">
            <span className="font-mono text-xl font-black text-emerald-800 tracking-wider">
              {regSuccessData?.kode || 'RW10-2026-001'}
            </span>
            <button
              type="button"
              onClick={() => {
                const code = regSuccessData?.kode || '';
                navigator.clipboard
                  .writeText(code)
                  .then(() => showToast(`Kode registrasi disalin: ${code}`, 'success'))
                  .catch(() => showToast(`Salin manual: ${code}`, 'info'));
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1 shadow"
            >
              <i className="fa-regular fa-copy" /> Salin
            </button>
          </div>
          <div className="space-y-2 pt-1">
            <a
              href={regSuccessData?.waLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow"
            >
              <i className="fa-brands fa-whatsapp text-base" /> Konfirmasi ke WhatsApp Pengurus
            </a>
            <button
              type="button"
              onClick={closeModal}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Selesai &amp; Tutup
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: PENGADUAN */}
      <ModalWrapper id="modal-pengaduan">
        <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-bullhorn text-amber-500 mr-2" />
              Pengaduan &amp; Lapor Lingkungan
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <form onSubmit={handleSubmitPengaduan} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Pelapor *
              </label>
              <input
                type="text"
                required
                value={aduNama}
                onChange={(e) => setAduNama(e.target.value)}
                placeholder="Nama Anda (Blok / RT)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Masalah *
                </label>
                <select
                  value={aduKategori}
                  onChange={(e) => setAduKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="Keamanan">Keamanan &amp; Ronda</option>
                  <option value="Infrastruktur">Infrastruktur &amp; Lampu PJU</option>
                  <option value="Kebersihan">Kebersihan &amp; Sampah</option>
                  <option value="Drainase">Saluran Air &amp; Banjir</option>
                  <option value="Sosial">Ketertiban Sosial</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. WhatsApp Pelapor *
                </label>
                <input
                  type="text"
                  required
                  value={aduWa}
                  onChange={(e) => setAduWa(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lokasi Titik &amp; Detail Masalah *
              </label>
              <textarea
                rows={3}
                required
                value={aduDeskripsi}
                onChange={(e) => setAduDeskripsi(e.target.value)}
                placeholder="Sebutkan titik lokasi (misal depan Blok B-04) dan jelaskan kendala lingkungan yang dialami..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm transition shadow flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-paper-plane" /> Kirim Laporan Pengaduan
            </button>
          </form>
        </div>
      </ModalWrapper>

      {/* MODAL: CEK STATUS PERMOHONAN */}
      <ModalWrapper id="modal-cek-status">
        <div className="bg-white rounded-3xl max-w-xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h3 className="font-black text-lg text-slate-900">
                <i className="fa-solid fa-magnifying-glass text-emerald-600 mr-2" />
                Lacak Status Permohonan
              </h3>
              <p className="text-xs text-slate-500">
                Pantau proses verifikasi berkas surat Anda secara real-time
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStatusQuery(modalSearchInput.trim());
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                required
                value={modalSearchInput || statusQuery}
                onChange={(e) => setModalSearchInput(e.target.value)}
                placeholder="Masukkan Kode Surat atau ID Warga (cth: RW10-01A04-01)..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow"
              >
                Cari
              </button>
            </form>

            <div className="space-y-4">
              {!activeQuery ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Ketikkan kode pendaftaran (contoh: <b>RW10-2026-001</b>) atau <b>ID Warga</b> Anda
                  (contoh: <b>RW10-01A04-01</b>).
                </p>
              ) : statusMatches.length === 0 ? (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm text-center">
                  Permohonan dengan kode atau ID Warga <b>{activeQuery}</b> tidak ditemukan di
                  sistem.
                </div>
              ) : (
                statusMatches.map((s) => {
                  const isRtPassed =
                    s.status.includes('Menunggu Pengesahan RW') || s.status.includes('Disetujui');
                  const isRwPassed = s.status.includes('Disetujui');
                  const isRejected = s.status.includes('Ditolak');

                  return (
                    <div
                      key={s.kode}
                      className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono font-black text-emerald-800 text-sm tracking-wider">
                            {s.kode}
                          </span>
                          <p className="text-xs text-slate-500 font-semibold">
                            {maskPublicName(s.nama)} ({s.rt})
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isRwPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>

                      <div className="py-2">
                        <div className="flex items-center justify-between text-center relative">
                          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{
                                width: isRwPassed ? '100%' : isRtPassed ? '66%' : '33%',
                              }}
                            />
                          </div>

                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow">
                              <i className="fa-solid fa-check" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 mt-1">
                              Diajukan
                            </span>
                          </div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full ${
                                isRtPassed
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              } flex items-center justify-center text-xs font-bold shadow`}
                            >
                              <i
                                className={`fa-solid ${
                                  isRtPassed ? 'fa-check' : 'fa-hourglass-half'
                                }`}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 mt-1">
                              Verifikasi RT
                            </span>
                          </div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full ${
                                isRwPassed
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              } flex items-center justify-center text-xs font-bold shadow`}
                            >
                              <i className={`fa-solid ${isRwPassed ? 'fa-check' : 'fa-stamp'}`} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 mt-1">
                              Pengesahan RW
                            </span>
                          </div>
                          <div className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full ${
                                isRwPassed
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              } flex items-center justify-center text-xs font-bold shadow`}
                            >
                              <i
                                className={`fa-solid ${isRwPassed ? 'fa-circle-check' : 'fa-file'}`}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 mt-1">
                              Siap Cetak
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-white p-3 rounded-2xl border border-slate-200/80 space-y-1">
                        <p>
                          <b>Jenis:</b> {s.jenis}
                        </p>
                        <p>
                          <b>Keperluan:</b> {s.keperluan}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Tanggal Pengajuan: {s.tanggal}
                        </p>
                      </div>

                      {s.status === 'Disetujui & Siap Cetak' && (
                        <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openPrintLetterModal(s.kode)}
                            className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <i className="fa-solid fa-print" /> Pratinjau / Cetak PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadSuratDocx(s.kode)}
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <i className="fa-solid fa-file-word" /> Unduh File .docx
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: PERATURAN RW 10 */}
      <ModalWrapper id="modal-peraturan">
        <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-scale-balanced text-emerald-600 mr-2" />
              Peraturan &amp; Tata Tertib RW 10
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-3 text-xs sm:text-sm text-slate-600">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <b className="text-slate-900">1. Tamu Menginap 1x24 Jam:</b> Tamu menginap wajib
              dilaporkan kepada Ketua RT setempat melalui form lapor atau WhatsApp pengurus RT.
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <b className="text-slate-900">2. Jam Tenang &amp; Portal Malam:</b> Jam tenang dimulai
              pukul 22.00 WIB. Portal utama lingkungan ditutup pukul 23.00 - 05.00 WIB.
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <b className="text-slate-900">3. Pemilahan Sampah:</b> Warga diwajibkan memilah sampah
              anorganik (kering) untuk disetorkan ke Bank Sampah dan sampah basah di tempat sampah
              depan rumah.
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <b className="text-slate-900">4. Iuran Lingkungan:</b> Pembayaran iuran bulanan
              disetorkan kepada Bendahara RT masing-masing paling lambat tanggal 10 setiap
              bulannya.
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <b className="text-slate-900">5. Gotong Royong:</b> Setiap kepala keluarga diharapkan
              berpartisipasi dalam kerja bakti rutin bulanan demi kebersihan drainase dan
              pencegahan demam berdarah.
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: BERITA DETAIL / INDEKS */}
      <ModalWrapper id="modal-berita">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <h3 className="font-black text-base sm:text-lg text-slate-900">
              {activeBerita ? (
                <>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase mr-2 ${getBeritaCategoryColor(
                      activeBerita.kategori || 'Pengumuman'
                    )}`}
                  >
                    {activeBerita.kategori || 'Pengumuman'}
                  </span>
                  Liputan RW 10
                </>
              ) : (
                <>
                  <i className="fa-solid fa-newspaper text-emerald-600 mr-2" />
                  Indeks Berita &amp; Pengumuman RW 10
                </>
              )}
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {activeBerita ? (
              <article className="space-y-4">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {activeBerita.judul}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700">
                      <i className="fa-solid fa-user-pen text-emerald-600 mr-1" />
                      {activeBerita.penulis || 'Pengurus RW 10'}
                    </span>
                    <span>•</span>
                    <span>
                      <i className="fa-regular fa-calendar mr-1" />
                      {activeBerita.tanggal}
                    </span>
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `*${activeBerita.judul}*\n\n${activeBerita.isi.slice(
                        0,
                        180
                      )}...\n\nInfo lengkap di Portal RW 10 Perumahan Permata Hijau.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
                  >
                    <i className="fa-brands fa-whatsapp" /> Bagikan
                  </a>
                </div>
                <figure className="space-y-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeBerita.foto || DEFAULT_BERITA_IMG}
                    alt={activeBerita.judul}
                    className="w-full max-h-[380px] object-cover rounded-2xl border border-slate-200 shadow-sm"
                  />
                  {activeBerita.caption && (
                    <figcaption className="text-xs italic text-slate-500 px-1">
                      <i className="fa-solid fa-camera mr-1 text-slate-400" />
                      {activeBerita.caption}
                    </figcaption>
                  )}
                </figure>
                <div className="text-sm sm:text-[15px] text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                  {activeBerita.isi}
                </div>
                {berita.filter((item) => item.id !== activeBerita.id).length > 0 && (
                  <div className="pt-5 mt-5 border-t border-slate-200 space-y-3">
                    <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                      Berita Lainnya
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {berita
                        .filter((item) => item.id !== activeBerita.id)
                        .slice(0, 3)
                        .map((t) => (
                          <div
                            key={t.id}
                            onClick={() => openBeritaDetail(t.id)}
                            className="cursor-pointer group rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-400 transition bg-slate-50"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={t.foto || DEFAULT_BERITA_IMG}
                              alt={t.judul}
                              className="w-full h-24 object-cover group-hover:scale-105 transition"
                            />
                            <div className="p-2.5">
                              <p className="text-[10px] font-bold text-emerald-700">{t.tanggal}</p>
                              <h5 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-emerald-700 mt-0.5">
                                {t.judul}
                              </h5>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </article>
            ) : berita.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Belum ada berita.</p>
            ) : (
              berita.map((b) => (
                <div
                  key={b.id}
                  onClick={() => openBeritaDetail(b.id)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 cursor-pointer flex gap-3.5 items-center transition group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.foto || DEFAULT_BERITA_IMG}
                    alt={b.judul}
                    className="w-24 h-20 sm:w-32 sm:h-24 rounded-xl object-cover shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded font-black uppercase ${getBeritaCategoryColor(
                          b.kategori || 'Pengumuman'
                        )}`}
                      >
                        {b.kategori || 'Pengumuman'}
                      </span>
                      <span className="text-slate-400 font-semibold">{b.tanggal}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-emerald-700">
                      {b.judul}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{b.isi}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: KEUANGAN */}
      <ModalWrapper id="modal-keuangan">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-wallet text-emerald-600 mr-2" />
              Buku Kas Keuangan RW 10
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportKasCsv}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                <i className="fa-solid fa-file-csv mr-1" /> Unduh CSV
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-600 font-extrabold">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keuangan.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        Belum ada mutasi kas.
                      </td>
                    </tr>
                  ) : (
                    keuangan.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                          {t.tanggal}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                          {t.keterangan}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: BANK SAMPAH */}
      <ModalWrapper id="modal-bank-sampah">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-recycle text-emerald-600 mr-2" />
              Bank Sampah &ldquo;Berkah&rdquo; Permata Hijau
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <p>
              Program pemilahan sampah bernilai ekonomis bagi seluruh warga RW 10. Uang hasil
              tabungan dapat dicairkan setiap menjelang Hari Raya Idul Fitri.
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
              <p className="font-bold text-emerald-900">
                <i className="fa-regular fa-clock mr-1" /> Jadwal Penimbangan:
              </p>
              <p className="text-xs">
                Setiap Hari Minggu Pekan ke-2 &amp; ke-4, Pukul 08.00 - 10.30 WIB di Halaman Gedung
                Serba Guna.
              </p>
            </div>
            <div className="border border-slate-200 rounded-2xl p-3 space-y-1.5 text-xs">
              <p className="font-bold text-slate-800">Daftar Sampah yang Diterima:</p>
              <p>&bull; Kardus &amp; Kertas Bekas / Buku</p>
              <p>&bull; Botol Plastik PET &amp; Gelas Air Mineral</p>
              <p>&bull; Kaleng Minuman &amp; Logam / Besi</p>
              <p>&bull; Minyak Jelantah (disaring dalam botol bersih)</p>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: GSG */}
      <ModalWrapper id="modal-gsg">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-building-columns text-emerald-600 mr-2" />
              Gedung Serba Guna (GSG)
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <p>
              Fasilitas bersama warga RW 10 yang dilengkapi lapangan badminton indoor, kursi rapat
              100 unit, sound system, toilet bersih, dan area parkir.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900">Ketentuan Reservasi:</p>
              <p>1. Warga mengajukan permohonan peminjaman ke Sekretaris RW minimal H-7 acara.</p>
              <p>2. Menjaga kebersihan dan tidak merusak fasilitas gedung.</p>
            </div>
            <button
              type="button"
              onClick={() => openModal('modal-kontak')}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition"
            >
              Hubungi Pengurus untuk Cek Jadwal GSG
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: TPS */}
      <ModalWrapper id="modal-tps">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-dumpster text-emerald-600 mr-2" />
              TPS &amp; Armada Sampah
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-3 text-sm text-slate-600">
            <p>
              Pengangkutan sampah rumah tangga dilakukan rutin setiap hari{' '}
              <b>Selasa, Kamis, dan Sabtu</b> pagi mulai pukul 06.30 WIB.
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <b>Catatan Penting:</b> Puing bangunan, ranting pohon besar, dan limbah medis dilarang
              keras diletakkan di tempat sampah rumah tangga tanpa koordinasi khusus dengan
              koordinator kebersihan.
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: UMKM LIST */}
      <ModalWrapper id="modal-umkm-list">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h3 className="font-black text-lg text-slate-900">
                {umkmModalCategory === 'ALL'
                  ? 'Semua Direktori UMKM Warga RW 10'
                  : `UMKM Kategori: ${umkmModalCategory}`}
              </h3>
              <p className="text-xs text-slate-500">
                Daftar usaha lokal milik warga Perumahan Permata Hijau
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openModal('modal-daftar-umkm-warga')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
              >
                <i className="fa-solid fa-plus-circle mr-1" /> Daftarkan Usaha
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['ALL', ...UMKM_CATEGORIES] as const).map((cat) => {
                const active = umkmModalCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => openUmkmCategoryModal(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua' : cat}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUmkm.length === 0 ? (
                <p className="text-sm text-slate-400 col-span-3 text-center py-8">
                  Belum ada usaha di kategori ini.
                </p>
              ) : (
                filteredUmkm.map((u) => {
                  const waUrl = `https://wa.me/${sanitizeWa(u.wa)}?text=${encodeURIComponent(
                    `Halo ${u.nama}, saya warga RW 10 Permata Hijau.`
                  )}`;
                  return (
                    <div
                      key={u.id}
                      className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow transition"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {u.kategori}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-1">{u.nama}</h4>
                        <p className="text-xs text-emerald-700 font-semibold">{u.pemilik}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{u.deskripsi}</p>
                      </div>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center transition flex items-center justify-center gap-1"
                      >
                        <i className="fa-brands fa-whatsapp" /> Chat WhatsApp
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: DAFTAR UMKM WARGA */}
      <ModalWrapper id="modal-daftar-umkm-warga">
        <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-store text-indigo-600 mr-2" />
              Daftarkan Usaha Anda
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <form onSubmit={handleWargaSubmitUmkm} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Usaha / Produk *
              </label>
              <input
                type="text"
                required
                value={wargaUmkmNama}
                onChange={(e) => setWargaUmkmNama(e.target.value)}
                placeholder="Cth: Dapur Bu Siti, Laundry Berkah"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Usaha *
                </label>
                <select
                  value={wargaUmkmKategori}
                  onChange={(e) => setWargaUmkmKategori(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold"
                >
                  {UMKM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  No. WhatsApp Bisnis *
                </label>
                <input
                  type="text"
                  required
                  value={wargaUmkmWa}
                  onChange={(e) => setWargaUmkmWa(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Pemilik &amp; Alamat Rumah (Blok/RT) *
              </label>
              <input
                type="text"
                required
                value={wargaUmkmPemilik}
                onChange={(e) => setWargaUmkmPemilik(e.target.value)}
                placeholder="Cth: Ibu Siti Rahayu (Blok C-12 / RT 03)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Singkat Produk / Layanan *
              </label>
              <textarea
                rows={3}
                required
                value={wargaUmkmDeskripsi}
                onChange={(e) => setWargaUmkmDeskripsi(e.target.value)}
                placeholder="Jelaskan menu, jasa, atau produk yang Anda tawarkan..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition shadow flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-paper-plane" /> Publikasikan Usaha Saya
            </button>
          </form>
        </div>
      </ModalWrapper>

      {/* MODAL: SHORTCUT AGENDA */}
      <ModalWrapper id="modal-shortcut-agenda">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">Agenda Kegiatan RW 10</h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-3">
            <button
              type="button"
              onClick={() => openModal('modal-agenda-kerjabakti')}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/70 flex items-center gap-4 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <i className="fa-solid fa-broom text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Kerja Bakti &amp; Fogging</h4>
                <p className="text-xs text-slate-500">22 Nov 2026 • 07.00 WIB</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openModal('modal-agenda-rapat')}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/70 flex items-center gap-4 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                <i className="fa-solid fa-users-rectangle text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Rapat Koordinasi Bulanan</h4>
                <p className="text-xs text-slate-500">28 Nov 2026 • 19.30 WIB</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => openModal('modal-agenda-even')}
              className="w-full p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/70 flex items-center gap-4 text-left transition group"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition">
                <i className="fa-solid fa-calendar-check text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Senam Sehat &amp; Bazar</h4>
                <p className="text-xs text-slate-500">06 Des 2026 • 06.30 WIB</p>
              </div>
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: AGENDA KERJA BAKTI */}
      <ModalWrapper id="modal-agenda-kerjabakti">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-broom text-emerald-600 mr-2" />
              Kerja Bakti &amp; Fogging Serentak
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1 text-xs">
              <p>
                <b>Waktu:</b> Minggu, 22 November 2026 • Pukul 07.00 WIB s/d Selesai
              </p>
              <p>
                <b>Titik Kumpul:</b> Depan Blok Masing-masing RT (01 - 05)
              </p>
              <p>
                <b>Perlengkapan:</b> Cangkul, sapu lidi, kantong sampah
              </p>
            </div>
            <p>
              Kegiatan meliputi pembersihan selokan pembuangan air hujan dari endapan lumpur,
              pemangkasan dahan pohon liar, dan fogging pencegahan DBD.
            </p>
            <button
              type="button"
              onClick={() =>
                addToGoogleCalendar(
                  'Kerja Bakti Rutin & Fogging RW 10',
                  'Pembersihan saluran air dan fogging serentak',
                  'Perumahan Permata Hijau RW 10 Wonosobo',
                  '20261122T070000',
                  '20261122T100000'
                )
              }
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <i className="fa-regular fa-calendar-plus" /> Simpan ke Google Calendar
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: AGENDA RAPAT */}
      <ModalWrapper id="modal-agenda-rapat">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-users-rectangle text-teal-600 mr-2" />
              Rapat Koordinasi Bulanan RW
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 space-y-1 text-xs">
              <p>
                <b>Waktu:</b> Sabtu, 28 November 2026 • 19.30 WIB
              </p>
              <p>
                <b>Tempat:</b> Gedung Serba Guna (GSG) Permata Hijau
              </p>
              <p>
                <b>Peserta:</b> Pengurus RW, Ketua RT 01-05, dan Koordinator Bidang
              </p>
            </div>
            <p>
              Agenda pembahasan evaluasi program kerja tahunan, laporan pertanggungjawaban kas, serta
              penyusunan agenda menyambut akhir tahun.
            </p>
            <button
              type="button"
              onClick={() =>
                addToGoogleCalendar(
                  'Rapat Koordinasi Bulanan RW 10',
                  'Rapat evaluasi program kerja dan laporan kas',
                  'GSG RW 10 Permata Hijau',
                  '20261128T193000',
                  '20261128T213000'
                )
              }
              className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <i className="fa-regular fa-calendar-plus" /> Simpan ke Google Calendar
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: AGENDA SENAM & BAZAR */}
      <ModalWrapper id="modal-agenda-even">
        <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-calendar-check text-amber-500 mr-2" />
              Senam Sehat &amp; Bazar UMKM
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
              <p>
                <b>Waktu:</b> Minggu, 06 Desember 2026 • 06.30 WIB
              </p>
              <p>
                <b>Tempat:</b> Lapangan Olahraga RW 10
              </p>
              <p>
                <b>Terbuka untuk:</b> Seluruh Warga RW 10 &amp; Keluarga
              </p>
            </div>
            <p>
              Senam aerobik bersama instruktur profesional dilanjutkan bazar kuliner dan aneka produk
              UMKM warga Permata Hijau.
            </p>
            <button
              type="button"
              onClick={() =>
                addToGoogleCalendar(
                  'Senam Sehat & Bazar UMKM RW 10',
                  'Senam pagi bersama dan bazar kuliner UMKM',
                  'Lapangan Olahraga RW 10 Permata Hijau',
                  '20261206T063000',
                  '20261206T100000'
                )
              }
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <i className="fa-regular fa-calendar-plus" /> Simpan ke Google Calendar
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: KONTAK PENGURUS & DARURAT */}
      <ModalWrapper id="modal-kontak">
        <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <h3 className="font-black text-lg text-slate-900">
              <i className="fa-solid fa-phone-volume text-emerald-600 mr-2" />
              Kontak Pengurus &amp; Darurat
            </h3>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-6 space-y-3">
            {[
              {
                role: 'Ketua RW 10',
                nama: pengurusRw.ketua.nama,
                wa: pengurusRw.ketua.wa,
                icon: 'fa-user-tie',
              },
              {
                role: 'Sekretaris RW 10',
                nama: pengurusRw.sekretaris.nama,
                wa: pengurusRw.sekretaris.wa,
                icon: 'fa-file-signature',
              },
              {
                role: 'Bendahara RW 10',
                nama: pengurusRw.bendahara.nama,
                wa: pengurusRw.bendahara.wa,
                icon: 'fa-wallet',
              },
              {
                role: 'Pos Satpam Utama (24 Jam)',
                nama: 'Petugas Keamanan Lingkungan',
                wa: '6281234567999',
                icon: 'fa-shield-halved',
              },
            ].map((c) => (
              <div
                key={c.role}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <i className={`fa-solid ${c.icon}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700">
                      {c.role}
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{c.nama}</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${sanitizeWa(c.wa)}?text=${encodeURIComponent(
                    `Halo ${c.nama}, saya warga RW 10 Permata Hijau.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition flex items-center gap-1"
                >
                  <i className="fa-brands fa-whatsapp" /> Chat
                </a>
              </div>
            ))}

            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Jajaran Ketua RT 01 – RT 05
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RT_LIST.map((rtKey) => (
                  <div
                    key={rtKey}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-emerald-800">{rtKey}</span>
                      <p className="text-slate-800 font-semibold">{pengurusRt[rtKey].ketua}</p>
                    </div>
                    <span className="text-[11px] text-slate-400">Ketua RT</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-phone-flip text-rose-600" /> Kontak Darurat Kabupaten
                Wonosobo:
              </p>
              <p>&bull; Polsek Mojotengah: (0286) 321110</p>
              <p>&bull; Pemadam Kebakaran Wonosobo: (0286) 321113 / 113</p>
              <p>&bull; Puskesmas Mojotengah / Ambulans: (0286) 324118</p>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: CCTV RW 10 (4 LIVESTREAM KAMERA LINGKUNGAN) */}
      <ModalWrapper id="modal-cctv" backdropClass="bg-slate-950/80">
        <div className="bg-slate-950 text-white rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-800">
          <div className="sticky top-0 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-5 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-3 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-video text-lg" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-white">
                    Pantauan CCTV RW 10 Permata Hijau
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> {cctv.length} LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Livestream Keamanan Lingkungan 24 Jam &bull;{' '}
                  <span className="font-mono text-emerald-400">{cctvTime.header}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cctv.map((cam) => {
                const url = (cam.streamUrl || '').trim();
                const isDirectImage = /\.(mjpg|mjpeg|jpg|jpeg|png)(\?.*)?$/i.test(url);
                return (
                  <div
                    key={cam.id}
                    className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg flex flex-col"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      {url ? (
                        isDirectImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt={cam.nama}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <iframe
                            src={url}
                            title={cam.nama}
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                          />
                        )
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cam.poster}
                            alt={cam.nama}
                            className="w-full h-full object-cover opacity-80 brightness-90 contrast-110"
                          />
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
                            }}
                          />
                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 border border-white/15 text-[10px] font-mono text-amber-300">
                            PRATINJAU SIMULASI
                          </div>
                        </>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 text-[10px] font-mono font-bold text-white">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span>REC</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-emerald-400">{cam.id}</span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-[10px] font-mono text-slate-200">
                        {cctvTime.cam}
                      </div>
                    </div>
                    <div className="p-3.5 flex items-center justify-between gap-2 bg-slate-900/95">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                          {cam.nama}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          <i className="fa-solid fa-location-dot text-emerald-400 mr-1" />
                          {cam.lokasi}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {url ? 'LIVE STREAM' : 'ONLINE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <p>
                <i className="fa-solid fa-shield-halved text-emerald-400 mr-1" /> Pengurus RW dapat
                mengubah URL livestream masing-masing kamera melalui{' '}
                <b>Dashboard Pengurus &rarr; Berita, Agenda &amp; UMKM</b>.
              </p>
              <button
                type="button"
                onClick={() => openModal('modal-kontak')}
                className="text-emerald-400 hover:text-emerald-300 font-bold shrink-0"
              >
                <i className="fa-solid fa-phone-flip mr-1" /> Hubungi Pos Satpam
              </button>
            </div>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: LOGIN PENGURUS */}
      <ModalWrapper id="modal-login">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-5 flex justify-between items-center">
            <div>
              <h3 className="font-black text-lg">Login Pengurus RW &amp; RT</h3>
              <p className="text-xs text-emerald-200">
                Akses Panel Verifikasi Surat &amp; Data Warga
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              attemptLogin(loginUser, loginPass);
            }}
            className="p-6 space-y-4"
          >
            {authConfig.showDemoButtons && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pilih Akun Demo (Klik untuk Isi Cepat):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {authConfig.accounts.slice(0, 4).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => attemptLogin(acc.username, acc.password)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                        acc.role === 'RW'
                          ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                          : 'bg-sky-100 text-sky-900 hover:bg-sky-200'
                      }`}
                    >
                      <i
                        className={`fa-solid fa-bolt ${
                          acc.role === 'RW' ? 'text-emerald-600' : 'text-sky-600'
                        }`}
                      />{' '}
                      {acc.role === 'RW' ? 'Demo Admin RW (Masuk Langsung)' : acc.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Pengurus
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin atau rt01..rt05"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-right-to-bracket" /> Masuk ke Dashboard
            </button>
          </form>
        </div>
      </ModalWrapper>
    </>
  );
}
