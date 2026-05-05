"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Fornecedor, PaginatedResponse } from "@/types";
import { maskCPF, maskPhone, maskCNPJ } from "@/app/utils/utils";
import Card from "@/components/ui/Card";

const LABEL_TIPO: Record<string, string> = {
  TI: "T.I.",
  PECAS: "Peças",
  SERVICO: "Serviço",
  GERAL: "Geral",
};

async function fetchFornecedores(page: number, limit: number, search: string, tipo: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
    ...(tipo ? { tipo_fornecedor: tipo } : {}),
  });
  const res = await fetch(`/api/fornecedores?${params}`);
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json() as Promise<PaginatedResponse<Fornecedor>>;
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFornecedores(currentPage, 10, searchTerm, tipoFiltro)
      .then((data) => {
        setFornecedores(data.data);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [currentPage, searchTerm, tipoFiltro]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSearchTerm(formData.get("search") as string);
    setTipoFiltro(formData.get("tipo") as string);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Fornecedores</h1>
          <Link
            href="/fornecedores/cadastrar"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm"
          >
            Cadastrar
          </Link>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            name="search"
            placeholder="Buscar por nome, CPF/CNPJ ou email..."
            defaultValue={searchTerm}
            className="border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 p-2 rounded-md w-full sm:w-1/2 text-slate-900 border"
          />
          <select
            name="tipo"
            defaultValue={tipoFiltro}
            className="border-slate-300 focus:ring-indigo-500 focus:border-indigo-500 p-2 rounded-md text-slate-900 border"
          >
            <option value="">Todos os tipos</option>
            <option value="TI">T.I.</option>
            <option value="PECAS">Peças</option>
            <option value="SERVICO">Serviço</option>
            <option value="GERAL">Geral</option>
          </select>
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm"
          >
            Buscar
          </button>
        </form>

        {loading ? (
          <p className="text-slate-600">Carregando fornecedores...</p>
        ) : fornecedores.length === 0 ? (
          <p className="text-slate-600">Nenhum fornecedor encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg">
              <thead className="bg-gray-400">
                <tr>
                  <th className="py-3 px-4 text-left text-black">Nome/Razão Social</th>
                  <th className="py-3 px-4 text-left text-black">Tipo</th>
                  <th className="py-3 px-4 text-left text-black">CPF/CNPJ</th>
                  <th className="py-3 px-4 text-left text-black">Email</th>
                  <th className="py-3 px-4 text-left text-black">Telefone</th>
                  <th className="py-3 px-4 text-left text-black">Ações</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id_fornecedor} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-black">
                      {fornecedor.tipo_pessoa === "FISICA"
                        ? fornecedor.nome_completo
                        : fornecedor.razao_social}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {LABEL_TIPO[fornecedor.tipo_fornecedor] ?? fornecedor.tipo_fornecedor}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-black">
                      {fornecedor.tipo_pessoa === "FISICA"
                        ? maskCPF(fornecedor.cpf ?? "")
                        : maskCNPJ(fornecedor.cnpj ?? "")}
                    </td>
                    <td className="py-3 px-4 text-black">{fornecedor.email}</td>
                    <td className="py-3 px-4 text-black">{maskPhone(fornecedor.telefone_principal)}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/fornecedores/${fornecedor.id_fornecedor}/editar`}
                        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-2.5 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 w-full sm:w-auto text-sm"
                      >
                        Editar
                      </Link>
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
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
