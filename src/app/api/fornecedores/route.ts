import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fornecedorSchema = z.object({
  tipo_pessoa: z.enum(["FISICA", "JURIDICA"]),
  tipo_fornecedor: z.enum(["TI", "PECAS", "SERVICO", "GERAL"]),
  nome_completo: z.string().optional(),
  cpf: z.string().optional(),
  razao_social: z.string().optional(),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  nome_contato_pj: z.string().optional(),
  telefone_principal: z.string().min(1, { message: "Telefone principal é obrigatório" }),
  telefone_secundario: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }),
  website: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado_uf: z.string().optional(),
  produtos_servicos: z.string().optional(),
  prazo_entrega: z.string().optional(),
  condicoes_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = fornecedorSchema.parse(body);

    if (data.tipo_pessoa === "FISICA" && !data.nome_completo) {
      return NextResponse.json({ error: "Nome completo é obrigatório para pessoa física." }, { status: 400 });
    }
    if (data.tipo_pessoa === "FISICA" && !data.cpf) {
      return NextResponse.json({ error: "CPF é obrigatório para pessoa física." }, { status: 400 });
    }
    if (data.tipo_pessoa === "JURIDICA" && !data.razao_social) {
      return NextResponse.json({ error: "Razão Social é obrigatória para pessoa jurídica." }, { status: 400 });
    }
    if (data.tipo_pessoa === "JURIDICA" && !data.cnpj) {
      return NextResponse.json({ error: "CNPJ é obrigatório para pessoa jurídica." }, { status: 400 });
    }

    const existingEmail = await prisma.fornecedor.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
    }

    if (data.tipo_pessoa === "FISICA" && data.cpf) {
      const existingCpf = await prisma.fornecedor.findUnique({ where: { cpf: data.cpf } });
      if (existingCpf) {
        return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 });
      }
    }
    if (data.tipo_pessoa === "JURIDICA" && data.cnpj) {
      const existingCnpj = await prisma.fornecedor.findUnique({ where: { cnpj: data.cnpj } });
      if (existingCnpj) {
        return NextResponse.json({ error: "CNPJ já cadastrado." }, { status: 409 });
      }
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        tipo_pessoa: data.tipo_pessoa,
        tipo_fornecedor: data.tipo_fornecedor,
        nome_completo: data.tipo_pessoa === "FISICA" ? data.nome_completo : null,
        cpf: data.tipo_pessoa === "FISICA" ? data.cpf : null,
        razao_social: data.tipo_pessoa === "JURIDICA" ? data.razao_social : null,
        nome_fantasia: data.tipo_pessoa === "JURIDICA" ? data.nome_fantasia : null,
        cnpj: data.tipo_pessoa === "JURIDICA" ? data.cnpj : null,
        inscricao_estadual: data.tipo_pessoa === "JURIDICA" ? data.inscricao_estadual : null,
        inscricao_municipal: data.tipo_pessoa === "JURIDICA" ? data.inscricao_municipal : null,
        nome_contato_pj: data.tipo_pessoa === "JURIDICA" ? data.nome_contato_pj : null,
        telefone_principal: data.telefone_principal,
        telefone_secundario: data.telefone_secundario,
        email: data.email,
        website: data.website,
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado_uf: data.estado_uf,
        produtos_servicos: data.produtos_servicos,
        prazo_entrega: data.prazo_entrega,
        condicoes_pagamento: data.condicoes_pagamento,
        observacoes: data.observacoes,
      },
    });
    return NextResponse.json(fornecedor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Erro ao criar fornecedor:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  const tipo_fornecedor = searchParams.get("tipo_fornecedor") || "";

  const skip = (page - 1) * limit;

  try {
    const whereClause = {
      ativo: true,
      ...(tipo_fornecedor ? { tipo_fornecedor: tipo_fornecedor as "TI" | "PECAS" | "SERVICO" | "GERAL" } : {}),
      ...(search
        ? {
            OR: [
              { nome_completo: { contains: search } },
              { razao_social: { contains: search } },
              { cpf: { contains: search } },
              { cnpj: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    const [fornecedores, totalItems] = await Promise.all([
      prisma.fornecedor.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { data_cadastro: "desc" },
      }),
      prisma.fornecedor.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: fornecedores,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
