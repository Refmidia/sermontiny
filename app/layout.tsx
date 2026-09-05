import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Sans, Inter } from 'next/font/google';
import { SITE, absoluteUrl } from '@/lib/site';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.shortName}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    locale: SITE.locale,
    type: 'website',
    url: SITE.url,
    siteName: SITE.shortName,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.name,
    description: SITE.description,
  },
  alternates: {
    canonical: absoluteUrl('/'),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${ibmPlex.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
