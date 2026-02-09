"use client";
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/Button';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <Link href={user ? "/painel" : "/"} className="font-display font-bold text-xl text-slate-900 tracking-tight hover:text-indigo-600 transition-colors">
              WS Service Solutions
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/clientes" className={buttonVariants('ghost', 'sm')}>Clientes</Link>
                <Link href="/servicos" className={buttonVariants('ghost', 'sm')}>Serviços</Link>
                <Link href="/relatorios" className={buttonVariants('ghost', 'sm')}>Relatórios</Link>
                <Link href="/configuracao" className={buttonVariants('ghost', 'sm')}>Configuração</Link>
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <span className="text-sm text-slate-600">Olá, <span className="font-medium text-slate-900">{user.user_metadata.full_name}</span></span>
                <button
                  onClick={handleLogout}
                  className={buttonVariants('outline', 'sm', 'ml-2 border-slate-300 text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200')}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className={buttonVariants('primary', 'sm')}>Login</Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 text-slate-600 hover:text-indigo-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              {user ? (
                <>
                  <div className="pb-3 border-b border-slate-100 mb-3">
                    <p className="text-sm text-slate-500">Logado como</p>
                    <p className="font-medium text-slate-900">{user.user_metadata.full_name}</p>
                  </div>
                  <Link href="/clientes" onClick={() => setIsMenuOpen(false)} className="block py-2 text-slate-600 hover:text-indigo-600">Clientes</Link>
                  <Link href="/servicos" onClick={() => setIsMenuOpen(false)} className="block py-2 text-slate-600 hover:text-indigo-600">Serviços</Link>
                  <Link href="/relatorios" onClick={() => setIsMenuOpen(false)} className="block py-2 text-slate-600 hover:text-indigo-600">Relatórios</Link>
                  <Link href="/configuracao" onClick={() => setIsMenuOpen(false)} className="block py-2 text-slate-600 hover:text-indigo-600">Configuração</Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className={buttonVariants('primary', 'md', 'w-full justify-center')}>Login</Link>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to prevent content from being hidden behind fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
