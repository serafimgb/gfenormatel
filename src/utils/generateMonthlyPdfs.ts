import JSZip from 'jszip';
import { BookingEvent, EquipmentType, Project } from '@/types';
import { generateBookingPdf } from './generateBookingPdf';

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const downloadMonthlyPdfs = async (
  events: BookingEvent[],
  equipmentTypes: EquipmentType[],
  projects: Project[],
  monthLabel: string,
) => {
  if (events.length === 0) return;

  const zip = new JSZip();

  for (const event of events) {
    const doc = await generateBookingPdf(event, equipmentTypes, projects);
    const pdfBlob = doc.output('arraybuffer');
    const safeName = `${event.solicitante}-${formatDate(event.start)}`.replace(/[/\\:]/g, '-');
    zip.file(`${safeName}.pdf`, pdfBlob);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agendamentos-${monthLabel}.zip`;
  a.click();
  URL.revokeObjectURL(url);
};
