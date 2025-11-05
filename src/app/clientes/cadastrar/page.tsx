// src/app/clientes/cadastrar/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TipoPessoa } from "@/types"; //Cliente,
import { useEffect, useState } from "react";
import { maskCPF, maskPhone, maskCEP, maskCNPJ } from "@/app/utils/utils";

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

export default function CadastrarClientePage() {
  const router = useRouter();
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(TipoPessoa.FISICA);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      tipo_pessoa: TipoPessoa.FISICA,
    },
  });

  const watchedTipoPessoa = watch("tipo_pessoa");

  useEffect(() => {
    setTipoPessoa(watchedTipoPessoa);
    // Limpar campos específicos ao mudar o tipo de pessoa
    if (watchedTipoPessoa === TipoPessoa.FISICA) {
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
  }, [watchedTipoPessoa, setValue]);

  // Desestruturar register para campos com máscara
  const cpfRegister = register("cpf");
  const cnpjRegister = register("cnpj");
  const telefonePrincipalRegister = register("telefone_principal");
  const telefoneSecundarioRegister = register("telefone_secundario");
  const cepRegister = register("cep");

  const onSubmit: SubmitHandler<ClienteFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao cadastrar cliente");
      }
      router.push("/clientes");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao cadastrar cliente'
      setError(errorMessage);
      console.error("Erro ao cadastrar cliente:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 mt-12 bg-neutral-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Cadastrar Novo Cliente</h1>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="tipo_pessoa" className="block text-sm font-medium text-black">Tipo de Pessoa</label>
          <select
            id="tipo_pessoa"
            {...register("tipo_pessoa")}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base text-black border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value={TipoPessoa.FISICA}>Pessoa Física</option>
            <option value={TipoPessoa.JURIDICA}>Pessoa Jurídica</option>
          </select>
        </div>

        {tipoPessoa === TipoPessoa.FISICA && (
          <>
            <div>
              <label htmlFor="nome_completo" className="block text-sm font-medium text-black">Nome Completo</label>
              <input type="text" maxLength={100} id="nome_completo" {...register("nome_completo")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
              {errors.nome_completo && <p className="text-red-500 text-xs mt-1">{errors.nome_completo.message}</p>}
            </div>
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-black">CPF</label>
              <input
                type="text"
                id="cpf"
                {...cpfRegister}
                onChange={(e) => {
                  const masked = maskCPF(e.target.value);
                  e.target.value = masked;
                  cpfRegister.onChange(e);
                  setValue("cpf", masked, { shouldValidate: true });
                }}
                maxLength={14}
                placeholder="000.000.000-00"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
              />
              {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
            </div>
          </>
        )}

        {tipoPessoa === TipoPessoa.JURIDICA && (
          <>
            <div>
              <label htmlFor="razao_social" className="block text-sm font-medium text-black">Razão Social</label>
              <input type="text" maxLength={100} id="razao_social" {...register("razao_social")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
              {errors.razao_social && <p className="text-red-500 text-xs mt-1">{errors.razao_social.message}</p>}
            </div>
            <div>
              <label htmlFor="nome_fantasia" className="block text-sm font-medium text-black">Nome Fantasia</label>
              <input type="text" id="nome_fantasia" {...register("nome_fantasia")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-black">CNPJ</label>
              <input
                type="text"
                id="cnpj"
                {...cnpjRegister}
                onChange={(e) => {
                  const masked = maskCNPJ(e.target.value);
                  e.target.value = masked;
                  cnpjRegister.onChange(e);
                  setValue("cnpj", masked, { shouldValidate: true });
                }}
                maxLength={18}
                placeholder="00.000.000/0000-00"
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
              />
              {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>}
            </div>
            <div>
              <label htmlFor="inscricao_estadual" className="block text-sm font-medium text-black">Inscrição Estadual</label>
              <input type="text" id="inscricao_estadual" {...register("inscricao_estadual")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
            <div>
              <label htmlFor="inscricao_municipal" className="block text-sm font-medium text-black">Inscrição Municipal</label>
              <input type="text" id="inscricao_municipal" {...register("inscricao_municipal")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
            <div>
              <label htmlFor="nome_contato_pj" className="block text-sm font-medium text-black">Nome do Contato</label>
              <input type="text" id="nome_contato_pj" {...register("nome_contato_pj")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black">Email</label>
          <input
            type="email"
            id="email"
            {...register("email")}
            placeholder="exemplo@email.com"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="telefone_principal" className="block text-sm font-medium text-black">Telefone Principal</label>
          <input
            type="tel"
            id="telefone_principal"
            {...telefonePrincipalRegister}
            onChange={(e) => {
              const masked = maskPhone(e.target.value);
              e.target.value = masked;
              telefonePrincipalRegister.onChange(e);
              setValue("telefone_principal", masked, { shouldValidate: true });
            }}
            maxLength={15}
            placeholder="(00) 00000-0000"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
          />
          {errors.telefone_principal && <p className="text-red-500 text-xs mt-1">{errors.telefone_principal.message}</p>}
        </div>
        <div>
          <label htmlFor="telefone_secundario" className="block text-sm font-medium text-black">Telefone Secundário</label>
          <input
            type="tel"
            id="telefone_secundario"
            {...telefoneSecundarioRegister}
            onChange={(e) => {
              const masked = maskPhone(e.target.value);
              e.target.value = masked;
              telefoneSecundarioRegister.onChange(e);
              setValue("telefone_secundario", masked, { shouldValidate: true });
            }}
            maxLength={15}
            placeholder="(00) 00000-0000"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
          />
        </div>
        <div>
          <label htmlFor="cep" className="block text-sm font-medium text-black">CEP</label>
          <input
            type="text"
            id="cep"
            {...cepRegister}
            onChange={(e) => {
              const masked = maskCEP(e.target.value);
              e.target.value = masked;
              cepRegister.onChange(e);
              setValue("cep", masked, { shouldValidate: true });
            }}
            maxLength={9}
            placeholder="00000-000"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black"
          />
        </div>
        <div>
          <label htmlFor="rua" className="block text-sm font-medium text-black">Rua</label>
          <input type="text" maxLength={100} id="rua" {...register("rua")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-black">Número</label>
          <input type="text" maxLength={10} id="numero" {...register("numero")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="complemento" className="block text-sm font-medium text-black">Complemento</label>
          <input type="text" maxLength={100} id="complemento" {...register("complemento")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="bairro" className="block text-sm font-medium text-black">Bairro</label>
          <input type="text" maxLength={100} id="bairro" {...register("bairro")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-black">Cidade</label>
          <input type="text" maxLength={100} id="cidade" {...register("cidade")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="estado_uf" className="block text-sm font-medium text-black">Estado (UF)</label>
          <input type="text" maxLength={2} id="estado_uf" {...register("estado_uf")} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>
        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-black">Observações</label>
          <textarea id="observacoes" {...register("observacoes")} rows={3} className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 text-black" />
        </div>

        <div className="flex justify-end space-x-3">
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
            {isSubmitting ? "Salvando..." : "Salvar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}

