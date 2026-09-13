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
  recorrente: z.boolean().optional().default(false),
  quantidade_repeticoes: z.number().int().min(1).max(60).optional().nullable(),
}).refine(
  (data) => !data.recorrente || (data.quantidade_repeticoes ?? 0) >= 1,
  { message: "Informe quantas vezes a cobrança deve se repetir nos meses seguintes.", path: ["quantidade_repeticoes"] }
);

function adicionarMeses(data: Date, meses: number): Date {
  const resultado = new Date(data.getTime());
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

// const servicoUpdateSchema = servicoSchema.partial().extend({
//   data_efetiva_saida: z.string().datetime({ offset: true }).optional().nullable(),
// });

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

    const { recorrente, quantidade_repeticoes, ...dadosServico } = data;
    const totalRecorrencias = recorrente ? (quantidade_repeticoes ?? 0) + 1 : undefined;
    const dataEntrada = new Date();

    const novoServico = await prisma.servico.create({
      data: {
        ...dadosServico,
        id_status_atual: statusInicial.id_status_servico, // Garante que o status inicial seja "Pendente"
        data_entrada: dataEntrada,
        recorrente: !!recorrente,
        numero_recorrencia: recorrente ? 1 : undefined,
        total_recorrencias: totalRecorrencias,
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

    // Gera os lançamentos das repetições futuras (meses seguintes) para a mesma cobrança
    if (recorrente && quantidade_repeticoes && quantidade_repeticoes >= 1) {
      for (let i = 1; i <= quantidade_repeticoes; i++) {
        const repeticao = await prisma.servico.create({
          data: {
            id_cliente: dadosServico.id_cliente,
            id_tipo_servico: dadosServico.id_tipo_servico,
            descricao_problema: dadosServico.descricao_problema,
            equipamento_descricao: dadosServico.equipamento_descricao,
            equipamento_marca: dadosServico.equipamento_marca,
            equipamento_modelo: dadosServico.equipamento_modelo,
            equipamento_num_serie: dadosServico.equipamento_num_serie,
            data_entrada: adicionarMeses(dataEntrada, i),
            data_previsao_saida: dadosServico.data_previsao_saida
              ? adicionarMeses(new Date(dadosServico.data_previsao_saida), i).toISOString()
              : null,
            valor_servico: dadosServico.valor_servico,
            valor_pecas: dadosServico.valor_pecas,
            valor_mao_de_obra: dadosServico.valor_mao_de_obra,
            observacoes_internas: dadosServico.observacoes_internas,
            id_status_atual: statusInicial.id_status_servico,
            recorrente: true,
            id_servico_origem: novoServico.id_servico,
            numero_recorrencia: i + 1,
            total_recorrencias: totalRecorrencias,
          },
        });

        await prisma.historicoServico.create({
          data: {
            id_servico: repeticao.id_servico,
            id_status_novo: statusInicial.id_status_servico,
            observacao: `Serviço gerado automaticamente (repetição ${i + 1}/${totalRecorrencias} da cobrança recorrente)`,
          },
        });
      }
    }

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
  const mes_referencia = searchParams.get("mes_referencia") || ""; // formato "YYYY-MM"

  const skip = (page - 1) * limit;

  try {
    const whereClause: import("@prisma/client").Prisma.ServicoWhereInput = {};
    if (search) {
      whereClause.OR = [
        { id_servico: { contains: search, mode: "insensitive" } },
        { descricao_problema: { contains: search, mode: "insensitive" } },
        { equipamento_descricao: { contains: search, mode: "insensitive" } },
        { cliente: { nome_completo: { contains: search, mode: "insensitive" } } },
        { cliente: { razao_social: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status_filter) {
      whereClause.id_status_atual = status_filter;
    }
    if (/^\d{4}-\d{2}$/.test(mes_referencia)) {
      const [ano, mes] = mes_referencia.split("-").map(Number);
      whereClause.data_entrada = {
        gte: new Date(ano, mes - 1, 1),
        lt: new Date(ano, mes, 1),
      };
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

