// src/app//configuracao/tipos-servico/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { TipoServico } from "@prisma/client";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlert } from "@/components/ui/AlertContext";

const tipoServicoFormSchema = z.object({
  nome_tipo_servico: z.string().min(1, "Tipo de serviço é obrigatório"),
  descricao: z.string().min(1, "Descrição do problema é obrigatória")
});

type TipoServicoFormData = z.infer<typeof tipoServicoFormSchema>;

async function fetchTipoServico(id: string) {
  const res = await fetch(`/api/tipos-servico/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Falha ao buscar dados do serviço");
  }
  return res.json() as Promise<TipoServico>;
}

export default function TipoServicoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tipoServicoId = params.id as string;
  const { showSuccess } = useAlert();
  const [tipoServico, setTipoServico] = useState<TipoServico>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TipoServicoFormData>({
    resolver: zodResolver(tipoServicoFormSchema),
  });

  useEffect(() => {
    if (tipoServicoId) {
      setIsLoading(true);
      fetchTipoServico(tipoServicoId)
        .then(tipoServicoData => {
          if (tipoServicoData) {
            setTipoServico(tipoServicoData);
          } else {
            setError("Tipo de Serviço não encontrado.");
          }
        }).catch(err => {
          console.error(err);
          setError("Erro ao carregar dados tipo de serviço.");
        }).finally(() => setIsLoading(false));
    }
  }, [tipoServicoId, reset]);

  useEffect(() => {
    if (tipoServico) {
      reset({
        nome_tipo_servico: tipoServico.nome_tipo_servico,
        descricao: tipoServico.descricao ?? "",
      });
    }
  }, [tipoServico, reset]);


  const onSubmit: SubmitHandler<TipoServicoFormData> = async (data) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const response = await fetch(`/api/tipos-servico/${tipoServicoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar tipo de serviço");
      }
      router.push("/configuracao/tipos-servico/");

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao atualizar tipo de serviço:", err);
      } else {
        setError("Erro desconhecido ao atualizar tipo de serviço.");
        console.error("Erro desconhecido ao atualizar tipo de serviço:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTipoServico = async () => {
    if (!tipoServicoId || !window.confirm("Tem certeza que deseja excluir esta Tipo de Serviço? Esta ação não pode ser desfeita e removerá tudo.")) {
      return;
    }
    setIsLoading(true); // Reutilizar isLoading para indicar operação
    setError(null);
    try {
      const response = await fetch(`/api/tipos-servico/${tipoServicoId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir a TIpo de Serviço.");
      }
      showSuccess("Tipo de Serviço excluído com sucesso!");
      router.push("/configuracao");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao excluir Tipo de Serviço:", err);
      } else {
        setError("Erro desconhecido ao excluir Tipo de Serviço.");
        console.error("Erro desconhecido ao excluir Tipo de Serviço:", err);
      }
      setIsLoading(false);
    }
  };

  if (isLoading) return <p className="text-center mt-8">Carregando dados tipo de serviço...</p>;
  if (error && !isUpdatingStatus) return <p className="text-red-500 bg-red-100 p-3 rounded mb-4 text-center mt-8">Erro: {error}</p>;
  if (!isLoading && !tipoServico && !error) return <p>Cliente não encontrado ou dados inválidos.</p>; // Caso não carregue

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-600">Editar Tipo de Serviço</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <label htmlFor="nome_tipo_servico" className="block text-sm font-medium text-gray-700">Nome</label>
            <input type="text" id="nome_tipo_servico" {...register("nome_tipo_servico")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            {errors.nome_tipo_servico && <p className="text-red-500 text-xs mt-1">{errors.nome_tipo_servico.message}</p>}
          </div>
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
            <input type="text" id="descricao" {...register("descricao")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            {errors.descricao && <p className="text-red-500 text-xs mt-1">{errors.descricao.message}</p>}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleDeleteTipoServico}
              className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-medium py-2 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 text-sm disabled:opacity-50 flex-1 sm:flex-none text-center"
              disabled={isSubmitting}
            >
              Excluir
            </button>
            <div className="space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
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
          </div>
        </form>
      </div>
    </div>
  );
}

