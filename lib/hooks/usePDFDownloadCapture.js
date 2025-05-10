import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Hook para generar y descargar un PDF a partir de un elemento referenciado.
 * @param {Object} ref - React ref apuntando al contenido que se desea capturar.
 * @returns {Function} downloadPDF - Función que genera y descarga el PDF.
 */
export const usePDFDownload = (ref) => {
  const downloadPDF = useCallback(async (filename = 'documento.pdf') => {
    if (!ref?.current) return;

    const canvas = await html2canvas(ref.current);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  }, [ref]);

  return downloadPDF;
};
