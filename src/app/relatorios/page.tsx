// src/app/relatorios/page.tsx
"use client";

import { useState, useEffect } from "react";
import { StatusServico, TipoPessoa, Servico } from "@/types";
import { useAlert } from "@/components/ui/AlertContext";

async function fetchStatusServico() {
  const res = await fetch("/api/status-servico");
  if (!res.ok) {
    throw new Error("Falha ao buscar status de serviço");
  }

  const json = await res.json();
  return json.data as StatusServico[];
}

export default function RelatoriosPage() {
  const [statusServicos, setStatusServicos] = useState<StatusServico[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { showError } = useAlert();
  // Filtros para Relatório de Serviços por Status
  const [filtroStatusId, setFiltroStatusId] = useState("");
  const [filtroDataInicioServicos, setFiltroDataInicioServicos] = useState("");
  const [filtroDataFimServicos, setFiltroDataFimServicos] = useState("");

  // Filtros para Relatório de Faturamento
  const [filtroDataInicioFaturamento, setFiltroDataInicioFaturamento] = useState("");
  const [filtroDataFimFaturamento, setFiltroDataFimFaturamento] = useState("");
  const [filtroTipoPessoaFaturamento, setFiltroTipoPessoaFaturamento] = useState<"TODOS" | "FISICA" | "JURIDICA">("TODOS");

  const [error, setError] = useState<string | null>(null);

  // Estado para resultado do relatório Serviços por Status
  const [resultadoServicosStatus, setResultadoServicosStatus] = useState<Servico[] | null>(null);
  const [loadingResultadoServicos, setLoadingResultadoServicos] = useState(false);

  // Estado para resultado do relatório Faturamento
  const [resultadoFaturamento, setResultadoFaturamento] = useState<{
    data: Servico[];
    totalFaturado: number;
    periodo: { inicio: string; fim: string };
    filtro_tipo_cliente: string;
  } | null>(null);
  const [loadingResultadoFaturamento, setLoadingResultadoFaturamento] = useState(false);

  useEffect(() => {
    fetchStatusServico()
      .then(data => setStatusServicos(data))
      .catch(err => {
        console.error(err);
        setError("Erro ao carregar lista de status para filtros.");
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  const handleDownloadRelatorio = async (tipoRelatorio: "servicos-status" | "faturamento", formato: "csv" | "pdf" | "json") => {
    let url = "";
    const params = new URLSearchParams();
    params.append("formato", formato);

    if (tipoRelatorio === "servicos-status") {
      url = "/api/relatorios/servicos-status";
      if (filtroStatusId) params.append("status_id", filtroStatusId);
      if (filtroDataInicioServicos) params.append("data_inicio", new Date(filtroDataInicioServicos).toISOString());
      if (filtroDataFimServicos) params.append("data_fim", new Date(filtroDataFimServicos).toISOString());
    } else if (tipoRelatorio === "faturamento") {
      url = "/api/relatorios/faturamento";
      if (!filtroDataInicioFaturamento || !filtroDataFimFaturamento) {
        showError("Datas de início e fim são obrigatórias para o relatório de faturamento.");
        return;
      }
      params.append("data_inicio", new Date(filtroDataInicioFaturamento).toISOString());
      params.append("data_fim", new Date(filtroDataFimFaturamento).toISOString());
      if (filtroTipoPessoaFaturamento) params.append("tipo_pessoa_cliente", filtroTipoPessoaFaturamento);
    }

    try {
      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao gerar relatório ${tipoRelatorio}`);
      }

      if (formato === "json") {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio_${tipoRelatorio}_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else { // CSV ou PDF (tratados pela API para download direto)
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const contentDisposition = response.headers.get("content-disposition");
        let fileName = `relatorio_${tipoRelatorio}_${new Date().toISOString().split("T")[0]}.${formato}`;
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (fileNameMatch && fileNameMatch.length === 2)
            fileName = fileNameMatch[1];
        }
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error(`Erro ao baixar relatório ${tipoRelatorio}:`, err);
      } else {
        setError("Erro desconhecido ao baixar relatório");
        console.error(`Erro desconhecido ao baixar relatório ${tipoRelatorio}:`, err);
      }
    }
  };

  // Função para buscar e exibir resultado do relatório Serviços por Status
  const handleExibirRelatorioServicosStatus = async () => {
    setLoadingResultadoServicos(true);
    setResultadoServicosStatus(null);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("formato", "json");
      if (filtroStatusId) params.append("status_id", filtroStatusId);
      if (filtroDataInicioServicos) params.append("data_inicio", new Date(filtroDataInicioServicos).toISOString());
      if (filtroDataFimServicos) params.append("data_fim", new Date(filtroDataFimServicos).toISOString());
      const response = await fetch(`/api/relatorios/servicos-status?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao buscar relatório");
      }
      const data = await response.json();
      setResultadoServicosStatus(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao buscar relatório de serviços por status:", err);
      } else {
        setError("erro desconhecido ao buscar relatório de serviços por status");
        setResultadoServicosStatus(null);
        console.error("Erro desconhecido ao buscar relatório de serviços por status:", err);
      }
    } finally {
      setLoadingResultadoServicos(false);
    }
  };

  // Função para buscar e exibir resultado do relatório de Faturamento
  const handleExibirRelatorioFaturamento = async () => {
    setLoadingResultadoFaturamento(true);
    setResultadoFaturamento(null);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("formato", "json");
      if (!filtroDataInicioFaturamento || !filtroDataFimFaturamento) {
        showError("Datas de início e fim são obrigatórias para o relatório de faturamento.");
        setLoadingResultadoFaturamento(false);
        return;
      }
      params.append("data_inicio", new Date(filtroDataInicioFaturamento).toISOString());
      params.append("data_fim", new Date(filtroDataFimFaturamento).toISOString());
      if (filtroTipoPessoaFaturamento) params.append("tipo_pessoa_cliente", filtroTipoPessoaFaturamento);
      const response = await fetch(`/api/relatorios/faturamento?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao buscar relatório");
      }
      const data = await response.json();
      setResultadoFaturamento(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao buscar relatório de faturamento:", err);
      } else {
        setError("erro desconhecido ao buscar relatório de faturamento");
        console.error("Erro desconhecido ao buscar relatório de faturamento:", err);
      }
      setResultadoFaturamento(null);
    } finally {
      setLoadingResultadoFaturamento(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Relatórios</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Erro: {error}</p>}

      {/* Relatório de Serviços por Status */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Relatório de Serviços por Status</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="filtroStatusId" className="block text-sm font-medium text-gray-700">Status do Serviço</label>
            <select
              id="filtroStatusId"
              value={filtroStatusId}
              onChange={(e) => setFiltroStatusId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
              disabled={loadingStatus}
            >
              <option value="">Todos os Status</option>
              {statusServicos.map(status => (
                <option key={status.id_status_servico} value={status.id_status_servico} >{status.nome_status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtroDataInicioServicos" className="block text-sm font-medium text-gray-700">Data de Entrada (Início)</label>
            <input
              type="date"
              id="filtroDataInicioServicos"
              value={filtroDataInicioServicos}
              onChange={(e) => setFiltroDataInicioServicos(e.target.value)}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
            />
          </div>
          <div>
            <label htmlFor="filtroDataFimServicos" className="block text-sm font-medium text-gray-700">Data de Entrada (Fim)</label>
            <input
              type="date"
              id="filtroDataFimServicos"
              value={filtroDataFimServicos}
              onChange={(e) => setFiltroDataFimServicos(e.target.value)}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
            />
          </div>
        </div>
        <div className="flex space-x-2 mb-4">
          <button onClick={handleExibirRelatorioServicosStatus} className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50" disabled={loadingResultadoServicos}>
            {loadingResultadoServicos ? "Carregando..." : "Exibir Resultado"}
          </button>
          {/* <button onClick={() => handleDownloadRelatorio("servicos-status", "csv")} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Baixar CSV</button> */}
          <button onClick={() => handleDownloadRelatorio("servicos-status", "pdf")} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Baixar PDF</button>
          {/* <button onClick={() => handleDownloadRelatorio("servicos-status", "json")} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Baixar JSON</button> */}
        </div>
        {/* Tabela de resultado */}
        {resultadoServicosStatus && resultadoServicosStatus.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border text-black">OS</th>
                  <th className="px-4 py-2 border text-black">Cliente</th>
                  <th className="px-4 py-2 border text-black">Tipo Pessoa</th>
                  <th className="px-4 py-2 border text-black">Tipo Serviço</th>
                  <th className="px-4 py-2 border text-black">Data Entrada</th>
                  <th className="px-4 py-2 border text-black">Status Atual</th>
                  <th className="px-4 py-2 border text-black">Valor Serviço</th>
                </tr>
              </thead>
              <tbody>
                {resultadoServicosStatus.map((s) => (
                  <tr key={s.id_servico}>
                    <td className="px-4 py-2 border text-black">{s.id_servico}</td>
                    <td className="px-4 py-2 border text-black">{s.cliente?.tipo_pessoa === "FISICA" ? s.cliente?.nome_completo : s.cliente?.razao_social}</td>
                    <td className="px-4 py-2 border text-black">{s.cliente?.tipo_pessoa}</td>
                    <td className="px-4 py-2 border text-black">{s.tipo_servico?.nome_tipo_servico}</td>
                    <td className="px-4 py-2 border text-black">{s.data_entrada ? new Date(s.data_entrada).toLocaleDateString() : ""}</td>
                    <td className="px-4 py-2 border text-black">{s.status_atual?.nome_status}</td>
                    <td className="px-4 py-2 border text-black">{s.valor_servico?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {resultadoServicosStatus && resultadoServicosStatus.length === 0 && (
          <p className="text-gray-500 mt-4">Nenhum resultado encontrado para o filtro selecionado.</p>
        )}
      </div>

      {/* Relatório de Faturamento */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Relatório de Faturamento</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="filtroDataInicioFaturamento" className="block text-sm font-medium text-gray-700">Data de Saída Efetiva (Início)</label>
            <input
              type="date"
              id="filtroDataInicioFaturamento"
              value={filtroDataInicioFaturamento}
              onChange={(e) => setFiltroDataInicioFaturamento(e.target.value)}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="filtroDataFimFaturamento" className="block text-sm font-medium text-gray-700">Data de Saída Efetiva (Fim)</label>
            <input
              type="date"
              id="filtroDataFimFaturamento"
              value={filtroDataFimFaturamento}
              onChange={(e) => setFiltroDataFimFaturamento(e.target.value)}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
              required
            />
          </div>
          <div>
            <label htmlFor="filtroTipoPessoaFaturamento" className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
            <select
              id="filtroTipoPessoaFaturamento"
              value={filtroTipoPessoaFaturamento}
              onChange={(e) => setFiltroTipoPessoaFaturamento(e.target.value as "TODOS" | "FISICA" | "JURIDICA")}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
            >
              <option value="TODOS">Todos</option>
              <option value={TipoPessoa.FISICA} >Pessoa Física</option>
              <option value={TipoPessoa.JURIDICA} >Pessoa Jurídica</option>
            </select>
          </div>
        </div>
        <div className="flex space-x-2 mb-4">
          <button onClick={handleExibirRelatorioFaturamento} className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded disabled:opacity-50" disabled={loadingResultadoFaturamento}>
            {loadingResultadoFaturamento ? "Carregando..." : "Exibir Resultado"}
          </button>
          <button onClick={() => handleDownloadRelatorio("faturamento", "pdf")} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Baixar PDF</button>
        </div>
        {/* Tabela de resultado */}
        {resultadoFaturamento && resultadoFaturamento.data.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 border text-black">OS</th>
                  <th className="px-4 py-2 border text-black">Cliente</th>
                  <th className="px-4 py-2 border text-black">Tipo Pessoa</th>
                  <th className="px-4 py-2 border text-black">Tipo Serviço</th>
                  <th className="px-4 py-2 border text-black">Data Saída Efetiva</th>
                  <th className="px-4 py-2 border text-black">Valor Serviço</th>
                  <th className="px-4 py-2 border text-black">Valor Peças</th>
                  <th className="px-4 py-2 border text-black">Valor Mão de Obra</th>
                  <th className="px-4 py-2 border text-black">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {resultadoFaturamento.data.map((s) => (
                  <tr key={s.id_servico}>
                    <td className="px-4 py-2 border text-black">{s.id_servico}</td>
                    <td className="px-4 py-2 border text-black">{s.cliente?.tipo_pessoa === "FISICA" ? s.cliente?.nome_completo : s.cliente?.razao_social}</td>
                    <td className="px-4 py-2 border text-black">{s.cliente?.tipo_pessoa}</td>
                    <td className="px-4 py-2 border text-black">{s.tipo_servico?.nome_tipo_servico}</td>
                    <td className="px-4 py-2 border text-black">{s.data_efetiva_saida ? new Date(s.data_efetiva_saida).toLocaleDateString() : ""}</td>
                    <td className="px-4 py-2 border text-black">{s.valor_servico?.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-black">{s.valor_pecas?.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-black">{s.valor_mao_de_obra?.toFixed(2)}</td>
                    <td className="px-4 py-2 border text-black">{((s.valor_servico || 0) + (s.valor_pecas || 0) + (s.valor_mao_de_obra || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <span className="font-bold text-lg text-black">Total Faturado: R$ {resultadoFaturamento.totalFaturado.toFixed(2)}</span>
              <br />
              <span className="text-gray-600 text-sm">Período: {new Date(resultadoFaturamento.periodo.inicio).toLocaleDateString()} a {new Date(resultadoFaturamento.periodo.fim).toLocaleDateString()}</span>
            </div>
          </div>
        )}
        {resultadoFaturamento && resultadoFaturamento.data.length === 0 && (
          <p className="text-gray-500 mt-4">Nenhum resultado encontrado para o filtro selecionado.</p>
        )}
      </div>

    </div>
  );
}

