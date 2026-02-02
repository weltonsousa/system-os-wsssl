import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const publicPaths = ['/login', '/register', '/auth/callback']
    const isPublic = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))



    const isApi = request.nextUrl.pathname.startsWith('/api')

    if (
        !user &&
        !isPublic &&
        !request.nextUrl.pathname.startsWith('/_next') &&
        request.nextUrl.pathname !== '/' // Home page might be public
    ) {
        // no user, potentially respond by redirecting the user to the login page
        if (isApi) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // NOTE: You can also redirect authenticated users to /painel if they try to access login
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/painel'
        return NextResponse.redirect(url)
    }

    return response
}
