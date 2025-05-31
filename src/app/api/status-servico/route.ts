import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusServicoSchema = z.object({
  nome_status: z.string().min(1, { message: "Status de serviço é obrigatória." }),
});


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = statusServicoSchema.parse(body);

    const novoStatusServico = await prisma.statusServico.create({
      data: {
        nome_status: data.nome_status,
      },
    });

    return NextResponse.json(novoStatusServico, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Erro ao criar status serviço:", error);
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
          { nome_status: { contains: search } },
        ],
      }
      : {};

    const statusServico = await prisma.statusServico.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: {
        nome_status: "desc",
      },
    });

    const totalItems = await prisma.statusServico.count({
      where: whereClause,
    });

    return NextResponse.json({
      data: statusServico,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error("Erro ao buscar status serviços:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

