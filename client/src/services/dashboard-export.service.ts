/**
 * Dashboard Export Service - Nomos
 * Serviço para geração e download de relatório único em Excel (.xlsx)
 * com gráficos visuais embutidos (Pizza, Barras) e tabelas consolidadas
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DashboardStats } from './dashboard.service';
import { formatLegalStatus, formatClientStatus, formatActionType } from '@/utils/formats';

/** Cores corporativas Nomos */
const COLORS = {
  headerBg: 'FF0F172A', // Slate 900
  sectionBg: 'FF1E293B', // Slate 800
  tableHeaderBg: 'FF334155', // Slate 700
  tableHeaderAltBg: 'FF475569', // Slate 600
  subtleBg: 'FFF8FAFC', // Slate 50
  totalRowBg: 'FFF1F5F9', // Slate 100
  border: 'FFE2E8F0', // Slate 200
  borderDark: 'FFCBD5E1', // Slate 300
  primaryAccent: 'FF0284C7', // Sky 600
  textDark: 'FF0F172A',
  textLight: 'FFFFFFFF',
  textMuted: 'FF64748B',
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } },
};

const BORDER_TOTAL: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.borderDark } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'double', color: { argb: COLORS.sectionBg } },
  right: { style: 'thin', color: { argb: COLORS.border } },
};

export interface ExportDashboardOptions {
  organizationName?: string;
  userName?: string;
}

export class DashboardExportService {
  /**
   * Exporta a planilha consolidada contendo tabelas analíticas e gráficos visuais (Pizza e Barras)
   */
  static async exportToExcel(stats: DashboardStats, options?: ExportDashboardOptions): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Nomos - Gestão Jurídica Inteligente';
    workbook.lastModifiedBy = options?.userName || 'Nomos';
    workbook.created = new Date();
    workbook.modified = new Date();

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const sheet = workbook.addWorksheet('Dashboard & Gráficos', {
      views: [{ showGridLines: true }],
      properties: { tabColor: { argb: COLORS.sectionBg } },
    });

    // Larguras das colunas
    sheet.columns = [
      { width: 3 },  // A (Margem)
      { width: 30 }, // B (Categoria / Indicador)
      { width: 14 }, // C (Quantidade / Valor)
      { width: 16 }, // D (Participação %)
      { width: 4 },  // E (Espaçador)
      { width: 15 }, // F (Gráfico)
      { width: 15 }, // G (Gráfico)
      { width: 15 }, // H (Gráfico)
      { width: 15 }, // I (Gráfico)
      { width: 15 }, // J (Gráfico)
      { width: 15 }, // K (Gráfico)
      { width: 3 },  // L (Margem)
    ];

    let r = 2;

    // 1. BANNER DE CABEÇALHO
    sheet.mergeCells(`B${r}:K${r}`);
    const titleCell = sheet.getCell(`B${r}`);
    titleCell.value = 'NOMOS — SISTEMA DE GESTÃO JURÍDICA';
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.textLight } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(r).height = 34;
    r++;

    sheet.mergeCells(`B${r}:K${r}`);
    const subCell = sheet.getCell(`B${r}`);
    subCell.value = 'Relatório Geral da Dashboard com Gráficos e Indicadores Estratégicos';
    subCell.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFE2E8F0' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(r).height = 22;
    r++;

    sheet.mergeCells(`B${r}:K${r}`);
    const metaCell = sheet.getCell(`B${r}`);
    const orgText = options?.organizationName ? `Organização: ${options.organizationName} | ` : '';
    metaCell.value = `${orgText}Emissão: ${formattedDate} às ${formattedTime}`;
    metaCell.font = { name: 'Segoe UI', size: 9, color: { argb: COLORS.textMuted } };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.subtleBg } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(r).height = 20;
    r += 2;

    // 2. SEÇÃO 1: INDICADORES PRINCIPAIS (KPIs)
    sheet.mergeCells(`B${r}:D${r}`);
    const kpiTitle = sheet.getCell(`B${r}`);
    kpiTitle.value = '1. INDICADORES PRINCIPAIS (KPIs)';
    kpiTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.textLight } };
    kpiTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderBg } };
    kpiTitle.alignment = { vertical: 'middle', indent: 1 };
    sheet.getRow(r).height = 24;
    r++;

    const kpiHeaderRow = sheet.getRow(r);
    kpiHeaderRow.values = ['', 'Indicador Operacional', 'Total', 'Referência'];
    kpiHeaderRow.height = 22;
    ['B', 'C', 'D'].forEach((col) => {
      const cell = sheet.getCell(`${col}${r}`);
      cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.textLight } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderAltBg } };
      cell.alignment = { vertical: 'middle', horizontal: col === 'C' ? 'right' : 'left' };
      cell.border = BORDER_THIN;
    });
    r++;

    const kpiData = [
      { label: 'Total de Clientes Cadastrados', val: stats.total_clients, ref: 'Base Total' },
      { label: 'Processos Jurídicos Ativos', val: stats.total_legal_actions, ref: 'Em Andamento' },
      { label: 'Novos Clientes (30 dias)', val: stats.recent_clients_30d, ref: 'Últimos 30 dias' },
      { label: 'Novas Ações (30 dias)', val: stats.recent_actions_30d, ref: 'Últimos 30 dias' },
      { label: 'Usuários na Organização', val: stats.total_users, ref: 'Equipe Ativa' },
    ];

    kpiData.forEach((item, idx) => {
      const row = sheet.getRow(r);
      row.values = ['', item.label, item.val, item.ref];
      row.height = 20;

      const bg = idx % 2 === 0 ? 'FFFFFFFF' : COLORS.subtleBg;
      ['B', 'C', 'D'].forEach((col) => {
        const cell = sheet.getCell(`${col}${r}`);
        cell.font = { name: 'Segoe UI', size: 9 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = BORDER_THIN;
        if (col === 'C') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
          cell.font = { name: 'Segoe UI', size: 9, bold: true };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
      r++;
    });

    r += 2;

    // 3. SEÇÃO 2: GRÁFICO DE BARRAS — PROCESSOS POR STATUS
    const statusSectionStartRow = r;

    sheet.mergeCells(`B${r}:D${r}`);
    const statusTitle = sheet.getCell(`B${r}`);
    statusTitle.value = '2. PROCESSOS POR STATUS';
    statusTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.textLight } };
    statusTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderBg } };
    statusTitle.alignment = { vertical: 'middle', indent: 1 };
    sheet.getRow(r).height = 24;
    r++;

    const statusHeaderRow = sheet.getRow(r);
    statusHeaderRow.values = ['', 'Status Processual', 'Processos', 'Participação (%)'];
    statusHeaderRow.height = 22;
    ['B', 'C', 'D'].forEach((col) => {
      const cell = sheet.getCell(`${col}${r}`);
      cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.textLight } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderAltBg } };
      cell.alignment = { vertical: 'middle', horizontal: ['C', 'D'].includes(col) ? 'right' : 'left' };
      cell.border = BORDER_THIN;
    });
    r++;

    const actionsEntries = Object.entries(stats.actions_by_status || {});
    const totalActions = actionsEntries.reduce((acc, [, count]) => acc + count, 0) || stats.total_legal_actions || 1;
    const actionsSum = actionsEntries.reduce((acc, [, count]) => acc + count, 0);

    const barChartData: { label: string; count: number; pct: number }[] = [];

    if (actionsEntries.length > 0) {
      actionsEntries.forEach(([status, count], idx) => {
        const row = sheet.getRow(r);
        const pct = count / totalActions;
        const formattedLabel = formatLegalStatus(status);
        barChartData.push({ label: formattedLabel, count, pct });

        row.values = ['', formattedLabel, count, pct];
        row.height = 20;

        const bg = idx % 2 === 0 ? 'FFFFFFFF' : COLORS.subtleBg;
        ['B', 'C', 'D'].forEach((col) => {
          const cell = sheet.getCell(`${col}${r}`);
          cell.font = { name: 'Segoe UI', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.border = BORDER_THIN;
          if (col === 'C') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          } else if (col === 'D') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '0.0%';
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
        r++;
      });

      // Linha de Total
      const totalRow = sheet.getRow(r);
      totalRow.values = ['', 'Total de Processos', actionsSum, 1.0];
      totalRow.height = 22;
      ['B', 'C', 'D'].forEach((col) => {
        const cell = sheet.getCell(`${col}${r}`);
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.textDark } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalRowBg } };
        cell.border = BORDER_TOTAL;
        if (col === 'C') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (col === 'D') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
      r++;
    } else {
      sheet.mergeCells(`B${r}:D${r}`);
      const emptyCell = sheet.getCell(`B${r}`);
      emptyCell.value = 'Nenhum processo cadastrado';
      emptyCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: COLORS.textMuted } };
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyCell.border = BORDER_THIN;
      r++;
    }

    // EMBUTIR IMAGEM DO GRÁFICO DE BARRAS NO EXCEL
    try {
      const barChartBase64 = this.renderBarChartCanvas(
        'Gráfico de Processos por Status',
        barChartData,
        actionsSum
      );
      const barImageId = workbook.addImage({
        base64: barChartBase64,
        extension: 'png',
      });
      sheet.addImage(barImageId, {
        tl: { col: 5, row: statusSectionStartRow - 1 }, // Coluna F
        ext: { width: 540, height: 270 },
      });
    } catch (e) {
      console.warn('Erro ao gerar imagem do gráfico de barras:', e);
    }

    // Ajustar r para garantir que a próxima seção não sobreponha a imagem do gráfico (altura ~14 linhas)
    r = Math.max(r, statusSectionStartRow + 14);
    r += 2;

    // 4. SEÇÃO 3: GRÁFICO DE PIZZA — CLIENTES POR STATUS
    const clientSectionStartRow = r;

    sheet.mergeCells(`B${r}:D${r}`);
    const clientTitle = sheet.getCell(`B${r}`);
    clientTitle.value = '3. CLIENTES POR STATUS';
    clientTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.textLight } };
    clientTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderBg } };
    clientTitle.alignment = { vertical: 'middle', indent: 1 };
    sheet.getRow(r).height = 24;
    r++;

    const clientHeaderRow = sheet.getRow(r);
    clientHeaderRow.values = ['', 'Status do Cliente', 'Clientes', 'Participação (%)'];
    clientHeaderRow.height = 22;
    ['B', 'C', 'D'].forEach((col) => {
      const cell = sheet.getCell(`${col}${r}`);
      cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.textLight } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderAltBg } };
      cell.alignment = { vertical: 'middle', horizontal: ['C', 'D'].includes(col) ? 'right' : 'left' };
      cell.border = BORDER_THIN;
    });
    r++;

    const clientEntries = Object.entries(stats.clients_by_status || {});
    const totalClients = clientEntries.reduce((acc, [, count]) => acc + count, 0) || stats.total_clients || 1;
    const clientSum = clientEntries.reduce((acc, [, count]) => acc + count, 0);

    const pieChartData: { label: string; count: number; pct: number }[] = [];

    if (clientEntries.length > 0) {
      clientEntries.forEach(([status, count], idx) => {
        const row = sheet.getRow(r);
        const pct = count / totalClients;
        const formattedLabel = formatClientStatus(status);
        pieChartData.push({ label: formattedLabel, count, pct });

        row.values = ['', formattedLabel, count, pct];
        row.height = 20;

        const bg = idx % 2 === 0 ? 'FFFFFFFF' : COLORS.subtleBg;
        ['B', 'C', 'D'].forEach((col) => {
          const cell = sheet.getCell(`${col}${r}`);
          cell.font = { name: 'Segoe UI', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.border = BORDER_THIN;
          if (col === 'C') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          } else if (col === 'D') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '0.0%';
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
        r++;
      });

      // Linha de Total
      const totalRow = sheet.getRow(r);
      totalRow.values = ['', 'Total de Clientes', clientSum, 1.0];
      totalRow.height = 22;
      ['B', 'C', 'D'].forEach((col) => {
        const cell = sheet.getCell(`${col}${r}`);
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.textDark } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalRowBg } };
        cell.border = BORDER_TOTAL;
        if (col === 'C') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (col === 'D') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
      r++;
    } else {
      sheet.mergeCells(`B${r}:D${r}`);
      const emptyCell = sheet.getCell(`B${r}`);
      emptyCell.value = 'Nenhum cliente cadastrado';
      emptyCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: COLORS.textMuted } };
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyCell.border = BORDER_THIN;
      r++;
    }

    // EMBUTIR IMAGEM DO GRÁFICO DE PIZZA NO EXCEL
    try {
      const pieChartBase64 = this.renderPieChartCanvas(
        'Gráfico de Pizza — Clientes por Status',
        pieChartData,
        clientSum
      );
      const pieImageId = workbook.addImage({
        base64: pieChartBase64,
        extension: 'png',
      });
      sheet.addImage(pieImageId, {
        tl: { col: 5, row: clientSectionStartRow - 1 }, // Coluna F
        ext: { width: 540, height: 270 },
      });
    } catch (e) {
      console.warn('Erro ao gerar imagem do gráfico de pizza:', e);
    }

    r = Math.max(r, clientSectionStartRow + 14);
    r += 2;

    // 5. SEÇÃO 4: PROCESSOS POR TIPO DE AÇÃO (se houver dados)
    if (stats.actions_by_type && Object.keys(stats.actions_by_type).length > 0) {
      const typeSectionStartRow = r;

      sheet.mergeCells(`B${r}:D${r}`);
      const typeTitle = sheet.getCell(`B${r}`);
      typeTitle.value = '4. PROCESSOS POR TIPO DE AÇÃO';
      typeTitle.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.textLight } };
      typeTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderBg } };
      typeTitle.alignment = { vertical: 'middle', indent: 1 };
      sheet.getRow(r).height = 24;
      r++;

      const typeHeaderRow = sheet.getRow(r);
      typeHeaderRow.values = ['', 'Tipo de Ação', 'Processos', 'Participação (%)'];
      typeHeaderRow.height = 22;
      ['B', 'C', 'D'].forEach((col) => {
        const cell = sheet.getCell(`${col}${r}`);
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.textLight } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.tableHeaderAltBg } };
        cell.alignment = { vertical: 'middle', horizontal: ['C', 'D'].includes(col) ? 'right' : 'left' };
        cell.border = BORDER_THIN;
      });
      r++;

      const typeEntries = Object.entries(stats.actions_by_type);
      const totalTypes = typeEntries.reduce((acc, [, count]) => acc + count, 0) || 1;
      const typesSum = typeEntries.reduce((acc, [, count]) => acc + count, 0);

      const typeChartData: { label: string; count: number; pct: number }[] = [];

      typeEntries.forEach(([type, count], idx) => {
        const row = sheet.getRow(r);
        const pct = count / totalTypes;
        const formattedLabel = formatActionType(type);
        typeChartData.push({ label: formattedLabel, count, pct });

        row.values = ['', formattedLabel, count, pct];
        row.height = 20;

        const bg = idx % 2 === 0 ? 'FFFFFFFF' : COLORS.subtleBg;
        ['B', 'C', 'D'].forEach((col) => {
          const cell = sheet.getCell(`${col}${r}`);
          cell.font = { name: 'Segoe UI', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.border = BORDER_THIN;
          if (col === 'C') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          } else if (col === 'D') {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '0.0%';
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
        r++;
      });

      // Linha de Total
      const totalRow = sheet.getRow(r);
      totalRow.values = ['', 'Total de Ações', typesSum, 1.0];
      totalRow.height = 22;
      ['B', 'C', 'D'].forEach((col) => {
        const cell = sheet.getCell(`${col}${r}`);
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.textDark } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalRowBg } };
        cell.border = BORDER_TOTAL;
        if (col === 'C') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (col === 'D') {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
      });
      r++;

      // EMBUTIR IMAGEM DO GRÁFICO DE TIPOS NO EXCEL
      try {
        const typeChartBase64 = this.renderBarChartCanvas(
          'Gráfico de Processos por Tipo de Ação',
          typeChartData,
          typesSum,
          '#6366F1'
        );
        const typeImageId = workbook.addImage({
          base64: typeChartBase64,
          extension: 'png',
        });
        sheet.addImage(typeImageId, {
          tl: { col: 5, row: typeSectionStartRow - 1 }, // Coluna F
          ext: { width: 540, height: 270 },
        });
      } catch (e) {
        console.warn('Erro ao gerar imagem do gráfico de tipos:', e);
      }
    }

    // Gerar buffer e download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const fileDate = now.toISOString().slice(0, 10);
    const fileTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `relatorio-dashboard-nomos_${fileDate}_${fileTime}.xlsx`;

    saveAs(blob, filename);
  }

  /**
   * Renderiza um Gráfico de Barras elegante em Canvas e retorna em Base64 PNG
   */
  private static renderBarChartCanvas(
    title: string,
    data: { label: string; count: number; pct: number }[],
    total: number,
    barColor = '#0284C7'
  ): string {
    const width = 1080;
    const height = 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Fundo Branco do Card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Borda do Card
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Título
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 30px "Segoe UI", -apple-system, sans-serif';
    ctx.fillText(title, 40, 56);

    // Subtítulo
    ctx.fillStyle = '#64748B';
    ctx.font = '20px "Segoe UI", -apple-system, sans-serif';
    ctx.fillText(`Total consolidado: ${total} registros`, 40, 92);

    // Linha divisória
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 112);
    ctx.lineTo(width - 40, 112);
    ctx.stroke();

    if (data.length === 0) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 24px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhum dado disponível', width / 2, height / 2);
      return canvas.toDataURL('image/png');
    }

    const startY = 145;
    const maxItems = Math.min(data.length, 7);
    const availableHeight = height - startY - 40;
    const rowHeight = availableHeight / maxItems;
    const maxVal = Math.max(...data.map((d) => d.count), 1);

    const labelStartX = 40;
    const labelWidth = 240;
    const barStartX = 300;
    const barMaxWidth = 560;
    const barHeight = Math.min(rowHeight * 0.55, 32);

    data.slice(0, maxItems).forEach((item, i) => {
      const centerY = startY + i * rowHeight + rowHeight / 2;
      const barY = centerY - barHeight / 2;

      // Label
      ctx.fillStyle = '#1E293B';
      ctx.font = '500 21px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(item.label, barStartX - 20, centerY + 7);

      // Track de fundo da barra
      ctx.fillStyle = '#F1F5F9';
      this.drawRoundedRect(ctx, barStartX, barY, barMaxWidth, barHeight, 6);
      ctx.fill();

      // Barra de progresso
      const currentBarWidth = Math.max((item.count / maxVal) * barMaxWidth, 10);
      ctx.fillStyle = barColor;
      this.drawRoundedRect(ctx, barStartX, barY, currentBarWidth, barHeight, 6);
      ctx.fill();

      // Valor e Percentual
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 21px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      const pctText = (item.pct * 100).toFixed(0);
      ctx.fillText(`${item.count} (${pctText}%)`, barStartX + barMaxWidth + 20, centerY + 7);
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Renderiza um Gráfico de Pizza / Rosca moderno em Canvas e retorna em Base64 PNG
   */
  private static renderPieChartCanvas(
    title: string,
    data: { label: string; count: number; pct: number }[],
    total: number
  ): string {
    const width = 1080;
    const height = 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Paleta refinada para as fatias
    const PIE_PALETTE = [
      '#0284C7', // Azul Primário
      '#0EA5E9', // Azul Claro
      '#38BDF8', // Ciano
      '#6366F1', // Índigo
      '#8B5CF6', // Roxo
      '#EC4899', // Rosa
      '#F59E0B', // Âmbar
      '#10B981', // Esmeralda
    ];

    // Fundo Branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Borda
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Título
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 30px "Segoe UI", -apple-system, sans-serif';
    ctx.fillText(title, 40, 56);

    // Subtítulo
    ctx.fillStyle = '#64748B';
    ctx.font = '20px "Segoe UI", -apple-system, sans-serif';
    ctx.fillText(`Distribuição proporcional consolidada (${total} clientes)`, 40, 92);

    // Linha divisória
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 112);
    ctx.lineTo(width - 40, 112);
    ctx.stroke();

    if (data.length === 0 || total === 0) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'italic 24px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nenhum dado disponível', width / 2, height / 2);
      return canvas.toDataURL('image/png');
    }

    // Desenhar Rosca / Donut no lado esquerdo
    const centerX = 260;
    const centerY = 320;
    const outerRadius = 150;
    const innerRadius = 80;

    let startAngle = -Math.PI / 2;

    data.forEach((item, i) => {
      const sliceAngle = (item.count / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const color = PIE_PALETTE[i % PIE_PALETTE.length];

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      // Separador branco sutil
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Texto no Centro da Rosca
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 42px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${total}`, centerX, centerY + 8);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('TOTAL', centerX, centerY + 34);

    // Legenda no lado direito
    const legendStartX = 540;
    const legendStartY = 160;
    const maxLegendItems = Math.min(data.length, 6);
    const legendRowHeight = 52;

    data.slice(0, maxLegendItems).forEach((item, i) => {
      const itemY = legendStartY + i * legendRowHeight;
      const color = PIE_PALETTE[i % PIE_PALETTE.length];

      // Marcador circular colorido
      ctx.beginPath();
      ctx.arc(legendStartX + 12, itemY + 12, 10, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Nome do status
      ctx.fillStyle = '#1E293B';
      ctx.font = '500 22px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legendStartX + 36, itemY + 19);

      // Quantidade e Percentual
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      const pctText = (item.pct * 100).toFixed(1);
      ctx.fillText(`${item.count}  (${pctText}%)`, width - 60, itemY + 19);

      // Linha guia sutil na legenda
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(legendStartX, itemY + 36);
      ctx.lineTo(width - 60, itemY + 36);
      ctx.stroke();
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Helper para desenhar retângulos com cantos arredondados no Canvas
   */
  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
