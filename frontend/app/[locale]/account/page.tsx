import { unstable_setRequestLocale } from 'next-intl/server';

export default function AccountPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  return <div className="container-app py-12"><p>Account - Coming soon</p></div>;
}
