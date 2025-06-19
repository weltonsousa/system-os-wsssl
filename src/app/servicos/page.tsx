// src/app/servicos/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Servico, PaginatedResponse, TipoServico, StatusServico } from "@/types";

async function fetchServicos(page: number = 1, limit: number = 10, search: string = "", status_filter: string = "") {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append("search", search);
  if (status_filter) params.append("status_filter", status_filter);

  const res = await fetch(`/api/servicos?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Falha ao buscar dados dos serviços');
  }
  return res.json() as Promise<PaginatedResponse<Servico>>;
}

async function fetchTiposServico() {
  const res = await fetch('/api/tipos-servico');
  if (!res.ok) {
    throw new Error('Falha ao buscar tipos de serviço');
  }

  const json = await res.json();
  return json.data as TipoServico[];
}

async function fetchStatusServico() {
  const res = await fetch('/api/status-servico');
  if (!res.ok) {
    throw new Error('Falha ao buscar status de serviço');
  }
  const json = await res.json();
  return json.data as StatusServico[];
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [statusServicos, setStatusServicos] = useState<StatusServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchTiposServico(),
      fetchStatusServico()
    ]).then(([tiposData, statusData]) => {
      setTiposServico(tiposData);
      setStatusServicos(statusData);
    }).catch(err => {
      console.error("Erro ao buscar dados de apoio:", err);
      setError("Erro ao carregar dados de apoio (tipos/status de serviço).");
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchServicos(currentPage, 10, searchTerm, statusFilter)
      .then(data => {
        setServicos(data.data);
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
        <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
        <Link href="/servicos/cadastrar" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Nova Ordem de Serviço
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          name="search"
          placeholder="Buscar por OS, cliente, descrição..."
          className="border p-2 rounded w-full md:w-1/3"
          defaultValue={searchTerm}
        />
        <select
          name="status_filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="border p-2 rounded w-full md:w-1/4"
        >
          <option value="" >Todos os Status</option>
          {statusServicos.map(status => (
            <option key={status.id_status_servico} value={status.id_status_servico} className="bg-black">
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
        <p>Carregando serviços...</p>
      ) : servicos.length === 0 ? (
        <p>Nenhuma ordem de serviço encontrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-400">
              <tr>
                <th className="py-3 px-4 text-left text-black">OS</th>
                <th className="py-3 px-4 text-left text-black">Cliente</th>
                <th className="py-3 px-4 text-left text-black">Tipo de Serviço</th>
                <th className="py-3 px-4 text-left text-black">Data Entrada</th>
                <th className="py-3 px-4 text-left text-black">Status</th>
                <th className="py-3 px-4 text-left text-black">Valor Total</th>
                <th className="py-3 px-4 text-left text-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id_servico} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-black">{servico.id_servico?.substring(0, 8)}...</td>
                  <td className="py-3 px-4 text-black">{servico.cliente?.nome_completo || servico.cliente?.razao_social}</td>
                  <td className="py-3 px-4 text-black">{servico.tipo_servico?.nome_tipo_servico}</td>
                  <td className="py-3 px-4 text-black">{new Date(servico.data_entrada!).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-black">{servico.status_atual?.nome_status}</td>
                  <td className="py-3 px-4 text-black">R$ {(servico.valor_servico || 0).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <Link href={`/servicos/${servico.id_servico}`} className="text-blue-500 hover:underline mr-2">
                      Detalhes
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

