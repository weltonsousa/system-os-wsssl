import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const clienteSchema = z.object({
  tipo_pessoa: z.enum(["FISICA", "JURIDICA"]),
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
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado_uf: z.string().optional(),
  observacoes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = clienteSchema.parse(body);

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

    // Verificar unicidade de email
    const existingEmail = await prisma.cliente.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 });
    }

    // Verificar unicidade de CPF/CNPJ
    if (data.tipo_pessoa === "FISICA" && data.cpf) {
      const existingCpf = await prisma.cliente.findUnique({
        where: { cpf: data.cpf },
      });
      if (existingCpf) {
        return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 });
      }
    }
    if (data.tipo_pessoa === "JURIDICA" && data.cnpj) {
      const existingCnpj = await prisma.cliente.findUnique({
        where: { cnpj: data.cnpj },
      });
      if (existingCnpj) {
        return NextResponse.json({ error: "CNPJ já cadastrado." }, { status: 409 });
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        tipo_pessoa: data.tipo_pessoa,
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
        cep: data.cep,
        rua: data.rua,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        estado_uf: data.estado_uf,
        observacoes: data.observacoes,
      },
    });
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";

  const skip = (page - 1) * limit;

  try {
    const whereClause = search
      ? {
          OR: [
            { nome_completo: { contains: search } },
            { razao_social: { contains: search } },
            { cpf: { contains: search } },
            { cnpj: { contains: search } },
            { email: { contains: search } },
          ],
          ativo: true, // Apenas clientes ativos
        }
      : { ativo: true };

    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: {
        nome_completo: "asc", // Ou razao_social, dependendo da preferência
      },
    });

    const totalItems = await prisma.cliente.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: clientes,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

