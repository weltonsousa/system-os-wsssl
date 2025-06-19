// src/app/tipos-servico/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PaginatedResponse, TipoServico } from "@/types";

async function fetchTiposServico(page: number = 1, limit: number = 10, search: string = "", status_filter: string = "") {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);
  if (status_filter) params.append("status_filter", status_filter);

  const res = await fetch(`/api/tipos-servico?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Falha ao buscar tipos de serviço');
  }
  return res.json() as Promise<PaginatedResponse<TipoServico>>;
}

export default function TiposServicoPage() {
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchTiposServico(currentPage, 10, searchTerm)
      .then(data => {
        setTiposServico(data.data);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        // Handle error display to user
      });
  }, [currentPage, searchTerm]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTiposServico(currentPage, 10, searchTerm, statusFilter)
      .then(data => {
        setTiposServico(data.data);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || "Ocorreu um erro ao buscar os tipos serviço.");
        setLoading(false);
      });
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search") as string;
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tipo de Serviço</h1>
        <Link href="/configuracao/tipos-servico/cadastrar" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Novo Tipo de Serviço
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          name="search"
          placeholder="Buscar por tipo, descrição..."
          className="border p-2 rounded w-full md:w-1/3"
          defaultValue={searchTerm}
        />
        <select
          name="status_filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="border p-2 rounded w-full md:w-1/4"
        >
          <option value="" >Todos os Tipos de Serviço</option>
          {tiposServico.map(tipos => (
            <option key={tipos.id_tipo_servico} value={tipos.id_tipo_servico} className="bg-black">
              {tipos.nome_tipo_servico}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Buscar
        </button>
      </form>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      {loading ? (
        <p>Carregando tipos serviço...</p>
      ) : tiposServico.length === 0 ? (
        <p>Nenhum tipo de serviço encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-400">
              <tr>
                <th className="py-3 px-4 text-left text-black">Nome</th>
                <th className="py-3 px-4 text-left text-black">Descrição</th>
                <th className="py-3 px-4 text-left text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tiposServico.map((tipo) => (
                <tr key={tipo.id_tipo_servico} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-black">{tipo.nome_tipo_servico}</td>
                  <td className="py-3 px-4 text-black">{tipo.descricao}</td>
                  <td className="py-3 px-4">
                    <Link href={`/configuracao/tipos-servico/${tipo.id_tipo_servico}`} className="text-blue-500 hover:underline mr-2">
                      Editar
                    </Link>
                    {/* Adicionar link para editar e botão de excluir posteriormente */}
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

