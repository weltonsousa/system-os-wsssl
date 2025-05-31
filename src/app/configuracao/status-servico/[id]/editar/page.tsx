// src/app/configuracao/status-servico/[id]/editar/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StatusServico } from "@/types";
import { useEffect, useState } from "react";

const statusServicoUpdateFormSchema = z.object({
  nome_status: z.string().min(1, "Nome do status de serviço é obrigatório"),
  descricao: z.string().min(1, "Descrição do tipo de serviço é obrigatória"),
});

type StatusServicoUpdateFormData = z.infer<typeof statusServicoUpdateFormSchema>;

async function fetchStatuServicoById(id: string) {
  const res = await fetch(`/api/status-servico/${id}`);
  if (!res.ok) throw new Error("Falha ao buscar tipo de serviço");
  return res.json() as Promise<StatusServico>;
}

export default function EditarstatusServicoPage() {
  const router = useRouter();
  const params = useParams();
  const servicoId = params.id as string;

  const [statusServico, setStatusServico] = useState<StatusServico>();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    //setValue,
  } = useForm<StatusServicoUpdateFormData>({
    resolver: zodResolver(statusServicoUpdateFormSchema),
  });

  useEffect(() => {
    if (servicoId) {
      setIsLoading(true);
      fetchStatuServicoById(servicoId)
        .then((statusServico) => {
          if (statusServico) {
             reset({
                    nome_status: statusServico.nome_status ?? "",
                    descricao: statusServico.descricao ?? "",
                  });
                  // Popula o formulário
              setStatusServico(statusServico);
          } else {
            setError("Serviço não encontrado.");
          }
        })
        .catch(err => {
          console.error(err);
          setError("Erro ao carregar dados do status de serviço.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [servicoId, reset]);

  const onSubmit: SubmitHandler<StatusServicoUpdateFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
      };

      const response = await fetch(`/api/status-servico/${servicoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar serviço");
      }
      router.push(`/configuracao/status-servico`); // Volta para a página de detalhes
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao atualizar status de serviço:", err);
      } else {
        setError("Erro desconhecido ao atualizar status de serviço.");
        console.error("Erro desconhecido ao atualizar status de serviço:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="text-center mt-8">Carregando dados para edição...</p>;
  if (error && !isSubmitting) return <p className="text-red-500 bg-red-100 p-3 rounded mb-4 text-center mt-8">Erro: {error}</p>;


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Editar Status de Serviço</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <div>
          <label htmlFor="nome_status" className="block text-sm font-medium text-gray-700">Nome do Status de Serviço</label>
          <input id="nome_status" {...register("nome_status")} />
          {errors.nome_status && <p className="text-red-500 text-xs mt-1">{errors.nome_status.message}</p>}
        </div>

        <h2 className="text-xl font-semibold pt-4 border-t mt-6">Descrição</h2>
        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição do Tipo de Serviço</label>
          <input type="text" id="descricao" {...register("descricao")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2" />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/configuracao/status-servico`)} // Voltar para detalhes
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
  );
}

