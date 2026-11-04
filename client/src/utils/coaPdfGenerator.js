import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './formatters';

export const generateCOAPdf = (coa, batch) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const navyDark = [15, 23, 42]; // #0f172a
  const tealAccent = [13, 148, 136]; // #0d9488
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];
  const borderLight = [226, 232, 240];

  // Header Banner
  doc.setFillColor(...navyDark);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative Teal stripe
  doc.setFillColor(...tealAccent);
  doc.rect(0, 28, pageWidth, 3, 'F');

  // Header Logo & Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FOODLAB LIMS', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Food Processing Laboratory & Quality Certification Authority', 14, 20);

  // Certificate Heading on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICATE OF ANALYSIS', pageWidth - 14, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Doc #: ${coa.certificateNumber}`, pageWidth - 14, 20, { align: 'right' });

  let yPos = 40;

  // Accreditation Subheader
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderLight);
  doc.roundedRect(14, yPos, pageWidth - 28, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...tealAccent);
  doc.text('ACCREDITATION STANDARD:', 18, yPos + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text(coa.accreditationStandard || 'ISO/IEC 17025:2017 Testing Laboratory (NABL / ILAC MRA)', 68, yPos + 7.5);

  yPos += 18;

  // Batch & Product Details Grid (2 Column Box)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, yPos, pageWidth - 28, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navyDark);
  doc.text('BATCH & SAMPLE IDENTIFICATION', 18, yPos + 7);
  doc.setDrawColor(...borderLight);
  doc.line(18, yPos + 9, pageWidth - 18, yPos + 9);

  // Col 1
  const col1X = 18;
  const col2X = pageWidth / 2 + 5;
  let rowY = yPos + 16;

  const renderField = (x, y, label, val) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(String(val || '—'), x + 38, y);
  };

  renderField(col1X, rowY, 'Certificate No:', coa.certificateNumber);
  renderField(col2X, rowY, 'Batch ID:', coa.batchId);
  rowY += 6.5;

  renderField(col1X, rowY, 'Product Name:', coa.productName);
  renderField(col2X, rowY, 'Category:', coa.productCategory);
  rowY += 6.5;

  renderField(col1X, rowY, 'Mfg Date:', formatDate(coa.manufacturingDate || batch?.manufacturingDate));
  renderField(col2X, rowY, 'Expiry Date:', formatDate(coa.expiryDate || batch?.expiryDate));
  rowY += 6.5;

  renderField(col1X, rowY, 'Storage Spec:', coa.storageConditions || batch?.storageConditions);
  renderField(col2X, rowY, 'Sample Loc:', coa.sampleInfo?.sampleLocation || batch?.sampleLocation);

  yPos += 48;

  // 1. Chemical Analysis Table
  if (coa.testResults?.chemical?.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navyDark);
    doc.text('1. CHEMICAL ANALYSIS & PHYSICOCHEMICAL PARAMETERS', 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [['Parameter', 'Unit', 'Test Method', 'Specification Limit', 'Observed Value', 'Result']],
      body: coa.testResults.chemical.map((row) => [
        row.parameter,
        row.unit,
        row.method,
        row.specification,
        row.observed,
        row.result,
      ]),
      theme: 'grid',
      headStyles: { fillColor: navyDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        5: { fontStyle: 'bold', textColor: [22, 163, 74] }, // Green for pass
      },
      margin: { left: 14, right: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 8;
  }

  // 2. Microbiological Testing Table
  if (coa.testResults?.microbiological?.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navyDark);
    doc.text('2. MICROBIOLOGICAL EXAMINATION', 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [['Microorganism / Parameter', 'Unit', 'Standard Method', 'Specification Ceiling', 'Observed Finding', 'Result']],
      body: coa.testResults.microbiological.map((row) => [
        row.parameter,
        row.unit,
        row.method,
        row.specification,
        row.observed,
        row.result,
      ]),
      theme: 'grid',
      headStyles: { fillColor: navyDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        5: { fontStyle: 'bold', textColor: [22, 163, 74] },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 8;
  }

  // 3. Heavy Metals & Contaminants Table
  if (coa.testResults?.heavyMetals?.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navyDark);
    doc.text('3. HEAVY METALS, TOXINS & CHEMICAL CONTAMINANTS', 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [['Contaminant Analyte', 'Unit', 'Method Reference', 'Regulatory Max Ceiling', 'Observed Level', 'Result']],
      body: coa.testResults.heavyMetals.map((row) => [
        row.parameter,
        row.unit,
        row.method,
        row.specification,
        row.observed,
        row.result,
      ]),
      theme: 'grid',
      headStyles: { fillColor: navyDark, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: textDark },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        5: { fontStyle: 'bold', textColor: [22, 163, 74] },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 8;
  }

  // Check page overflow for Verdict and Signatures
  if (yPos > 220) {
    doc.addPage();
    yPos = 25;
  }

  // Verdict Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, yPos, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text('OFFICIAL QUALITY VERDICT:', 18, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text(coa.overallVerdict || 'CONFORMS TO ALL REGULATORY QUALITY & SAFETY SPECIFICATIONS - APPROVED FOR RELEASE', 18, yPos + 11.5);

  yPos += 24;

  // Signatures & Endorsement Block
  const sigBoxY = yPos;
  doc.setDrawColor(...borderLight);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, sigBoxY, pageWidth - 28, 30, 2, 2, 'D');

  // Signatory Left: Analyst
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('TESTED & VERIFIED BY:', 20, sigBoxY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navyDark);
  doc.text('Laboratory Operations Staff', 20, sigBoxY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Analytical Food Chemistry & Microbiology Team', 20, sigBoxY + 22);

  // Signatory Right: Quality Manager
  const signRightX = pageWidth - 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('AUTHORIZED QA SIGN-OFF:', signRightX, sigBoxY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...navyDark);
  doc.text(coa.issuedByName || 'Quality Manager', signRightX, sigBoxY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Date of Release: ${formatDate(coa.issueDate)}`, signRightX, sigBoxY + 22);

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(
      `FoodLab LIMS Enterprise System | Certificate #${coa.certificateNumber} | Page ${i} of ${totalPages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
    doc.text(
      'CONFIDENTIAL & PROPRIETARY | ISO/IEC 17025 VERIFIED',
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    );
  }

  // Save / Download PDF
  doc.save(`${coa.certificateNumber}_${coa.batchId}.pdf`);
};
