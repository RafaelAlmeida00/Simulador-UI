
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/src/components/providers';
import { ThemeProvider } from '@/src/components/layout';
import { Toaster } from '@/src/components/feedback';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Plant Simulator',
  description: 'Plant Floor Monitoring Dashboard',
  openGraph: {
    title: 'Plant Simulator',
    description: 'Plant Floor Monitoring Dashboard',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <ThemeProvider defaultTheme="dark" storageKey="plant-simulator-theme">
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
