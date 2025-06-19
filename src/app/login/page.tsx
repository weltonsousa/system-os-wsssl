"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();

  // Erros vindos do middleware
  const middlewareError = searchParams.get('error');
  const returnUrl = searchParams.get('returnUrl');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'token-expired':
        return 'Sua sessão expirou. Faça login novamente.';
      case 'invalid-token':
        return 'Token inválido. Faça login novamente.';
      case 'authentication-required':
        return 'Você precisa fazer login para acessar esta página.';
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login bem-sucedido
        // O token já foi definido como cookie pela API
        router.push(returnUrl || '/painel');
      } else {
        // Erro no login
        setLoginError(data.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setLoginError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const middlewareErrorMessage = getErrorMessage(middlewareError);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login
        </h2>

        {/* Mensagens de erro do middleware */}
        {middlewareErrorMessage && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            {middlewareErrorMessage}
          </div>
        )}

        {/* Erro de login */}
        {loginError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="seu@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Digite sua senha"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Registre-se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}