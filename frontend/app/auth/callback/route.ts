import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'

/** Chemins internes autorisés pour la redirection post-auth. */
function sanitizeNext(next: string | null): string {
  if (!next) return '/'
  // Rejette tout ce qui contient un schéma (http://, //) ou un domaine externe
  if (/^https?:\/\//i.test(next) || next.startsWith('//')) return '/'
  // Ne conserve que les chemins relatifs commençant par /
  if (!next.startsWith('/')) return '/'
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNext(searchParams.get('next'))
  const locale = searchParams.get('locale') ?? 'fr'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignoré en Server Component — la session est rafraîchie par le middleware
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const suffix = next === '/' ? '' : next

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}/${locale}${suffix}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/${locale}${suffix}`)
      } else {
        return NextResponse.redirect(`${origin}/${locale}${suffix}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`)
}
