// src/app/servicos/[id]/editar/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Servico, Cliente, TipoServico, StatusServico } from "@/types";
import { useEffect, useState } from "react";
import { useAlert } from "@/components/ui/AlertContext";
import { WrenchScrewdriverIcon, ComputerDesktopIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { Field } from "@/components/ui/Field";

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
  valor_servico: z.number().nullable().optional(),
  valor_pecas: z.number().nullable().optional(),
  valor_mao_de_obra: z.number().nullable().optional(),
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
  const { showSuccess, showError } = useAlert();

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
      showSuccess("Serviço atualizado com sucesso!");
      router.push(`/servicos/${servicoId}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showError(err.message);
        console.error("Erro ao atualizar serviço:", err);
      } else {
        showError("Erro desconhecido ao atualizar serviço");
        console.error("Erro desconhecido:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = "mt-1 block w-full shadow-sm sm:text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-violet-500 focus:border-violet-500 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-violet-400 dark:focus:border-violet-400 dark:placeholder-slate-500 transition-colors";

  const tabs: TabItem[] = [
    {
      id: "servico-cliente",
      label: "Serviço & Cliente",
      icon: WrenchScrewdriverIcon,
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field id="id_cliente" label="Cliente" required error={errors.id_cliente?.message}>
              <select
                id="id_cliente"
                {...register("id_cliente")}
                className={inputClassName}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente!}>
                    {cliente.tipo_pessoa === "FISICA" ? cliente.nome_completo : cliente.razao_social} ({cliente.email})
                  </option>
                ))}
              </select>
            </Field>

            <Field id="id_tipo_servico" label="Tipo de Serviço" required error={errors.id_tipo_servico?.message}>
              <select
                id="id_tipo_servico"
                {...register("id_tipo_servico")}
                className={inputClassName}
              >
                <option value="">Selecione o tipo de serviço</option>
                {tiposServico.map(tipo => (
                  <option key={tipo.id_tipo_servico} value={tipo.id_tipo_servico!}>
                    {tipo.nome_tipo_servico}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="id_status_atual" label="Status Atual" required error={errors.id_status_atual?.message}>
              <select
                id="id_status_atual"
                {...register("id_status_atual")}
                className={inputClassName}
              >
                <option value="">Selecione o status</option>
                {statusServico.map(status => (
                  <option key={status.id_status_servico} value={status.id_status_servico!}>
                    {status.nome_status}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field id="descricao_problema" label="Descrição do Problema/Solicitação" required error={errors.descricao_problema?.message}>
            <textarea
              id="descricao_problema"
              {...register("descricao_problema")}
              rows={4}
              placeholder="Descreva detalhadamente o problema relatado pelo cliente..."
              className={inputClassName}
            />
          </Field>
        </div>
      )
    },
    {
      id: "equipamento",
      label: "Equipamento",
      icon: ComputerDesktopIcon,
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="equipamento_descricao" label="Descrição do Equipamento" error={errors.equipamento_descricao?.message}>
              <input type="text" id="equipamento_descricao" {...register("equipamento_descricao")} className={inputClassName} placeholder="Ex: Notebook, Smartphone..." />
            </Field>
            <Field id="equipamento_marca" label="Marca" error={errors.equipamento_marca?.message}>
              <input type="text" id="equipamento_marca" {...register("equipamento_marca")} className={inputClassName} placeholder="Ex: Dell, Samsung..." />
            </Field>
            <Field id="equipamento_modelo" label="Modelo" error={errors.equipamento_modelo?.message}>
              <input type="text" id="equipamento_modelo" {...register("equipamento_modelo")} className={inputClassName} placeholder="Ex: Inspiron 15, Galaxy S21..." />
            </Field>
            <Field id="equipamento_num_serie" label="Número de Série" error={errors.equipamento_num_serie?.message}>
              <input type="text" id="equipamento_num_serie" {...register("equipamento_num_serie")} className={inputClassName} placeholder="S/N do equipamento" />
            </Field>
          </div>
        </div>
      )
    },
    {
      id: "valores-solucao",
      label: "Valores & Solução",
      icon: CurrencyDollarIcon,
      content: (
        <div className="space-y-4 pt-2">
          <h2 className="text-md font-semibold text-slate-800 dark:text-slate-200">Datas e Prazos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="data_previsao_saida" label="Data de Previsão de Saída" error={errors.data_previsao_saida?.message}>
              <input type="date" id="data_previsao_saida" {...register("data_previsao_saida")} className={inputClassName} />
            </Field>
            <Field id="data_efetiva_saida" label="Data Efetiva de Saída" error={errors.data_efetiva_saida?.message}>
              <input type="date" id="data_efetiva_saida" {...register("data_efetiva_saida")} className={inputClassName} />
            </Field>
          </div>

          <hr className="border-slate-200 dark:border-slate-800 my-4" />
          <h2 className="text-md font-semibold text-slate-800 dark:text-slate-200">Valores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field id="valor_servico" label="Valor Total (R$)" error={errors.valor_servico?.message}>
              <input type="number" step="0.01" id="valor_servico" {...register("valor_servico", { valueAsNumber: true })} className={inputClassName} placeholder="0.00" />
            </Field>
            <Field id="valor_pecas" label="Valor das Peças (R$)" error={errors.valor_pecas?.message}>
              <input type="number" step="0.01" id="valor_pecas" {...register("valor_pecas", { valueAsNumber: true })} className={inputClassName} placeholder="0.00" />
            </Field>
            <Field id="valor_mao_de_obra" label="Valor da Mão de Obra (R$)" error={errors.valor_mao_de_obra?.message}>
              <input type="number" step="0.01" id="valor_mao_de_obra" {...register("valor_mao_de_obra", { valueAsNumber: true })} className={inputClassName} placeholder="0.00" />
            </Field>
          </div>

          <hr className="border-slate-200 dark:border-slate-800 my-4" />
          <h2 className="text-md font-semibold text-slate-800 dark:text-slate-200">Diagnóstico e Observações</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field id="descricao_solucao" label="Descrição da Solução Aplicada" error={errors.descricao_solucao?.message}>
              <textarea id="descricao_solucao" {...register("descricao_solucao")} rows={3} className={inputClassName} placeholder="O que foi feito para solucionar o problema..." />
            </Field>
            <Field id="observacoes_internas" label="Observações Internas" error={errors.observacoes_internas?.message}>
              <textarea id="observacoes_internas" {...register("observacoes_internas")} rows={2} className={inputClassName} placeholder="Anotações visíveis apenas para a equipe..." />
            </Field>
          </div>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Carregando dados da OS...</p>
        </div>
      </div>
    );
  }

  if (error && !isSubmitting) {
    return (
      <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl">
        <div className="text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-500/20 mb-6 flex items-center gap-3">
          <p className="text-sm font-medium">Erro: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl flex-1">
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-8 transition-colors">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Editar Ordem de Serviço
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
              OS: {servicoId?.substring(0, 8)}...
            </p>
          </div>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-500/20 mb-6 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Tabs tabs={tabs} />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => router.push(`/servicos/${servicoId}`)}
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium py-2.5 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 w-full sm:w-auto text-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-violet-600 dark:bg-violet-500 hover:bg-violet-700 dark:hover:bg-violet-600 text-white font-medium py-2.5 px-6 rounded-lg disabled:opacity-50 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 w-full sm:w-auto text-sm"
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
