import { AuthProvider } from './context/AuthContext';
import LayoutContent from './LayoutContent';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>UGC Edge</title>
        <meta name="description" content="Create targeted UGC pitches that stand out" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
      </head>
      <body className="bg-white min-h-screen">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
