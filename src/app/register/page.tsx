"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Import dynamic to avoid initializing client on server if this component was SSR enabled, 
      // but it's "use client" so imports at top are fine. 
      // But we need to import createClient first.
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccess("Conta criada com sucesso! Verifique seu email para confirmar.");
      // Se auto confirm não estiver ativado, talvez não logue direto.
      // Se estiver ativado, pode logar.
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao registrar");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Registrar</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {success && <div className="mb-4 text-green-600">{success}</div>}
        <div className="mb-4">
          <label className="block mb-1 text-gray-500">Nome</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded text-gray-500"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-500">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded text-gray-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-gray-500">Senha</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded text-gray-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Registrar
        </button>
      </form>
    </div>
  );
}