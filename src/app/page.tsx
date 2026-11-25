'use client';

import { useRw10 } from '@/context/Rw10Context';
import PublicPortal from '@/components/PublicPortal';
import AdminDashboard from '@/components/AdminDashboard';
import PublicModals from '@/components/PublicModals';
import AdminModals from '@/components/AdminModals';
import ToastContainer from '@/components/ToastContainer';

export default function HomePage() {
  const { viewMode } = useRw10();

  return (
    <>
      <ToastContainer />
      {viewMode === 'admin' ? <AdminDashboard /> : <PublicPortal />}
      <PublicModals />
      <AdminModals />
    </>
  );
}
