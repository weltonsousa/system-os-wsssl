import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET as authHandler } from '../[...nextauth]/route';
import jwt from 'jsonwebtoken';
import type { Session } from 'next-auth';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    // Verificar se há uma sessão ativa do NextAuth
    const session: Session | null = await getServerSession(authHandler);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Criar token JWT com os dados da sessão
    const token = jwt.sign(
      {
        id: session.user.id,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Criar resposta e definir cookie
    const response = NextResponse.json({ message: 'Token sincronizado' });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 dia
    });

    return response;
  } catch (error) {
    console.error('Erro ao sincronizar token:', error);
    return NextResponse.json(
      { error: 'Erro ao sincronizar token' },
      { status: 500 }
    );
  }
}

