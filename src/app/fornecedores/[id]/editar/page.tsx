"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TipoPessoa, TipoFornecedor } from "@/types";
import { useEffect, useState } from "react";
import { maskCPF, maskPhone, maskCEP, maskCNPJ } from "@/app/utils/utils";
import {
  BuildingOfficeIcon,
  PhoneIcon,
  BriefcaseIcon,
  EllipsisHorizontalCircleIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { Field } from "@/components/ui/Field";

const fornecedorUpdateSchema = z
  .object({
    tipo_pessoa: z.nativeEnum(TipoPessoa),
    tipo_fornecedor: z.nativeEnum(TipoFornecedor),
    nome_completo: z.string().optional().nullable(),
    cpf: z.string().optional().nullable(),
    razao_social: z.string().optional().nullable(),
    nome_fantasia: z.string().optional().nullable(),
    cnpj: z.string().optional().nullable(),
    inscricao_estadual: z.string().optional().nullable(),
    inscricao_municipal: z.string().optional().nullable(),
    nome_contato_pj: z.string().optional().nullable(),
    telefone_principal: z.string().min(1, "Telefone principal é obrigatório"),
    telefone_secundario: z.string().optional().nullable(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    website: z.string().optional().nullable(),
    cep: z.string().optional().nullable(),
    rua: z.string().optional().nullable(),
    numero: z.string().optional().nullable(),
    complemento: z.string().optional().nullable(),
    bairro: z.string().optional().nullable(),
    cidade: z.string().optional().nullable(),
    estado_uf: z.string().optional().nullable(),
    produtos_servicos: z.string().optional().nullable(),
    prazo_entrega: z.string().optional().nullable(),
    condicoes_pagamento: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo_pessoa === TipoPessoa.FISICA) {
      if (!data.nome_completo)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome completo é obrigatório para Pessoa Física", path: ["nome_completo"] });
      if (!data.cpf)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CPF é obrigatório para Pessoa Física", path: ["cpf"] });
    } else {
      if (!data.razao_social)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Razão Social é obrigatória para Pessoa Jurídica", path: ["razao_social"] });
      if (!data.cnpj)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CNPJ é obrigatório para Pessoa Jurídica", path: ["cnpj"] });
    }
  });

type FornecedorUpdateData = z.infer<typeof fornecedorUpdateSchema>;

export default function EditarFornecedorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(TipoPessoa.JURIDICA);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FornecedorUpdateData>({
    resolver: zodResolver(fornecedorUpdateSchema),
    defaultValues: {
      tipo_pessoa: TipoPessoa.JURIDICA,
      tipo_fornecedor: TipoFornecedor.GERAL,
    },
  });

  useEffect(() => {
    fetch(`/api/fornecedores/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fornecedor não encontrado");
        return res.json();
      })
      .then((data) => {
        reset({
          tipo_pessoa: data.tipo_pessoa,
          tipo_fornecedor: data.tipo_fornecedor,
          nome_completo: data.nome_completo ?? "",
          cpf: data.cpf ?? "",
          razao_social: data.razao_social ?? "",
          nome_fantasia: data.nome_fantasia ?? "",
          cnpj: data.cnpj ?? "",
          inscricao_estadual: data.inscricao_estadual ?? "",
          inscricao_municipal: data.inscricao_municipal ?? "",
          nome_contato_pj: data.nome_contato_pj ?? "",
          telefone_principal: data.telefone_principal ?? "",
          telefone_secundario: data.telefone_secundario ?? "",
          email: data.email ?? "",
          website: data.website ?? "",
          cep: data.cep ?? "",
          rua: data.rua ?? "",
          numero: data.numero ?? "",
          complemento: data.complemento ?? "",
          bairro: data.bairro ?? "",
          cidade: data.cidade ?? "",
          estado_uf: data.estado_uf ?? "",
          produtos_servicos: data.produtos_servicos ?? "",
          prazo_entrega: data.prazo_entrega ?? "",
          condicoes_pagamento: data.condicoes_pagamento ?? "",
          observacoes: data.observacoes ?? "",
        });
        setTipoPessoa(data.tipo_pessoa);
        setLoadingData(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoadingData(false);
      });
  }, [id, reset]);

  const watchedTipoPessoa = watch("tipo_pessoa");

  useEffect(() => {
    setTipoPessoa(watchedTipoPessoa);
  }, [watchedTipoPessoa]);

  const cpfRegister = register("cpf");
  const cnpjRegister = register("cnpj");
  const telefonePrincipalRegister = register("telefone_principal");
  const telefoneSecundarioRegister = register("telefone_secundario");
  const cepRegister = register("cep");

  const onSubmit: SubmitHandler<FornecedorUpdateData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/fornecedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao atualizar fornecedor");
      }
      router.push("/fornecedores");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar fornecedor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja inativar este fornecedor?")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/fornecedores/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao inativar fornecedor");
      }
      router.push("/fornecedores");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao inativar fornecedor");
      setIsDeleting(false);
    }
  };

  const inputClassName =
    "mt-1 block w-full shadow-sm sm:text-sm border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-violet-500 focus:border-violet-500 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-violet-400 dark:focus:border-violet-400 dark:placeholder-slate-500 transition-colors";

  const tabs: TabItem[] = [
    {
      id: "dados",
      label: "Dados do Fornecedor",
      icon: BuildingOfficeIcon,
      content: (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="tipo_pessoa" label="Tipo de Pessoa" required>
              <select id="tipo_pessoa" {...register("tipo_pessoa")} className={inputClassName}>
                <option value={TipoPessoa.JURIDICA}>Pessoa Jurídica</option>
                <option value={TipoPessoa.FISICA}>Pessoa Física</option>
              </select>
            </Field>
            <Field id="tipo_fornecedor" label="Tipo de Fornecedor" required>
              <select id="tipo_fornecedor" {...register("tipo_fornecedor")} className={inputClassName}>
                <option value={TipoFornecedor.GERAL}>Geral</option>
                <option value={TipoFornecedor.TI}>T.I.</option>
                <option value={TipoFornecedor.PECAS}>Peças</option>
                <option value={TipoFornecedor.SERVICO}>Prestação de Serviço</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="email" label="Email" error={errors.email?.message}>
              <input type="email" id="email" {...register("email")} placeholder="contato@empresa.com" className={inputClassName} />
            </Field>
            <Field id="website" label="Website" error={errors.website?.message}>
              <input type="text" id="website" {...register("website")} placeholder="https://www.empresa.com.br" className={inputClassName} />
            </Field>
          </div>

          {tipoPessoa === TipoPessoa.FISICA && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="nome_completo" label="Nome Completo" required error={errors.nome_completo?.message}>
                <input type="text" maxLength={100} id="nome_completo" {...register("nome_completo")} className={inputClassName} />
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="razao_social" label="Razão Social" required error={errors.razao_social?.message}>
                  <input type="text" maxLength={100} id="razao_social" {...register("razao_social")} className={inputClassName} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="nome_fantasia" label="Nome Fantasia" error={errors.nome_fantasia?.message}>
                  <input type="text" id="nome_fantasia" {...register("nome_fantasia")} className={inputClassName} />
                </Field>
                <Field id="nome_contato_pj" label="Nome do Contato" error={errors.nome_contato_pj?.message}>
                  <input type="text" id="nome_contato_pj" {...register("nome_contato_pj")} className={inputClassName} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="inscricao_estadual" label="Inscrição Estadual" error={errors.inscricao_estadual?.message}>
                  <input type="text" id="inscricao_estadual" {...register("inscricao_estadual")} className={inputClassName} />
                </Field>
                <Field id="inscricao_municipal" label="Inscrição Municipal" error={errors.inscricao_municipal?.message}>
                  <input type="text" id="inscricao_municipal" {...register("inscricao_municipal")} className={inputClassName} />
                </Field>
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      id: "contato-endereco",
      label: "Contato & Endereço",
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
                <input type="text" maxLength={100} id="rua" {...register("rua")} className={inputClassName} />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Field id="numero" label="Número" error={errors.numero?.message}>
              <input type="text" maxLength={10} id="numero" {...register("numero")} className={inputClassName} />
            </Field>
            <div className="sm:col-span-3">
              <Field id="complemento" label="Complemento" error={errors.complemento?.message}>
                <input type="text" maxLength={100} id="complemento" {...register("complemento")} className={inputClassName} />
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field id="bairro" label="Bairro" error={errors.bairro?.message}>
              <input type="text" maxLength={100} id="bairro" {...register("bairro")} className={inputClassName} />
            </Field>
            <Field id="cidade" label="Cidade" error={errors.cidade?.message}>
              <input type="text" maxLength={100} id="cidade" {...register("cidade")} className={inputClassName} />
            </Field>
            <Field id="estado_uf" label="Estado (UF)" error={errors.estado_uf?.message}>
              <input type="text" maxLength={2} id="estado_uf" {...register("estado_uf")} className={inputClassName} />
            </Field>
          </div>
        </div>
      ),
    },
    {
      id: "comercial",
      label: "Dados Comerciais",
      icon: BriefcaseIcon,
      content: (
        <div className="space-y-4 pt-2">
          <Field id="produtos_servicos" label="Produtos / Serviços Fornecidos" error={errors.produtos_servicos?.message}>
            <textarea
              id="produtos_servicos"
              {...register("produtos_servicos")}
              rows={3}
              placeholder="Descreva os produtos ou serviços que este fornecedor oferece..."
              className={inputClassName}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="prazo_entrega" label="Prazo de Entrega" error={errors.prazo_entrega?.message}>
              <input type="text" id="prazo_entrega" {...register("prazo_entrega")} className={inputClassName} placeholder="Ex: 5 a 7 dias úteis" />
            </Field>
            <Field id="condicoes_pagamento" label="Condições de Pagamento" error={errors.condicoes_pagamento?.message}>
              <input type="text" id="condicoes_pagamento" {...register("condicoes_pagamento")} className={inputClassName} placeholder="Ex: 30/60 dias, boleto" />
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
          <Field id="observacoes" label="Observações" error={errors.observacoes?.message}>
            <textarea id="observacoes" {...register("observacoes")} rows={4} className={inputClassName} />
          </Field>
        </div>
      ),
    },
  ];

  if (loadingData) {
    return (
      <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl">
        <div className="bg-white/80 border border-slate-200 rounded-2xl shadow-sm p-8">
          <p className="text-slate-600">Carregando dados do fornecedor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 mt-8 max-w-4xl">
      <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-8 transition-colors">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Editar Fornecedor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Atualize os dados do fornecedor abaixo.
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              className="bg-white text-rose-600 border border-rose-300 hover:bg-rose-50 font-medium py-2.5 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 w-full sm:w-auto text-sm"
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? "Inativando..." : "Inativar Fornecedor"}
            </button>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
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
