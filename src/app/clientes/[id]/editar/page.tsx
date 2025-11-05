// src/app/clientes/[id]/editar/page.tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Cliente, TipoPessoa } from "@/types";
import { useEffect, useState } from "react";
import { maskCEP, maskCNPJ, maskCPF } from "@/app/utils/utils";

const clienteFormSchema = z.object({
  tipo_pessoa: z.nativeEnum(TipoPessoa),
  nome_completo: z.string().optional(),
  cpf: z.string().optional(),
  razao_social: z.string().optional(),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  nome_contato_pj: z.string().optional(),
  telefone_principal: z.string().min(1, "Telefone principal é obrigatório"),
  telefone_secundario: z.string().optional(),
  email: z.string().email("Email inválido"),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado_uf: z.string().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.tipo_pessoa === TipoPessoa.FISICA) {
    if (!data.nome_completo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome completo é obrigatório para Pessoa Física",
        path: ["nome_completo"],
      });
    }
    if (!data.cpf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF é obrigatório para Pessoa Física",
        path: ["cpf"],
      });
    }
  } else if (data.tipo_pessoa === TipoPessoa.JURIDICA) {
    if (!data.razao_social) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Razão Social é obrigatória para Pessoa Jurídica",
        path: ["razao_social"],
      });
    }
    if (!data.cnpj) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CNPJ é obrigatório para Pessoa Jurídica",
        path: ["cnpj"],
      });
    }
  }
});

type ClienteFormData = z.infer<typeof clienteFormSchema>;

async function fetchCliente(id: string) {
  const res = await fetch(`/api/clientes/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Falha ao buscar dados do cliente");
  }
  return res.json() as Promise<Cliente>;
}

// Função utilitária para converter null em undefined
function nullsToUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(nullsToUndefined) as unknown as T;
  const newObj: Record<string, unknown> = {};
  for (const key in obj as object) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key];
      newObj[key] = value === null ? undefined : nullsToUndefined(value);
    }
  }
  return newObj as T;
}

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const clienteId = params.id as string;

  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(TipoPessoa.FISICA);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset, // Para popular o formulário com dados existentes
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteFormSchema),
  });

  const watchedTipoPessoa = watch("tipo_pessoa");

  useEffect(() => {
    if (clienteId) {
      setIsLoading(true);
      fetchCliente(clienteId)
        .then(data => {
          if (data) {
            reset(nullsToUndefined(data) as ClienteFormData); // Popula o formulário
            setTipoPessoa(data.tipo_pessoa);
          } else {
            setError("Cliente não encontrado.");
          }
        })
        .catch((err: unknown) => {
          if (err instanceof Error) {
            console.error(err);
            setError("Erro ao carregar dados do cliente.");
          } else {
            console.error("Erro desconhecido ao carregar dados do cliente:", err);
            setError("Erro desconhecido ao carregar dados do cliente.");
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [clienteId, reset]);

  useEffect(() => {
    setTipoPessoa(watchedTipoPessoa);
    // Não limpar campos aqui ao carregar, apenas ao mudar interativamente
  }, [watchedTipoPessoa]);

  const handleTipoPessoaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTipo = event.target.value as TipoPessoa;
    setValue("tipo_pessoa", newTipo, { shouldValidate: true });
    // Limpar campos específicos ao mudar o tipo de pessoa
    if (newTipo === TipoPessoa.FISICA) {
      setValue("razao_social", "");
      setValue("nome_fantasia", "");
      setValue("cnpj", "");
      setValue("inscricao_estadual", "");
      setValue("inscricao_municipal", "");
      setValue("nome_contato_pj", "");
    } else {
      setValue("nome_completo", "");
      setValue("cpf", "");
    }
  };

  const onSubmit: SubmitHandler<ClienteFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar cliente");
      }
      router.push("/clientes");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao atualizar cliente:", err);
      } else {
        setError("Erro desconhecido ao atualizar cliente.");
        console.error("Erro desconhecido ao atualizar cliente:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao excluir cliente");
      }
      router.push("/clientes");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        console.error("Erro ao excluir cliente:", err);
      } else {
        setError("Erro desconhecido ao excluir cliente.");
        console.error("Erro desconhecido ao excluir cliente:", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Carregando dados do cliente...</p>;
  if (error && !isSubmitting) return <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Erro: {error}</p>;
  if (!isLoading && !watchedTipoPessoa && !error) return <p>Cliente não encontrado ou dados inválidos.</p>; // Caso não carregue

  return (
    <div className="container mx-auto p-4  bg-neutral-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Editar Cliente</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="tipo_pessoa" className="block text-sm font-medium text-gray-700">Tipo de Pessoa</label>
          <select
            id="tipo_pessoa"
            {...register("tipo_pessoa")}
            onChange={handleTipoPessoaChange} // Usar o handler customizado
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-black"
          >
            <option value={TipoPessoa.FISICA}>Pessoa Física</option>
            <option value={TipoPessoa.JURIDICA}>Pessoa Jurídica</option>
          </select>
        </div>

        {tipoPessoa === TipoPessoa.FISICA && (
          <>
            <div>
              <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <input type="text" id="nome_completo" {...register("nome_completo")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
              {errors.nome_completo && <p className="text-red-500 text-xs mt-1">{errors.nome_completo.message}</p>}
            </div>
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
              <input type="text" maxLength={14} id="cpf" {...register("cpf")} onChange={(e) => {
                const masked = maskCPF(e.target.value);
                e.target.value = masked;
                register("cpf").onChange(e);
                setValue("cpf", masked, { shouldValidate: true });
              }} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
              {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
            </div>
          </>
        )}

        {tipoPessoa === TipoPessoa.JURIDICA && (
          <>
            <div>
              <label htmlFor="razao_social" className="block text-sm font-medium text-gray-700">Razão Social</label>
              <input type="text" id="razao_social" {...register("razao_social")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
              {errors.razao_social && <p className="text-red-500 text-xs mt-1">{errors.razao_social.message}</p>}
            </div>
            <div>
              <label htmlFor="nome_fantasia" className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
              <input type="text" id="nome_fantasia" {...register("nome_fantasia")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
              <input type="text" maxLength={18} id="cnpj" {...register("cnpj")} onChange={(e) => {
                const masked = maskCNPJ(e.target.value);
                e.target.value = masked;
                register("cnpj").onChange(e);
                setValue("cnpj", masked, { shouldValidate: true });
              }} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
              {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>}
            </div>
            <div>
              <label htmlFor="inscricao_estadual" className="block text-sm font-medium text-gray-700">Inscrição Estadual</label>
              <input type="text" id="inscricao_estadual" {...register("inscricao_estadual")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
            <div>
              <label htmlFor="inscricao_municipal" className="block text-sm font-medium text-gray-700">Inscrição Municipal</label>
              <input type="text" id="inscricao_municipal" {...register("inscricao_municipal")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
            <div>
              <label htmlFor="nome_contato_pj" className="block text-sm font-medium text-gray-700">Nome do Contato</label>
              <input type="text" id="nome_contato_pj" {...register("nome_contato_pj")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" id="email" {...register("email")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="telefone_principal" className="block text-sm font-medium text-gray-700">Telefone Principal</label>
          <input type="tel" id="telefone_principal" {...register("telefone_principal")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
          {errors.telefone_principal && <p className="text-red-500 text-xs mt-1">{errors.telefone_principal.message}</p>}
        </div>
        <div>
          <label htmlFor="telefone_secundario" className="block text-sm font-medium text-gray-700">Telefone Secundário</label>
          <input type="tel" id="telefone_secundario" {...register("telefone_secundario")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
          <input type="text" id="cep" maxLength={9} {...register("cep")} onChange={(e) => {
            const masked = maskCEP(e.target.value);
            e.target.value = masked;
            register("cep").onChange(e);
            setValue("cep", masked, { shouldValidate: true });
          }} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="rua" className="block text-sm font-medium text-gray-700">Rua</label>
          <input type="text" id="rua" {...register("rua")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-gray-700">Número</label>
          <input type="text" id="numero" {...register("numero")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="complemento" className="block text-sm font-medium text-gray-700">Complemento</label>
          <input type="text" id="complemento" {...register("complemento")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="bairro" className="block text-sm font-medium text-gray-700">Bairro</label>
          <input type="text" id="bairro" {...register("bairro")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">Cidade</label>
          <input type="text" id="cidade" {...register("cidade")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="estado_uf" className="block text-sm font-medium text-gray-700">Estado (UF)</label>
          <input type="text" id="estado_uf" {...register("estado_uf")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">Observações</label>
          <textarea id="observacoes" {...register("observacoes")} rows={3} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div className="flex items-center">
          <input
            id="ativo"
            type="checkbox"
            {...register("ativo")}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
            Cliente Ativo
          </label>
        </div>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            disabled={isSubmitting}
          >
            Excluir Cliente
          </button>
          <div className="space-x-3">
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
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

