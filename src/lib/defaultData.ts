import {
  Aduan,
  Berita,
  PengurusRtMap,
  PengurusRw,
  RtKey,
  Surat,
  TransaksiKas,
  Umkm,
  Warga,
} from '@/types/rw10';

export const STORAGE_KEYS = {
  PENGURUS_RW: 'rw10_pengurus_rw',
  PENGURUS_RT: 'rw10_pengurus_rt',
  WARGA: 'rw10_warga_v2',
  SURAT: 'rw10_surat_v2',
  ADUAN: 'rw10_pengaduan',
  KEUANGAN: 'rw10_keuangan',
  BERITA: 'rw10_berita',
  UMKM: 'rw10_umkm',
  HERO_BG: 'rw10_hero_bg',
} as const;

export const DEFAULT_HERO_BG =
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1920&q=80';

export const DEFAULT_BERITA_IMG =
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=900&q=80';

export const RT_LIST: RtKey[] = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

export const BERITA_CATEGORIES = [
  'Kegiatan Warga',
  'Layanan',
  'Kesehatan',
  'Keamanan',
  'Pengumuman',
] as const;

export const UMKM_CATEGORIES = [
  'Kuliner',
  'Hasil Kriya',
  'Konveksi',
  'Jasa Pariwisata',
  'Usaha Lainnya',
] as const;

export const DEFAULT_PENGURUS_RW: PengurusRw = {
  ketua: { nama: 'H. Bambang Sutrisno', wa: '6281234567001' },
  sekretaris: { nama: 'Arif Budiman, S.E.', wa: '6281234567002' },
  bendahara: { nama: 'Dra. Siti Rahmawati', wa: '6281234567003' },
  bidang: [
    { bidang: 'Bidang Keamanan & Ketertiban', koordinator: 'Bpk. Hendra Wijaya' },
    { bidang: 'Bidang Kebersihan & Lingkungan Hidup', koordinator: 'Bpk. Agus Santoso' },
    { bidang: 'Bidang Sosial & Kemasyarakatan', koordinator: 'Ibu Ratna Dewi' },
    { bidang: 'Bidang Pemuda, Olahraga & Humas', koordinator: 'Sdr. Dimas Pratama' },
  ],
};

export const DEFAULT_PENGURUS_RT: PengurusRtMap = {
  'RT 01': { ketua: 'Bpk. Joko Widodo', sekretaris: 'Bpk. Eko Prasetyo', bendahara1: 'Ibu Sri Wahyuni', bendahara2: 'Ibu Lestari' },
  'RT 02': { ketua: 'Bpk. Slamet Riyadi', sekretaris: 'Bpk. Fajar Nugroho', bendahara1: 'Ibu Yuniarti', bendahara2: 'Ibu Endang' },
  'RT 03': { ketua: 'Bpk. Sugeng Raharjo', sekretaris: 'Bpk. Bayu Aji', bendahara1: 'Ibu Rina Kusuma', bendahara2: 'Ibu Wati' },
  'RT 04': { ketua: 'Bpk. Wahyu Hidayat', sekretaris: 'Bpk. Rizky Maulana', bendahara1: 'Ibu Ani Suryani', bendahara2: 'Ibu Dewi' },
  'RT 05': { ketua: 'Bpk. Ahmad Fauzi', sekretaris: 'Bpk. Dedi Kurniawan', bendahara1: 'Ibu Nurul Huda', bendahara2: 'Ibu Fitri' },
};

export const DEFAULT_WARGA: Warga[] = [
  { id: 'WRG-001', idWarga: 'RW10-01A04-01', idRumah: 'RW10-01A04', nama: 'Andi Saputra', jk: 'Laki-laki', tgllahir: '1992-05-12', rt: 'RT 01', blok: 'Blok A-04', hunian: 'Warga Tetap', keluarga: 'Kepala Keluarga', wa: '6281327001122', status: 'Aktif' },
  { id: 'WRG-002', idWarga: 'RW10-01A04-02', idRumah: 'RW10-01A04', nama: 'Dian Pertiwi', jk: 'Perempuan', tgllahir: '1994-08-14', rt: 'RT 01', blok: 'Blok A-04', hunian: 'Warga Tetap', keluarga: 'Istri', wa: '6281327001123', status: 'Aktif' },
  { id: 'WRG-003', idWarga: 'RW10-01A04-03', idRumah: 'RW10-01A04', nama: 'Raffa Saputra', jk: 'Laki-laki', tgllahir: '2019-03-10', rt: 'RT 01', blok: 'Blok A-04', hunian: 'Warga Tetap', keluarga: 'Anak', wa: '', status: 'Aktif' },
  { id: 'WRG-004', idWarga: 'RW10-01A12-01', idRumah: 'RW10-01A12', nama: 'Budi Hartono', jk: 'Laki-laki', tgllahir: '1980-02-15', rt: 'RT 01', blok: 'Blok A-12', hunian: 'Warga Tetap', keluarga: 'Kepala Keluarga', wa: '6281227004411', status: 'Aktif' },
  { id: 'WRG-005', idWarga: 'RW10-01A12-02', idRumah: 'RW10-01A12', nama: 'Yanti Wulandari', jk: 'Perempuan', tgllahir: '1982-07-20', rt: 'RT 01', blok: 'Blok A-12', hunian: 'Warga Tetap', keluarga: 'Istri', wa: '6281328001122', status: 'Aktif' },
  { id: 'WRG-006', idWarga: 'RW10-02B02-01', idRumah: 'RW10-02B02', nama: 'Slamet Riyadi', jk: 'Laki-laki', tgllahir: '1985-11-05', rt: 'RT 02', blok: 'Blok B-02', hunian: 'Warga Tetap', keluarga: 'Kepala Keluarga', wa: '6285641112201', status: 'Aktif' },
  { id: 'WRG-007', idWarga: 'RW10-02B02-02', idRumah: 'RW10-02B02', nama: 'Siti Aminah', jk: 'Perempuan', tgllahir: '1987-04-08', rt: 'RT 02', blok: 'Blok B-02', hunian: 'Warga Tetap', keluarga: 'Istri', wa: '6285641112202', status: 'Aktif' },
  { id: 'WRG-008', idWarga: 'RW10-02B09-01', idRumah: 'RW10-02B09', nama: 'Bagus Setiawan', jk: 'Laki-laki', tgllahir: '1996-09-22', rt: 'RT 02', blok: 'Blok B-09', hunian: 'Kontrak', keluarga: 'Kepala Keluarga', wa: '6281578009900', status: 'Aktif' },
  { id: 'WRG-009', idWarga: 'RW10-03C10-01', idRumah: 'RW10-03C10', nama: 'Hendra Wijaya', jk: 'Laki-laki', tgllahir: '1978-06-18', rt: 'RT 03', blok: 'Blok C-10', hunian: 'Warga Tetap', keluarga: 'Kepala Keluarga', wa: '6281328007788', status: 'Aktif' },
  { id: 'WRG-010', idWarga: 'RW10-03C10-02', idRumah: 'RW10-03C10', nama: 'Ratna Dewi', jk: 'Perempuan', tgllahir: '1981-01-11', rt: 'RT 03', blok: 'Blok C-10', hunian: 'Warga Tetap', keluarga: 'Istri', wa: '6281328007789', status: 'Aktif' },
  { id: 'WRG-011', idWarga: 'RW10-03C15-01', idRumah: 'RW10-03C15', nama: 'Dimas Pratama', jk: 'Laki-laki', tgllahir: '2001-10-09', rt: 'RT 03', blok: 'Blok C-15', hunian: 'Kos', keluarga: 'Lainnya', wa: '6289612345678', status: 'Aktif' },
  { id: 'WRG-012', idWarga: 'RW10-04D03-01', idRumah: 'RW10-04D03', nama: 'Suryo Pranoto', jk: 'Laki-laki', tgllahir: '1975-03-25', rt: 'RT 04', blok: 'Blok D-03', hunian: 'Warga Tetap', keluarga: 'Kepala Keluarga', wa: '6281328003344', status: 'Aktif' },
  { id: 'WRG-013', idWarga: 'RW10-04D03-02', idRumah: 'RW10-04D03', nama: 'Ani Suryani', jk: 'Perempuan', tgllahir: '1977-12-22', rt: 'RT 04', blok: 'Blok D-03', hunian: 'Warga Tetap', keluarga: 'Istri', wa: '6281328003345', status: 'Aktif' },
  { id: 'WRG-014', idWarga: 'RW10-05E01-01', idRumah: 'RW10-05E01', nama: 'Ahmad Fauzi', jk: 'Laki-laki', tgllahir: '1988-08-14', rt: 'RT 05', blok: 'Blok E-01', hunian: 'Warga Tetap', keluarga: 'Kepala Keluarga', wa: '6281215556677', status: 'Aktif' },
  { id: 'WRG-015', idWarga: 'RW10-05E01-02', idRumah: 'RW10-05E01', nama: 'Nurul Huda', jk: 'Perempuan', tgllahir: '1990-05-03', rt: 'RT 05', blok: 'Blok E-01', hunian: 'Warga Tetap', keluarga: 'Istri', wa: '6281215556678', status: 'Aktif' },
];

export const DEFAULT_SURAT: Surat[] = [
  {
    kode: 'RW10-2026-001',
    tanggal: '2026-11-18',
    jenis: 'Surat Pengantar',
    nama: 'Andi Saputra',
    idWarga: 'RW10-01A04-01',
    rt: 'RT 01',
    keperluan: 'Pembuatan Surat Keterangan Catatan Kepolisian (SKCK) di Polsek Mojotengah',
    wa: '6281327001122',
    email: 'andi.saputra@email.com',
    status: 'Disetujui & Siap Cetak',
  },
  {
    kode: 'RW10-2026-002',
    tanggal: '2026-11-20',
    jenis: 'Mutasi Kependudukan',
    nama: 'Bagus Setiawan',
    idWarga: 'RW10-02B09-01',
    rt: 'RT 02',
    keperluan: 'Lapor warga kontrak baru pindahan dari Semarang di Blok B-09 RT 02',
    wa: '6281578009900',
    email: 'bagus.setiawan@email.com',
    status: 'Menunggu Pengesahan RW',
  },
  {
    kode: 'RW10-2026-003',
    tanggal: '2026-11-21',
    jenis: 'Usulan Perlindungan Sosial',
    nama: 'Yanti Wulandari',
    idWarga: 'RW10-01A12-02',
    rt: 'RT 01',
    keperluan: 'Pengajuan permohonan DTKS & KIS PBI bantuan kesehatan keluarga',
    wa: '6281328001122',
    email: '',
    status: 'Menunggu Verifikasi RT',
  },
];

export const DEFAULT_ADUAN: Aduan[] = [
  {
    id: 'ADU-001',
    tanggal: '2026-11-19',
    nama: 'Bpk. Kurniawan (Blok C-05)',
    kategori: 'Infrastruktur',
    deskripsi: 'Lampu penerangan jalan utama di persimpangan Blok C padam sejak 2 malam lalu.',
    wa: '6281229998877',
    status: 'Diproses',
    tanggapan: 'Sudah dijadwalkan penggantian bohlam LED oleh tim keamanan besok pagi.',
  },
  {
    id: 'ADU-002',
    tanggal: '2026-11-20',
    nama: 'Ibu Ratna (Blok A-08)',
    kategori: 'Kebersihan',
    deskripsi: 'Saluran air di ujung Blok A tersumbat dedaunan menjelang musim hujan.',
    wa: '6281328007789',
    status: 'Baru',
    tanggapan: '',
  },
];

export const DEFAULT_KEUANGAN: TransaksiKas[] = [
  { id: 'TRX-1', tanggal: '2026-11-01', keterangan: 'Saldo Awal Kas RW 10 Bulan November 2026', tipe: 'masuk', nominal: 12500000 },
  { id: 'TRX-2', tanggal: '2026-11-10', keterangan: 'Setoran Iuran Kas Lingkungan Terpadu RT 01 - 05', tipe: 'masuk', nominal: 4500000 },
  { id: 'TRX-3', tanggal: '2026-11-14', keterangan: 'Honor Petugas Keamanan Pos Satpam & Petugas TPS', tipe: 'keluar', nominal: 2800000 },
  { id: 'TRX-4', tanggal: '2026-11-17', keterangan: 'Perawatan Lampu PJU & Pembelian Cairan Obat Fogging', tipe: 'keluar', nominal: 950000 },
];

export const DEFAULT_BERITA: Berita[] = [
  {
    id: 'BRT-1',
    tanggal: '2026-11-19',
    kategori: 'Kegiatan Warga',
    penulis: 'Tim Humas RW 10',
    foto: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=80',
    caption: 'Suasana gotong royong warga RW 10 membersihkan saluran air dan fasilitas umum lingkungan.',
    judul: 'Kerja Bakti Rutin & Fogging Serentak RW 10 Digelar Akhir Pekan Ini',
    isi: 'Wonosobo - Pengurus RW 10 Perumahan Permata Hijau mengimbau seluruh kepala keluarga dari RT 01 hingga RT 05 untuk berpartisipasi dalam kegiatan kerja bakti rutin dan fogging serentak pada Minggu, 22 November 2026 mulai pukul 07.00 WIB.\n\nKegiatan difokuskan pada pembersihan saluran drainase utama dari endapan lumpur serta pemangkasan dahan pohon guna mengantisipasi curah hujan tinggi. Tim kesehatan lingkungan juga akan melakukan pengasapan (fogging) di seluruh blok perumahan untuk mencegah penyebaran Demam Berdarah Dengue (DBD).\n\nWarga diharapkan membawa perlengkapan kebersihan masing-masing seperti cangkul, sapu lidi, dan kantong sampah. Konsumsi ringan disediakan di titik kumpul masing-masing RT.',
  },
  {
    id: 'BRT-2',
    tanggal: '2026-11-15',
    kategori: 'Layanan',
    penulis: 'Sekretariat RW 10',
    foto: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1000&q=80',
    caption: 'Layanan surat pengantar online RW 10 memudahkan warga mengurus administrasi kependudukan.',
    judul: 'Layanan Pengajuan Surat Digital RW 10 Resmi Beroperasi 24 Jam',
    isi: 'Wonosobo - Guna meningkatkan kecepatan pelayanan administrasi warga, Sekretariat RW 10 Permata Hijau resmi meluncurkan layanan pengajuan surat pengantar digital yang dapat diakses kapan saja melalui portal warga.\n\nMelalui sistem ini, warga cukup memasukkan ID Warga RW 10 (tanpa perlu menginput NIK demi keamanan data pribadi) untuk mengisi formulir otomatis, lalu memantau proses verifikasi dari Ketua RT hingga pengesahan Ketua RW secara transparan. Surat yang telah disetujui dapat langsung diunduh dalam format PDF maupun dokumen Microsoft Word (.docx).',
  },
  {
    id: 'BRT-3',
    tanggal: '2026-11-10',
    kategori: 'Kesehatan',
    penulis: 'Kader Posyandu RW 10',
    foto: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1000&q=80',
    caption: 'Pelayanan cek kesehatan rutin bagi lansia dan penimbangan balita di Gedung Serba Guna.',
    judul: 'Posyandu Balita & Skrining Kesehatan Lansia Gratis di GSG',
    isi: 'Wonosobo - Kader Posyandu bersama bidan Kelurahan Mudal kembali menyelenggarakan pemeriksaan tumbuh kembang balita, pemberian vitamin, serta skrining kesehatan gratis bagi warga lanjut usia di Gedung Serba Guna (GSG) RW 10.\n\nLayanan meliputi pengecekan tekanan darah, gula darah sewaktu, dan konsultasi gizi. Warga lansia diimbau hadir mulai pukul 08.00 WIB dengan membawa kartu identitas.',
  },
];

export const DEFAULT_UMKM: Umkm[] = [
  {
    id: 'UMKM-1',
    nama: 'Mie Ongklok & Sate Bu Yanti',
    kategori: 'Kuliner',
    pemilik: 'Ibu Yanti (Blok A-12 / RT 01)',
    deskripsi: 'Kuliner khas Wonosobo hangat, menerima pesanan katering rapat & arisan warga.',
    wa: '6281328001122',
  },
  {
    id: 'UMKM-2',
    nama: 'Kriya Bambu Permata',
    kategori: 'Hasil Kriya',
    pemilik: 'Bpk. Suryo (Blok D-03 / RT 04)',
    deskripsi: 'Kerajinan kap lampu hias, besek hantaran, dan souvenir bambu khas Wonosobo.',
    wa: '6281328003344',
  },
  {
    id: 'UMKM-3',
    nama: 'Jahit & Konveksi Seragam Amanah',
    kategori: 'Konveksi',
    pemilik: 'Ibu Rina (Blok B-08 / RT 02)',
    deskripsi: 'Jahit seragam PKK, seragam olahraga RT, permak pakaian cepat rapi.',
    wa: '6281328005566',
  },
  {
    id: 'UMKM-4',
    nama: 'Dieng Highland Tour & Rent Car',
    kategori: 'Jasa Pariwisata',
    pemilik: 'Bpk. Hendra (Blok C-10 / RT 03)',
    deskripsi: 'Paket trip Dieng Plateau, sewa mobil Avanza/Innova ber-AC + sopir ramah.',
    wa: '6281328007788',
  },
];
