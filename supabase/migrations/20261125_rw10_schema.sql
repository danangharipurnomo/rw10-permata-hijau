-- RW 10 Permata Hijau Isolated Schema (rw10_ prefix)
-- Safe to co-exist in klinik-permata-hijau Supabase project

CREATE TABLE IF NOT EXISTS public.rw10_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rw10_warga (
  id TEXT PRIMARY KEY,
  id_warga TEXT UNIQUE NOT NULL,
  id_rumah TEXT NOT NULL,
  nama TEXT NOT NULL,
  jk TEXT NOT NULL,
  tgllahir TEXT DEFAULT '',
  rt TEXT NOT NULL,
  blok TEXT NOT NULL,
  hunian TEXT NOT NULL,
  keluarga TEXT NOT NULL,
  wa TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rw10_surat (
  kode TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  jenis TEXT NOT NULL,
  nama TEXT NOT NULL,
  id_warga TEXT DEFAULT '',
  rt TEXT NOT NULL,
  keperluan TEXT NOT NULL,
  wa TEXT DEFAULT '',
  email TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Menunggu Verifikasi RT',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rw10_aduan (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  wa TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Baru',
  tanggapan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rw10_keuangan (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  keterangan TEXT NOT NULL,
  tipe TEXT NOT NULL,
  nominal BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rw10_berita (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  kategori TEXT NOT NULL,
  penulis TEXT NOT NULL,
  foto TEXT DEFAULT '',
  caption TEXT DEFAULT '',
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rw10_umkm (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  pemilik TEXT NOT NULL,
  deskripsi TEXT NOT NULL,
  wa TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS with open portal policies (public + dashboard)
ALTER TABLE public.rw10_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rw10_warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rw10_surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rw10_aduan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rw10_keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rw10_berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rw10_umkm ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'rw10_settings',
    'rw10_warga',
    'rw10_surat',
    'rw10_aduan',
    'rw10_keuangan',
    'rw10_berita',
    'rw10_umkm'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "rw10_all_%I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "rw10_all_%I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;
