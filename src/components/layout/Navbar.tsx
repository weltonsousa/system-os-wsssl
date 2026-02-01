"use client";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
      <div>
        {user ? (
          <>
            <Link href="/painel" className="font-bold text-lg">WS Service Solutions</Link>
          </>

        ) : (
          <>
            <Link href="/" className="font-bold text-lg">WS Service Solutions</Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/clientes" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Clientes</Link>
            <Link href="/servicos" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Serviços</Link>
            <Link href="/relatorios" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Relatórios</Link>
            <Link href="/configuracao" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Configuração</Link>
            <span>Olá, {user.email}</span>
            <button
              onClick={handleLogout}
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-normal py-2 px-4 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Login</Link>
            {/* <Link href="/register" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Registrar</Link> */}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

