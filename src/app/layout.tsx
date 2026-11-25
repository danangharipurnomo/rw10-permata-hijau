import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './globals.css';
import { Rw10Provider } from '@/context/Rw10Context';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RW 10 Perumahan Permata Hijau - Portal Warga & Dashboard Pengurus',
  description:
    'Portal resmi layanan administrasi digital, transparansi kas, direktori UMKM, dan dashboard pengurus RW 10 Perumahan Permata Hijau, Kel. Mudal, Kec. Mojotengah, Kab. Wonosobo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} scroll-smooth`}>
      <body className="bg-slate-50 text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-900">
        <Rw10Provider>{children}</Rw10Provider>
      </body>
    </html>
  );
}
