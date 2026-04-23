import { AuthProvider } from './context/AuthContext';
import LayoutContent from './LayoutContent';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>UGC Pitch</title>
        <meta name="description" content="Create targeted UGC pitches that stand out" />
      </head>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </html>
  );
}
