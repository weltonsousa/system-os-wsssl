import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const clienteUpdateSchema = z.object({
  tipo_pessoa: z.enum(["FISICA", "JURIDICA"]).optional(),
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
  cep: z.string().optional().nullable(),
  rua: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado_uf: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id_cliente = params.id;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    return NextResponse.json(cliente);
  } catch (error) {
    console.error(`Erro ao buscar cliente ${id_cliente}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id_cliente = params.id;

  try {
    const body = await request.json();
    console.log("Body recebido:", body);
    const data = clienteUpdateSchema.parse(body);

    const clienteExistente = await prisma.cliente.findUnique({
      where: { id_cliente },
    });

    if (!clienteExistente) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    // Verificar unicidade de email se estiver sendo alterado
    if (data.email && data.email !== clienteExistente.email) {
      const existingEmail = await prisma.cliente.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email já cadastrado para outro cliente." }, { status: 409 });
      }
    }

    // Verificar unicidade de CPF/CNPJ se estiverem sendo alterados
    if (data.tipo_pessoa === "FISICA" && data.cpf && data.cpf !== clienteExistente.cpf) {
      const existingCpf = await prisma.cliente.findUnique({
        where: { cpf: data.cpf },
      });
      if (existingCpf) {
        return NextResponse.json({ error: "CPF já cadastrado para outro cliente." }, { status: 409 });
      }
    }
    if (data.tipo_pessoa === "JURIDICA" && data.cnpj && data.cnpj !== clienteExistente.cnpj) {
      const existingCnpj = await prisma.cliente.findUnique({
        where: { cnpj: data.cnpj },
      });
      if (existingCnpj) {
        return NextResponse.json({ error: "CNPJ já cadastrado para outro cliente." }, { status: 409 });
      }
    }

    // Lógica para limpar campos específicos se o tipo de pessoa mudar
    let finalData: any = { ...data };
    if (data.tipo_pessoa && data.tipo_pessoa !== clienteExistente.tipo_pessoa) {
      if (data.tipo_pessoa === "FISICA") {
        finalData.razao_social = null;
        finalData.nome_fantasia = null;
        finalData.cnpj = null;
        finalData.inscricao_estadual = null;
        finalData.inscricao_municipal = null;
        finalData.nome_contato_pj = null;
      } else if (data.tipo_pessoa === "JURIDICA") {
        finalData.nome_completo = null;
        finalData.cpf = null;
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id_cliente },
      data: finalData,
    });
    return NextResponse.json(cliente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(`Erro ao atualizar cliente ${id_cliente}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id_cliente = params.id;

  try {
    const servicosCount = await prisma.servico.count({
      where: { id_cliente: id_cliente },
    });

    if (servicosCount > 0) {
      return NextResponse.json(
        { error: "Cliente possui serviços associados e não pode ser excluído. Considere inativá-lo." },
        { status: 409 }
      );
    }

    await prisma.cliente.update({
      where: { id_cliente },
      data: { ativo: false },
    });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(`Erro ao deletar cliente ${id_cliente}:`, error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

