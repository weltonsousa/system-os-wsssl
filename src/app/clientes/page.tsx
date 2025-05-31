// src/app/clientes/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cliente, PaginatedResponse } from "@/types";

async function fetchClientes(page: number = 1, limit: number = 10, search: string = "") {
  const res = await fetch(`/api/clientes?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json() as Promise<PaginatedResponse<Cliente>>;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchClientes(currentPage, 10, searchTerm)
      .then(data => {
        setClientes(data.data);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        // Handle error display to user
      });
  }, [currentPage, searchTerm]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page on new search
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Link href="/clientes/cadastrar" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Novo Cliente
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          name="search"
          placeholder="Buscar por nome, CPF/CNPJ ou email..."
          className="border p-2 rounded w-full md:w-1/2"
          defaultValue={searchTerm}
        />
        <button type="submit" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Buscar
        </button>
      </form>

      {loading ? (
        <p>Carregando clientes...</p>
      ) : clientes.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-400">
              <tr>
                <th className="py-3 px-4 text-left text-black">Nome/Razão Social</th>
                <th className="py-3 px-4 text-left text-black">CPF/CNPJ</th>
                <th className="py-3 px-4 text-left text-black">Email</th>
                <th className="py-3 px-4 text-left text-black">Telefone</th>
                <th className="py-3 px-4 text-left text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id_cliente} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-black">{cliente.tipo_pessoa === "FISICA" ? cliente.nome_completo : cliente.razao_social}</td>
                  <td className="py-3 px-4 text-black">{cliente.tipo_pessoa === "FISICA" ? cliente.cpf : cliente.cnpj}</td>
                  <td className="py-3 px-4 text-black">{cliente.email}</td>
                  <td className="py-3 px-4 text-black">{cliente.telefone_principal}</td>
                  <td className="py-3 px-4 text-black">
                    <Link href={`/clientes/${cliente.id_cliente}/editar`} className="text-blue-500 hover:underline mr-2">
                      Editar
                    </Link>
                    {/* Botão de excluir pode ser adicionado aqui com confirmação */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

