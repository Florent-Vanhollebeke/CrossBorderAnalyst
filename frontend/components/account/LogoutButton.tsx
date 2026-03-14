'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function LogoutButton({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations('account.quick_actions');

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700">
      <LogOut className="h-4 w-4" />
      {t('logout')}
    </Button>
  );
}
