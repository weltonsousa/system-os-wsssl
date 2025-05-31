// src/app/servicos/[id]/editar/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Servico, Cliente, TipoServico, StatusServico } from "@/types";
import { useEffect, useState } from "react";

const servicoUpdateFormSchema = z.object({
  id_cliente: z.string().min(1, "Cliente é obrigatório"),
  id_tipo_servico: z.string().min(1, "Tipo de serviço é obrigatório"),
  descricao_problema: z.string().min(1, "Descrição do problema é obrigatória"),
  equipamento_descricao: z.string().optional().nullable(),
  equipamento_marca: z.string().optional().nullable(),
  equipamento_modelo: z.string().optional().nullable(),
  equipamento_num_serie: z.string().optional().nullable(),
  data_previsao_saida: z.string().optional().nullable(),
  data_efetiva_saida: z.string().optional().nullable(),
  id_status_atual: z.string().min(1, "Status é obrigatório"),
  valor_servico: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? null : parseFloat(String(val)),
    z.number().nullable().optional()
  ),
  valor_pecas: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? null : parseFloat(String(val)),
    z.number().nullable().optional()
  ),
  valor_mao_de_obra: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? null : parseFloat(String(val)),
    z.number().nullable().optional()
  ),
  descricao_solucao: z.string().optional().nullable(),
  observacoes_internas: z.string().optional().nullable(),
});

type ServicoUpdateFormData = z.infer<typeof servicoUpdateFormSchema>;

async function fetchServico(id: string) {
  const res = await fetch(`/api/servicos/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Falha ao buscar dados do serviço");
  }
  return res.json() as Promise<Servico>;
}

async function fetchClientesParaSelect() {
  const res = await fetch("/api/clientes?limit=1000");
  if (!res.ok) throw new Error("Falha ao buscar clientes");
  const data = await res.json();
  return data.data as Cliente[];
}

async function fetchTiposServicoParaSelect() {
  const res = await fetch("/api/tipos-servico");
  if (!res.ok) throw new Error("Falha ao buscar tipos de serviço");
  const data = await res.json();
  return data.data as TipoServico[];
}

async function fetchStatusServicoParaSelect() {
  const res = await fetch("/api/status-servico");
  if (!res.ok) throw new Error("Falha ao buscar status de serviço");
  const data = await res.json();
  return data.data as StatusServico[];
}

export default function EditarServicoPage() {
  const router = useRouter();
  const params = useParams();
  const servicoId = params.id as string;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [statusServico, setStatusServico] = useState<StatusServico[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ServicoUpdateFormData>({
    resolver: zodResolver(servicoUpdateFormSchema),
  });

  useEffect(() => {
    if (servicoId) {
      setIsLoading(true);
      Promise.all([
        fetchServico(servicoId),
        fetchClientesParaSelect(),
        fetchTiposServicoParaSelect(),
        fetchStatusServicoParaSelect(),
      ]).then(([servicoData, clientesData, tiposData, statusData]) => {
        if (servicoData) {
          // Formatar datas para o input type="date" e datetime-local
          const formattedData = {
            ...servicoData,
            data_previsao_saida: servicoData.data_previsao_saida ? new Date(servicoData.data_previsao_saida).toISOString().split("T")[0] : "",
            data_efetiva_saida: servicoData.data_efetiva_saida ? new Date(servicoData.data_efetiva_saida).toISOString().split("T")[0] : "",
          };
          reset(formattedData);
        } else {
          setError("Serviço não encontrado.");
        }
        setClientes(clientesData);
        setTiposServico(tiposData);
        setStatusServico(statusData);
      }).catch(err => {
        console.error(err);
        setError("Erro ao carregar dados do serviço ou dados de apoio.");
      }).finally(() => setIsLoading(false));
    }
  }, [servicoId, reset]);

  const onSubmit: SubmitHandler<ServicoUpdateFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        data_previsao_saida: data.data_previsao_saida ? new Date(data.data_previsao_saida).toISOString() : null,
        data_efetiva_saida: data.data_efetiva_saida ? new Date(data.data_efetiva_saida).toISOString() : null,
      };

      const response = await fetch(`/api/servicos/${servicoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar serviço");
      }
      router.push(`/servicos/${servicoId}`); // Volta para a página de detalhes
    } catch (err: any) {
      setError(err.message);
      console.error("Erro ao atualizar serviço:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="text-center mt-8">Carregando dados para edição...</p>;
  if (error && !isSubmitting) return <p className="text-red-500 bg-red-100 p-3 rounded mb-4 text-center mt-8">Erro: {error}</p>;


  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6  text-gray-800">Editar Ordem de Serviço (OS: {servicoId?.substring(0, 8)}...)</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="id_cliente" className="block text-sm font-medium text-gray-700">Cliente</label>
            <select
              id="id_cliente"
              {...register("id_cliente")}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id_cliente} value={cliente.id_cliente!} className="bg-black">
                  {cliente.tipo_pessoa === "FISICA" ? cliente.nome_completo : cliente.razao_social} ({cliente.email})
                </option>
              ))}
            </select>
            {errors.id_cliente && <p className="text-red-500 text-xs mt-1">{errors.id_cliente.message}</p>}
          </div>

          <div>
            <label htmlFor="id_tipo_servico" className="block text-sm font-medium text-gray-700">Tipo de Serviço</label>
            <select
              id="id_tipo_servico"
              {...register("id_tipo_servico")}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
            >
              <option value="">Selecione o tipo de serviço</option>
              {tiposServico.map(tipo => (
                <option key={tipo.id_tipo_servico} value={tipo.id_tipo_servico!} >
                  {tipo.nome_tipo_servico}
                </option>
              ))}
            </select>
            {errors.id_tipo_servico && <p className="text-red-500 text-xs mt-1">{errors.id_tipo_servico.message}</p>}
          </div>
          <div>
            <label htmlFor="id_status_atual" className="block text-sm font-medium text-gray-700">Status Atual do Serviço</label>
            <select
              id="id_status_atual"
              {...register("id_status_atual")}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
            >
              <option value="">Selecione o status</option>
              {statusServico.map(status => (
                <option key={status.id_status_servico} value={status.id_status_servico!}>
                  {status.nome_status}
                </option>
              ))}
            </select>
            {errors.id_status_atual && <p className="text-red-500 text-xs mt-1">{errors.id_status_atual.message}</p>}
          </div>

          <div>
            <label htmlFor="descricao_problema" className="block text-sm font-medium text-gray-700">Descrição do Problema/Solicitação</label>
            <textarea id="descricao_problema" {...register("descricao_problema")} rows={3} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
            {errors.descricao_problema && <p className="text-red-500 text-xs mt-1">{errors.descricao_problema.message}</p>}
          </div>

          <h2 className="text-xl font-semibold text-gray-800">Detalhes do Equipamento</h2>
          <div>
            <label htmlFor="equipamento_descricao" className="block text-sm font-medium text-gray-700">Descrição do Equipamento</label>
            <input type="text" id="equipamento_descricao" {...register("equipamento_descricao")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="equipamento_marca" className="block text-sm font-medium text-gray-700">Marca</label>
            <input type="text" id="equipamento_marca" {...register("equipamento_marca")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="equipamento_modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
            <input type="text" id="equipamento_modelo" {...register("equipamento_modelo")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="equipamento_num_serie" className="block text-sm font-medium text-gray-700">Número de Série</label>
            <input type="text" id="equipamento_num_serie" {...register("equipamento_num_serie")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-800">Valores e Prazos</h2>
          <div>
            <label htmlFor="data_previsao_saida" className="block text-sm font-medium text-gray-700">Data de Previsão de Saída</label>
            <input type="date" id="data_previsao_saida" {...register("data_previsao_saida")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="data_efetiva_saida" className="block text-sm font-medium text-gray-700">Data Efetiva de Saída</label>
            <input type="date" id="data_efetiva_saida" {...register("data_efetiva_saida")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="valor_servico" className="block text-sm font-medium text-gray-700">Valor Total do Serviço (R$)</label>
            <input type="number" step="0.01" id="valor_servico" {...register("valor_servico")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="valor_pecas" className="block text-sm font-medium text-gray-700">Valor das Peças (R$)</label>
            <input type="number" step="0.01" id="valor_pecas" {...register("valor_pecas")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="valor_mao_de_obra" className="block text-sm font-medium text-gray-700">Valor da Mão de Obra (R$)</label>
            <input type="number" step="0.01" id="valor_mao_de_obra" {...register("valor_mao_de_obra")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-800">Solução e Observações</h2>
          <div>
            <label htmlFor="descricao_solucao" className="block text-sm font-medium text-gray-700">Descrição da Solução Aplicada</label>
            <textarea id="descricao_solucao" {...register("descricao_solucao")} rows={3} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>
          <div>
            <label htmlFor="observacoes_internas" className="block text-sm font-medium text-gray-700">Observações Internas</label>
            <textarea id="observacoes_internas" {...register("observacoes_internas")} rows={3} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-gray-500" />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/servicos/${servicoId}`)} // Voltar para detalhes
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

