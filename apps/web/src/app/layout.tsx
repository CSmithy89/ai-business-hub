import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'tippy.js/dist/tippy.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | HYVVE',
    default: 'HYVVE - Your AI Team',
  },
  description: 'AI-powered business orchestration platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
