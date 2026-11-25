'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRw10 } from '@/context/Rw10Context';
import { BERITA_CATEGORIES, DEFAULT_BERITA_IMG, UMKM_CATEGORIES } from '@/lib/defaultData';
import {
  formatRupiah,
  getBeritaCategoryColor,
  sanitizeWa,
  triggerCsvDownload,
} from '@/lib/utils';

export default function PublicPortal() {
  const {
    warga,
    keuangan,
    berita,
    umkm,
    heroBg,
    openModal,
    openServiceModal,
    openStatusSearchModal,
    openBeritaDetail,
    openBeritaIndex,
    openUmkmCategoryModal,
    showToast,
  } = useRw10();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [heroSearch, setHeroSearch] = useState('');
  const [activeBeritaCategory, setActiveBeritaCategory] = useState<string>('ALL');
  const [countdown, setCountdown] = useState({ days: '00', hours: '00', mins: '00' });

  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.nav-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  useEffect(() => {
    const targetDate = new Date('2026-11-22T07:00:00+07:00').getTime();
    const update = () => {
      const dist = targetDate - Date.now();
      if (dist <= 0) {
        setCountdown({ days: '00', hours: '00', mins: '00' });
        return;
      }
      const d = Math.floor(dist / (1000 * 60 * 60 * 24));
      const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        mins: String(m).padStart(2, '0'),
      });
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const demography = useMemo(() => {
    const aktif = warga.filter((w) => w.status === 'Aktif');
    const uniqueKk = new Set(aktif.map((w) => w.idRumah).filter(Boolean));
    const laki = aktif.filter((w) => w.jk === 'Laki-laki').length;
    const perempuan = aktif.filter((w) => w.jk === 'Perempuan').length;
    const tetap = aktif.filter((w) => w.hunian === 'Warga Tetap').length;
    return {
      totalJiwa: aktif.length,
      totalKk: uniqueKk.size,
      laki,
      perempuan,
      tetap,
      nonTetap: aktif.length - tetap,
    };
  }, [warga]);

  const kasSummary = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    keuangan.forEach((t) => {
      if (t.tipe === 'masuk') masuk += Number(t.nominal);
      else keluar += Number(t.nominal);
    });
    return { masuk, keluar, saldo: masuk - keluar };
  }, [keuangan]);

  const filteredBerita = useMemo(() => {
    return activeBeritaCategory === 'ALL'
      ? berita
      : berita.filter((b) => (b.kategori || 'Pengumuman') === activeBeritaCategory);
  }, [berita, activeBeritaCategory]);

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

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearch.trim();
    if (!q) {
      showToast('Ketikkan Kode Registrasi atau ID Warga terlebih dahulu.', 'info');
      return;
    }
    openStatusSearchModal(q);
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const headlineBerita = filteredBerita[0];
  const restBerita = filteredBerita.slice(1, 6);

  return (
    <div id="public-view" className="min-h-screen flex flex-col">
      {/* TOP TICKER BAR */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-emerald-200 text-xs py-2 px-4 border-b border-emerald-800/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse">
              <i className="fa-solid fa-satellite-dish mr-1 text-[9px]" /> PENGUMUMAN
            </span>
            <span className="truncate text-slate-300">
              Layanan pengajuan surat pengantar kini online 24 jam. Verifikasi cepat oleh RT 01–05.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] shrink-0 text-slate-400">
            <a
              href="tel:081234567999"
              className="hover:text-emerald-300 transition flex items-center gap-1"
            >
              <i className="fa-solid fa-phone-flip text-emerald-400" /> Pos Satpam: 0812-3456-7999
            </a>
            <span className="hidden md:inline">•</span>
            <button
              type="button"
              onClick={() => openModal('modal-kontak')}
              className="hover:text-white transition flex items-center gap-1"
            >
              <i className="fa-solid fa-triangle-exclamation text-amber-400" /> Nomor Darurat
            </button>
          </div>
        </div>
      </div>

      {/* STICKY RESPONSIVE NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <a href="#beranda" className="flex items-center gap-3 group">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 group-hover:shadow-emerald-500/20 transition-all duration-300">
                <i className="fa-solid fa-house-chimney-window text-lg md:text-xl" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight">
                    RW 10 Permata Hijau
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 hidden sm:inline-block">
                    RESMI
                  </span>
                </div>
                <span className="block text-[11px] font-medium text-emerald-700">
                  Kel. Mudal • Kec. Mojotengah • Kab. Wonosobo
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <a
                href="#beranda"
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 transition"
              >
                Beranda
              </a>

              {/* Dropdown: Profil RW */}
              <div className={`relative nav-dropdown ${openDropdown === 'profil' ? 'open' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggleDropdown('profil')}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 transition flex items-center gap-1.5"
                >
                  Profil RW <i className="fa-solid fa-chevron-down text-[10px] opacity-70" />
                </button>
                <div className="nav-dropdown-menu absolute left-0 mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-sejarah');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-landmark w-4 text-emerald-600" /> Sejarah &amp; Visi Misi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-organogram');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-sitemap w-4 text-emerald-600" /> Struktur Pengurus (Bagan)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-daftar-rt');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-people-roof w-4 text-emerald-600" /> Daftar RT (01 - 05)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-fasilitas');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-building-circle-check w-4 text-emerald-600" /> Fasilitas Lingkungan
                  </button>
                </div>
              </div>

              {/* Dropdown: Layanan Warga */}
              <div className={`relative nav-dropdown ${openDropdown === 'layanan' ? 'open' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggleDropdown('layanan')}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 transition flex items-center gap-1.5"
                >
                  Layanan Warga <i className="fa-solid fa-chevron-down text-[10px] opacity-70" />
                </button>
                <div className="nav-dropdown-menu absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openServiceModal('Surat Pengantar');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-file-signature w-4 text-emerald-600" /> Surat Pengantar (SKCK, KTP, dll)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openServiceModal('Usulan Perlindungan Sosial');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-hand-holding-heart w-4 text-emerald-600" /> Usulan Perlindungan Sosial / Bansos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openServiceModal('Mutasi Kependudukan');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-truck-moving w-4 text-emerald-600" /> Mutasi (Pindah Masuk/Keluar)
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-cek-status');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-magnifying-glass w-4" /> Lacak Status Permohonan
                  </button>
                </div>
              </div>

              {/* Dropdown: Transparansi & Info */}
              <div className={`relative nav-dropdown ${openDropdown === 'info' ? 'open' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggleDropdown('info')}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 transition flex items-center gap-1.5"
                >
                  Transparansi &amp; Info <i className="fa-solid fa-chevron-down text-[10px] opacity-70" />
                </button>
                <div className="nav-dropdown-menu absolute left-0 mt-1 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-keuangan');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-wallet w-4 text-emerald-600" /> Transparansi Kas RW
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openBeritaIndex();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-newspaper w-4 text-emerald-600" /> Berita &amp; Pengumuman
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-shortcut-agenda');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-calendar-days w-4 text-emerald-600" /> Agenda &amp; Kegiatan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-peraturan');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <i className="fa-solid fa-scale-balanced w-4 text-emerald-600" /> Peraturan &amp; Tata Tertib RW
                  </button>
                </div>
              </div>

              {/* Dropdown: UMKM Warga */}
              <div className={`relative nav-dropdown ${openDropdown === 'umkm' ? 'open' : ''}`}>
                <button
                  type="button"
                  onClick={() => toggleDropdown('umkm')}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 transition flex items-center gap-1.5"
                >
                  UMKM Warga <i className="fa-solid fa-chevron-down text-[10px] opacity-70" />
                </button>
                <div className="nav-dropdown-menu absolute left-0 mt-1 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openUmkmCategoryModal('ALL');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5"
                  >
                    <i className="fa-solid fa-store w-4 text-emerald-600" /> Semua Direktori UMKM
                  </button>
                  {UMKM_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        openUmkmCategoryModal(cat);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5"
                    >
                      <i className="fa-solid fa-tag w-4 text-emerald-600" /> {cat}
                    </button>
                  ))}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown(null);
                      openModal('modal-daftar-umkm-warga');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5"
                  >
                    <i className="fa-solid fa-circle-plus w-4" /> Daftarkan Usaha Anda
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal('modal-login')}
                className="ml-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
              >
                <i className="fa-solid fa-user-shield text-xs" /> Login Pengurus
              </button>
            </nav>

            {/* Mobile Hamburger Button & Quick Login */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => openModal('modal-login')}
                className="px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <i className="fa-solid fa-user-shield" /> Login
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none transition"
                aria-label="Buka Menu"
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Accordion Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white max-h-[82vh] overflow-y-auto shadow-xl">
            <div className="px-4 py-3 space-y-1">
              <a
                href="#beranda"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-emerald-50"
              >
                Beranda
              </a>

              {/* Profil RW */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => toggleAccordion('acc-profil')}
                  className="w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-emerald-50"
                >
                  <span>Profil RW</span>
                  <i
                    className={`fa-solid fa-chevron-down text-xs transition-transform ${
                      openAccordion === 'acc-profil' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'acc-profil' && (
                  <div className="pl-4 pb-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-sejarah');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Sejarah &amp; Visi Misi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-organogram');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Struktur Pengurus (Bagan)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-daftar-rt');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Daftar RT (01 - 05)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-fasilitas');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Fasilitas Lingkungan
                    </button>
                  </div>
                )}
              </div>

              {/* Layanan Warga */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => toggleAccordion('acc-layanan')}
                  className="w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-emerald-50"
                >
                  <span>Layanan Warga</span>
                  <i
                    className={`fa-solid fa-chevron-down text-xs transition-transform ${
                      openAccordion === 'acc-layanan' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'acc-layanan' && (
                  <div className="pl-4 pb-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openServiceModal('Surat Pengantar');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Surat Pengantar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openServiceModal('Usulan Perlindungan Sosial');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Usulan Perlindungan Sosial
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openServiceModal('Mutasi Kependudukan');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Mutasi Kependudukan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-cek-status');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-emerald-700 hover:bg-emerald-50"
                    >
                      Lacak Status Permohonan
                    </button>
                  </div>
                )}
              </div>

              {/* Transparansi & Info */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => toggleAccordion('acc-info')}
                  className="w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-emerald-50"
                >
                  <span>Transparansi &amp; Info</span>
                  <i
                    className={`fa-solid fa-chevron-down text-xs transition-transform ${
                      openAccordion === 'acc-info' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'acc-info' && (
                  <div className="pl-4 pb-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-keuangan');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Transparansi Kas RW
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openBeritaIndex();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Berita &amp; Pengumuman
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-shortcut-agenda');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Agenda &amp; Kegiatan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-peraturan');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                    >
                      Peraturan RW
                    </button>
                  </div>
                )}
              </div>

              {/* UMKM Warga */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={() => toggleAccordion('acc-umkm')}
                  className="w-full flex justify-between items-center px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-emerald-50"
                >
                  <span>UMKM Warga</span>
                  <i
                    className={`fa-solid fa-chevron-down text-xs transition-transform ${
                      openAccordion === 'acc-umkm' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'acc-umkm' && (
                  <div className="pl-4 pb-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openUmkmCategoryModal('ALL');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-emerald-50"
                    >
                      Semua Direktori UMKM
                    </button>
                    {UMKM_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openUmkmCategoryModal(cat);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50"
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openModal('modal-daftar-umkm-warga');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-50"
                    >
                      Daftarkan Usaha Anda
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openModal('modal-kontak');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-phone-volume text-emerald-600" /> Kontak Pengurus &amp; Darurat
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section
        id="beranda"
        className="relative overflow-hidden bg-slate-950 text-white min-h-[580px] flex items-center"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-100"
          style={{ backgroundImage: `url('${heroBg}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/85 to-slate-950/75 backdrop-blur-[1px]" />
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#34d399 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Portal Resmi Layanan &amp; Administrasi Digital Warga
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Selamat Datang di Portal <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white">
                  RW 10 Permata Hijau
                </span>
              </h1>
              <p className="text-slate-200/90 text-sm sm:text-base max-w-2xl leading-relaxed">
                Kelurahan Mudal, Kecamatan Mojotengah, Kabupaten Wonosobo, Jawa Tengah. Mewujudkan
                tata kelola lingkungan yang harmonis, transparan, dan pelayanan surat berjenjang
                serentak antar RT 01 hingga RT 05.
              </p>

              {/* Quick Letter & Status Search Box */}
              <div className="pt-2 max-w-xl">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
                  <i className="fa-solid fa-magnifying-glass mr-1.5" /> Lacak Status Surat / Permohonan Anda
                </label>
                <form onSubmit={handleHeroSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      placeholder="Masukkan Kode Surat (RW10-2026-001) atau ID Warga (RW10-01A04-01)..."
                      className="w-full pl-4 pr-14 py-3.5 rounded-2xl text-slate-800 bg-white/95 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xl font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setHeroSearch('RW10-2026-001');
                        openStatusSearchModal('RW10-2026-001');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                      title="Coba kode demo"
                    >
                      Demo
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-extrabold text-sm transition-all duration-200 shadow-xl flex items-center justify-center gap-2 shrink-0"
                  >
                    Cek Status <i className="fa-solid fa-arrow-right" />
                  </button>
                </form>
                <p className="text-[11px] text-slate-300/80 mt-2">
                  <i className="fa-solid fa-circle-check text-emerald-400 mr-1" /> Data terlindungi.
                  Surat yang disetujui dapat diunduh dalam format <b>PDF</b> atau <b>.docx (Word)</b>.
                </p>
              </div>
            </div>

            {/* Demographic Card */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider">
                        Statistik Demografi Aktif
                      </p>
                    </div>
                    <h3 className="font-black text-xl text-white mt-0.5">RW 10 Permata Hijau</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/25 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <i className="fa-solid fa-users-rays text-2xl" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 hover:bg-white/15 transition">
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {demography.totalJiwa}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-tight mt-0.5">
                      Total Jiwa
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 hover:bg-white/15 transition">
                    <p className="text-2xl sm:text-3xl font-black text-white">
                      {demography.totalKk}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-tight mt-0.5">
                      Kepala Keluarga
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 hover:bg-white/15 transition">
                    <p className="text-2xl sm:text-3xl font-black text-white">5</p>
                    <p className="text-[11px] font-semibold text-emerald-200 uppercase tracking-tight mt-0.5">
                      Wilayah RT
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-950/40 rounded-2xl p-3 border border-emerald-500/20 text-xs flex justify-between items-center text-emerald-100">
                  <span>
                    <i className="fa-solid fa-venus-mars mr-1 text-emerald-300" /> L: {demography.laki} | P:{' '}
                    {demography.perempuan}
                  </span>
                  <span>
                    <i className="fa-solid fa-house-chimney mr-1 text-emerald-300" /> Tetap:{' '}
                    {demography.tetap} | Kontrak/Kos: {demography.nonTetap}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => openServiceModal('Surat Pengantar')}
                    className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs sm:text-sm transition text-center shadow-lg flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-file-pen text-emerald-700" /> Buat Surat Pengantar
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal('modal-pengaduan')}
                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm border border-emerald-400/40 transition text-center shadow flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-bullhorn text-amber-300" /> Lapor Pengaduan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE EVENT COUNTDOWN BANNER */}
      <section className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white border-y border-emerald-700/50 py-3.5 px-4 shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <i className="fa-solid fa-calendar-check" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Agenda Lingkungan Terdekat:
              </span>
              <h4 className="font-extrabold text-sm sm:text-base">
                Kerja Bakti Rutin &amp; Fogging Serentak
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm">
              <div className="bg-black/30 px-2.5 py-1 rounded-lg">
                <span>{countdown.days}</span>{' '}
                <span className="text-[9px] font-sans text-emerald-200">Hari</span>
              </div>
              <span>:</span>
              <div className="bg-black/30 px-2.5 py-1 rounded-lg">
                <span>{countdown.hours}</span>{' '}
                <span className="text-[9px] font-sans text-emerald-200">Jam</span>
              </div>
              <span>:</span>
              <div className="bg-black/30 px-2.5 py-1 rounded-lg">
                <span>{countdown.mins}</span>{' '}
                <span className="text-[9px] font-sans text-emerald-200">Mnt</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openModal('modal-agenda-kerjabakti')}
              className="px-3 py-1.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition shadow"
            >
              Detail Kegiatan
            </button>
          </div>
        </div>
      </section>

      {/* 6 QUICK ACTION SHORTCUT CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => openModal('modal-shortcut-layanan')}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl border border-slate-100 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-200 text-left group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition shadow-sm">
              <i className="fa-solid fa-file-signature text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Layanan Warga</h3>
              <p className="text-xs text-slate-500 mt-0.5">Surat &amp; Mutasi</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openModal('modal-pengaduan')}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl border border-slate-100 hover:border-amber-400 hover:-translate-y-1 transition-all duration-200 text-left group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition shadow-sm">
              <i className="fa-solid fa-bullhorn text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Pengaduan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Lapor Lingkungan</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openModal('modal-keuangan')}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl border border-slate-100 hover:border-teal-400 hover:-translate-y-1 transition-all duration-200 text-left group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition shadow-sm">
              <i className="fa-solid fa-chart-pie text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Keuangan Kas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Transparansi Publik</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openUmkmCategoryModal('ALL')}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl border border-slate-100 hover:border-indigo-400 hover:-translate-y-1 transition-all duration-200 text-left group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition shadow-sm">
              <i className="fa-solid fa-store text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Direktori UMKM</h3>
              <p className="text-xs text-slate-500 mt-0.5">Usaha Warga RW 10</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openModal('modal-shortcut-agenda')}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl border border-slate-100 hover:border-rose-400 hover:-translate-y-1 transition-all duration-200 text-left group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition shadow-sm">
              <i className="fa-solid fa-calendar-days text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Agenda RW</h3>
              <p className="text-xs text-slate-500 mt-0.5">Jadwal &amp; Rapat</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => openModal('modal-kontak')}
            className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl border border-slate-100 hover:border-sky-400 hover:-translate-y-1 transition-all duration-200 text-left group flex flex-col justify-between"
          >
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:bg-sky-600 group-hover:text-white transition shadow-sm">
              <i className="fa-solid fa-phone-volume text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Kontak Pengurus</h3>
              <p className="text-xs text-slate-500 mt-0.5">Nomor Darurat</p>
            </div>
          </button>
        </div>
      </section>

      {/* MAIN HOMEPAGE CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14 w-full">
        {/* TRANSPARANSI KEUANGAN RW SUMMARY BANNER */}
        <section
          id="transparansi-keuangan"
          className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-700/30"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                <i className="fa-solid fa-vault" /> Akuntabilitas Publik
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                Transparansi Keuangan Kas RW 10
              </h2>
              <p className="text-emerald-100/90 text-sm mt-1">
                Rekapitulasi kas operasional diperbarui secara real-time oleh Bendahara RW 10
                Permata Hijau.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportKasCsv}
                className="px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-500/30 transition flex items-center gap-1.5 shadow"
              >
                <i className="fa-solid fa-file-csv" /> Unduh Rekap CSV
              </button>
              <button
                type="button"
                onClick={() => openModal('modal-keuangan')}
                className="px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-extrabold text-sm hover:bg-emerald-50 transition shadow flex items-center gap-1.5"
              >
                Lihat Rincian Mutasi <i className="fa-solid fa-arrow-right ml-1" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition">
              <div className="flex items-center justify-between text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                <span>TOTAL PEMASUKAN</span>
                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <i className="fa-solid fa-arrow-trend-up" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-200">
                {formatRupiah(kasSummary.masuk)}
              </p>
              <p className="text-[11px] text-emerald-100/70 mt-1">Iuran warga &amp; dana operasional</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition">
              <div className="flex items-center justify-between text-rose-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                <span>TOTAL PENGELUARAN</span>
                <span className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300">
                  <i className="fa-solid fa-arrow-trend-down" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-200">
                {formatRupiah(kasSummary.keluar)}
              </p>
              <p className="text-[11px] text-rose-100/70 mt-1">Keamanan, sampah &amp; perawatan</p>
            </div>
            <div className="bg-emerald-500/30 backdrop-blur-md border border-emerald-400/50 rounded-2xl p-5 hover:bg-emerald-500/40 transition">
              <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1.5">
                <span>SALDO KAS BERJALAN</span>
                <span className="w-8 h-8 rounded-lg bg-emerald-400/30 flex items-center justify-center text-emerald-200">
                  <i className="fa-solid fa-scale-balanced" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {formatRupiah(kasSummary.saldo)}
              </p>
              <p className="text-[11px] text-emerald-100/90 mt-1">Saldo terkini siap digunakan</p>
            </div>
          </div>
        </section>

        {/* BERITA & AGENDA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Berita */}
          <section className="lg:col-span-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 border-emerald-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    LIVE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Kabar Aktual RW 10
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Liputan kegiatan, layanan, dan pengumuman resmi warga Permata Hijau
                </p>
              </div>
              <button
                type="button"
                onClick={openBeritaIndex}
                className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition self-start sm:self-auto"
              >
                Indeks Berita <i className="fa-solid fa-chevron-right text-[10px]" />
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['ALL', ...BERITA_CATEGORIES] as const).map((cat) => {
                const isActive = activeBeritaCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveBeritaCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua' : cat}
                  </button>
                );
              })}
            </div>

            {filteredBerita.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-400">
                Belum ada berita pada kategori <b>{activeBeritaCategory}</b>.
              </div>
            ) : (
              <>
                {headlineBerita && (
                  <article
                    onClick={() => openBeritaDetail(headlineBerita.id)}
                    className="relative rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group bg-slate-900 border border-slate-200"
                  >
                    <div className="relative aspect-[16/9] sm:aspect-[21/10] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={headlineBerita.foto || DEFAULT_BERITA_IMG}
                        alt={headlineBerita.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow ${getBeritaCategoryColor(
                            headlineBerita.kategori || 'Pengumuman'
                          )}`}
                        >
                          {headlineBerita.kategori || 'Pengumuman'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/50 backdrop-blur-sm text-white">
                          <i className="fa-regular fa-clock mr-1" />
                          {headlineBerita.tanggal}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white space-y-2">
                        <h3 className="text-lg sm:text-2xl font-black leading-tight group-hover:text-emerald-300 transition">
                          {headlineBerita.judul}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 hidden sm:block">
                          {headlineBerita.isi}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300">
                          <span>
                            <i className="fa-solid fa-pen-nib mr-1 text-emerald-400" />
                            {headlineBerita.penulis || 'Pengurus RW 10'}
                          </span>
                          <span className="font-bold text-emerald-300 group-hover:underline">
                            Baca Liputan &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                )}

                <div className="space-y-3.5">
                  {restBerita.map((b) => (
                    <article
                      key={b.id}
                      onClick={() => openBeritaDetail(b.id)}
                      className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-sm hover:shadow-md hover:border-emerald-300 transition cursor-pointer flex gap-3.5 sm:gap-4 items-center group"
                    >
                      <div className="w-28 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-100 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.foto || DEFAULT_BERITA_IMG}
                          alt={b.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded font-black uppercase tracking-wider ${getBeritaCategoryColor(
                              b.kategori || 'Pengumuman'
                            )}`}
                          >
                            {b.kategori || 'Pengumuman'}
                          </span>
                          <span className="text-slate-400 font-semibold">
                            <i className="fa-regular fa-calendar mr-1" />
                            {b.tanggal}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition">
                          {b.judul}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 hidden sm:block">
                          {b.isi}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Agenda Terdekat */}
          <section className="lg:col-span-4 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Agenda Terdekat
                  </h2>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">Jadwal kegiatan warga bulan ini</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
              <div
                onClick={() => openModal('modal-agenda-kerjabakti')}
                className="flex gap-4 items-start p-3.5 rounded-2xl hover:bg-emerald-50/80 cursor-pointer transition border border-transparent hover:border-emerald-200 group"
              >
                <div className="px-3 py-2 rounded-2xl bg-emerald-100 text-emerald-800 flex flex-col items-center justify-center shrink-0 font-bold group-hover:bg-emerald-600 group-hover:text-white transition">
                  <span className="text-[10px] uppercase leading-none font-extrabold">Nov</span>
                  <span className="text-xl leading-tight font-black">22</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-800 transition">
                    Kerja Bakti Rutin &amp; Fogging Serentak
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    <i className="fa-regular fa-clock mr-1 text-emerald-600" />
                    07.00 WIB • Seluruh Area RT 01-05
                  </p>
                </div>
              </div>

              <div
                onClick={() => openModal('modal-agenda-rapat')}
                className="flex gap-4 items-start p-3.5 rounded-2xl hover:bg-teal-50/80 cursor-pointer transition border-t border-slate-100 group"
              >
                <div className="px-3 py-2 rounded-2xl bg-teal-100 text-teal-800 flex flex-col items-center justify-center shrink-0 font-bold group-hover:bg-teal-600 group-hover:text-white transition">
                  <span className="text-[10px] uppercase leading-none font-extrabold">Nov</span>
                  <span className="text-xl leading-tight font-black">28</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-teal-800 transition">
                    Rapat Koordinasi Bulanan Pengurus RW &amp; RT
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    <i className="fa-regular fa-clock mr-1 text-teal-600" />
                    19.30 WIB • Gedung Serba Guna (GSG)
                  </p>
                </div>
              </div>

              <div
                onClick={() => openModal('modal-agenda-even')}
                className="flex gap-4 items-start p-3.5 rounded-2xl hover:bg-amber-50/80 cursor-pointer transition border-t border-slate-100 group"
              >
                <div className="px-3 py-2 rounded-2xl bg-amber-100 text-amber-800 flex flex-col items-center justify-center shrink-0 font-bold group-hover:bg-amber-500 group-hover:text-white transition">
                  <span className="text-[10px] uppercase leading-none font-extrabold">Des</span>
                  <span className="text-xl leading-tight font-black">06</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-amber-800 transition">
                    Senam Sehat Bersama &amp; Bazar Kuliner UMKM
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    <i className="fa-regular fa-clock mr-1 text-amber-600" />
                    06.30 WIB • Lapangan Olahraga RW 10
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openModal('modal-shortcut-agenda')}
                className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs text-center transition flex items-center justify-center gap-1.5 mt-2"
              >
                <i className="fa-regular fa-calendar-check text-emerald-600" /> Lihat Semua Agenda &amp;
                Tambahkan ke Kalender
              </button>
            </div>
          </section>
        </div>

        {/* LAYANAN WARGA CATALOG */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Prosedur Mudah &amp; Cepat
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Katalog Layanan Administrasi Warga
            </h2>
            <p className="text-sm text-slate-500">
              Ajukan permohonan surat administrasi kependudukan Anda dari mana saja tanpa antre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <i className="fa-solid fa-file-signature" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Surat Pengantar RT / RW
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Untuk keperluan pembuatan KTP Baru/Perubahan, KK, SKCK Kepolisian, Surat
                    Keterangan Domisili, Pengantar Nikah (N1-N4), dan Surat Keterangan Usaha (SKU).
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <p>
                    <i className="fa-solid fa-check text-emerald-600 mr-1.5" /> Verifikasi
                    berjenjang RT 01–05
                  </p>
                  <p>
                    <i className="fa-solid fa-check text-emerald-600 mr-1.5" /> Download PDF &amp;
                    file Word (.docx)
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => openServiceModal('Surat Pengantar')}
                  className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  Ajukan Surat Pengantar <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-2xl group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                  <i className="fa-solid fa-hand-holding-heart" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Perlindungan Sosial &amp; Bansos
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pendataan dan usulan warga kurang mampu untuk masuk dalam DTKS (Data Terpadu
                    Kesejahteraan Sosial), KIS / BPJS PBI, Program Indonesia Pintar (PIP), dan
                    bansos pangan.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <p>
                    <i className="fa-solid fa-check text-teal-600 mr-1.5" /> Tepat sasaran
                    didampingi RT
                  </p>
                  <p>
                    <i className="fa-solid fa-check text-teal-600 mr-1.5" /> Pengantar ke Kelurahan
                    Mudal
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => openServiceModal('Usulan Perlindungan Sosial')}
                  className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  Ajukan Perlindungan Sosial <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-2xl group-hover:bg-sky-600 group-hover:text-white transition-all duration-300">
                  <i className="fa-solid fa-truck-moving" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Mutasi Kependudukan</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pelaporan warga baru (pindah masuk), lapor pindah keluar domisili, data
                    kelahiran baru, serta pembaruan status kontrak/kos di perumahan Permata Hijau.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <p>
                    <i className="fa-solid fa-check text-sky-600 mr-1.5" /> Integrasi langsung ke
                    Buku Induk Warga
                  </p>
                  <p>
                    <i className="fa-solid fa-check text-sky-600 mr-1.5" /> Pemberitahuan otomatis
                    ke Ketua RT
                  </p>
                </div>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => openServiceModal('Mutasi Kependudukan')}
                  className="w-full py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow"
                >
                  Lapor Mutasi Kependudukan <i className="fa-solid fa-arrow-right" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* DIREKTORI UMKM WARGA HIGHLIGHT */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                <i className="fa-solid fa-store" /> Pemberdayaan Ekonomi
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Direktori UMKM Warga RW 10
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Dukung usaha tetangga dan produk lokal warga Perumahan Permata Hijau.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openModal('modal-daftar-umkm-warga')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow"
              >
                <i className="fa-solid fa-plus-circle" /> Daftarkan Usaha Anda
              </button>
              <button
                type="button"
                onClick={() => openUmkmCategoryModal('ALL')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition"
              >
                Lihat Semua UMKM <i className="fa-solid fa-arrow-right ml-1" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {umkm.slice(0, 4).map((u) => {
              const waLink = `https://wa.me/${sanitizeWa(u.wa)}?text=${encodeURIComponent(
                `Halo ${u.nama}, saya warga RW 10 Permata Hijau ingin bertanya produk/layanan Anda.`
              )}`;
              return (
                <div
                  key={u.id}
                  className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between hover:bg-white hover:border-indigo-300 hover:shadow-md transition group"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {u.kategori}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition mt-1">
                      {u.nama}
                    </h4>
                    <p className="text-xs text-emerald-700 font-semibold">
                      <i className="fa-solid fa-user-check text-[10px] mr-1" />
                      {u.pemilik}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {u.deskripsi}
                    </p>
                  </div>
                  <div className="pt-4 mt-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <i className="fa-brands fa-whatsapp text-sm" /> Pesan / Hubungi
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FASILITAS LINGKUNGAN PREVIEW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => openModal('modal-gsg')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
              <i className="fa-solid fa-building-columns" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Gedung Serba Guna (GSG)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Fasilitas pertemuan warga, posyandu, olahraga badminton, dan hajatan keluarga.
            </p>
            <span className="inline-block mt-3 text-xs font-bold text-emerald-700 group-hover:underline">
              Info Reservasi &rarr;
            </span>
          </div>

          <div
            onClick={() => openModal('modal-bank-sampah')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl mb-3 group-hover:bg-teal-600 group-hover:text-white transition">
              <i className="fa-solid fa-recycle" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Bank Sampah &ldquo;Berkah&rdquo;</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pengelolaan pilah sampah bernilai ekonomi setiap pekan ke-2 &amp; ke-4.
            </p>
            <span className="inline-block mt-3 text-xs font-bold text-teal-700 group-hover:underline">
              Jadwal &amp; Harga &rarr;
            </span>
          </div>

          <div
            onClick={() => openModal('modal-tps')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-3 group-hover:bg-amber-500 group-hover:text-white transition">
              <i className="fa-solid fa-dumpster" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">TPS &amp; Armada Sampah</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pengangkutan sampah terjadwal setiap Selasa, Kamis, dan Sabtu pagi.
            </p>
            <span className="inline-block mt-3 text-xs font-bold text-amber-700 group-hover:underline">
              Ketentuan Buang &rarr;
            </span>
          </div>

          <div
            onClick={() => openModal('modal-kontak')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl mb-3 group-hover:bg-sky-600 group-hover:text-white transition">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Pos Keamanan (24 Jam)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sistem portal otomatis, ronda lingkungan, dan kamera CCTV utama RW 10.
            </p>
            <span className="inline-block mt-3 text-xs font-bold text-sky-700 group-hover:underline">
              Hubungi Pos Jaga &rarr;
            </span>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-slate-800/80 pb-10">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3 text-white font-extrabold text-xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <i className="fa-solid fa-house-chimney-window" />
                </div>
                <span>RW 10 Permata Hijau</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Sekretariat: Gedung Serba Guna RW 10 Perumahan Permata Hijau, Kelurahan Mudal,
                Kecamatan Mojotengah, Kabupaten Wonosobo, Jawa Tengah 56351.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 flex items-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-location-dot text-emerald-400" /> Peta Lokasi
                </a>
                <button
                  type="button"
                  onClick={() => openModal('modal-kontak')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 flex items-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-phone text-teal-400" /> Kontak Pengurus
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
                Layanan Mandiri
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => openServiceModal('Surat Pengantar')}
                    className="hover:text-emerald-400 transition"
                  >
                    Surat Pengantar Online
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('modal-cek-status')}
                    className="hover:text-emerald-400 transition"
                  >
                    Lacak Status Surat (ID Warga)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('modal-pengaduan')}
                    className="hover:text-emerald-400 transition"
                  >
                    Lapor Pengaduan Warga
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('modal-keuangan')}
                    className="hover:text-emerald-400 transition"
                  >
                    Transparansi Kas RW
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openModal('modal-daftar-umkm-warga')}
                    className="hover:text-emerald-400 transition"
                  >
                    Promosi Usaha / UMKM
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3.5">
                Bantuan Darurat
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Hubungi nomor darurat terdekat atau sekretariat jika membutuhkan bantuan segera.
              </p>
              <button
                type="button"
                onClick={() => openModal('modal-kontak')}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow"
              >
                <i className="fa-brands fa-whatsapp text-sm" /> WhatsApp Hotline Pengurus
              </button>
              <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                <p>
                  <i className="fa-solid fa-shield mr-1" /> Polsek Mojotengah: (0286) 321110
                </p>
                <p>
                  <i className="fa-solid fa-fire-extinguisher mr-1" /> Damkar Wonosobo: (0286) 321113
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
            <p>&copy; 2026 Rukun Warga 10 Perumahan Permata Hijau, Mudal, Mojotengah, Wonosobo.</p>
            <p className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sistem Administrasi &amp;
              Transparansi Kependudukan Digital
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
