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

    // QR del portal de autofacturación. Va como PNG y no como el SVG original
    // (public/qr-autofactura.svg) porque jsPDF no sabe dibujar SVG.
    // Si falla la carga, el recibo se genera igual: el link de texto sigue ahí.
    const leerComoDataUrl = (b) =>
      new Promise((res, rej) => {
        const r = new FileReader();
        r.onloadend = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(b);
      });

    let qrDataUrl = null;
    try {
      const qrResp = await fetch('/qr-autofactura.png');
      if (qrResp.ok) qrDataUrl = await leerComoDataUrl(await qrResp.blob());
    } catch (err) {
      console.warn('No se pudo cargar el QR de autofacturación:', err);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imgData = reader.result;

        doc.addImage(imgData, 'PNG', 14, 10, 60, 20);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Recibo de pago", 14, 40);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const nombrePaciente =
          [safePatient?.nombre, safePatient?.apellidos].filter(Boolean).join(' ').trim() ||
          [safePayment?.paciente_nombre, safePayment?.paciente_apellidos].filter(Boolean).join(' ').trim() ||
          safePatient?.nombre_completo ||
          safePatient?.name ||
          'Paciente';
        doc.text("Paciente:", 14, 50);
        doc.setFont("helvetica", "normal");
        doc.text(nombrePaciente, 45, 50);

        doc.setFont("helvetica", "bold");
        doc.text("Fecha:", 14, 57);
        doc.setFont("helvetica", "normal");
        const [y, m, d] = new Date(safePayment.fecha).toISOString().slice(0, 10).split("-");
        doc.text(`${d}/${m}/${y}`, 45, 57);


        doc.setFont("helvetica", "bold");
        doc.text("Folio para facturar:", 14, 64);
        doc.setFont("helvetica", "normal");
        doc.text(String(safePayment.autofac_folio || safePayment.id || "-"), 65, 64);

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

        // Servicios dentales (persona física, servicios médicos) = IVA EXENTO.
        const money = (n) =>
          new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
        const total = Number(safePayment.monto || 0);

        let ty = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', 130, ty);
        doc.text(money(total), 195, ty, { align: 'right' });
        ty += 6;
        doc.text('IVA (Exento):', 130, ty);
        doc.text(money(0), 195, ty, { align: 'right' });
        ty += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 130, ty);
        doc.text(money(total), 195, ty, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        // Bloque de autofacturación: resaltado, con el LINK clickeable.
        const PORTAL = 'https://autofacturacion.factura.com/697d1db74f793';
        const folio = String(safePayment.autofac_folio || safePayment.id || '');
        const [fy, fm, fd] = new Date(safePayment.fecha).toISOString().slice(0, 10).split('-');
        let ay = ty + 16;

        // Layout: textos a la izquierda, QR a la derecha dentro de la misma caja.
        const QR_LADO = 24;             // mm
        const QR_X = 195 - 6 - QR_LADO; // 6 mm de aire contra el borde derecho
        const CAJA_ALTO = qrDataUrl ? 35 : 27; // sin QR, la caja conserva su alto

        // Caja azul clara
        doc.setDrawColor(37, 99, 235);
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(14, ay - 6, 181, CAJA_ALTO, 2, 2, 'FD');

        doc.setTextColor(30, 58, 138);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('¿Necesitas factura? Autofactúrala aquí:', 18, ay);

        // Link clickeable (azul, subrayado visual)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.textWithLink(PORTAL, 18, ay + 7, { url: PORTAL });
        const linkWidth = doc.getTextWidth(PORTAL);
        doc.setDrawColor(37, 99, 235);
        doc.line(18, ay + 8.2, 18 + linkWidth, ay + 8.2);

        // Datos que teclea el paciente. A 9 pt para que no se metan debajo del QR.
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Folio: ${folio}      Fecha: ${fd}/${fm}/${fy}      Total: ${money(total)}`, 18, ay + 14);

        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', QR_X, ay - 2, QR_LADO, QR_LADO);

          // Leyenda centrada bajo el QR.
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 58, 138);
          doc.text('Genera tu factura', QR_X + QR_LADO / 2, ay + QR_LADO + 2.5, {
            align: 'center',
          });
        }

        // reset
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        ay += CAJA_ALTO - 3;

        if (safePayment.notas) {
          doc.setFont("helvetica", "bold");
          doc.text('Notas:', 14, ay + 6);
          doc.setFont("helvetica", "normal");
          doc.text(String(safePayment.notas), 14, ay + 12);
        }

        if (returnBlob) {
          const pdfBlob = doc.output("blob");
          resolve(pdfBlob);
        } else {
          doc.save(`Recibo_${safePayment.numero_factura || 'pago'}.pdf`);
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
