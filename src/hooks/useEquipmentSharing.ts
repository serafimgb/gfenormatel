import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EquipmentSharingRecord {
  id: string;
  source_project_id: string;
  equipment_type_id: string;
  target_project_id: string;
}

export const useEquipmentSharing = () => {
  return useQuery({
    queryKey: ['equipment_sharing'],
    queryFn: async (): Promise<EquipmentSharingRecord[]> => {
      const { data, error } = await supabase
        .from('equipment_sharing')
        .select('*');
      if (error) throw error;
      return (data || []) as EquipmentSharingRecord[];
    },
  });
};

export const useToggleEquipmentSharing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceProjectId,
      equipmentTypeId,
      targetProjectId,
      isCurrentlyShared,
    }: {
      sourceProjectId: string;
      equipmentTypeId: string;
      targetProjectId: string;
      isCurrentlyShared: boolean;
    }) => {
      if (isCurrentlyShared) {
        // Remove both directions
        const { error: err1 } = await supabase
          .from('equipment_sharing')
          .delete()
          .eq('source_project_id', sourceProjectId)
          .eq('equipment_type_id', equipmentTypeId)
          .eq('target_project_id', targetProjectId);
        if (err1) throw err1;
        const { error: err2 } = await supabase
          .from('equipment_sharing')
          .delete()
          .eq('source_project_id', targetProjectId)
          .eq('equipment_type_id', equipmentTypeId)
          .eq('target_project_id', sourceProjectId);
        if (err2) throw err2;
      } else {
        // Insert both directions
        const { error } = await supabase
          .from('equipment_sharing')
          .insert([
            {
              source_project_id: sourceProjectId,
              equipment_type_id: equipmentTypeId,
              target_project_id: targetProjectId,
            },
            {
              source_project_id: targetProjectId,
              equipment_type_id: equipmentTypeId,
              target_project_id: sourceProjectId,
            },
          ] as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment_sharing'] });
    },
  });
};
