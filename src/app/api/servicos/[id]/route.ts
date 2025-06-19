import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Reutilizando o schema de atualização para PUT, pois GET e DELETE não têm body
const servicoUpdateSchema = z.object({
  id_cliente: z.string().cuid({ message: "ID de cliente inválido." }).optional(),
  id_tipo_servico: z.string().cuid({ message: "ID de tipo de serviço inválido." }).optional(),
  descricao_problema: z.string().min(1, { message: "Descrição do problema é obrigatória." }).optional(),
  equipamento_descricao: z.string().optional().nullable(),
  equipamento_marca: z.string().optional().nullable(),
  equipamento_modelo: z.string().optional().nullable(),
  equipamento_num_serie: z.string().optional().nullable(),
  data_previsao_saida: z.string().datetime({ offset: true }).optional().nullable(),
  data_efetiva_saida: z.string().datetime({ offset: true }).optional().nullable(),
  id_status_atual: z.string().cuid({ message: "ID de status inválido." }).optional(),
  valor_servico: z.number().optional().nullable(),
  valor_pecas: z.number().optional().nullable(),
  valor_mao_de_obra: z.number().optional().nullable(),
  descricao_solucao: z.string().optional().nullable(),
  observacoes_internas: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id_servico = params.id;

  try {
    const servico = await prisma.servico.findUnique({
      where: { id_servico },
      include: {
        cliente: {
          select: { id_cliente: true, nome_completo: true, razao_social: true, tipo_pessoa: true, email: true, telefone_principal: true },
        },
        tipo_servico: true,
        status_atual: true,
        historico: {
          orderBy: { data_alteracao: "desc" },
          include: {
            status_anterior: { select: { nome_status: true } },
            status_novo: { select: { nome_status: true } },
          },
        },
      },
    });

    if (!servico) {
      return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    }
    return NextResponse.json(servico);
  } catch (error) {
    console.error(`Erro ao buscar serviço ${id_servico}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id_servico = params.id;

  try {
    const body = await request.json();
    const data = servicoUpdateSchema.parse(body);

    const servicoAtual = await prisma.servico.findUnique({
      where: { id_servico },
    });

    if (!servicoAtual) {
      return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    }

    // Lógica para histórico de status
    if (data.id_status_atual && data.id_status_atual !== servicoAtual.id_status_atual) {
      await prisma.historicoServico.create({
        data: {
          id_servico: id_servico,
          id_status_anterior: servicoAtual.id_status_atual,
          id_status_novo: data.id_status_atual,
          observacao: body.observacao_mudanca_status || "Status alterado via API", // Opcional: permitir uma observação específica para a mudança
        },
      });
    }

    const servicoAtualizado = await prisma.servico.update({
      where: { id_servico },
      data: data,
    });

    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(`Erro ao atualizar serviço ${id_servico}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id_servico = params.id;

  try {
    // A exclusão em cascata do histórico é definida no schema do Prisma
    await prisma.servico.delete({
      where: { id_servico },
    });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(`Erro ao deletar serviço ${id_servico}:`, error);
    // Verificar se o erro é devido a restrições de chave estrangeira (ex: se houver pagamentos vinculados, etc.)
    // Por enquanto, um erro genérico é suficiente.
    return NextResponse.json({ error: "Erro interno do servidor ao tentar deletar o serviço." }, { status: 500 });
  }
}

