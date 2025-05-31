import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Reutilizando o schema de atualização para PUT, pois GET e DELETE não têm body
const tipoServicoUpdateSchema = z.object({
  nome_tipo_servico: z.string().min(1, "Nome do tipo de serviço é obrigatório"),
  descricao: z.string().min(1, "Descrição do tipo de serviço é obrigatória"),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id_tipo_servico = params.id;
  console.log(id_tipo_servico);
  try {
    const tipoServico = await prisma.tipoServico.findUnique({
      where: { id_tipo_servico },
    });

    if (!tipoServico) {
      return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
    }
    return NextResponse.json(tipoServico);
  } catch (error) {
    console.error(`Erro ao buscar tipo de serviço ${id_tipo_servico}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id_tipo_servico = params.id;

  try {
    const body = await request.json();
    const data = tipoServicoUpdateSchema.parse(body);

    const tipoServicoAtual = await prisma.tipoServico.findUnique({
      where: { id_tipo_servico },
    });

    if (!tipoServicoAtual) {
      return NextResponse.json({ error: "Tipo de serviço não encontrado." }, { status: 404 });
    }

    const tipoServicoAtualizado = await prisma.tipoServico.update({
      where: { id_tipo_servico },
      data: data,
    });

    return NextResponse.json(tipoServicoAtualizado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(`Erro ao atualizar tipo de serviço ${id_tipo_servico}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id_tipo_servico = params.id;

  try {
    // A exclusão em cascata do histórico é definida no schema do Prisma
    await prisma.tipoServico.update({
      where: { id_tipo_servico },
      data: {
        nome_tipo_servico: "",
        descricao: "",
      },
    });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(`Erro ao deletar serviço ${id_tipo_servico}:`, error);
    // Verificar se o erro é devido a restrições de chave estrangeira (ex: se houver pagamentos vinculados, etc.)
    // Por enquanto, um erro genérico é suficiente.
    return NextResponse.json({ error: "Erro interno do servidor ao tentar deletar o serviço." }, { status: 500 });
  }
}

