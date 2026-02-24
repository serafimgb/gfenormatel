import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  numeroOm: row.numero_om || '',
  descricao: row.descricao,
  isCancelled: row.is_cancelled || false,
  cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
  cancellationReason: row.cancellation_reason,
});

// Convert BookingEvent to database format
const mapToDBFormat = (event: BookingEvent) => ({
  pemt_id: event.pemtId,
  equipment_type: event.equipmentType,
  project_id: event.projectId,
  solicitante: event.solicitante,
  carteira: event.carteira,
  local: event.local,
  servico_tipo: event.servicoTipo,
  start_time: event.start.toISOString(),
  end_time: event.end.toISOString(),
  tempo_servico_horas: event.tempoServicoHoras,
  numero_om: event.numeroOm,
  descricao: event.descricao,
});

export const useBookings = (projectId?: string) => {
  return useQuery({
    queryKey: ['bookings', projectId],
    queryFn: async (): Promise<BookingEvent[]> => {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('start_time', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }

      return (data || []).map(mapToBookingEvent);
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: BookingEvent) => {
      const dbData = mapToDBFormat(event);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        throw error;
      }

      return mapToBookingEvent(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useDeleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting booking:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useCheckConflict = () => {
  return async (pemtId: string, equipmentType: string, projectId: string, start: Date, end: Date, excludeId?: string, isExclusive?: boolean): Promise<{ hasConflict: boolean; conflictProjectId?: string }> => {
    let query = supabase
      .from('bookings')
      .select('id, project_id')
      .eq('equipment_type', equipmentType)
      .eq('is_cancelled', false)
      .lt('start_time', end.toISOString())
      .gt('end_time', start.toISOString());

    // For exclusive equipment, check ALL projects; otherwise only current project
    if (!isExclusive) {
      query = query.eq('project_id', projectId);
    }

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking conflict:', error);
      throw error;
    }

    if ((data?.length || 0) > 0) {
      const conflictProjectId = data?.[0]?.project_id;
      return { hasConflict: true, conflictProjectId };
    }
    return { hasConflict: false };
  };
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', id);

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
