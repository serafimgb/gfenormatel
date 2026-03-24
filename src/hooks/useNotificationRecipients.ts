import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationRecipient {
  id: string;
  name: string;
  email: string;
  type: 'carteira' | 'gestao';
  carteira: string | null;
  project_id: string | null;
  created_at: string;
}

export const useNotificationRecipients = () => {
  return useQuery({
    queryKey: ['notification-recipients'],
    queryFn: async (): Promise<NotificationRecipient[]> => {
      const { data, error } = await supabase
        .from('notification_recipients')
        .select('*')
        .order('type', { ascending: true })
        .order('carteira', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching notification recipients:', error);
        throw error;
      }

      return (data || []) as NotificationRecipient[];
    },
  });
};

export const useAddRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (recipient: { name: string; email: string; type: 'carteira' | 'gestao'; carteira: string | null }) => {
      const { error } = await supabase
        .from('notification_recipients')
        .insert(recipient);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-recipients'] });
    },
  });
};

export const useDeleteRecipient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_recipients')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-recipients'] });
    },
  });
};
