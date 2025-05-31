"use client";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { signOut, useSession } from 'next-auth/react';


const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
      <div>
        {session?.user?.name ? (
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
        {status === "authenticated" && session?.user ? (
          <>
            <Link href="/clientes" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Clientes</Link>
            <Link href="/servicos" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Serviços</Link>
            <Link href="/relatorios" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded">Relatórios</Link>
            <span>Olá, {session.user.name}</span>
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

