"use client";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface JwtPayload {
  name: string;
  email: string;
  id: string;
  exp: number;
}

const Navbar = () => {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          setUser(decoded);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
      <div>
        <Link href="/" className="font-bold text-lg">WS Service Solutions</Link>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span>Olá, {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/register" className="hover:underline">Registrar</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

