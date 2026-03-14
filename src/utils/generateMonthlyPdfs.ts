import JSZip from 'jszip';
import { BookingEvent, EquipmentType, Project } from '@/types';
import { generateBookingPdf } from './generateBookingPdf';

const formatDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export type DownloadProgress = {
  current: number;
  total: number;
  status: 'generating' | 'zipping' | 'done';
};

export const downloadMonthlyPdfs = async (
  events: BookingEvent[],
  equipmentTypes: EquipmentType[],
  projects: Project[],
  monthLabel: string,
  onProgress?: (progress: DownloadProgress) => void,
) => {
  if (events.length === 0) return;

  const zip = new JSZip();
  const total = events.length;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    onProgress?.({ current: i + 1, total, status: 'generating' });
    const doc = await generateBookingPdf(event, equipmentTypes, projects);
    const pdfBlob = doc.output('arraybuffer');
    const safeName = `${event.solicitante}-${formatDate(event.start)}`.replace(/[/\\:]/g, '-');
    zip.file(`${safeName}.pdf`, pdfBlob);
  }

  onProgress?.({ current: total, total, status: 'zipping' });
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agendamentos-${monthLabel}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  onProgress?.({ current: total, total, status: 'done' });
};
