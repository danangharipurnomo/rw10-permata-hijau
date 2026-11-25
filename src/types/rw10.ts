export type RtKey = 'RT 01' | 'RT 02' | 'RT 03' | 'RT 04' | 'RT 05';

export interface PengurusInti {
  nama: string;
  wa: string;
}

export interface BidangItem {
  bidang: string;
  koordinator: string;
}

export interface PengurusRw {
  ketua: PengurusInti;
  sekretaris: PengurusInti;
  bendahara: PengurusInti;
  bidang: BidangItem[];
}

export interface PengurusRtItem {
  ketua: string;
  sekretaris: string;
  bendahara1: string;
  bendahara2: string;
}

export type PengurusRtMap = Record<RtKey, PengurusRtItem>;

export type JenisKelamin = 'Laki-laki' | 'Perempuan';
export type StatusHunian = 'Warga Tetap' | 'Kontrak' | 'Kos';
export type StatusKeluarga = 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Lainnya';
export type StatusKependudukan = 'Aktif' | 'Pindah' | 'Meninggal';

export interface Warga {
  id: string;
  idWarga: string;
  idRumah: string;
  nama: string;
  jk: JenisKelamin | string;
  tgllahir: string;
  rt: RtKey | string;
  blok: string;
  hunian: StatusHunian | string;
  keluarga: StatusKeluarga | string;
  wa: string;
  status: StatusKependudukan | string;
}

export type StatusSurat =
  | 'Menunggu Verifikasi RT'
  | 'Menunggu Pengesahan RW'
  | 'Disetujui & Siap Cetak'
  | 'Ditolak';

export interface Surat {
  kode: string;
  tanggal: string;
  jenis: string;
  nama: string;
  idWarga: string;
  rt: RtKey | string;
  keperluan: string;
  wa: string;
  email: string;
  status: StatusSurat | string;
}

export type StatusAduan = 'Baru' | 'Diproses' | 'Selesai';

export interface Aduan {
  id: string;
  tanggal: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  wa: string;
  status: StatusAduan | string;
  tanggapan: string;
}

export type TipeTransaksi = 'masuk' | 'keluar';

export interface TransaksiKas {
  id: string;
  tanggal: string;
  keterangan: string;
  tipe: TipeTransaksi;
  nominal: number;
}

export interface Berita {
  id: string;
  tanggal: string;
  kategori: string;
  penulis: string;
  foto: string;
  caption: string;
  judul: string;
  isi: string;
}

export interface Umkm {
  id: string;
  nama: string;
  kategori: string;
  pemilik: string;
  deskripsi: string;
  wa: string;
}

export interface AdminSession {
  username: string;
  role: 'RW' | 'RT';
  rtScope: RtKey | null;
  label: string;
}

export type AdminTab =
  | 'dashboard'
  | 'warga'
  | 'surat'
  | 'pengaduan'
  | 'keuangan'
  | 'pengurus-rw'
  | 'pengurus-rt'
  | 'konten';

export type ModalId =
  | 'modal-sejarah'
  | 'modal-organogram'
  | 'modal-daftar-rt'
  | 'modal-fasilitas'
  | 'modal-shortcut-layanan'
  | 'modal-service-form'
  | 'modal-reg-success'
  | 'modal-pengaduan'
  | 'modal-cek-status'
  | 'modal-peraturan'
  | 'modal-berita'
  | 'modal-keuangan'
  | 'modal-bank-sampah'
  | 'modal-gsg'
  | 'modal-tps'
  | 'modal-umkm-list'
  | 'modal-daftar-umkm-warga'
  | 'modal-shortcut-agenda'
  | 'modal-agenda-kerjabakti'
  | 'modal-agenda-rapat'
  | 'modal-agenda-even'
  | 'modal-kontak'
  | 'modal-login'
  | 'modal-warga-form'
  | 'modal-confirm-delete'
  | 'modal-print-letter';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}
