import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const fornecedorUpdateSchema = z.object({
  tipo_pessoa: z.enum(["FISICA", "JURIDICA"]).optional(),
  tipo_fornecedor: z.enum(["TI", "PECAS", "SERVICO", "GERAL"]).optional(),
  nome_completo: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  razao_social: z.string().optional().nullable(),
  nome_fantasia: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  inscricao_estadual: z.string().optional().nullable(),
  inscricao_municipal: z.string().optional().nullable(),
  nome_contato_pj: z.string().optional().nullable(),
  telefone_principal: z.string().min(1, { message: "Telefone principal é obrigatório" }),
  telefone_secundario: z.string().optional().nullable(),
  email: z.string().email({ message: "Email inválido" }).optional(),
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
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id_fornecedor = (await params).id;
  try {
    const fornecedor = await prisma.fornecedor.findUnique({ where: { id_fornecedor } });
    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
    }
    return NextResponse.json(fornecedor);
  } catch (error) {
    console.error(`Erro ao buscar fornecedor ${id_fornecedor}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id_fornecedor = (await params).id;
  try {
    const body = await request.json();
    const data = fornecedorUpdateSchema.parse(body);

    const fornecedorExistente = await prisma.fornecedor.findUnique({ where: { id_fornecedor } });
    if (!fornecedorExistente) {
      return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
    }

    if (data.email && data.email !== fornecedorExistente.email) {
      const existingEmail = await prisma.fornecedor.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        return NextResponse.json({ error: "Email já cadastrado para outro fornecedor." }, { status: 409 });
      }
    }

    if (data.tipo_pessoa === "FISICA" && data.cpf && data.cpf !== fornecedorExistente.cpf) {
      const existingCpf = await prisma.fornecedor.findUnique({ where: { cpf: data.cpf } });
      if (existingCpf) {
        return NextResponse.json({ error: "CPF já cadastrado para outro fornecedor." }, { status: 409 });
      }
    }
    if (data.tipo_pessoa === "JURIDICA" && data.cnpj && data.cnpj !== fornecedorExistente.cnpj) {
      const existingCnpj = await prisma.fornecedor.findUnique({ where: { cnpj: data.cnpj } });
      if (existingCnpj) {
        return NextResponse.json({ error: "CNPJ já cadastrado para outro fornecedor." }, { status: 409 });
      }
    }

    const finalData: Record<string, unknown> = { ...data };
    if (data.tipo_pessoa && data.tipo_pessoa !== fornecedorExistente.tipo_pessoa) {
      if (data.tipo_pessoa === "FISICA") {
        finalData.razao_social = null;
        finalData.nome_fantasia = null;
        finalData.cnpj = null;
        finalData.inscricao_estadual = null;
        finalData.inscricao_municipal = null;
        finalData.nome_contato_pj = null;
      } else {
        finalData.nome_completo = null;
        finalData.cpf = null;
      }
    }

    const fornecedor = await prisma.fornecedor.update({ where: { id_fornecedor }, data: finalData });
    return NextResponse.json(fornecedor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(`Erro ao atualizar fornecedor ${id_fornecedor}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id_fornecedor = (await params).id;
  try {
    const fornecedor = await prisma.fornecedor.findUnique({ where: { id_fornecedor } });
    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado." }, { status: 404 });
    }
    await prisma.fornecedor.update({ where: { id_fornecedor }, data: { ativo: false } });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(`Erro ao deletar fornecedor ${id_fornecedor}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
