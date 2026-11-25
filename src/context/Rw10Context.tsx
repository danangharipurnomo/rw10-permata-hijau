'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  AdminSession,
  AdminTab,
  Aduan,
  Berita,
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
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
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
    const raf = window.requestAnimationFrame(() => {
      setPengurusRwState(readLocal(STORAGE_KEYS.PENGURUS_RW, DEFAULT_PENGURUS_RW));
      setPengurusRtState(readLocal(STORAGE_KEYS.PENGURUS_RT, DEFAULT_PENGURUS_RT));
      setWargaState(readLocal(STORAGE_KEYS.WARGA, DEFAULT_WARGA));
      setSuratState(readLocal(STORAGE_KEYS.SURAT, DEFAULT_SURAT));
      setAduanState(readLocal(STORAGE_KEYS.ADUAN, DEFAULT_ADUAN));
      setKeuanganState(readLocal(STORAGE_KEYS.KEUANGAN, DEFAULT_KEUANGAN));
      setBeritaState(readLocal(STORAGE_KEYS.BERITA, DEFAULT_BERITA));
      setUmkmState(readLocal(STORAGE_KEYS.UMKM, DEFAULT_UMKM));
      const savedBg = window.localStorage.getItem(STORAGE_KEYS.HERO_BG);
      if (savedBg) setHeroBgState(savedBg);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(raf);
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
    window.localStorage.setItem(STORAGE_KEYS.PENGURUS_RW, JSON.stringify(val));
  }, []);

  const setPengurusRt = useCallback((val: PengurusRtMap) => {
    setPengurusRtState(val);
    window.localStorage.setItem(STORAGE_KEYS.PENGURUS_RT, JSON.stringify(val));
  }, []);

  const setWarga = useCallback((val: Warga[]) => {
    setWargaState(val);
    window.localStorage.setItem(STORAGE_KEYS.WARGA, JSON.stringify(val));
  }, []);

  const setSurat = useCallback((val: Surat[]) => {
    setSuratState(val);
    window.localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(val));
  }, []);

  const setAduan = useCallback((val: Aduan[]) => {
    setAduanState(val);
    window.localStorage.setItem(STORAGE_KEYS.ADUAN, JSON.stringify(val));
  }, []);

  const setKeuangan = useCallback((val: TransaksiKas[]) => {
    setKeuanganState(val);
    window.localStorage.setItem(STORAGE_KEYS.KEUANGAN, JSON.stringify(val));
  }, []);

  const setBerita = useCallback((val: Berita[]): boolean => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.BERITA, JSON.stringify(val));
      setBeritaState(val);
      return true;
    } catch {
      return false;
    }
  }, []);

  const setUmkm = useCallback((val: Umkm[]) => {
    setUmkmState(val);
    window.localStorage.setItem(STORAGE_KEYS.UMKM, JSON.stringify(val));
  }, []);

  const setHeroBg = useCallback((url: string | null) => {
    if (!url) {
      window.localStorage.removeItem(STORAGE_KEYS.HERO_BG);
      setHeroBgState(DEFAULT_HERO_BG);
    } else {
      window.localStorage.setItem(STORAGE_KEYS.HERO_BG, url);
      setHeroBgState(url);
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
