// src/app/servicos/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Servico, StatusServico } from "@/types";
import Link from "next/link";

async function fetchServico(id: string) {
  const res = await fetch(`/api/servicos/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Falha ao buscar dados do serviço");
  }
  return res.json() as Promise<Servico>;
}

async function fetchStatusServico() {
  const res = await fetch("/api/status-servico");
  if (!res.ok) {
    throw new Error("Falha ao buscar status de serviço");
  }
  const json = await res.json();
  return json.data as StatusServico[];
}

export default function ServicoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const servicoId = params.id as string;

  const [servico, setServico] = useState<Servico | null>(null);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusServico[]>([]);
  const [novoStatusId, setNovoStatusId] = useState<string>("");
  const [observacaoMudancaStatus, setObservacaoMudancaStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (servicoId) {
      setIsLoading(true);
      Promise.all([
        fetchServico(servicoId),
        fetchStatusServico()
      ]).then(([servicoData, statusData]) => {
        if (servicoData) {
          setServico(servicoData);
          setNovoStatusId(servicoData.id_status_atual); // Pre-seleciona o status atual
        } else {
          setError("Serviço não encontrado.");
        }
        setStatusDisponiveis(statusData);
      }).catch(err => {
        console.error(err);
        setError("Erro ao carregar dados do serviço ou status.");
      }).finally(() => setIsLoading(false));
    }
  }, [servicoId]);

  const handleStatusUpdate = async () => {
    if (!servico || !novoStatusId || novoStatusId === servico.id_status_atual) {
      alert("Selecione um novo status diferente do atual.");
      return;
    }
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const response = await fetch(`/api/servicos/${servicoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_status_atual: novoStatusId,
          observacao_mudanca_status: observacaoMudancaStatus || `Status alterado para ${statusDisponiveis.find(s => s.id_status_servico === novoStatusId)?.nome_status}`
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar status do serviço");
      }
      const updatedServico = await response.json();
      setServico(updatedServico); // Atualiza o serviço localmente
      // Refetch para pegar o histórico atualizado
      fetchServico(servicoId).then(data => setServico(data));
      setObservacaoMudancaStatus(""); // Limpa observação
      alert("Status atualizado com sucesso!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao atualizar status:", err);
      } else {
        setError("Erro desconhecido ao atualizar status.");
        console.error("Erro desconhecido ao atualizar status:", err);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteServico = async () => {
    if (!servicoId || !window.confirm("Tem certeza que deseja excluir esta Ordem de Serviço? Esta ação não pode ser desfeita e removerá todo o histórico associado.")) {
      return;
    }
    setIsLoading(true); // Reutilizar isLoading para indicar operação
    setError(null);
    try {
      const response = await fetch(`/api/servicos/${servicoId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir a Ordem de Serviço.");
      }
      alert("Ordem de Serviço excluída com sucesso!");
      router.push("/servicos");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao excluir Ordem de Serviço:", err);
      } else {
        setError("Erro desconhecido ao excluir Ordem de Serviço.");
        console.error("Erro desconhecido ao excluir Ordem de Serviço:", err);
      }
      setIsLoading(false);
    }
  };

  if (isLoading && !servico) return <p className="text-center mt-8">Carregando dados do serviço...</p>;
  if (error && !isUpdatingStatus) return <p className="text-red-500 bg-red-100 p-3 rounded mb-4 text-center mt-8">Erro: {error}</p>;
  if (!servico) return <p className="text-center mt-8">Serviço não encontrado.</p>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Detalhes da Ordem de Serviço</h1>
            <p className="text-gray-500">OS: {servico.id_servico?.substring(0, 12)}...</p>
          </div>
          <div className="flex space-x-2">
            <Link href={`/servicos/${servicoId}/editar`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Editar OS
            </Link>
            <button
              onClick={handleDeleteServico}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              disabled={isLoading || isUpdatingStatus}
            >
              Excluir OS
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Informações do Cliente</h2>
            <p className="text-black"><strong>Nome/Razão Social:</strong> {servico.cliente?.nome_completo || servico.cliente?.razao_social}</p>
            <p className="text-black"><strong>Email:</strong> {servico.cliente?.email}</p>
            <p className="text-black"><strong>Telefone:</strong> {servico.cliente?.telefone_principal}</p>
            <Link href={`/clientes/${servico.id_cliente}/editar`} className="text-sm text-blue-500 hover:underline">Ver/Editar Cliente</Link>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Informações do Serviço</h2>
            <p className="text-black"><strong>Tipo de Serviço:</strong> {servico.tipo_servico?.nome_tipo_servico}</p>
            <p className="text-black"><strong>Status Atual:</strong> <span className="font-semibold">{servico.status_atual?.nome_status}</span></p>
            <p className="text-black"><strong>Data de Entrada:</strong> {new Date(servico.data_entrada!).toLocaleDateString()}</p>
            {servico.data_previsao_saida && <p className="text-black"><strong>Previsão de Saída:</strong> {new Date(servico.data_previsao_saida).toLocaleDateString()}</p>}
            {servico.data_efetiva_saida && <p className="text-black"><strong>Data Efetiva de Saída:</strong> {new Date(servico.data_efetiva_saida).toLocaleDateString()}</p>}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Descrição do Problema</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{servico.descricao_problema}</p>
        </div>

        {servico.equipamento_descricao && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Detalhes do Equipamento</h2>
            <p className="text-black"><strong>Descrição:</strong> {servico.equipamento_descricao}</p>
            {servico.equipamento_marca && <p className="text-black"><strong>Marca:</strong> {servico.equipamento_marca}</p>}
            {servico.equipamento_modelo && <p className="text-black"><strong>Modelo:</strong> {servico.equipamento_modelo}</p>}
            {servico.equipamento_num_serie && <p className="text-black"><strong>Nº de Série:</strong> {servico.equipamento_num_serie}</p>}
          </div>
        )}

        {(servico.valor_servico || servico.valor_pecas || servico.valor_mao_de_obra) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Valores</h2>
            {servico.valor_pecas !== null && <p className="text-black"><strong>Valor das Peças:</strong> R$ {servico.valor_pecas?.toFixed(2)}</p>}
            {servico.valor_mao_de_obra !== null && <p className="text-black"><strong>Valor da Mão de Obra:</strong> R$ {servico.valor_mao_de_obra?.toFixed(2)}</p>}
            {servico.valor_servico !== null && <p className="text-black"><strong>Valor Total do Serviço:</strong> R$ {servico.valor_servico?.toFixed(2)}</p>}
          </div>
        )}

        {servico.descricao_solucao && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Descrição da Solução</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{servico.descricao_solucao}</p>
          </div>
        )}

        {servico.observacoes_internas && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Observações Internas</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{servico.observacoes_internas}</p>
          </div>
        )}

        <div className="mb-6 pt-4 border-t">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Atualizar Status do Serviço</h2>
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <div className="flex-grow">
              <label htmlFor="novo_status" className="block text-sm font-medium text-gray-700">Novo Status</label>
              <select
                id="novo_status"
                value={novoStatusId}
                onChange={(e) => setNovoStatusId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
                disabled={isUpdatingStatus}
              >
                {statusDisponiveis.map(status => (
                  <option key={status.id_status_servico} value={status.id_status_servico}>
                    {status.nome_status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-grow">
              <label htmlFor="observacao_mudanca_status" className="block text-sm font-medium text-gray-700">Observação (Opcional)</label>
              <input
                type="text"
                id="observacao_mudanca_status"
                value={observacaoMudancaStatus}
                onChange={(e) => setObservacaoMudancaStatus(e.target.value)}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
                disabled={isUpdatingStatus}
                placeholder="Ex: Aguardando peça"
              />
            </div>
            <button
              onClick={handleStatusUpdate}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 w-full sm:w-auto"
              disabled={isUpdatingStatus || novoStatusId === servico.id_status_atual}
            >
              {isUpdatingStatus ? "Atualizando..." : "Atualizar Status"}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Histórico de Status</h2>
          {servico.historico && servico.historico.length > 0 ? (
            <ul className="space-y-3">
              {servico.historico.map(item => (
                <li key={item.id_historico_servico} className="p-3 bg-gray-50 rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">{new Date(item.data_alteracao).toLocaleString()}</p>
                  <p className="text-black">
                    Status alterado
                    {item.status_anterior ? (
                      <> de <span className="font-medium">{item.status_anterior.nome_status}</span></>
                    ) : ""}
                    {" para "}
                    <span className="font-medium text-green-600">{item.status_novo.nome_status}</span>.
                  </p>
                  {item.observacao && <p className="text-sm text-gray-600 mt-1"><em>Observação: {item.observacao}</em></p>}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum histórico de status para este serviço.</p>
          )}
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
            // disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

