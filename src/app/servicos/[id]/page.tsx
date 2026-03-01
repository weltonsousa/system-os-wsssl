// src/app/servicos/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Servico, StatusServico } from "@/types";
import Link from "next/link";
import { useAlert } from "@/components/ui/AlertContext";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import {
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

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
  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    if (servicoId) {
      setIsLoading(true);
      Promise.all([
        fetchServico(servicoId),
        fetchStatusServico()
      ]).then(([servicoData, statusData]) => {
        if (servicoData) {
          setServico(servicoData);
          setNovoStatusId(servicoData.id_status_atual);
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
      showError("Selecione um novo status diferente do atual.");
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
      setServico(updatedServico);
      fetchServico(servicoId).then(data => setServico(data));
      setObservacaoMudancaStatus("");
      showSuccess("Status atualizado com sucesso!");
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
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/servicos/${servicoId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir a Ordem de Serviço.");
      }
      showSuccess("Ordem de Serviço excluída com sucesso!");
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

  if (isLoading && !servico) {
    return (
      <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Carregando dados da OS...</p>
        </div>
      </div>
    );
  }

  if (error && !isUpdatingStatus) {
    return (
      <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl">
        <div className="text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-500/20 mb-6 flex items-center gap-3">
          <p className="text-sm font-medium">Erro: {error}</p>
        </div>
      </div>
    );
  }

  if (!servico) return <p className="text-center mt-8 dark:text-slate-200">Serviço não encontrado.</p>;

  const inputClassName = "mt-1 block w-full shadow-sm sm:text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-violet-500 focus:border-violet-500 bg-white dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-violet-400 dark:focus:border-violet-400 transition-colors";

  const tabs: TabItem[] = [
    {
      id: "visao-geral",
      label: "Visão Geral",
      icon: ClipboardDocumentListIcon,
      content: (
        <div className="space-y-6 pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                Informações do Cliente
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-300">Nome/Razão Social:</strong> {servico.cliente?.nome_completo || servico.cliente?.razao_social}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-300">Email:</strong> {servico.cliente?.email}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-300">Telefone:</strong> {servico.cliente?.telefone_principal}
                </p>
              </div>
              <div className="mt-4">
                <Link href={`/clientes/${servico.id_cliente}/editar`} className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors">
                  Ver/Editar Cliente &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                Informações do Serviço
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-300">Tipo de Serviço:</strong> {servico.tipo_servico?.nome_tipo_servico}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-300">Status Atual:</strong>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    {servico.status_atual?.nome_status}
                  </span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-300">Data de Entrada:</strong> {new Date(servico.data_entrada!).toLocaleDateString()}
                </p>
                {servico.data_previsao_saida && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-300">Previsão de Saída:</strong> {new Date(servico.data_previsao_saida).toLocaleDateString()}
                  </p>
                )}
                {servico.data_efetiva_saida && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-300">Data Efetiva de Saída:</strong> {new Date(servico.data_efetiva_saida).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Descrição do Problema</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{servico.descricao_problema}</p>
          </div>
        </div>
      )
    },
    {
      id: "equipamento",
      label: "Equipamento & Detalhes",
      icon: ComputerDesktopIcon,
      content: (
        <div className="space-y-6 pt-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Detalhes do Equipamento</h2>
            {servico.equipamento_descricao || servico.equipamento_marca || servico.equipamento_modelo || servico.equipamento_num_serie ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {servico.equipamento_descricao && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-300 block mb-1">Descrição:</strong>
                    {servico.equipamento_descricao}
                  </p>
                )}
                {servico.equipamento_marca && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-300 block mb-1">Marca:</strong>
                    {servico.equipamento_marca}
                  </p>
                )}
                {servico.equipamento_modelo && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-300 block mb-1">Modelo:</strong>
                    {servico.equipamento_modelo}
                  </p>
                )}
                {servico.equipamento_num_serie && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-800 dark:text-slate-300 block mb-1">Nº de Série:</strong>
                    {servico.equipamento_num_serie}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">Nenhum equipamento registrado para esta OS.</p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Descrição da Solução</h2>
            {servico.descricao_solucao ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{servico.descricao_solucao}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">Solução ainda não documentada.</p>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Observações Internas</h2>
            {servico.observacoes_internas ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{servico.observacoes_internas}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">Sem observações internas registrados.</p>
            )}
          </div>
        </div>
      )
    },
    {
      id: "financeiro-status",
      label: "Valores & Status",
      icon: BanknotesIcon,
      content: (
        <div className="space-y-6 pt-4">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Valores Fechados</h2>
            {(servico.valor_servico || servico.valor_pecas || servico.valor_mao_de_obra) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                {servico.valor_pecas !== null && (
                  <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400 mb-1">Valor das Peças</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">R$ {servico.valor_pecas?.toFixed(2)}</p>
                  </div>
                )}
                {servico.valor_mao_de_obra !== null && (
                  <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="text-slate-500 dark:text-slate-400 mb-1">Mão de Obra</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">R$ {servico.valor_mao_de_obra?.toFixed(2)}</p>
                  </div>
                )}
                {servico.valor_servico !== null && (
                  <div className="bg-indigo-50 dark:bg-violet-900/20 shadow-sm p-4 border border-indigo-100 dark:border-violet-500/30 rounded-lg">
                    <p className="text-indigo-600/80 dark:text-violet-400 mb-1">Valor Total</p>
                    <p className="text-xl font-bold text-indigo-700 dark:text-violet-300">R$ {servico.valor_servico?.toFixed(2)}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">Nenhum valor financeiro lançado nesta OS.</p>
            )}
          </div>

          <div className="bg-white/50 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Atualizar Status do Serviço</h2>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-grow w-full">
                <label htmlFor="novo_status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Novo Status</label>
                <select
                  id="novo_status"
                  value={novoStatusId}
                  onChange={(e) => setNovoStatusId(e.target.value)}
                  className={inputClassName}
                  disabled={isUpdatingStatus}
                >
                  {statusDisponiveis.map(status => (
                    <option key={status.id_status_servico} value={status.id_status_servico}>
                      {status.nome_status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-grow w-full">
                <label htmlFor="observacao_mudanca_status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação (Opcional)</label>
                <input
                  type="text"
                  id="observacao_mudanca_status"
                  value={observacaoMudancaStatus}
                  onChange={(e) => setObservacaoMudancaStatus(e.target.value)}
                  className={inputClassName}
                  disabled={isUpdatingStatus}
                  placeholder="Ex: Aguardando peça"
                />
              </div>
              <button
                onClick={handleStatusUpdate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-lg disabled:opacity-50 w-full sm:w-auto transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-sm h-[42px]"
                disabled={isUpdatingStatus || novoStatusId === servico.id_status_atual}
              >
                {isUpdatingStatus ? "Atualizando..." : "Atualizar"}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Histórico de Status</h2>
            {servico.historico && servico.historico.length > 0 ? (
              <ul className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent dark:before:via-slate-700">
                {servico.historico.map((item, id) => (
                  <li key={item.id_historico_servico} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <span className="text-xs font-bold">{servico.historico!.length - id}</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1">
                        <div className="font-medium text-emerald-600 dark:text-emerald-400 text-sm">{item.status_novo.nome_status}</div>
                        <time className="text-xs font-medium text-slate-500 dark:text-slate-400">{new Date(item.data_alteracao).toLocaleString()}</time>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 text-sm">
                        {item.status_anterior ? (
                          <>Mudou de <span className="font-medium text-slate-700 dark:text-slate-300">{item.status_anterior.nome_status}</span></>
                        ) : "Status inicial definido."}
                      </div>
                      {item.observacao && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 p-2 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-100 dark:border-slate-700"><em>{item.observacao}</em></p>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800/60">Nenhum histórico de status para este serviço.</p>
            )}
          </div>

        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl flex-1">
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-8 transition-colors">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Detalhes da Ordem de Serviço
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
              OS: {servico.id_servico?.substring(0, 12)}...
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDeleteServico}
              className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-medium py-2 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 text-sm disabled:opacity-50 flex-1 sm:flex-none text-center"
              disabled={isLoading || isUpdatingStatus}
            >
              Excluir
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-2.5 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 w-full sm:w-auto text-sm"
            >
              Cancelar
            </button>
            <Link
              href={`/servicos/${servicoId}/editar`}
              className="bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 text-sm flex-1 sm:flex-none text-center"
            >
              Editar OS
            </Link>
          </div>
        </div>

        <Tabs tabs={tabs} defaultTab="visao-geral" />

      </div>
    </div>
  );
}
