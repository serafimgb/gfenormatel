import jsPDF from 'jspdf';
import { BookingEvent, EquipmentType, Project } from '@/types';

const NORMATEL_GREEN = [30, 120, 50];
const NORMATEL_DARK = [20, 80, 35];

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const generateBookingPdf = async (
  event: BookingEvent,
  equipmentTypes: EquipmentType[],
  projects: Project[],
): Promise<jsPDF> => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Load logo
  let logoImg: string | null = null;
  try {
    const response = await fetch('/imgs/logo.png');
    const blob = await response.blob();
    logoImg = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Logo not available
  }

  // Header background
  doc.setFillColor(NORMATEL_GREEN[0], NORMATEL_GREEN[1], NORMATEL_GREEN[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Gradient overlay
  doc.setFillColor(NORMATEL_DARK[0], NORMATEL_DARK[1], NORMATEL_DARK[2]);
  doc.rect(0, 30, pageWidth, 10, 'F');

  // Logo
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', 10, 5, 20, 20);
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('NORMATEL', 35, 16);

  doc.setFontSize(8);
  doc.text('GFE - GESTÃO DE FROTA ESPECIAL', 35, 23);

  // Document label
  doc.setFontSize(10);
  doc.text('COMPROVANTE DE AGENDAMENTO', pageWidth / 2, 37, { align: 'center' });

  // Content
  let y = 52;
  const equipName = equipmentTypes.find(e => e.id === event.equipmentType)?.name || event.equipmentType;
  const projectName = projects.find(p => p.id === event.projectId)?.name || event.projectId;

  const fields = [
    ['Projeto', projectName],
    ['Equipamento', equipName],
    ['PEMT ID', event.pemtId],
    ['Solicitante', event.solicitante],
    ['Carteira', event.carteira],
    ['Local', event.local],
    ['Tipo de Serviço', event.servicoTipo],
    ['Nº OM', event.numeroOm || '-'],
    ['Data Início', `${formatDate(event.start)} às ${formatTime(event.start)}`],
    ['Data Fim', `${formatDate(event.end)} às ${formatTime(event.end)}`],
    ['Tempo de Serviço', `${event.tempoServicoHoras}h`],
  ];

  if (event.descricao) {
    fields.push(['Descrição', event.descricao]);
  }

  if (event.isCancelled) {
    fields.push(
      ['Status', '❌ CANCELADO'],
      ['Cancelado por', event.cancelledBy || '-'],
      ['Motivo', event.cancellationReason || '-'],
    );
  }

  fields.forEach(([label, value], i) => {
    const bgColor = i % 2 === 0 ? [245, 245, 245] : [255, 255, 255];
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(15, y - 4, pageWidth - 30, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(label, 20, y + 2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), 80, y + 2);

    y += 10;
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFillColor(NORMATEL_GREEN[0], NORMATEL_GREEN[1], NORMATEL_GREEN[2]);
  doc.rect(0, footerY - 5, pageWidth, 20, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`Gerado em ${formatDate(new Date())} às ${formatTime(new Date())} | GFE Normatel`, pageWidth / 2, footerY + 2, { align: 'center' });

  return doc;
};

export const downloadBookingPdf = async (
  event: BookingEvent,
  equipmentTypes: EquipmentType[],
  projects: Project[],
) => {
  const doc = await generateBookingPdf(event, equipmentTypes, projects);
  doc.save(`agendamento-${event.solicitante}-${formatDate(event.start)}.pdf`);
};
