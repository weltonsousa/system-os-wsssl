// src/app/tipos-servico/cadastrar/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TipoServico } from "@/types";
import { useEffect, useState } from "react";

const tipoServicoFormSchema = z.object({
  nome_tipo_servico: z.string().min(1, "Tipo de serviço é obrigatório"),
  descricao: z.string().min(1, "Descrição do problema é obrigatória")
});

type TipoServicoFormData = z.infer<typeof tipoServicoFormSchema>;

async function fetchTiposServico() {
  const res = await fetch("/api/tipos-servico");
  if (!res.ok) throw new Error("Falha ao buscar tipos de serviço");
  return res.json() as Promise<TipoServico[]>;
}

export default function CadastrarServicoPage() {
  const router = useRouter();
  // const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TipoServicoFormData>({
    resolver: zodResolver(tipoServicoFormSchema),
  });

  useEffect(() => {
    fetchTiposServico()
      .catch(err => {
        console.error("Erro ao carregar dados de apoio:", err);
        setError("Erro ao carregar tipos de serviço.");
      });
  }, []);

  const onSubmit: SubmitHandler<TipoServicoFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...data
      };

      const response = await fetch("/api/tipos-servico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao cadastrar tipo de serviço");
      }

      router.push("/configuracao/tipos-servico");
    } catch (err: unknown) {
      if (err instanceof Error) {
        const message = err?.message || JSON.stringify(err);
        setError(message);
      } else {
        console.error("Erro ao cadastrar tipo de serviço:", err);
        setError("Erro ao cadastrar tipo de serviço.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto p-4 mt-8 max-w-3xl">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">Novo Tipo de Serviço</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="nome_tipo_servico" className="block text-sm font-medium text-slate-700">Tipo de Serviço</label>
            <input type="text" id="nome_tipo_servico" {...register("nome_tipo_servico")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md p-2 text-slate-900" />
            {errors.nome_tipo_servico && <p className="text-red-500 text-xs mt-1">{errors.nome_tipo_servico?.message}</p>}
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-slate-700">Descrição</label>
            <textarea id="descricao" {...register("descricao")} rows={3} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md p-2 text-slate-900" />
            {errors.descricao && <p className="text-red-500 text-xs mt-1">{errors.descricao?.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Tipo de Serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

