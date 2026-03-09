import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportScorecardPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    backgroundColor: "#161b26",
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // Handle multi-page if content is tall
  let position = 0;
  const pageHeight = pdf.internal.pageSize.getHeight();

  if (pdfHeight <= pageHeight) {
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  } else {
    let remainingHeight = pdfHeight;
    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      remainingHeight -= pageHeight;
      position -= pageHeight;
      if (remainingHeight > 0) {
        pdf.addPage();
      }
    }
  }

  pdf.save(`${filename}.pdf`);
}
