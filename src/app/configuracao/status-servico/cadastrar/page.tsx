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
  const [statusServico, setStatusServico] = useState<StatusServico[]>([]);
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
      .then((tiposData) => {
        setStatusServico(tiposData);
      }).catch(err => {
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
    } catch (err: any) {
      const message = err?.message || JSON.stringify(err);
      setError(message);
      console.error("Erro ao cadastrar status de serviço:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-neutral-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Novo Tipo de Status de Serviço</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="nome_status" className="block text-sm font-medium text-gray-700">Nome</label>
          <input type="text" id="nome_status" {...register("nome_status")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
          {errors.nome_status && <p className="text-red-500 text-xs mt-1">{errors.nome_status.message}</p>}
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
            {isSubmitting ? "Salvando..." : "Salvar Status de Serviço"}
          </button>
        </div>
      </form>
    </div>
  );
}

