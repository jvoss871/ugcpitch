'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

const PLAN_BADGE = {
  pro:     { label: 'Pro',     bg: '#0f1117', color: '#34d399' },
  starter: { label: 'Starter', bg: '#f0fdf4', color: '#16a34a' },
  free:    { label: 'Free',    bg: '#f3f4f6', color: '#6b7280' },
};

export default function LayoutContent({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) { setPlanStatus(null); return; }
    fetch(`/api/plan?username=${encodeURIComponent(user.username)}`)
      .then(r => r.json())
      .then(d => setPlanStatus(d.status ?? 'free'))
      .catch(() => setPlanStatus('free'));
  }, [user]);

  const planBadge = planStatus ? (PLAN_BADGE[planStatus] ?? PLAN_BADGE.free) : null;

  // Pages that render with no app chrome
  if (pathname === '/pitch/view' || pathname === '/admin' || pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <>
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="w-8 h-8" />
            <span className="text-xl font-black text-gray-900 tracking-tight">UGC <span className="text-teal-500">Edge</span></span>
          </Link>

          {!user ? (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition">
              Log in
            </Link>
          ) : (
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-teal-600 transition">
                Dashboard
              </Link>

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
                    <Link href="/help" onClick={() => setMenuOpen(false)}
                      className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 block">
                      Help & Tips
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <Link href="/upgrade" onClick={() => setMenuOpen(false)}
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-full">
                        <span className="flex-1">Manage Plan</span>
                        {planBadge && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: planBadge.bg, color: planBadge.color }}>
                            {planBadge.label}
                          </span>
                        )}
                      </Link>
                    </div>
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
          )}
        </div>
      </nav>

      <main key={pathname} className={`max-w-7xl mx-auto px-6 animate-fade-in-up ${pathname === '/' ? 'pt-12' : 'py-12'}`}>
        {children}
      </main>

      {pathname !== '/' && (
        <footer className="border-t border-gray-200 mt-20 py-8 bg-white/50">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-600">
            <p>© 2025 UGC Edge. Stop blending in.</p>
          </div>
        </footer>
      )}
    </>
  );
}
