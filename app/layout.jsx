import { AuthProvider } from './context/AuthContext';
import LayoutContent from './LayoutContent';
import './globals.css';

export const metadata = {
  title: {
    default: 'UGC Edge — The pitch page that gets you picked',
    template: '%s | UGC Edge',
  },
  description: 'Paste any brand listing. Get a custom pitch page with tailored copy, your best content, and your brand — ready to send in 30 seconds.',
  metadataBase: new URL('https://ugc-edge.com'),
  openGraph: {
    title: 'UGC Edge — The pitch page that gets you picked',
    description: 'Paste any brand listing. Get a custom pitch page with tailored copy, your best content, and your brand — ready to send in 30 seconds.',
    url: 'https://ugc-edge.com',
    siteName: 'UGC Edge',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'UGC Edge sample pitch page' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UGC Edge — The pitch page that gets you picked',
    description: 'Paste any brand listing. Get a custom pitch page with tailored copy, your best content, and your brand — ready to send in 30 seconds.',
    images: ['/og-image.png'],
  },
  icons: { icon: '/logo.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
