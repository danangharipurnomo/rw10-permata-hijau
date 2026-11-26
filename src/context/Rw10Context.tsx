'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AdminSession,
  AdminTab,
  Aduan,
  Berita,
  CctvCamera,
  ModalId,
  PengurusRtMap,
  PengurusRw,
  Surat,
  ToastItem,
  ToastType,
  TransaksiKas,
  Umkm,
  Warga,
} from '@/types/rw10';
import {
  DEFAULT_ADUAN,
  DEFAULT_BERITA,
  DEFAULT_CCTV,
  DEFAULT_HERO_BG,
  DEFAULT_KEUANGAN,
  DEFAULT_PENGURUS_RT,
  DEFAULT_PENGURUS_RW,
  DEFAULT_SURAT,
  DEFAULT_UMKM,
  DEFAULT_WARGA,
  STORAGE_KEYS,
} from '@/lib/defaultData';
import { generateAndDownloadSuratDocx } from '@/lib/docxGenerator';
import { supabase } from '@/lib/supabaseClient';

interface Rw10ContextValue {
  hydrated: boolean;
  pengurusRw: PengurusRw;
  setPengurusRw: (val: PengurusRw) => void;
  pengurusRt: PengurusRtMap;
  setPengurusRt: (val: PengurusRtMap) => void;
  warga: Warga[];
  setWarga: (val: Warga[]) => void;
  surat: Surat[];
  setSurat: (val: Surat[]) => void;
  aduan: Aduan[];
  setAduan: (val: Aduan[]) => void;
  keuangan: TransaksiKas[];
  setKeuangan: (val: TransaksiKas[]) => void;
  berita: Berita[];
  setBerita: (val: Berita[]) => boolean;
  umkm: Umkm[];
  setUmkm: (val: Umkm[]) => void;
  heroBg: string;
  setHeroBg: (url: string | null) => void;
  cctv: CctvCamera[];
  setCctv: (cams: CctvCamera[]) => void;

  session: AdminSession | null;
  setSession: (s: AdminSession | null) => void;
  viewMode: 'public' | 'admin';
  setViewMode: (m: 'public' | 'admin') => void;
  adminTab: AdminTab;
  setAdminTab: (t: AdminTab) => void;

  activeModal: ModalId | null;
  openModal: (id: ModalId) => void;
  closeModal: () => void;

  serviceJenis: string;
  openServiceModal: (jenis: string) => void;
  regSuccessData: { kode: string; waLink: string } | null;
  setRegSuccessData: (d: { kode: string; waLink: string } | null) => void;
  statusQuery: string;
  setStatusQuery: (q: string) => void;
  openStatusSearchModal: (q: string) => void;

  selectedBeritaId: string | null;
  openBeritaDetail: (id: string) => void;
  openBeritaIndex: () => void;

  umkmModalCategory: string;
  openUmkmCategoryModal: (category: string) => void;

  editingWargaId: string | null;
  openWargaFormModal: (editId?: string | null) => void;
  pendingDeleteWargaId: string | null;
  openDeleteWargaModal: (id: string) => void;

  printSuratKode: string | null;
  openPrintLetterModal: (kode: string) => void;
  downloadSuratDocx: (kode: string) => Promise<void>;

  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
}

const Rw10Context = createContext<Rw10ContextValue | null>(null);

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, val: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage quota errors
  }
}

function mapWargaFromDb(row: Record<string, unknown>): Warga {
  return {
    id: String(row.id || ''),
    idWarga: String(row.id_warga || ''),
    idRumah: String(row.id_rumah || ''),
    nama: String(row.nama || ''),
    jk: String(row.jk || 'Laki-laki'),
    tgllahir: String(row.tgllahir || ''),
    rt: String(row.rt || 'RT 01'),
    blok: String(row.blok || ''),
    hunian: String(row.hunian || 'Warga Tetap'),
    keluarga: String(row.keluarga || 'Kepala Keluarga'),
    wa: String(row.wa || ''),
    status: String(row.status || 'Aktif'),
  };
}

function mapWargaToDb(w: Warga) {
  return {
    id: w.id,
    id_warga: w.idWarga,
    id_rumah: w.idRumah,
    nama: w.nama,
    jk: w.jk,
    tgllahir: w.tgllahir || '',
    rt: w.rt,
    blok: w.blok,
    hunian: w.hunian,
    keluarga: w.keluarga,
    wa: w.wa || '',
    status: w.status,
  };
}

function mapSuratFromDb(row: Record<string, unknown>): Surat {
  return {
    kode: String(row.kode || ''),
    tanggal: String(row.tanggal || ''),
    jenis: String(row.jenis || ''),
    nama: String(row.nama || ''),
    idWarga: String(row.id_warga || ''),
    rt: String(row.rt || 'RT 01'),
    keperluan: String(row.keperluan || ''),
    wa: String(row.wa || ''),
    email: String(row.email || ''),
    status: String(row.status || 'Menunggu Verifikasi RT'),
  };
}

function mapSuratToDb(s: Surat) {
  return {
    kode: s.kode,
    tanggal: s.tanggal,
    jenis: s.jenis,
    nama: s.nama,
    id_warga: s.idWarga || '',
    rt: s.rt,
    keperluan: s.keperluan,
    wa: s.wa || '',
    email: s.email || '',
    status: s.status,
  };
}

async function syncCollection<T>(
  table: string,
  pk: string,
  prevItems: T[],
  nextItems: T[],
  toDb: (item: T) => Record<string, unknown>,
  getId: (item: T) => string
) {
  if (!supabase) return;
  const nextIds = new Set(nextItems.map(getId));
  const removedIds = prevItems.map(getId).filter((id) => !nextIds.has(id));
  if (removedIds.length > 0) {
    await supabase.from(table).delete().in(pk, removedIds);
  }
  if (nextItems.length > 0) {
    await supabase.from(table).upsert(nextItems.map(toDb), { onConflict: pk });
  }
}

export function Rw10Provider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [pengurusRw, setPengurusRwState] = useState<PengurusRw>(DEFAULT_PENGURUS_RW);
  const [pengurusRt, setPengurusRtState] = useState<PengurusRtMap>(DEFAULT_PENGURUS_RT);
  const [warga, setWargaState] = useState<Warga[]>(DEFAULT_WARGA);
  const [surat, setSuratState] = useState<Surat[]>(DEFAULT_SURAT);
  const [aduan, setAduanState] = useState<Aduan[]>(DEFAULT_ADUAN);
  const [keuangan, setKeuanganState] = useState<TransaksiKas[]>(DEFAULT_KEUANGAN);
  const [berita, setBeritaState] = useState<Berita[]>(DEFAULT_BERITA);
  const [umkm, setUmkmState] = useState<Umkm[]>(DEFAULT_UMKM);
  const [heroBg, setHeroBgState] = useState<string>(DEFAULT_HERO_BG);
  const [cctv, setCctvState] = useState<CctvCamera[]>(DEFAULT_CCTV);

  const wargaRef = useRef<Warga[]>(DEFAULT_WARGA);
  const suratRef = useRef<Surat[]>(DEFAULT_SURAT);
  const aduanRef = useRef<Aduan[]>(DEFAULT_ADUAN);
  const keuanganRef = useRef<TransaksiKas[]>(DEFAULT_KEUANGAN);
  const beritaRef = useRef<Berita[]>(DEFAULT_BERITA);
  const umkmRef = useRef<Umkm[]>(DEFAULT_UMKM);

  const [session, setSession] = useState<AdminSession | null>(null);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [adminTab, setAdminTabState] = useState<AdminTab>('dashboard');

  const [activeModal, setActiveModal] = useState<ModalId | null>(null);
  const [serviceJenis, setServiceJenis] = useState<string>('Surat Pengantar');
  const [regSuccessData, setRegSuccessData] = useState<{ kode: string; waLink: string } | null>(null);
  const [statusQuery, setStatusQuery] = useState<string>('');
  const [selectedBeritaId, setSelectedBeritaId] = useState<string | null>(null);
  const [umkmModalCategory, setUmkmModalCategory] = useState<string>('ALL');
  const [editingWargaId, setEditingWargaId] = useState<string | null>(null);
  const [pendingDeleteWargaId, setPendingDeleteWargaId] = useState<string | null>(null);
  const [printSuratKode, setPrintSuratKode] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let active = true;

    async function hydrateData() {
      // Load localStorage fallback immediately
      const localRw = readLocal(STORAGE_KEYS.PENGURUS_RW, DEFAULT_PENGURUS_RW);
      const localRt = readLocal(STORAGE_KEYS.PENGURUS_RT, DEFAULT_PENGURUS_RT);
      const localWarga = readLocal(STORAGE_KEYS.WARGA, DEFAULT_WARGA);
      const localSurat = readLocal(STORAGE_KEYS.SURAT, DEFAULT_SURAT);
      const localAduan = readLocal(STORAGE_KEYS.ADUAN, DEFAULT_ADUAN);
      const localKeuangan = readLocal(STORAGE_KEYS.KEUANGAN, DEFAULT_KEUANGAN);
      const localBerita = readLocal(STORAGE_KEYS.BERITA, DEFAULT_BERITA);
      const localUmkm = readLocal(STORAGE_KEYS.UMKM, DEFAULT_UMKM);
      const localCctv = readLocal(STORAGE_KEYS.CCTV, DEFAULT_CCTV);
      const localBg =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(STORAGE_KEYS.HERO_BG) || DEFAULT_HERO_BG
          : DEFAULT_HERO_BG;

      if (!supabase) {
        if (!active) return;
        setPengurusRwState(localRw);
        setPengurusRtState(localRt);
        wargaRef.current = localWarga;
        setWargaState(localWarga);
        suratRef.current = localSurat;
        setSuratState(localSurat);
        aduanRef.current = localAduan;
        setAduanState(localAduan);
        keuanganRef.current = localKeuangan;
        setKeuanganState(localKeuangan);
        beritaRef.current = localBerita;
        setBeritaState(localBerita);
        umkmRef.current = localUmkm;
        setUmkmState(localUmkm);
        setCctvState(localCctv);
        setHeroBgState(localBg);
        setHydrated(true);
        return;
      }

      try {
        const [
          settingsRes,
          wargaRes,
          suratRes,
          aduanRes,
          keuanganRes,
          beritaRes,
          umkmRes,
        ] = await Promise.all([
          supabase.from('rw10_settings').select('*'),
          supabase.from('rw10_warga').select('*').order('created_at', { ascending: false }),
          supabase.from('rw10_surat').select('*').order('created_at', { ascending: false }),
          supabase.from('rw10_aduan').select('*').order('created_at', { ascending: false }),
          supabase.from('rw10_keuangan').select('*').order('tanggal', { ascending: false }),
          supabase.from('rw10_berita').select('*').order('tanggal', { ascending: false }),
          supabase.from('rw10_umkm').select('*').order('created_at', { ascending: false }),
        ]);

        if (!active) return;

        // Settings
        const settingsRows = settingsRes.data || [];
        const rwRow = settingsRows.find((r) => r.key === 'pengurus_rw');
        const rtRow = settingsRows.find((r) => r.key === 'pengurus_rt');
        const bgRow = settingsRows.find((r) => r.key === 'hero_bg');
        const cctvRow = settingsRows.find((r) => r.key === 'cctv');

        if (rwRow?.value) {
          setPengurusRwState(rwRow.value as PengurusRw);
        } else {
          await supabase.from('rw10_settings').upsert({ key: 'pengurus_rw', value: DEFAULT_PENGURUS_RW });
          setPengurusRwState(DEFAULT_PENGURUS_RW);
        }

        if (rtRow?.value) {
          setPengurusRtState(rtRow.value as PengurusRtMap);
        } else {
          await supabase.from('rw10_settings').upsert({ key: 'pengurus_rt', value: DEFAULT_PENGURUS_RT });
          setPengurusRtState(DEFAULT_PENGURUS_RT);
        }

        if (bgRow?.value && typeof bgRow.value === 'string') {
          setHeroBgState(bgRow.value);
        } else {
          setHeroBgState(DEFAULT_HERO_BG);
        }

        if (Array.isArray(cctvRow?.value) && cctvRow.value.length > 0) {
          setCctvState(cctvRow.value as CctvCamera[]);
        } else {
          await supabase.from('rw10_settings').upsert({ key: 'cctv', value: DEFAULT_CCTV });
          setCctvState(DEFAULT_CCTV);
        }

        // Warga
        if (wargaRes.data && wargaRes.data.length > 0) {
          const list = wargaRes.data.map(mapWargaFromDb);
          wargaRef.current = list;
          setWargaState(list);
        } else {
          await supabase.from('rw10_warga').upsert(DEFAULT_WARGA.map(mapWargaToDb));
          wargaRef.current = DEFAULT_WARGA;
          setWargaState(DEFAULT_WARGA);
        }

        // Surat
        if (suratRes.data && suratRes.data.length > 0) {
          const list = suratRes.data.map(mapSuratFromDb);
          suratRef.current = list;
          setSuratState(list);
        } else {
          await supabase.from('rw10_surat').upsert(DEFAULT_SURAT.map(mapSuratToDb));
          suratRef.current = DEFAULT_SURAT;
          setSuratState(DEFAULT_SURAT);
        }

        // Aduan
        if (aduanRes.data && aduanRes.data.length > 0) {
          const list = aduanRes.data as Aduan[];
          aduanRef.current = list;
          setAduanState(list);
        } else {
          await supabase.from('rw10_aduan').upsert(DEFAULT_ADUAN);
          aduanRef.current = DEFAULT_ADUAN;
          setAduanState(DEFAULT_ADUAN);
        }

        // Keuangan
        if (keuanganRes.data && keuanganRes.data.length > 0) {
          const list = keuanganRes.data.map((t) => ({
            id: String(t.id),
            tanggal: String(t.tanggal),
            keterangan: String(t.keterangan),
            tipe: t.tipe as 'masuk' | 'keluar',
            nominal: Number(t.nominal),
          }));
          keuanganRef.current = list;
          setKeuanganState(list);
        } else {
          await supabase.from('rw10_keuangan').upsert(DEFAULT_KEUANGAN);
          keuanganRef.current = DEFAULT_KEUANGAN;
          setKeuanganState(DEFAULT_KEUANGAN);
        }

        // Berita
        if (beritaRes.data && beritaRes.data.length > 0) {
          const list = beritaRes.data as Berita[];
          beritaRef.current = list;
          setBeritaState(list);
        } else {
          await supabase.from('rw10_berita').upsert(DEFAULT_BERITA);
          beritaRef.current = DEFAULT_BERITA;
          setBeritaState(DEFAULT_BERITA);
        }

        // UMKM
        if (umkmRes.data && umkmRes.data.length > 0) {
          const list = umkmRes.data as Umkm[];
          umkmRef.current = list;
          setUmkmState(list);
        } else {
          await supabase.from('rw10_umkm').upsert(DEFAULT_UMKM);
          umkmRef.current = DEFAULT_UMKM;
          setUmkmState(DEFAULT_UMKM);
        }
      } catch {
        // Fallback to local if network fails
      } finally {
        if (active) setHydrated(true);
      }
    }

    const raf = window.requestAnimationFrame(() => {
      void hydrateData();
    });
    return () => {
      active = false;
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const setPengurusRw = useCallback((val: PengurusRw) => {
    setPengurusRwState(val);
    writeLocal(STORAGE_KEYS.PENGURUS_RW, val);
    if (supabase) {
      void supabase.from('rw10_settings').upsert({ key: 'pengurus_rw', value: val });
    }
  }, []);

  const setPengurusRt = useCallback((val: PengurusRtMap) => {
    setPengurusRtState(val);
    writeLocal(STORAGE_KEYS.PENGURUS_RT, val);
    if (supabase) {
      void supabase.from('rw10_settings').upsert({ key: 'pengurus_rt', value: val });
    }
  }, []);

  const setWarga = useCallback((val: Warga[]) => {
    const prev = wargaRef.current;
    wargaRef.current = val;
    setWargaState(val);
    writeLocal(STORAGE_KEYS.WARGA, val);
    void syncCollection('rw10_warga', 'id', prev, val, mapWargaToDb, (w) => w.id);
  }, []);

  const setSurat = useCallback((val: Surat[]) => {
    const prev = suratRef.current;
    suratRef.current = val;
    setSuratState(val);
    writeLocal(STORAGE_KEYS.SURAT, val);
    void syncCollection('rw10_surat', 'kode', prev, val, mapSuratToDb, (s) => s.kode);
  }, []);

  const setAduan = useCallback((val: Aduan[]) => {
    const prev = aduanRef.current;
    aduanRef.current = val;
    setAduanState(val);
    writeLocal(STORAGE_KEYS.ADUAN, val);
    void syncCollection(
      'rw10_aduan',
      'id',
      prev,
      val,
      (a) => ({
        id: a.id,
        tanggal: a.tanggal,
        nama: a.nama,
        kategori: a.kategori,
        deskripsi: a.deskripsi,
        wa: a.wa || '',
        status: a.status,
        tanggapan: a.tanggapan || '',
      }),
      (a) => a.id
    );
  }, []);

  const setKeuangan = useCallback((val: TransaksiKas[]) => {
    const prev = keuanganRef.current;
    keuanganRef.current = val;
    setKeuanganState(val);
    writeLocal(STORAGE_KEYS.KEUANGAN, val);
    void syncCollection(
      'rw10_keuangan',
      'id',
      prev,
      val,
      (t) => ({
        id: t.id,
        tanggal: t.tanggal,
        keterangan: t.keterangan,
        tipe: t.tipe,
        nominal: Number(t.nominal),
      }),
      (t) => t.id
    );
  }, []);

  const setBerita = useCallback((val: Berita[]): boolean => {
    const prev = beritaRef.current;
    beritaRef.current = val;
    setBeritaState(val);
    writeLocal(STORAGE_KEYS.BERITA, val);
    void syncCollection(
      'rw10_berita',
      'id',
      prev,
      val,
      (b) => ({
        id: b.id,
        tanggal: b.tanggal,
        kategori: b.kategori,
        penulis: b.penulis,
        foto: b.foto || '',
        caption: b.caption || '',
        judul: b.judul,
        isi: b.isi,
      }),
      (b) => b.id
    );
    return true;
  }, []);

  const setUmkm = useCallback((val: Umkm[]) => {
    const prev = umkmRef.current;
    umkmRef.current = val;
    setUmkmState(val);
    writeLocal(STORAGE_KEYS.UMKM, val);
    void syncCollection(
      'rw10_umkm',
      'id',
      prev,
      val,
      (u) => ({
        id: u.id,
        nama: u.nama,
        kategori: u.kategori,
        pemilik: u.pemilik,
        deskripsi: u.deskripsi,
        wa: u.wa,
      }),
      (u) => u.id
    );
  }, []);

  const setHeroBg = useCallback((url: string | null) => {
    const nextUrl = url || DEFAULT_HERO_BG;
    setHeroBgState(nextUrl);
    if (typeof window !== 'undefined') {
      if (!url) window.localStorage.removeItem(STORAGE_KEYS.HERO_BG);
      else window.localStorage.setItem(STORAGE_KEYS.HERO_BG, url);
    }
    if (supabase) {
      void supabase.from('rw10_settings').upsert({ key: 'hero_bg', value: nextUrl });
    }
  }, []);

  const setCctv = useCallback((cams: CctvCamera[]) => {
    setCctvState(cams);
    writeLocal(STORAGE_KEYS.CCTV, cams);
    if (supabase) {
      void supabase.from('rw10_settings').upsert({ key: 'cctv', value: cams });
    }
  }, []);

  const openModal = useCallback((id: ModalId) => {
    setActiveModal(id);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  useEffect(() => {
    if (activeModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal) {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeModal]);

  const setAdminTab = useCallback(
    (tabName: AdminTab) => {
      const rwOnlyTabs: AdminTab[] = ['keuangan', 'pengurus-rw', 'pengurus-rt', 'konten'];
      if (session?.role === 'RT' && rwOnlyTabs.includes(tabName)) {
        showToast('Fitur ini khusus kewenangan Pengurus RW 10.', 'error');
        return;
      }
      setAdminTabState(tabName);
    },
    [session, showToast]
  );

  const openServiceModal = useCallback((jenis: string) => {
    setServiceJenis(jenis);
    setActiveModal('modal-service-form');
  }, []);

  const openStatusSearchModal = useCallback((q: string) => {
    setStatusQuery(q);
    setActiveModal('modal-cek-status');
  }, []);

  const openBeritaDetail = useCallback((id: string) => {
    setSelectedBeritaId(id);
    setActiveModal('modal-berita');
  }, []);

  const openBeritaIndex = useCallback(() => {
    setSelectedBeritaId(null);
    setActiveModal('modal-berita');
  }, []);

  const openUmkmCategoryModal = useCallback((category: string) => {
    setUmkmModalCategory(category);
    setActiveModal('modal-umkm-list');
  }, []);

  const openWargaFormModal = useCallback((editId: string | null = null) => {
    setEditingWargaId(editId);
    setActiveModal('modal-warga-form');
  }, []);

  const openDeleteWargaModal = useCallback((id: string) => {
    setPendingDeleteWargaId(id);
    setActiveModal('modal-confirm-delete');
  }, []);

  const openPrintLetterModal = useCallback((kode: string) => {
    setPrintSuratKode(kode);
    setActiveModal('modal-print-letter');
  }, []);

  const downloadSuratDocx = useCallback(
    async (kode: string) => {
      const target = surat.find((s) => s.kode === kode);
      if (!target) {
        showToast(`Data surat tidak ditemukan untuk ID: ${kode}`, 'error');
        return;
      }
      const matchedWarga = warga.find(
        (w) => (w.idWarga || '').toUpperCase() === (target.idWarga || '').toUpperCase()
      );
      try {
        await generateAndDownloadSuratDocx(target, pengurusRw, pengurusRt, matchedWarga);
        showToast('File Microsoft Word (.docx) berhasil diunduh!', 'success');
      } catch {
        showToast('Gagal membuat file .docx.', 'error');
      }
    },
    [surat, warga, pengurusRw, pengurusRt, showToast]
  );

  return (
    <Rw10Context.Provider
      value={{
        hydrated,
        pengurusRw,
        setPengurusRw,
        pengurusRt,
        setPengurusRt,
        warga,
        setWarga,
        surat,
        setSurat,
        aduan,
        setAduan,
        keuangan,
        setKeuangan,
        berita,
        setBerita,
        umkm,
        setUmkm,
        heroBg,
        setHeroBg,
        cctv,
        setCctv,
        session,
        setSession,
        viewMode,
        setViewMode,
        adminTab,
        setAdminTab,
        activeModal,
        openModal,
        closeModal,
        serviceJenis,
        openServiceModal,
        regSuccessData,
        setRegSuccessData,
        statusQuery,
        setStatusQuery,
        openStatusSearchModal,
        selectedBeritaId,
        openBeritaDetail,
        openBeritaIndex,
        umkmModalCategory,
        openUmkmCategoryModal,
        editingWargaId,
        openWargaFormModal,
        pendingDeleteWargaId,
        openDeleteWargaModal,
        printSuratKode,
        openPrintLetterModal,
        downloadSuratDocx,
        toasts,
        showToast,
      }}
    >
      {children}
    </Rw10Context.Provider>
  );
}

export function useRw10(): Rw10ContextValue {
  const ctx = useContext(Rw10Context);
  if (!ctx) throw new Error('useRw10 must be used within Rw10Provider');
  return ctx;
}
