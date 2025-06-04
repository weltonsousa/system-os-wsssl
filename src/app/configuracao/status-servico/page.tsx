// src/app/status-servico/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PaginatedResponse, StatusServico } from "@/types";

async function fetchStatusServico(page: number = 1, limit: number = 10, search: string = "", status_filter: string = "") {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);
  if (status_filter) params.append("status_filter", status_filter);

  const res = await fetch(`/api/status-servico?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Falha ao buscar dados dos status do serviço');
  }
  return res.json() as Promise<PaginatedResponse<StatusServico>>;
}

export default function StatusServicoPage() {
  const [statusServico, setStatusServico] = useState<StatusServico[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchStatusServico(currentPage, 10, searchTerm)
      .then(data => {
        setStatusServico(data.data);
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
    fetchStatusServico(currentPage, 10, searchTerm, statusFilter)
      .then(data => {
        setStatusServico(data.data);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || "Ocorreu um erro ao buscar os serviços.");
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
        <h1 className="text-3xl font-bold">Status de Serviço</h1>
        <Link href="/configuracao/status-servico/cadastrar" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Novo Status de Serviço
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          name="search"
          placeholder="Buscar por status..."
          className="border p-2 rounded w-full md:w-1/3"
          defaultValue={searchTerm}
        />
        <select
          name="status_filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="border p-2 rounded w-full md:w-1/4 hover:bg-gray-700 hover:text-white"
        >
          <option value="" >Todos os Status</option>
          {statusServico.map(status => (
            <option key={status.id_status_servico} value={status.id_status_servico}>
              {status.nome_status}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Buscar
        </button>
      </form>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      {loading ? (
        <p>Carregando status...</p>
      ) : statusServico.length === 0 ? (
        <p>Nenhuma status de serviço encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-400">
              <tr>
                <th className="py-3 px-4 text-left text-black">Status</th>
                <th className="py-3 px-4 text-left text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {statusServico.map((statu) => (
                <tr key={statu.id_status_servico} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-black">{statu.nome_status}</td>
                  {/* <td className="py-3 px-4 text-black">{statu.descricao}</td> */}
                  <td className="py-3 px-4 text-black">
                    <Link href={`/configuracao/status-servico/${statu.id_status_servico}`} className="text-blue-500 hover:underline mr-2">
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

