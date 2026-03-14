import { redirect } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/account/DashboardShell';

export default async function AccountPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <DashboardShell
      email={user.email ?? ''}
      createdAt={user.created_at}
      locale={locale}
    />
  );
}
