import { Injectable } from '@angular/core';
import { asyncScheduler, Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Formula } from '../models/formula.model';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private revokeSubscriptions: Subscription[] = [];

  constructor() {}

  /**
   * Genera un PDF de fórmula optométrica con diseño exacto de la imagen
   * @param formula - Datos de la fórmula médica
   * @param descargar - Si es true, descarga directamente sin previsualización
   */
  async generarFormulaPDF(
    formula: Formula,
    descargar: boolean = false
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    // const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let currentY = 12;

    // ============ BORDE EXTERIOR ============
    // doc.setDrawColor(0, 0, 0);
    // doc.setLineWidth(0.8);
    // doc.rect(margin, currentY, pageWidth - 2 * margin, pageHeight - 2 * margin);

    currentY += 5;

    // ============ ENCABEZADO - 3 COLUMNAS ============
    const headerY = currentY;
    const col1Width = 60;
    const col3Width = 60;

    // Columna 1: Logo (espacio para logo)
    // doc.setFontSize(12);
    // doc.setFont('helvetica', 'bold');
    // doc.text('[LOGO]', margin + 15, headerY + 12);

    const logoBase64 = await this.getBase64Image(
      '/assets/images/logo_large.png'
    );
    doc.addImage(logoBase64, 'PNG', margin + 5, headerY + 2, 48, 25);

    // Línea vertical 1
    doc.line(margin + col1Width, headerY, margin + col1Width, headerY + 30);

    // Columna 2: Información de la Óptica (CENTRO)
    const col2X = margin + col1Width + 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ÓPTICA OH MY GLASSES', col2X, headerY + 5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('NIT: 123456789-0', col2X, headerY + 9);
    doc.text('Calle XX # XX - XX', col2X, headerY + 13);
    doc.text('Tel: 3113966060', col2X, headerY + 17);
    doc.text('Email: contacto@ohmyglasses.com', col2X, headerY + 21);
    doc.text('Registro Médico: 1005411977', col2X, headerY + 25);

    // Línea vertical 2
    doc.line(
      pageWidth - margin - col3Width,
      headerY,
      pageWidth - margin - col3Width,
      headerY + 30
    );

    // Columna 3: Título y Fecha (DERECHA)
    const titleX = pageWidth - margin - col3Width + 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('FÓRMULA DE LENTES', titleX, headerY + 10);
    doc.text('OFTÁLMICOS', titleX + 8, headerY + 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatearFecha(formula.created_at), titleX + 8, headerY + 24);

    // Línea horizontal debajo del encabezado
    currentY = headerY + 30;
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2;

    // ============ INFORMACIÓN DEL PACIENTE (4 FILAS) ============
    const infoY = currentY;
    const rowHeight = 5;

    doc.setFontSize(8);
    doc.setLineWidth(0.3);

    // FILA 1: Identificación | Edad | Nombre
    let y = infoY;
    doc.setFont('helvetica', 'bold');
    doc.text('Identificación:', margin + 2, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.identificacion || '', margin + 24, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Edad:', margin + 75, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(String(formula.edad || ''), margin + 88, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Nombre:', margin + 135, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.nombres || '', margin + 150, y + 5);

    // FILA 2: Dirección | Teléfono | Afiliación
    y += rowHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Dirección:', margin + 7.3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.direccion || '', margin + 24, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Diagnóstico:', margin + 129.5, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.diagnostico || '', margin + 150, y + 5);

    // FILA 3: Afiliación | Régimen
    y += rowHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Teléfono:', margin + 8.4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.telefono || '', margin + 24, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Relac. 1:', margin + 135, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.diagnostico_relacion_1 || '', margin + 150, y + 5);

    // FILA 4: Diagnóstico | Relac. 1, 2, 3
    y += rowHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Afiliación:', margin + 7.4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.afiliacion || '', margin + 24, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Relac. 2:', margin + 135, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.diagnostico_relacion_2 || '', margin + 150, y + 5);

    // FILA 5: Relac. 3
    y += rowHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('Régimen:', margin + 8.2, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.regimen || '', margin + 24, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text('Relac. 3:', margin + 135, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.diagnostico_relacion_3 || '', margin + 150, y + 5);

    currentY = y + rowHeight + 2;

    // ============ TABLA OPTOMÉTRICA ============
    const tableWidth = pageWidth - 2 * margin;

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          '',
          'ESFERA',
          'CILINDRO',
          'EJE',
          'ADICIÓN',
          'PRISMA BASE',
          'GRADOS',
          'AV LEJOS',
          'AV CERCA',
        ],
      ],
      body: [
        [
          'OD',
          formula.od_esfera || '',
          formula.od_cilindro || '',
          formula.od_eje || '',
          formula.od_adicion || '',
          formula.od_prisma_base || '',
          formula.od_grados || '',
          formula.od_av_lejos || '',
          formula.od_av_cerca || '',
        ],
        [
          'OI',
          formula.oi_esfera || '',
          formula.oi_cilindro || '',
          formula.oi_eje || '',
          formula.oi_adicion || '',
          formula.oi_prisma_base || '',
          formula.oi_grados || '',
          formula.oi_av_lejos || '',
          formula.oi_av_cerca || '',
        ],
      ],
      theme: 'grid',
      styles: {
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 1.5,
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'center',
        cellPadding: 2,
      },
      columnStyles: {
        0: {
          fontStyle: 'bold',
          fillColor: [230, 230, 230],
          halign: 'center',
          cellWidth: tableWidth * 0.08, // 8%
        },
        1: { cellWidth: tableWidth * 0.115 }, // 11.5%
        2: { cellWidth: tableWidth * 0.115 }, // 11.5%
        3: { cellWidth: tableWidth * 0.08 }, // 8%
        4: { cellWidth: tableWidth * 0.115 }, // 11.5%
        5: { cellWidth: tableWidth * 0.14 }, // 14%
        6: { cellWidth: tableWidth * 0.1 }, // 10%
        7: { cellWidth: tableWidth * 0.1275 }, // 12.75%
        8: { cellWidth: tableWidth * 0.1275 }, // 12.75%
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    });

    currentY = (doc as any).lastAutoTable.finalY;
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // ============ FILA 4: TIPO LENTES, DETALLE, ALTURA ============
    const row4Y = currentY;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo Lentes:', margin + 2, row4Y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.tipo_lentes || '', margin + 22, row4Y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Detalle:', margin + 70, row4Y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.tipo_lentes_detalle || '', margin + 84, row4Y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Altura:', margin + 130, row4Y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.altura || '', margin + 144, row4Y + 4);

    // Columna derecha: TOMAR CENTROS ÓPTICOS
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth('TOMAR CENTROS');
    doc.text('TOMAR CENTROS', pageWidth - margin - textWidth - 2, row4Y + 3.5);
    doc.text('ÓPTICOS', pageWidth - margin - textWidth + 5, row4Y + 7.5);

    doc.line(margin, row4Y + 6, pageWidth - margin - 35, row4Y + 6);
    doc.line(
      pageWidth - margin - 35,
      currentY,
      pageWidth - margin - 35,
      row4Y + 6
    );

    // ============ FILA 5: COLOR, TTOS, DP ============
    const row5Y = row4Y + 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Color y ttos:', margin + 2, row5Y + 4);
    doc.setFont('helvetica', 'normal');
    const colorTtos = [formula.color, formula.tratamientos]
      .filter((x) => x)
      .join(', ');
    doc.text(colorTtos, margin + 22, row5Y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Dp:', margin + 134.5, row5Y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.dp || '', margin + 144.5, row5Y + 4);

    doc.line(margin, row5Y + 6, pageWidth - margin, row5Y + 6);

    // ============ FILA 6: USO DISPOSITIVO, CONTROL, DURACIÓN ============
    const row6Y = row5Y + 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Uso dispositivo', margin + 2, row6Y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.uso_dispositivo || '', margin + 28, row6Y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Control:', margin + 70, row6Y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.control || '', margin + 84, row6Y + 4);

    doc.setFont('helvetica', 'bold');
    doc.text('Duración tto:', margin + 125, row6Y + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(formula.duracion_tratamiento || '', margin + 148, row6Y + 4);

    doc.line(margin, row6Y + 6, pageWidth - margin, row6Y + 6);

    // ============ OBSERVACIONES ============
    const row7Y = row6Y + 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Observacion:', margin + 2, row7Y + 4);
    doc.setFont('helvetica', 'normal');
    if (formula.observaciones) {
      const obsLines = doc.splitTextToSize(
        formula.observaciones,
        pageWidth - margin - 40
      );
      doc.text(obsLines, margin + 24, row7Y + 4);
    }

    currentY = row7Y + 12;
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // ============ PIE DE PÁGINA - OPTÓMETRA ============
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const optometraX = pageWidth / 2;
    doc.text('Optómetra:', optometraX - 40, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('_______________________________', optometraX - 20, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Reg Médico:', optometraX - 40, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('_______________________________', optometraX - 20, currentY);

    // ============ GUARDAR O PREVISUALIZAR PDF ============
    if (descargar) {
      // Descargar directamente
      const nombreArchivo = `Formula_${formula.numero_formula || 'SN'}_${
        formula.identificacion
      }.pdf`;
      doc.save(nombreArchivo);
    } else {
      // Abrir en nueva pestaña para previsualización
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

      // Liberar memoria después de un tiempo
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    }
  }

  /**
   * Descarga directamente el PDF sin previsualización
   */
  descargarFormulaPDF(formula: Formula): void {
    this.generarFormulaPDF(formula, true);
  }

  /**
   * Formatea fecha en formato DD/MM/YYYY
   */
  private formatearFecha(fecha?: string): string {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getBase64Image(path: string): Promise<string> {
    return fetch(path)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob); // ← convierte a base64 automáticamente
          })
      );
  }
}
