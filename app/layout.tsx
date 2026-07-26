import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Bengali, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'BoardBridge BD — whiteboard to verified study pack',
  description:
    'One photo of a messy Bangla-English classroom whiteboard becomes a verified study pack. Powered by Gemma 4 vision.',
};

export const viewport: Viewport = {
  themeColor: '#0b1120',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className={`${bengali.variable} ${inter.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
