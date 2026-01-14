import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookingEvent } from '@/types';

// Convert database row to BookingEvent
const mapToBookingEvent = (row: any): BookingEvent => ({
  id: row.id,
  pemtId: row.pemt_id,
  equipmentType: row.equipment_type || 'PEMT',
  projectId: row.project_id || '743',
  solicitante: row.solicitante,
  carteira: row.carteira,
  local: row.local,
  servicoTipo: row.servico_tipo,
  start: new Date(row.start_time),
  end: new Date(row.end_time),
  tempoServicoHoras: Number(row.tempo_servico_horas),
  descricao: row.descricao,
  isCancelled: row.is_cancelled || false,
  cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
  cancellationReason: row.cancellation_reason,
});

// Hook to fetch bookings from OTHER projects (not the current one)
export const useOtherProjectBookings = (currentProjectId: string) => {
  return useQuery({
    queryKey: ['bookings', 'other', currentProjectId],
    queryFn: async (): Promise<BookingEvent[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .neq('project_id', currentProjectId)
        .eq('is_cancelled', false)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching other project bookings:', error);
        throw error;
      }

      return (data || []).map(mapToBookingEvent);
    },
  });
};

// Helper to check if two time ranges overlap
export const doTimesOverlap = (
  start1: Date, 
  end1: Date, 
  start2: Date, 
  end2: Date
): boolean => {
  return start1 < end2 && end1 > start2;
};

// Find overlapping events from other projects for the same equipment
export const findOverlappingEvents = (
  event: BookingEvent,
  otherProjectEvents: BookingEvent[]
): BookingEvent[] => {
  return otherProjectEvents.filter(other => 
    other.equipmentType === event.equipmentType &&
    doTimesOverlap(event.start, event.end, other.start, other.end)
  );
};
