import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tipoServicoSchema = z.object({
  nome_tipo_servico: z.string().min(1, { message: "Tipo de serviço é obrigatória." }),
  descricao: z.string().min(1, { message: "Descrição é obrigatória." }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = tipoServicoSchema.parse(body);

    const novoTipoServico = await prisma.tipoServico.create({
      data: {
        nome_tipo_servico: data.nome_tipo_servico,
        descricao: data.descricao,
      },
    });

    return NextResponse.json(novoTipoServico, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Erro ao criar tipo serviço:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const search = searchParams.get("search") || "";
  // const status_filter = searchParams.get("status_filter") || "";

  const skip = (page - 1) * limit;

  try {
    const whereClause = search
      ? {
        OR: [
          { nome_tipo_servico: { contains: search } },
          { descricao: { contains: search } },
        ],
      }
      : {};

    const tiposServico = await prisma.tipoServico.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: {
        nome_tipo_servico: "desc",
      },
    });

    const totalItems = await prisma.tipoServico.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: tiposServico,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar tipo serviços:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

