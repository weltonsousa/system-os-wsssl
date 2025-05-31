// src/app/servicos/cadastrar/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Servico, Cliente, TipoServico, StatusServico } from "@/types";
import { useEffect, useState } from "react";

const servicoFormSchema = z.object({
  id_cliente: z.string().min(1, "Cliente é obrigatório"),
  id_tipo_servico: z.string().min(1, "Tipo de serviço é obrigatório"),
  descricao_problema: z.string().min(1, "Descrição do problema é obrigatória"),
  equipamento_descricao: z.string().optional(),
  equipamento_marca: z.string().optional(),
  equipamento_modelo: z.string().optional(),
  equipamento_num_serie: z.string().optional(),
  data_previsao_saida: z.string().optional().nullable(), // Validar como data se necessário
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
});

type ServicoFormData = z.infer<typeof servicoFormSchema>;

async function fetchClientesParaSelect() {
  const res = await fetch("/api/clientes?limit=1000"); // Pegar uma lista grande para o select
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

export default function CadastrarServicoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [statusServico, setStatusServico] = useState<StatusServico[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServicoFormData>({
    resolver: zodResolver(servicoFormSchema),
  });

  useEffect(() => {
    Promise.all([
      fetchClientesParaSelect(),
      fetchTiposServicoParaSelect(),
      fetchStatusServicoParaSelect(),
    ]).then(([clientesData, tiposData, statusData]) => {
      setClientes(clientesData);
      setTiposServico(tiposData);
      setStatusServico(statusData);
    }).catch(err => {
      console.error("Erro ao carregar dados de apoio:", err);
      setError("Erro ao carregar clientes ou tipos de serviço.");
    });
  }, []);

  const onSubmit: SubmitHandler<ServicoFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        data_previsao_saida: data.data_previsao_saida ? new Date(data.data_previsao_saida).toISOString() : null,
      };

      const response = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          typeof errorData.error === "string"
            ? errorData.error
            : JSON.stringify(errorData) || "Falha ao cadastrar serviço";
        throw new Error(errorMessage);
      }
      router.push("/servicos");
    } catch (err: any) {
      setError(err.message);
      console.error("Erro ao cadastrar serviço:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-neutral-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Cadastrar Nova Ordem de Serviço</h1>
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
              <option key={cliente.id_cliente} value={cliente.id_cliente!}>
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
              <option key={tipo.id_tipo_servico} value={tipo.id_tipo_servico!}>
                {tipo.nome_tipo_servico}
              </option>
            ))}
          </select>
          {errors.id_tipo_servico && <p className="text-red-500 text-xs mt-1">{errors.id_tipo_servico.message}</p>}
        </div>
        <div>
          <label htmlFor="descricao_problema" className="block text-sm font-medium text-gray-700">Descrição do Problema/Solicitação</label>
          <textarea id="descricao_problema" {...register("descricao_problema")} rows={3} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
          {errors.descricao_problema && <p className="text-red-500 text-xs mt-1">{errors.descricao_problema.message}</p>}
        </div>

        <h2 className="text-xl font-semibold pt-4 border-t mt-6 text-blue-600">Detalhes do Equipamento (Opcional)</h2>
        <div>
          <label htmlFor="equipamento_descricao" className="block text-sm font-medium text-gray-700">Descrição do Equipamento</label>
          <input type="text" id="equipamento_descricao" {...register("equipamento_descricao")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="equipamento_marca" className="block text-sm font-medium text-gray-700">Marca</label>
          <input type="text" id="equipamento_marca" {...register("equipamento_marca")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="equipamento_modelo" className="block text-sm font-medium text-gray-700">Modelo</label>
          <input type="text" id="equipamento_modelo" {...register("equipamento_modelo")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="equipamento_num_serie" className="block text-sm font-medium text-gray-700">Número de Série</label>
          <input type="text" id="equipamento_num_serie" {...register("equipamento_num_serie")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>

        <h2 className="text-xl font-semibold pt-4 border-t mt-6 text-blue-600">Valores e Prazos (Opcional)</h2>
        <div>
          <label htmlFor="data_previsao_saida" className="block text-sm font-medium text-gray-700">Data de Previsão de Saída</label>
          <input type="date" id="data_previsao_saida" {...register("data_previsao_saida")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="valor_servico" className="block text-sm font-medium text-gray-700">Valor Total do Serviço (R$)</label>
          <input type="number" step="0.01" id="valor_servico" {...register("valor_servico")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="valor_pecas" className="block text-sm font-medium text-gray-700">Valor das Peças (R$)</label>
          <input type="number" step="0.01" id="valor_pecas" {...register("valor_pecas")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="valor_mao_de_obra" className="block text-sm font-medium text-gray-700">Valor da Mão de Obra (R$)</label>
          <input type="number" step="0.01" id="valor_mao_de_obra" {...register("valor_mao_de_obra")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
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
            {isSubmitting ? "Salvando..." : "Salvar Ordem de Serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}

