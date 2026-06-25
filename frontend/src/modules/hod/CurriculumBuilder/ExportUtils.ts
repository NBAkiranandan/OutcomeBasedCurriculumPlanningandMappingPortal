import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { CurriculumBuilderState } from './documentStore';

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '210mm';
  clone.style.height = 'auto';
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.zIndex = '-9999';
  clone.style.opacity = '0';
  clone.style.transform = 'none';
  clone.style.marginBottom = '0';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Support multiple pages if content exceeds one A4 page
    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
  } finally {
    document.body.removeChild(clone);
  }
};

export const exportToWord = async (data: CurriculumBuilderState, filename: string) => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: "ACADEMIC REGULATIONS, COURSE STRUCTURE AND SYLLABI", bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [new TextRun({ text: `Under ${data.regulation} Regulations`, bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [new TextRun({ text: data.program, bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: data.department, bold: true, size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1000 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Academic Year ${data.academicYear}`, bold: true, size: 20 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000 }
          }),
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
