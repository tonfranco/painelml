import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exportar dados para Excel
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Dados') {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Criar worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Gerar arquivo
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Exportar dados para CSV
 */
export function exportToCSV(data: any[], filename: string) {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Criar worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  
  // Gerar arquivo CSV
  XLSX.writeFile(wb, `${filename}.csv`, { bookType: 'csv' });
}

/**
 * Exportar dados para PDF
 */
export function exportToPDF(
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename: string,
  title: string
) {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
  
  // Tabela
  autoTable(doc, {
    startY: 35,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey])),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }, // blue-500
  });
  
  // Salvar
  doc.save(`${filename}.pdf`);
}

/**
 * Exportar relatório financeiro completo
 */
export function exportFinancialReport(
  stats: any,
  periods: any[],
  expenses: any[],
  taxes: any[],
  format: 'excel' | 'csv' | 'pdf'
) {
  const filename = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'excel') {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo
    const summaryData = [
      { Métrica: 'Faturamento Bruto', Valor: stats.totalRevenue },
      { Métrica: 'Taxas ML/MP', Valor: stats.totalFees },
      { Métrica: 'Impostos', Valor: stats.totalTaxes },
      { Métrica: 'Faturamento Líquido', Valor: stats.totalNet },
      { Métrica: 'Margem de Lucro', Valor: `${stats.profitMargin.toFixed(2)}%` },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
    
    // Sheet 2: Períodos
    if (periods && periods.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(periods);
      XLSX.utils.book_append_sheet(wb, ws2, 'Períodos');
    }
    
    // Sheet 3: Despesas
    if (expenses && expenses.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(expenses);
      XLSX.utils.book_append_sheet(wb, ws3, 'Despesas Fixas');
    }
    
    // Sheet 4: Impostos
    if (taxes && taxes.length > 0) {
      const ws4 = XLSX.utils.json_to_sheet(taxes);
      XLSX.utils.book_append_sheet(wb, ws4, 'Impostos e Taxas');
    }
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } else if (format === 'csv') {
    // Para CSV, exportar apenas o resumo
    const summaryData = [
      { Métrica: 'Faturamento Bruto', Valor: stats.totalRevenue },
      { Métrica: 'Taxas ML/MP', Valor: stats.totalFees },
      { Métrica: 'Impostos', Valor: stats.totalTaxes },
      { Métrica: 'Faturamento Líquido', Valor: stats.totalNet },
      { Métrica: 'Margem de Lucro', Valor: `${stats.profitMargin.toFixed(2)}%` },
    ];
    exportToCSV(summaryData, filename);
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 14, 20);
    
    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    
    // Resumo
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Faturamento Bruto', `R$ ${stats.totalRevenue.toFixed(2)}`],
        ['Taxas ML/MP', `R$ ${stats.totalFees.toFixed(2)}`],
        ['Impostos', `R$ ${stats.totalTaxes.toFixed(2)}`],
        ['Faturamento Líquido', `R$ ${stats.totalNet.toFixed(2)}`],
        ['Margem de Lucro', `${stats.profitMargin.toFixed(2)}%`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Períodos
    if (periods && periods.length > 0) {
      const startY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Períodos de Faturamento', 14, startY);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Período', 'Faturamento', 'Líquido']],
        body: periods.slice(0, 10).map(p => [
          p.periodKey,
          `R$ ${p.totalAmount.toFixed(2)}`,
          `R$ ${p.netAmount.toFixed(2)}`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }
    
    doc.save(`${filename}.pdf`);
  }
}

/**
 * Exportar fluxo de caixa
 */
export function exportCashFlowReport(
  forecast: any,
  reconciliation: any,
  format: 'excel' | 'csv' | 'pdf'
) {
  const filename = `fluxo-caixa-${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'excel') {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Previsão
    const forecastData = [
      { Período: 'Hoje', Quantidade: forecast.today.count, Total: forecast.today.total },
      { Período: 'Próximos 7 dias', Quantidade: forecast.next7Days.count, Total: forecast.next7Days.total },
      { Período: 'Próximos 30 dias', Quantidade: forecast.next30Days.count, Total: forecast.next30Days.total },
      { Período: 'Atrasados', Quantidade: forecast.overdue.count, Total: forecast.overdue.total },
    ];
    const ws1 = XLSX.utils.json_to_sheet(forecastData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Previsão');
    
    // Sheet 2: Conciliação
    if (reconciliation && reconciliation.items) {
      const ws2 = XLSX.utils.json_to_sheet(reconciliation.items);
      XLSX.utils.book_append_sheet(wb, ws2, 'Conciliação');
    }
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } else if (format === 'csv') {
    const forecastData = [
      { Período: 'Hoje', Quantidade: forecast.today.count, Total: forecast.today.total },
      { Período: 'Próximos 7 dias', Quantidade: forecast.next7Days.count, Total: forecast.next7Days.total },
      { Período: 'Próximos 30 dias', Quantidade: forecast.next30Days.count, Total: forecast.next30Days.total },
      { Período: 'Atrasados', Quantidade: forecast.overdue.count, Total: forecast.overdue.total },
    ];
    exportToCSV(forecastData, filename);
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Fluxo de Caixa', 14, 20);
    
    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
    
    // Previsão
    doc.setFontSize(14);
    doc.text('Previsão de Recebimentos', 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [['Período', 'Quantidade', 'Total']],
      body: [
        ['Hoje', forecast.today.count, `R$ ${forecast.today.total.toFixed(2)}`],
        ['Próximos 7 dias', forecast.next7Days.count, `R$ ${forecast.next7Days.total.toFixed(2)}`],
        ['Próximos 30 dias', forecast.next30Days.count, `R$ ${forecast.next30Days.total.toFixed(2)}`],
        ['Atrasados', forecast.overdue.count, `R$ ${forecast.overdue.total.toFixed(2)}`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Conciliação
    if (reconciliation && reconciliation.items && reconciliation.items.length > 0) {
      const startY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Conciliação Bancária', 14, startY);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Período', 'Esperado', 'Recebido', 'Status']],
        body: reconciliation.items.slice(0, 10).map((item: any) => [
          item.periodKey,
          `R$ ${item.expectedAmount.toFixed(2)}`,
          `R$ ${item.receivedAmount.toFixed(2)}`,
          item.status === 'matched' ? 'Conciliado' : 'Divergente',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
    }
    
    doc.save(`${filename}.pdf`);
  }
}
