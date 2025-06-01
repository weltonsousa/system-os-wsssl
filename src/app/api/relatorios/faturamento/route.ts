import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

const faturamentoQuerySchema = z.object({
  formato: z.enum(["json", "csv", "pdf"]).optional().default("json"),
  data_inicio: z.string().datetime({ offset: true }),
  data_fim: z.string().datetime({ offset: true }),
  tipo_pessoa_cliente: z.enum(["FISICA", "JURIDICA", "TODOS"]).optional().default("TODOS"),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParse = faturamentoQuerySchema.safeParse({
    formato: searchParams.get("formato") || "json",
    data_inicio: searchParams.get("data_inicio"),
    data_fim: searchParams.get("data_fim"),
    tipo_pessoa_cliente: searchParams.get("tipo_pessoa_cliente") || "TODOS",
  });

  if (!queryParse.success) {
    return NextResponse.json({ error: "Parâmetros inválidos", details: queryParse.error.flatten() }, { status: 400 });
  }

  const { formato, data_inicio, data_fim, tipo_pessoa_cliente } = queryParse.data;

  if (!data_inicio || !data_fim) {
    return NextResponse.json({ error: "Datas de início e fim são obrigatórias." }, { status: 400 });
  }

  try {
    const whereClause: Record<string, unknown> = {
      data_efetiva_saida: {
        gte: new Date(data_inicio),
        lte: new Date(data_fim),
      },
      // Considerar apenas serviços com valor e que foram concluídos (ou status que indiquem faturamento)
      // Isso pode depender da regra de negócio, por exemplo, status "Concluído" ou "Pago"
      // Para este exemplo, vamos considerar todos os serviços com data_efetiva_saida e valor_servico > 0
      valor_servico: {
        gt: 0,
      },
    };

    if (tipo_pessoa_cliente && tipo_pessoa_cliente !== "TODOS") {
      whereClause.cliente = {
        tipo_pessoa: tipo_pessoa_cliente,
      };
    }

    const servicosFaturados = await prisma.servico.findMany({
      where: whereClause,
      include: {
        cliente: { select: { nome_completo: true, razao_social: true, tipo_pessoa: true, email: true } },
        tipo_servico: { select: { nome_tipo_servico: true } },
      },
      orderBy: {
        data_efetiva_saida: "asc",
      },
    });

    const totalFaturado = servicosFaturados.reduce((acc, servico) => acc + (servico.valor_servico || 0), 0);

    if (formato === "csv") {
      let csvData = "OS;Data Saida;Cliente;Tipo Pessoa;Email Cliente;Tipo Servico;Valor Servico\n";
      servicosFaturados.forEach(s => {
        const clienteNome = s.cliente?.tipo_pessoa === "FISICA" ? s.cliente?.nome_completo : s.cliente?.razao_social;
        csvData += `${s.id_servico};${new Date(s.data_efetiva_saida!).toLocaleDateString()};${clienteNome || "N/A"};${s.cliente?.tipo_pessoa || "N/A"};${s.cliente?.email || "N/A"};${s.tipo_servico?.nome_tipo_servico || "N/A"};${s.valor_servico?.toFixed(2) || "0.00"}\n`;
      });
      csvData += `\nTotal Faturado;;;;;;R$ ${totalFaturado.toFixed(2)}\n`;
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="relatorio_faturamento_${new Date(data_inicio).toISOString().split("T")[0]}_a_${new Date(data_fim).toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (formato === "pdf") {
      // Gerar PDF com pdfkit
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => { });

      // Título
      doc.fontSize(22).fillColor('#1a202c').text('Relatório de Faturamento', { align: 'center', underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#333').text(`Período: ${new Date(data_inicio).toLocaleDateString()} a ${new Date(data_fim).toLocaleDateString()}`);
      doc.text(`Tipo de Cliente: ${tipo_pessoa_cliente}`);
      doc.moveDown(1);

      // Cabeçalho da tabela
      const tableTop = doc.y;
      const colWidths = [50, 80, 120, 50, 100, 60];
      const startX = 40;
      const headerBg = '#e2e8f0';
      const rowBg1 = '#fff';
      const rowBg2 = '#f7fafc';
      const textColor = '#222';
      const headerTitles = ['OS', 'Data Saída', 'Cliente', 'Tipo', 'Tipo Serviço', 'Valor'];

      // Fundo do cabeçalho
      doc.rect(startX, tableTop, colWidths.reduce((a, b) => a + b, 0), 22).fill(headerBg);
      doc.fillColor(textColor).fontSize(11).font('Helvetica');
      let x = startX;
      headerTitles.forEach((title, i) => {
        doc.text(title, x + 4, tableTop + 6, { width: colWidths[i] - 8, align: 'left' });
        x += colWidths[i];
      });
      doc.moveDown();

      // Linhas da tabela
      let y = tableTop + 22;
      servicosFaturados.forEach((s, idx) => {
        const bg = idx % 2 === 0 ? rowBg1 : rowBg2;
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 20).fill(bg);
        doc.fillColor(textColor);
        let x = startX;
        const clienteNome = s.cliente?.tipo_pessoa === "FISICA" ? s.cliente?.nome_completo : s.cliente?.razao_social;
        const row = [
          s.id_servico || '',
          s.data_efetiva_saida ? new Date(s.data_efetiva_saida).toLocaleDateString() : '',
          clienteNome || '',
          s.cliente?.tipo_pessoa || '',
          s.tipo_servico?.nome_tipo_servico || '',
          s.valor_servico?.toFixed(2) || '0.00',
        ];
        row.forEach((cell, i) => {
          doc.text(cell, x + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
          x += colWidths[i];
        });
        y += 20;
      });

      // Linha separadora
      doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke('#cbd5e1');
      y += 10;

      // Total em destaque
      doc.fontSize(14).fillColor('#1a202c').font('Helvetica-Bold').text(`Total Faturado: R$ ${totalFaturado.toFixed(2)}`, startX, y, {
        width: colWidths.reduce((a, b) => a + b, 0), align: 'right'
      });
      doc.end();

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const bufs: Buffer[] = [];
        doc.on('data', (d: Buffer) => bufs.push(d));
        doc.on('end', () => resolve(Buffer.concat(bufs)));
        doc.on('error', reject);
      });

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio_faturamento_${new Date(data_inicio).toISOString().split('T')[0]}_a_${new Date(data_fim).toISOString().split('T')[0]}.pdf"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json({
      data: servicosFaturados,
      totalFaturado,
      periodo: { inicio: data_inicio, fim: data_fim },
      filtro_tipo_cliente: tipo_pessoa_cliente,
    });

  } catch (error) {
    console.error("Erro ao gerar relatório de faturamento:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

