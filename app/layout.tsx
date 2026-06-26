import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Swift Meds — Real-time medication availability in Yaoundé',
  description:
    'Find medication availability in real time across partnered pharmacies in Yaoundé, reserve your medication, and pick it up — no more pharmacy run-arounds.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', background: '#0f4c31', color: '#fff', fontSize: '14px' },
            success: { iconTheme: { primary: '#43cf81', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
