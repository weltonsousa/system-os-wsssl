import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import PDFDocument from "pdfkit";

// Esquema para validar os query params (opcional, mas bom para robustez)
const reportQuerySchema = z.object({
  formato: z.enum(["json", "csv", "pdf"]).optional().default("json"),
  status_id: z.string().cuid().optional(), // Filtrar por um status específico
  data_inicio: z.string().datetime({ offset: true }).optional(),
  data_fim: z.string().datetime({ offset: true }).optional(),
});

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryParse = reportQuerySchema.safeParse({
    formato: searchParams.get("formato") || "json",
    status_id: searchParams.get("status_id") || undefined,
    data_inicio: searchParams.get("data_inicio") || undefined,
    data_fim: searchParams.get("data_fim") || undefined,
  });

  if (!queryParse.success) {
    return NextResponse.json({ error: "Parâmetros inválidos", details: queryParse.error.flatten() }, { status: 400 });
  }

  const { formato, status_id, data_inicio, data_fim } = queryParse.data;

  try {
    const whereClause: Record<string, unknown> = {};
    if (status_id) {
      whereClause.id_status_atual = status_id;
    }
    if (data_inicio && data_fim) {
      whereClause.data_entrada = {
        gte: new Date(data_inicio),
        lte: new Date(data_fim),
      };
    } else if (data_inicio) {
      whereClause.data_entrada = {
        gte: new Date(data_inicio),
      };
    } else if (data_fim) {
      whereClause.data_entrada = {
        lte: new Date(data_fim),
      };
    }

    const servicos = await prisma.servico.findMany({
      where: whereClause,
      include: {
        cliente: { select: { nome_completo: true, razao_social: true, tipo_pessoa: true } },
        tipo_servico: { select: { nome_tipo_servico: true } },
        status_atual: { select: { nome_status: true } },
      },
      orderBy: {
        data_entrada: "asc",
      },
    });

    if (formato === "csv") {
      let csvData = "OS;Cliente;Tipo Pessoa;Tipo Servico;Data Entrada;Status Atual;Valor Servico\n";
      servicos.forEach(s => {
        const clienteNome = s.cliente?.tipo_pessoa === "FISICA" ? s.cliente?.nome_completo : s.cliente?.razao_social;
        csvData += `${s.id_servico};${clienteNome || "N/A"};${s.cliente?.tipo_pessoa || "N/A"};${s.tipo_servico?.nome_tipo_servico || "N/A"};${new Date(s.data_entrada).toLocaleDateString()};${s.status_atual?.nome_status || "N/A"};${s.valor_servico?.toFixed(2) || "0.00"}\n`;
      });
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="relatorio_servicos_status_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (formato === "pdf") {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {});

      // Título
      doc.fontSize(20).fillColor('#1a202c').text('Relatório de Serviços por Status', { align: 'center', underline: true });
      doc.moveDown(0.5);
      let periodo = '';
      if (data_inicio && data_fim) {
        periodo = `Período: ${new Date(data_inicio).toLocaleDateString()} a ${new Date(data_fim).toLocaleDateString()}`;
      } else if (data_inicio) {
        periodo = `A partir de: ${new Date(data_inicio).toLocaleDateString()}`;
      } else if (data_fim) {
        periodo = `Até: ${new Date(data_fim).toLocaleDateString()}`;
      }
      if (periodo) doc.fontSize(12).fillColor('#333').text(periodo);
      if (status_id) doc.text(`Status filtrado: ${status_id}`);
      doc.moveDown(1);

      // Cabeçalho da tabela
      const tableTop = doc.y;
      const colWidths = [50, 120, 50, 100, 80, 100, 60];
      const startX = 40;
      const headerBg = '#e2e8f0';
      const rowBg1 = '#fff';
      const rowBg2 = '#f7fafc';
      const textColor = '#222';
      const headerTitles = ['OS', 'Cliente', 'Tipo Pessoa', 'Tipo Serviço', 'Data Entrada', 'Status', 'Valor'];

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
      servicos.forEach((s, idx) => {
        const bg = idx % 2 === 0 ? rowBg1 : rowBg2;
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 20).fill(bg);
        doc.fillColor(textColor);
        let x = startX;
        const clienteNome = s.cliente?.tipo_pessoa === "FISICA" ? s.cliente?.nome_completo : s.cliente?.razao_social;
        const row = [
          s.id_servico.substring(0, 10) || '',
          clienteNome || '',
          s.cliente?.tipo_pessoa || '',
          s.tipo_servico?.nome_tipo_servico || '',
          s.data_entrada ? new Date(s.data_entrada).toLocaleDateString() : '',
          s.status_atual?.nome_status || '',
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

      // Total de serviços
      doc.fontSize(12).fillColor('#1a202c').font('Helvetica').text(`Total de Serviços: ${servicos.length}`, startX, y, {
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
          'Content-Disposition': `attachment; filename="relatorio_servicos_status_${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json(servicos);

  } catch (error) {
    console.error("Erro ao gerar relatório de serviços por status:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

