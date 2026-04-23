'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

export default function LayoutContent({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Pages that render with no app chrome
  if (pathname === '/pitch/view' || pathname === '/admin') {
    return <body>{children}</body>;
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <body className="bg-gradient-to-br from-teal-50 to-white min-h-screen">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-teal-600 font-display">
            UGC Pitch
          </Link>

          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition">
                Dashboard
              </Link>

              {/* Profile icon + dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="w-9 h-9 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center hover:bg-teal-700 transition"
                >
                  {user.username?.[0]?.toUpperCase() ?? '?'}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2.5 text-xs text-gray-400 border-b border-gray-100 font-medium">
                      {user.username}
                    </div>
                    <Link href="/profile" onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 block">
                      Profile
                    </Link>
                    <Link href="/brand" onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 block">
                      Brand Setup
                    </Link>
                    <Link href="/content" onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 block">
                      Content Library
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { logout(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-gray-200 mt-20 py-8 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
          <p>© 2024 UGC Pitch. Stop blending in.</p>
        </div>
      </footer>
    </body>
  );
}
