import { supabase } from '@/integrations/supabase/client';
import { BookingEvent, EquipmentType, Project } from '@/types';

interface NotificationBookingData {
  solicitante: string;
  carteira: string;
  local: string;
  servicoTipo: string;
  equipmentType: string;
  equipmentName?: string;
  start: string;
  end: string;
  tempoServicoHoras: number;
  projectName?: string;
  numeroOm?: string;
  cancellationReason?: string;
  cancelledBy?: string;
}

export async function sendBookingNotification(
  type: 'created' | 'cancelled',
  event: BookingEvent,
  options?: {
    equipmentTypes?: EquipmentType[];
    projects?: Project[];
    cancellationReason?: string;
    cancelledBy?: string;
  }
) {
  try {
    const equipmentName = options?.equipmentTypes?.find(eq => eq.id === event.equipmentType)?.name;
    const projectName = options?.projects?.find(p => p.id === event.projectId)?.name;

    const booking: NotificationBookingData = {
      solicitante: event.solicitante,
      carteira: event.carteira,
      local: event.local,
      servicoTipo: event.servicoTipo,
      equipmentType: event.equipmentType,
      equipmentName,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      tempoServicoHoras: event.tempoServicoHoras,
      projectName,
      numeroOm: event.numeroOm,
      cancellationReason: options?.cancellationReason,
      cancelledBy: options?.cancelledBy,
    };

    const { error } = await supabase.functions.invoke('send-booking-notification', {
      body: { type, booking },
    });

    if (error) {
      console.error('Error sending notification:', error);
    }
  } catch (err) {
    // Don't block the main flow if notification fails
    console.error('Failed to send booking notification:', err);
  }
}
