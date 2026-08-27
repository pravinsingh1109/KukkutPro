import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashEntry } from '../types';

interface GeneratePdfOptions {
  farmName: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  openingBalance: string | number;
  closingBalance: string | number;
  totalIn: string | number;
  totalOut: string | number;
  entries: CashEntry[];
}

export function generateCashbookPdf(options: GeneratePdfOptions) {
  const {
    farmName,
    periodLabel,
    startDate,
    endDate,
    openingBalance,
    closingBalance,
    totalIn,
    totalOut,
    entries,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // --- BRAND HEADER ---
  // Top Banner Bar
  doc.setFillColor(230, 126, 34); // #E67E22 (Brand Orange)
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('KUKKUTPRO · CASH BOOK STATEMENT', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Poultry Farm Financial Ledger & Cash Flow Report`, 14, 18);

  // Generation timestamp on right
  const printDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Generated: ${printDate}`, pageWidth - 14, 18, { align: 'right' });

  // --- FARM & PERIOD INFO ---
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(farmName || 'KukkutPro Poultry Farm', 14, 33);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Statement Period: ${periodLabel} (${startDate} to ${endDate})`, 14, 39);

  // --- SUMMARY CARDS (BOXES) ---
  const boxY = 44;
  const boxHeight = 22;
  const boxWidth = (pageWidth - 28 - 9) / 4; // 4 boxes

  // 1. Opening Balance
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(220, 224, 230);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('OPENING BALANCE', 14 + boxWidth / 2, boxY + 7, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`Rs. ${Number(openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 14 + boxWidth / 2, boxY + 16, { align: 'center' });

  // 2. Total In (Green)
  const box2X = 14 + boxWidth + 3;
  doc.setFillColor(235, 247, 238);
  doc.setDrawColor(180, 225, 190);
  doc.roundedRect(box2X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(39, 140, 70);
  doc.text('TOTAL CASH IN (+)', box2X + boxWidth / 2, boxY + 7, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`+Rs. ${Number(totalIn).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, box2X + boxWidth / 2, boxY + 16, { align: 'center' });

  // 3. Total Out (Red)
  const box3X = box2X + boxWidth + 3;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(245, 190, 190);
  doc.roundedRect(box3X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(200, 40, 40);
  doc.text('TOTAL CASH OUT (-)', box3X + boxWidth / 2, boxY + 7, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`-Rs. ${Number(totalOut).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, box3X + boxWidth / 2, boxY + 16, { align: 'center' });

  // 4. Closing Cash in Hand
  const box4X = box3X + boxWidth + 3;
  doc.setFillColor(254, 247, 237);
  doc.setDrawColor(245, 205, 160);
  doc.roundedRect(box4X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(190, 95, 20);
  doc.text('CLOSING CASH', box4X + boxWidth / 2, boxY + 7, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Rs. ${Number(closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, box4X + boxWidth / 2, boxY + 16, { align: 'center' });

  // --- TRANSACTIONS TABLE ---
  const tableData = entries.map((entry, idx) => {
    const isIncome = entry.type === 'IN';
    const amountFormatted = Number(entry.amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    let sourceLabel: string = entry.source ? String(entry.source) : 'MANUAL';
    if (sourceLabel === 'CUSTOMER_PAYMENT') sourceLabel = 'Customer Due';
    else if (sourceLabel === 'SALE') sourceLabel = 'Egg Sale';
    else if (sourceLabel === 'EXPENSE') sourceLabel = 'Farm Expense';
    else if (sourceLabel === 'LABOUR') sourceLabel = 'Worker Salary/Adv';

    return [
      idx + 1,
      entry.date,
      sourceLabel,
      entry.notes || '—',
      isIncome ? `+${amountFormatted}` : '—',
      !isIncome ? `-${amountFormatted}` : '—',
    ];
  });

  autoTable(doc, {
    startY: boxY + boxHeight + 7,
    head: [['#', 'Date', 'Category / Source', 'Description / Details', 'Cash In (Rs.)', 'Cash Out (Rs.)']],
    body: tableData.length > 0 ? tableData : [['—', '—', '—', 'No cash transactions recorded for this period', '—', '—']],
    theme: 'grid',
    headStyles: {
      fillColor: [230, 126, 34],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontSize: 8 },
      1: { cellWidth: 23, halign: 'center', fontSize: 8 },
      2: { cellWidth: 35, fontSize: 8 },
      3: { cellWidth: 'auto', fontSize: 8 },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [39, 140, 70], fontSize: 8.5 },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [200, 40, 40], fontSize: 8.5 },
    },
    styles: {
      overflow: 'linebreak',
      cellPadding: 2.2,
      font: 'helvetica',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    foot: [
      [
        '',
        '',
        'TOTALS',
        `${entries.length} transactions`,
        `+Rs. ${Number(totalIn).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        `-Rs. ${Number(totalOut).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      ],
    ],
    footStyles: {
      fillColor: [240, 242, 245],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
    },
    didDrawPage: (data) => {
      // Page Number Footer
      const str = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      doc.text('KukkutPro — Certified Poultry Cash Ledger System', 14, doc.internal.pageSize.getHeight() - 8);
    },
    margin: { left: 14, right: 14, bottom: 15 },
  });

  // Save the PDF
  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `KukkutPro_CashBook_${safePeriod}.pdf`;
  doc.save(filename);
}
