import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Reutilizando o schema de atualização para PUT, pois GET e DELETE não têm body
const tipoServicoUpdateSchema = z.object({
  nome_status: z.string().min(1, "Nome do tipo de status é obrigatório"),
  descricao: z.string().min(1, "Descrição do status é obrigatória"),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id_status_servico = params.id;
  //console.log(id_status);
  try {
    const statusServico = await prisma.statusServico.findUnique({
      where: { id_status_servico },
    });

    if (!statusServico) {
      return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    }
    return NextResponse.json(statusServico);
  } catch (error) {
    console.error(`Erro ao buscar status de serviço ${id_status_servico}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id_status_servico = params.id;

  try {
    const body = await request.json();
    const data = tipoServicoUpdateSchema.parse(body);

    const statusServicoAtual = await prisma.statusServico.findUnique({
      where: { id_status_servico },
    });

    if (!statusServicoAtual) {
      return NextResponse.json({ error: "Tipo de serviço não encontrado." }, { status: 404 });
    }

    const statusServicoAtualizado = await prisma.statusServico.update({
      where: { id_status_servico },
      data: data,
    });

    return NextResponse.json(statusServicoAtualizado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(`Erro ao atualizar tipo de serviço ${id_status_servico}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id_status_servico = params.id;

  try {
    // A exclusão em cascata do histórico é definida no schema do Prisma
    await prisma.statusServico.update({
      where: { id_status_servico },
      data: {
        nome_status: "",
        descricao: "",
      },
    });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(`Erro ao deletar serviço ${id_status_servico}:`, error);
    // Verificar se o erro é devido a restrições de chave estrangeira (ex: se houver pagamentos vinculados, etc.)
    // Por enquanto, um erro genérico é suficiente.
    return NextResponse.json({ error: "Erro interno do servidor ao tentar deletar o serviço." }, { status: 500 });
  }
}

