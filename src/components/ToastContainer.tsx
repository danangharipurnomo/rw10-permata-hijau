'use client';

import { useRw10 } from '@/context/Rw10Context';

export default function ToastContainer() {
  const { toasts } = useRw10();

  const colors = {
    success: 'bg-emerald-900 text-white border-emerald-500 shadow-emerald-900/30',
    error: 'bg-rose-900 text-white border-rose-500 shadow-rose-900/30',
    info: 'bg-slate-900 text-white border-slate-700 shadow-slate-900/30',
  };

  const icons = {
    success: 'fa-circle-check text-emerald-400',
    error: 'fa-circle-exclamation text-rose-400',
    info: 'fa-circle-info text-sky-400',
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
            colors[t.type] || colors.info
          }`}
        >
          <i className={`fa-solid ${icons[t.type] || icons.info} text-base shrink-0`} />
          <span className="leading-tight">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
