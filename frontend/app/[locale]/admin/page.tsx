import { unstable_setRequestLocale } from 'next-intl/server';

interface BraveUsage {
  month: string;
  count: number;
  limit: number;
}

interface Props {
  params: { locale: string };
}

async function getBraveUsage(): Promise<BraveUsage | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/api/v1/brave-usage`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const usage = await getBraveUsage();
  const pct = usage ? Math.round((usage.count / usage.limit) * 100) : 0;

  return (
    <main className="container-app py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Brave Search — quota mensuel</h2>

        {usage ? (
          <>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Mois : {usage.month}</span>
              <span className="font-medium">{usage.count} / {usage.limit} requêtes</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-green-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{pct}% utilisé — {usage.limit - usage.count} requêtes restantes</p>
          </>
        ) : (
          <p className="text-sm text-gray-400">Impossible de récupérer les données.</p>
        )}
      </div>
    </main>
  );
}
