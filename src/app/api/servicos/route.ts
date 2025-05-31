import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const servicoSchema = z.object({
  id_cliente: z.string().cuid({ message: "ID de cliente inválido." }),
  id_tipo_servico: z.string().cuid({ message: "ID de tipo de serviço inválido." }),
  descricao_problema: z.string().min(1, { message: "Descrição do problema é obrigatória." }),
  equipamento_descricao: z.string().optional().nullable(),
  equipamento_marca: z.string().optional().nullable(),
  equipamento_modelo: z.string().optional().nullable(),
  equipamento_num_serie: z.string().optional().nullable(),
  data_previsao_saida: z.string().datetime({ offset: true }).optional().nullable(),
  valor_servico: z.number().optional().nullable(),
  valor_pecas: z.number().optional().nullable(),
  valor_mao_de_obra: z.number().optional().nullable(),
  descricao_solucao: z.string().optional().nullable(),
  observacoes_internas: z.string().optional().nullable(),
});

const servicoUpdateSchema = servicoSchema.partial().extend({
  data_efetiva_saida: z.string().datetime({ offset: true }).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = servicoSchema.parse(body);

    // Validações adicionais (existência de cliente, tipo de serviço, status inicial)
    const cliente = await prisma.cliente.findUnique({ where: { id_cliente: data.id_cliente } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    const tipoServico = await prisma.tipoServico.findUnique({ where: { id_tipo_servico: data.id_tipo_servico } });
    if (!tipoServico) {
      return NextResponse.json({ error: "Tipo de serviço não encontrado." }, { status: 404 });
    }
    const statusInicial = await prisma.statusServico.findFirst({
      where: { nome_status: "Pendente" }, // Ou buscar por uma flag/ordem específica
    });
    if (!statusInicial) {
      return NextResponse.json({ error: "Status inicial 'Pendente' não encontrado. Configure os status primeiro." }, { status: 500 });
    }

    const novoServico = await prisma.servico.create({
      data: {
        ...data,
        id_status_atual: statusInicial.id_status_servico, // Garante que o status inicial seja "Pendente"
        data_entrada: new Date(),
      },
    });

    // Cria o primeiro registro no histórico
    await prisma.historicoServico.create({
      data: {
        id_servico: novoServico.id_servico,
        id_status_novo: statusInicial.id_status_servico,
        observacao: "Serviço criado",
      },
    });

    return NextResponse.json(novoServico, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  const status_filter = searchParams.get("status_filter") || "";

  const skip = (page - 1) * limit;

  try {
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { id_servico: { contains: search} },
        { descricao_problema: { contains: search } },
        { equipamento_descricao: { contains: search } },
        { cliente: { nome_completo: { contains: search } } },
        { cliente: { razao_social: { contains: search } } },
      ];
    }
    if (status_filter) {
      whereClause.id_status_atual = status_filter;
    }

    const servicos = await prisma.servico.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: { id_cliente: true, nome_completo: true, razao_social: true, tipo_pessoa: true },
        },
        tipo_servico: {
          select: { id_tipo_servico: true, nome_tipo_servico: true },
        },
        status_atual: {
          select: { id_status_servico: true, nome_status: true },
        },
      },
      skip: skip,
      take: limit,
      orderBy: {
        data_entrada: "desc",
      },
    });

    const totalItems = await prisma.servico.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: servicos,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

