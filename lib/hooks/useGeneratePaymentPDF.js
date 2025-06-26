import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PAYMENT_METHODS } from '../utils/paymentmethods';

export const useGeneratePaymentPDF = () => {
  const generatePDF = async (payment, patient, returnBlob = false) => {
    const doc = new jsPDF();
    const logoUrl = 'https://res.cloudinary.com/dnxxkvpiz/image/upload/v1746820670/Implaeden/logo_ljop5d.png';
    const safePayment = { ...payment };
    const safePatient = { ...patient };

    const methodLabel =
    PAYMENT_METHODS.find(m => m.value === payment.metodo_pago)?.label
    || payment.metodo_pago;

    const response = await fetch(logoUrl);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imgData = reader.result;

        doc.addImage(imgData, 'PNG', 14, 10, 60, 20);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Factura de Pago", 14, 40);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Paciente:", 14, 50);
        doc.setFont("helvetica", "normal");
        doc.text(`${safePatient.nombre} ${safePatient.apellidos}`, 45, 50);

        doc.setFont("helvetica", "bold");
        doc.text("Fecha:", 14, 57);
        doc.setFont("helvetica", "normal");
        const [y, m, d] = new Date(safePayment.fecha).toISOString().slice(0, 10).split("-");
        doc.text(`${d}/${m}/${y}`, 45, 57);


        doc.setFont("helvetica", "bold");
        doc.text("Número de Factura:", 14, 64);
        doc.setFont("helvetica", "normal");
        doc.text(safePayment.numero_factura || "-", 65, 64);

        autoTable(doc, {
          startY: 70,
          head: [['Tratamiento', 'Monto', 'Método de Pago', 'Estado']],
          body: [[
            safePayment.tratamiento,
            new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(safePayment.monto),
            methodLabel,
            safePayment.estado
          ]]
        });

        if (safePayment.notas) {
          doc.setFont("helvetica", "bold");
          doc.text('Notas:', 14, doc.lastAutoTable.finalY + 10);
          doc.setFont("helvetica", "normal");
          doc.text(safePayment.notas, 14, doc.lastAutoTable.finalY + 16);
        }

        if (returnBlob) {
          const pdfBlob = doc.output("blob");
          resolve(pdfBlob);
        } else {
          doc.save(`Factura_${safePayment.numero_factura || 'pago'}.pdf`);
          resolve();
        }
      };

            // Pie de página
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
      
            // Línea divisora
            doc.setDrawColor(0); // color negro
            doc.line(14, pageHeight - 25, 195, pageHeight - 25); // línea horizontal de izquierda a derecha
            
            // Dirección y contacto
            doc.text("Av. Gregorio Méndez No. 2203 Col.Gil y Saenz, Vhsa. Tab.", 14, pageHeight - 18);
            doc.text("3521941 | 993 561 8911 | implaeden.com | implaeden@gmail.com", 14, pageHeight - 12);

      reader.readAsDataURL(blob);
    });
  };

  return generatePDF;
};
