import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const PUBLIC_PATHS = [
  '/login', 
  '/register',
  '/api/login', 
  '/api/logout',
  '/api/register',
  '/api/auth',
  '/favicon.ico',
  '/'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (isPublic) {
    return NextResponse.next();
  }

  // Verificar token
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Se for rota de API, retornar 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    // Se for página, redirecionar para login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Validar token JWT
  if (!JWT_SECRET) {
    console.error('JWT_SECRET não está configurado');
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verificar e decodificar o token
    jwt.verify(token, JWT_SECRET);
    // Token válido, permitir acesso
    return NextResponse.next();
  } catch (error) {
    // Token inválido ou expirado
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
    // Para páginas, redirecionar para login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    // Remover cookie inválido
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
