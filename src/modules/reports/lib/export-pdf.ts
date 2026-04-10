import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfSection {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

interface PdfReportOptions {
  title: string;
  subtitle: string;
  businessName: string;
  dateRange: string;
  sections: PdfSection[];
  summaryCards?: { label: string; value: string }[];
}

export function exportToPdf(options: PdfReportOptions) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // ── Header ──
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 14, y + 4);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(options.businessName, 14, y + 12);

  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(options.subtitle, 14, y + 18);
  doc.text(options.dateRange, pageWidth - 14, y + 18, { align: 'right' });

  y = 46;

  // ── Summary cards ──
  if (options.summaryCards && options.summaryCards.length > 0) {
    const cardWidth = (pageWidth - 28 - (options.summaryCards.length - 1) * 4) / options.summaryCards.length;

    options.summaryCards.forEach((card, i) => {
      const x = 14 + i * (cardWidth + 4);

      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x, y, cardWidth, 20, 2, 2, 'FD');

      doc.setTextColor(107, 114, 128);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label.toUpperCase(), x + 4, y + 7);

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + 4, y + 15);
    });

    y += 28;
  }

  // ── Sections ──
  for (const section of options.sections) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 15;
    }

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [section.headers],
      body: section.rows.map((row) => row.map((cell) => String(cell))),
      theme: 'striped',
      headStyles: {
        fillColor: [17, 24, 39],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [55, 65, 81],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      styles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.1,
      },
      margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Footer ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado por Vitriona — ${new Date().toLocaleDateString('es')}`, 14, pageHeight - 8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  doc.save(`${options.title.replace(/\s+/g, '_')}.pdf`);
}
