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
  cancelledBy: row.cancelled_by,
  createdBy: row.created_by,
});

// Convert BookingEvent to database format
const mapToDBFormat = (event: BookingEvent, userId?: string) => ({
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
  created_by: userId,
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
    mutationFn: async ({ event, userId }: { event: BookingEvent; userId?: string }) => {
      const dbData = mapToDBFormat(event, userId);
      
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

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, editedBy, editedByName, previousValues }: {
      id: string;
      updates: Partial<BookingEvent>;
      editedBy?: string;
      editedByName?: string;
      previousValues: Record<string, any>;
    }) => {
      const dbUpdates: Record<string, any> = {};
      if (updates.solicitante !== undefined) dbUpdates.solicitante = updates.solicitante;
      if (updates.carteira !== undefined) dbUpdates.carteira = updates.carteira;
      if (updates.local !== undefined) dbUpdates.local = updates.local;
      if (updates.servicoTipo !== undefined) dbUpdates.servico_tipo = updates.servicoTipo;
      if (updates.start !== undefined) dbUpdates.start_time = updates.start.toISOString();
      if (updates.end !== undefined) dbUpdates.end_time = updates.end.toISOString();
      if (updates.tempoServicoHoras !== undefined) dbUpdates.tempo_servico_horas = updates.tempoServicoHoras;
      if (updates.numeroOm !== undefined) dbUpdates.numero_om = updates.numeroOm;
      if (updates.equipmentType !== undefined) {
        dbUpdates.equipment_type = updates.equipmentType;
        dbUpdates.pemt_id = updates.equipmentType;
      }

      const { error } = await supabase
        .from('bookings')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating booking:', error);
        throw error;
      }

      // Record edit history
      const changes: Record<string, any> = {};
      Object.keys(dbUpdates).forEach(key => {
        changes[key] = dbUpdates[key];
      });

      await supabase.from('booking_edit_history').insert({
        booking_id: id,
        edited_by: editedBy,
        edited_by_name: editedByName,
        changes,
        previous_values: previousValues,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useBookingEditHistory = (bookingId?: string) => {
  return useQuery({
    queryKey: ['booking-edit-history', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];
      const { data, error } = await supabase
        .from('booking_edit_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('edited_at', { ascending: false });

      if (error) {
        console.error('Error fetching edit history:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!bookingId,
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason, cancelledBy }: { id: string; reason: string; cancelledBy: string }) => {
      const { error } = await supabase
        .from('bookings')
        .update({
          is_cancelled: true,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          cancelled_by: cancelledBy,
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
