'use client';

import { useParams, useRouter } from 'next/navigation';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

export function AuthButton() {
  const { user, loading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();

  if (loading) return null;

  if (user) {
    const handleSignOut = async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
    };

    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-gray-600 sm:inline">
          <User className="mr-1 inline h-3.5 w-3.5" />
          {user.email?.split('@')[0]}
        </span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <a
      href={`/${locale}/auth/login`}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <LogIn className="h-4 w-4" />
      Login
    </a>
  );
}
