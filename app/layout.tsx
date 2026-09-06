import type { Metadata } from 'next';
import { Instrument_Sans, Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/client-auth';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GlobeTrotter — Plan it before you pack',
  description:
    'GlobeTrotter is a personalized travel planning web application that helps users create, organize, and share multi-city travel itineraries.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${bricolageGrotesque.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
