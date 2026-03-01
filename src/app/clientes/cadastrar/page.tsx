// src/app/clientes/cadastrar/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TipoPessoa } from "@/types";
import { useEffect, useState } from "react";
import { maskCPF, maskPhone, maskCEP, maskCNPJ } from "@/app/utils/utils";
import { UserCircleIcon, PhoneIcon, EllipsisHorizontalCircleIcon } from "@heroicons/react/24/outline";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { Field } from "@/components/ui/Field";

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
  email: z.string().email("Email inválido").optional().or(z.literal("")),
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
      const errorMessage = err instanceof Error ? err.message : 'Falha ao cadastrar cliente';
      setError(errorMessage);
      console.error("Erro ao cadastrar cliente:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = "mt-1 block w-full shadow-sm sm:text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-violet-500 focus:border-violet-500 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-violet-400 dark:focus:border-violet-400 dark:placeholder-slate-500 transition-colors";

  const tabs: TabItem[] = [
    {
      id: "dados-pessoais",
      label: "Dados pessoais",
      icon: UserCircleIcon,
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="tipo_pessoa" label="Tipo de Pessoa" required>
              <select
                id="tipo_pessoa"
                {...register("tipo_pessoa")}
                className={inputClassName}
              >
                <option value={TipoPessoa.FISICA}>Pessoa Física</option>
                <option value={TipoPessoa.JURIDICA}>Pessoa Jurídica</option>
              </select>
            </Field>

            <Field id="email" label="Email" error={errors.email?.message}>
              <input
                type="email"
                id="email"
                {...register("email")}
                placeholder="exemplo@email.com"
                className={inputClassName}
              />
            </Field>
          </div>

          {tipoPessoa === TipoPessoa.FISICA && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="nome_completo" label="Nome Completo" required error={errors.nome_completo?.message}>
                <input type="text" maxLength={100} id="nome_completo" {...register("nome_completo")} className={inputClassName} placeholder="João Silva" />
              </Field>
              <Field id="cpf" label="CPF" required error={errors.cpf?.message}>
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
                  className={inputClassName}
                />
              </Field>
            </div>
          )}

          {tipoPessoa === TipoPessoa.JURIDICA && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="razao_social" label="Razão Social" required error={errors.razao_social?.message}>
                <input type="text" maxLength={100} id="razao_social" {...register("razao_social")} className={inputClassName} placeholder="Empresa XYZ LTDA" />
              </Field>
              <Field id="cnpj" label="CNPJ" required error={errors.cnpj?.message}>
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
                  className={inputClassName}
                />
              </Field>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "contato-endereco",
      label: "Contato & endereço",
      icon: PhoneIcon,
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="telefone_principal" label="Telefone Principal" required error={errors.telefone_principal?.message}>
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
                className={inputClassName}
              />
            </Field>
            <Field id="telefone_secundario" label="Telefone Secundário" error={errors.telefone_secundario?.message}>
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
                className={inputClassName}
              />
            </Field>
          </div>

          <hr className="border-slate-200 dark:border-slate-800 my-4" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field id="cep" label="CEP" error={errors.cep?.message}>
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
                className={inputClassName}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="rua" label="Rua" error={errors.rua?.message}>
                <input type="text" maxLength={100} id="rua" {...register("rua")} className={inputClassName} placeholder="Ex: Av. Paulista" />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Field id="numero" label="Número" error={errors.numero?.message}>
              <input type="text" maxLength={10} id="numero" {...register("numero")} className={inputClassName} placeholder="123" />
            </Field>
            <div className="sm:col-span-3">
              <Field id="complemento" label="Complemento" error={errors.complemento?.message}>
                <input type="text" maxLength={100} id="complemento" {...register("complemento")} className={inputClassName} placeholder="Apto 101, Bloco B" />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field id="bairro" label="Bairro" error={errors.bairro?.message}>
              <input type="text" maxLength={100} id="bairro" {...register("bairro")} className={inputClassName} placeholder="Centro" />
            </Field>
            <Field id="cidade" label="Cidade" error={errors.cidade?.message}>
              <input type="text" maxLength={100} id="cidade" {...register("cidade")} className={inputClassName} placeholder="São Paulo" />
            </Field>
            <Field id="estado_uf" label="Estado (UF)" error={errors.estado_uf?.message}>
              <input type="text" maxLength={2} id="estado_uf" {...register("estado_uf")} className={inputClassName} placeholder="SP" />
            </Field>
          </div>
        </div>
      ),
    },
    {
      id: "outros",
      label: "Outros",
      icon: EllipsisHorizontalCircleIcon,
      content: (
        <div className="space-y-4 pt-2">
          {tipoPessoa === TipoPessoa.JURIDICA && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Field id="nome_fantasia" label="Nome Fantasia" error={errors.nome_fantasia?.message}>
                <input type="text" id="nome_fantasia" {...register("nome_fantasia")} className={inputClassName} placeholder="Loja XYZ" />
              </Field>
              <Field id="nome_contato_pj" label="Nome do Contato" error={errors.nome_contato_pj?.message}>
                <input type="text" id="nome_contato_pj" {...register("nome_contato_pj")} className={inputClassName} placeholder="Contato Comercial" />
              </Field>
              <Field id="inscricao_estadual" label="Inscrição Estadual" error={errors.inscricao_estadual?.message}>
                <input type="text" id="inscricao_estadual" {...register("inscricao_estadual")} className={inputClassName} placeholder="Ex: 123.456.789.000" />
              </Field>
              <Field id="inscricao_municipal" label="Inscrição Municipal" error={errors.inscricao_municipal?.message}>
                <input type="text" id="inscricao_municipal" {...register("inscricao_municipal")} className={inputClassName} placeholder="Ex: 1234567" />
              </Field>
            </div>
          )}
          <Field id="observacoes" label="Observações" error={errors.observacoes?.message}>
            <textarea
              id="observacoes"
              {...register("observacoes")}
              rows={4}
              placeholder="Anotações adicionais sobre o cliente..."
              className={inputClassName}
            />
          </Field>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl">
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-8 transition-colors">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cadastrar Novo Cliente
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Preencha os dados abaixo para adicionar um novo cliente ao sistema.
          </p>
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
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
              {isSubmitting ? "Salvando..." : "Salvar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
