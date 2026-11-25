export function formatRupiah(num: number | string): string {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export function sanitizeWa(num: string): string {
  let cleaned = String(num || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
  return cleaned;
}

export function maskPublicName(name: string): string {
  const parts = String(name || '').trim().split(/\s+/);
  return parts
    .map((p, idx) => {
      if (idx === 0) return p;
      return p.length <= 2
        ? p[0] + '*'
        : p.slice(0, 2) + '*'.repeat(Math.min(4, p.length - 2));
    })
    .join(' ');
}

export function getBeritaCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    'Kegiatan Warga': 'bg-emerald-600 text-white',
    Layanan: 'bg-sky-600 text-white',
    Kesehatan: 'bg-teal-600 text-white',
    Keamanan: 'bg-amber-600 text-white',
    Pengumuman: 'bg-rose-600 text-white',
  };
  return map[cat] || 'bg-slate-700 text-white';
}

export function triggerCsvDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function addToGoogleCalendar(
  title: string,
  details: string,
  location: string,
  startIso: string,
  endIso: string
): void {
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    location
  )}&dates=${startIso}/${endIso}`;
  window.open(url, '_blank');
}
