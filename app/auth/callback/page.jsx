'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || '';
    const expiresIn = parseInt(hashParams.get('expires_in') || '3600', 10);

    if (!accessToken) {
      router.replace('/login');
      return;
    }

    const payload = parseJwt(accessToken);
    if (!payload) {
      router.replace('/login');
      return;
    }

    // Build session and write directly to localStorage so getSession() finds it
    const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      expires_in: expiresIn,
      token_type: 'bearer',
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        aud: payload.aud,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {},
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(session));

    // Let AuthContext pick it up via getSession
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        router.replace('/dashboard');
      } else {
        // getSession didn't pick it up — trigger reload so it re-reads localStorage
        window.location.href = '/dashboard';
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
