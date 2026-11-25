'use client';

import React, { useState } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import { useRw10 } from '@/context/Rw10Context';
import { RT_LIST } from '@/lib/defaultData';
import { RtKey, Warga } from '@/types/rw10';

function WargaFormModalContent() {
  const {
    closeModal,
    session,
    warga,
    setWarga,
    editingWargaId,
    showToast,
  } = useRw10();

  const isRt = session?.role === 'RT';
  const target = editingWargaId ? warga.find((w) => w.id === editingWargaId) : undefined;

  const [idWarga, setIdWarga] = useState(() => target?.idWarga ?? '');
  const [idRumah, setIdRumah] = useState(() => target?.idRumah ?? '');
  const [nama, setNama] = useState(() => target?.nama ?? '');
  const [jk, setJk] = useState(() => target?.jk ?? 'Laki-laki');
  const [tgllahir, setTgllahir] = useState(() => target?.tgllahir ?? '');
  const [rt, setRt] = useState<RtKey>(
    () => (target?.rt as RtKey) || (isRt && session?.rtScope ? session.rtScope : 'RT 01')
  );
  const [blok, setBlok] = useState(() => target?.blok ?? '');
  const [hunian, setHunian] = useState(() => target?.hunian ?? 'Warga Tetap');
  const [keluarga, setKeluarga] = useState(() => target?.keluarga ?? 'Kepala Keluarga');
  const [wa, setWa] = useState(() => target?.wa ?? '');
  const [status, setStatus] = useState(() => target?.status ?? 'Aktif');

  const handleAutoGenerateIds = () => {
    const blokRaw = blok.trim();
    if (!blokRaw) {
      showToast('Isi kolom Blok / Nomor Rumah terlebih dahulu (cth: Blok A-10).', 'info');
      return;
    }
    const rtNum = rt.replace(/[^0-9]/g, '').padStart(2, '0');
    const blokCode = blokRaw
      .replace(/^blok\s*/i, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const genIdRumah = `RW10-${rtNum}${blokCode}`;
    const sameHouse = warga.filter(
      (w) => (w.idRumah || '').toUpperCase() === genIdRumah && w.id !== editingWargaId
    );
    const nextSeq = String(sameHouse.length + 1).padStart(2, '0');
    const genIdWarga = `${genIdRumah}-${nextSeq}`;
    setIdRumah(genIdRumah);
    setIdWarga(genIdWarga);
    showToast(`ID otomatis dibuat: ${genIdWarga}`, 'success');
  };

  const handleSaveWarga = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdWarga = idWarga.trim().toUpperCase();
    const cleanIdRumah = idRumah.trim().toUpperCase();

    const dup = warga.find(
      (w) => (w.idWarga || '').toUpperCase() === cleanIdWarga && w.id !== editingWargaId
    );
    if (dup) {
      showToast(`ID Warga ${cleanIdWarga} sudah terdaftar atas nama ${dup.nama}!`, 'error');
      return;
    }

    const cleanWa = wa.trim()
      ? wa.replace(/[^0-9]/g, '').replace(/^0/, '62')
      : '';

    const payload: Warga = {
      id: editingWargaId || 'WRG-' + Date.now().toString().slice(-6),
      idWarga: cleanIdWarga,
      idRumah: cleanIdRumah,
      nama: nama.trim(),
      jk,
      tgllahir,
      rt: isRt && session?.rtScope ? session.rtScope : rt,
      blok: blok.trim(),
      hunian,
      keluarga,
      wa: cleanWa,
      status,
    };

    if (editingWargaId) {
      setWarga(warga.map((w) => (w.id === editingWargaId ? payload : w)));
      showToast('Data warga berhasil diperbarui.', 'success');
    } else {
      setWarga([payload, ...warga]);
      showToast('Data warga baru berhasil ditambahkan.', 'success');
    }
    closeModal();
  };

  return (
    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Database Kependudukan RW 10
              </span>
              <h3 className="font-black text-lg text-slate-900 mt-0.5">
                {editingWargaId ? 'Edit Data Warga' : 'Tambah Data Warga'}
              </h3>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <form onSubmit={handleSaveWarga} className="p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-900">
                  <i className="fa-solid fa-id-card-clip mr-1" /> Identitas Internal RW 10
                  (Zero-NIK)
                </span>
                <button
                  type="button"
                  onClick={handleAutoGenerateIds}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition shadow-sm"
                >
                  <i className="fa-solid fa-wand-magic-sparkles mr-1" /> Buat ID Otomatis dari RT
                  &amp; Blok
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ID Warga (Individu) *
                  </label>
                  <input
                    type="text"
                    required
                    value={idWarga}
                    onChange={(e) => setIdWarga(e.target.value)}
                    placeholder="Cth: RW10-01A04-01"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ID Rumah / Keluarga *
                  </label>
                  <input
                    type="text"
                    required
                    value={idRumah}
                    onChange={(e) => setIdRumah(e.target.value)}
                    placeholder="Cth: RW10-01A04"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama lengkap sesuai KTP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  required
                  value={jk}
                  onChange={(e) => setJk(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  required
                  value={tgllahir}
                  onChange={(e) => setTgllahir(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RT *</label>
                <select
                  required
                  disabled={isRt}
                  value={rt}
                  onChange={(e) => setRt(e.target.value as RtKey)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold disabled:opacity-60"
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
                  Blok / Nomor Rumah *
                </label>
                <input
                  type="text"
                  required
                  value={blok}
                  onChange={(e) => setBlok(e.target.value)}
                  placeholder="Cth: Blok A-04"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Hunian *
                </label>
                <select
                  required
                  value={hunian}
                  onChange={(e) => setHunian(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Warga Tetap">Warga Tetap</option>
                  <option value="Kontrak">Kontrak</option>
                  <option value="Kos">Kos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status dalam Keluarga *
                </label>
                <select
                  required
                  value={keluarga}
                  onChange={(e) => setKeluarga(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Kepala Keluarga">Kepala Keluarga</option>
                  <option value="Istri">Istri</option>
                  <option value="Anak">Anak</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Kependudukan *
                </label>
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Pindah">Pindah</option>
                  <option value="Meninggal">Meninggal</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow transition flex items-center gap-1.5"
              >
                <i className="fa-solid fa-floppy-disk" /> Simpan Data Warga
              </button>
            </div>
          </form>
        </div>
  );
}

export default function AdminModals() {
  const {
    closeModal,
    warga,
    setWarga,
    surat,
    pengurusRw,
    pengurusRt,
    editingWargaId,
    pendingDeleteWargaId,
    printSuratKode,
    downloadSuratDocx,
    showToast,
  } = useRw10();

  const pendingDeleteTarget = pendingDeleteWargaId
    ? warga.find((w) => w.id === pendingDeleteWargaId)
    : null;

  const printSurat = printSuratKode ? surat.find((s) => s.kode === printSuratKode) : null;
  const printMatchedWarga = printSurat
    ? warga.find(
        (w) => (w.idWarga || '').toUpperCase() === (printSurat.idWarga || '').toUpperCase()
      )
    : null;

  return (
    <>
      {/* MODAL: FORM DATA WARGA */}
      <ModalWrapper id="modal-warga-form">
        <WargaFormModalContent key={editingWargaId || 'new'} />
      </ModalWrapper>

      {/* MODAL: KONFIRMASI HAPUS */}
      <ModalWrapper id="modal-confirm-delete" zIndexClass="z-[60]">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 border border-slate-100">
          <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
            <i className="fa-solid fa-trash-can" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Hapus Data Warga?</h3>
          <p className="text-xs text-slate-500">
            {pendingDeleteTarget
              ? `Yakin ingin menghapus data warga "${pendingDeleteTarget.nama}" (ID: ${pendingDeleteTarget.idWarga})?`
              : 'Data warga yang telah dihapus tidak dapat dipulihkan kembali.'}
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (pendingDeleteWargaId) {
                  setWarga(warga.filter((w) => w.id !== pendingDeleteWargaId));
                  showToast('Data warga berhasil dihapus.', 'info');
                }
                closeModal();
              }}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* MODAL: PRINTABLE OFFICIAL LETTER PREVIEW */}
      <ModalWrapper id="modal-print-letter" zIndexClass="z-[60]" backdropClass="bg-slate-950/70">
        {printSurat && (
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="no-print sticky top-0 bg-slate-900 text-white px-6 py-3.5 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-black text-sm">Pratinjau Surat Resmi RW 10</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs transition flex items-center gap-1.5 shadow"
                >
                  <i className="fa-solid fa-print" /> Cetak / Simpan PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadSuratDocx(printSurat.kode)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition shadow"
                >
                  <i className="fa-solid fa-file-word" /> Unduh .docx
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            <div
              id="printable-letter-area"
              className="p-8 sm:p-12 bg-white text-slate-900 font-serif leading-relaxed"
            >
              <div className="border-b-4 border-double border-slate-900 pb-3 mb-6 text-center">
                <p className="text-sm font-bold tracking-widest uppercase">
                  RUKUN WARGA 10 PERUMAHAN PERMATA HIJAU
                </p>
                <p className="text-base sm:text-lg font-black uppercase">
                  KELURAHAN MUDAL • KECAMATAN MOJOTENGAH
                </p>
                <p className="text-sm font-bold uppercase">
                  KABUPATEN WONOSOBO - PROVINSI JAWA TENGAH
                </p>
                <p className="text-[11px] italic mt-1 font-sans text-slate-700">
                  Sekretariat: Gedung Serba Guna RW 10 Perumahan Permata Hijau, Mudal, Mojotengah,
                  Wonosobo 56351
                </p>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-lg font-bold underline uppercase tracking-wider">
                  {printSurat.jenis.toUpperCase()}
                </h2>
                <p className="text-xs font-sans mt-1">
                  Nomor:{' '}
                  <span className="font-bold">
                    {printSurat.kode.replace('RW10-', '')}/RW10-PH/XI/{new Date().getFullYear()}
                  </span>
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <p>
                  Yang bertanda tangan di bawah ini, Pengurus Rukun Tetangga (RT) dan Rukun Warga
                  (RW) 10 Perumahan Permata Hijau, Kelurahan Mudal, Kecamatan Mojotengah, Kabupaten
                  Wonosobo, dengan ini menerangkan bahwa:
                </p>
                <table className="w-full text-xs sm:text-sm my-3 border-collapse">
                  <tbody>
                    <tr>
                      <td className="py-1 w-36">Nama Lengkap</td>
                      <td className="py-1 w-4">:</td>
                      <td className="py-1 font-bold">{printSurat.nama}</td>
                    </tr>
                    <tr>
                      <td className="py-1">ID Warga RW 10</td>
                      <td className="py-1">:</td>
                      <td className="py-1 font-mono font-bold">{printSurat.idWarga || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1">NIK (Diisi Manual)</td>
                      <td className="py-1">:</td>
                      <td className="py-1 font-mono text-slate-500">
                        ....................................................................
                      </td>
                    </tr>
                    {printMatchedWarga && (
                      <>
                        <tr>
                          <td className="py-1">Jenis Kelamin</td>
                          <td className="py-1">:</td>
                          <td className="py-1">{printMatchedWarga.jk || '-'}</td>
                        </tr>
                        <tr>
                          <td className="py-1">Tanggal Lahir</td>
                          <td className="py-1">:</td>
                          <td className="py-1">{printMatchedWarga.tgllahir || '-'}</td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td className="py-1">Alamat Domisili</td>
                      <td className="py-1">:</td>
                      <td className="py-1">
                        {printMatchedWarga?.blok ? `${printMatchedWarga.blok}, ` : ''}
                        {printSurat.rt} / RW 10 Perumahan Permata Hijau, Kel. Mudal, Kec.
                        Mojotengah, Wonosobo
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">Jenis Layanan</td>
                      <td className="py-1">:</td>
                      <td className="py-1 font-bold">{printSurat.jenis}</td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Keperluan</td>
                      <td className="py-1 align-top">:</td>
                      <td className="py-1 font-medium">{printSurat.keperluan}</td>
                    </tr>
                  </tbody>
                </table>
                <p>
                  Orang tersebut di atas adalah benar-benar warga yang berdomisili di lingkungan RW
                  10 Perumahan Permata Hijau, Kelurahan Mudal, Kecamatan Mojotengah, Kabupaten
                  Wonosobo, serta berkelakuan baik dan tidak sedang tersangkut perkara apapun di
                  lingkungan.
                </p>
                <p>
                  Demikian surat pengantar ini dibuat dengan sebenarnya agar dapat dipergunakan
                  sebagaimana mestinya oleh yang berkepentingan.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs sm:text-sm">
                <div className="space-y-16">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-bold">Ketua {printSurat.rt}</p>
                  </div>
                  <p className="font-bold underline uppercase">
                    {pengurusRt[printSurat.rt as RtKey]?.ketua || `Ketua ${printSurat.rt}`}
                  </p>
                </div>
                <div className="space-y-16">
                  <div>
                    <p>
                      Wonosobo,{' '}
                      {new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="font-bold">Ketua RW 10 Permata Hijau</p>
                  </div>
                  <p className="font-bold underline uppercase">{pengurusRw.ketua.nama}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalWrapper>
    </>
  );
}
