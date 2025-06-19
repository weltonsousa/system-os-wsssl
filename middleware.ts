import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const PUBLIC_PATHS = ['/login', '/register', '/api/login', '/api/register', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso livre às rotas públicas
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  const token = request.cookies.get('token')?.value;

  if (isPublic) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const decoded: { exp: number } = jwtDecode(token);

    // Verifica se o token está expirado
    if (decoded.exp * 1000 < Date.now()) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'token-expired');
      return NextResponse.redirect(loginUrl);
    }

    // Se o token é válido, permite acesso
    return NextResponse.next();

  } catch (error) {
    console.error('Token inválido:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'invalid-token');
    return NextResponse.redirect(loginUrl);
  }
}

// Configura as rotas que o middleware deve observar
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/clientes/:path*',
    '/servicos/:path*',
    '/relatorios/:path*',
    '/configuracao/:path*',
  ],
};