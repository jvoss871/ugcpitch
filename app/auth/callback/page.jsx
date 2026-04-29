'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      router.replace('/login');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(async ({ error, data }) => {
      if (error) { router.replace('/login'); return; }
      const email = data.session?.user?.email;
      if (email) {
        try {
          const res = await fetch(`/api/profile?username=${encodeURIComponent(email)}`);
          const profile = await res.json();
          if (!profile?.name) { router.replace('/welcome'); return; }
        } catch {}
      }
      router.replace('/dashboard');
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
