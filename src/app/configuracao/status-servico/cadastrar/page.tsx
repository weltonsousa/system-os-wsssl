// src/app/servicos/cadastrar/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StatusServico } from "@/types";
import { useEffect, useState } from "react";

const statusFormSchema = z.object({
  nome_status: z.string().min(1, "Nome Status é obrigatório"),
});

type StatusServicoFormData = z.infer<typeof statusFormSchema>;

async function fetchStatusServico() {
  const res = await fetch("/api/status-servico"); // Pegar uma lista grande para o select
  if (!res.ok) throw new Error("Falha ao buscar status");
  const data = await res.json();
  return data.data as StatusServico[];
}

export default function CadastrarStatusServicoPage() {
  const router = useRouter();
  // Removido statusServico pois não está sendo utilizado
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StatusServicoFormData>({
    resolver: zodResolver(statusFormSchema),
  });

  useEffect(() => {
    fetchStatusServico()
      .catch(err => {
        console.error("Erro ao carregar dados:", err);
        setError("Erro ao carregar status de serviço.");
      });
  }, []);

  const onSubmit: SubmitHandler<StatusServicoFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data
      };

      const response = await fetch("/api/status-servico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao cadastrar status de serviço");
      }
      router.push("/configuracao/status-servico");
    } catch (err: unknown) {
      if (err instanceof Error) {
        const message = err?.message || JSON.stringify(err);
        setError(message);
      } else {
        setError("Erro desconhecido ao cadastrar status de serviço.");
        console.error("Erro ao cadastrar status de serviço:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 mt-8 max-w-3xl">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Novo Status de Serviço</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="nome_status" className="block text-sm font-medium text-slate-700">Nome</label>
            <input type="text" id="nome_status" {...register("nome_status")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md p-2 text-slate-900" />
            {errors.nome_status && <p className="text-red-500 text-xs mt-1">{errors.nome_status?.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
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
              {isSubmitting ? "Salvando..." : "Salvar Status de Serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

