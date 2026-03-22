import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectEquipment {
  id: string;
  project_id: string;
  equipment_type_id: string;
}

export const useProjectEquipment = (projectId?: string) => {
  return useQuery({
    queryKey: ['project_equipment', projectId],
    queryFn: async (): Promise<ProjectEquipment[]> => {
      let query = supabase.from('project_equipment').select('*');
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching project equipment:', error);
        throw error;
      }
      return (data || []) as ProjectEquipment[];
    },
  });
};

export const useAllProjectEquipment = () => {
  return useQuery({
    queryKey: ['project_equipment'],
    queryFn: async (): Promise<ProjectEquipment[]> => {
      const { data, error } = await supabase.from('project_equipment').select('*');
      if (error) {
        console.error('Error fetching all project equipment:', error);
        throw error;
      }
      return (data || []) as ProjectEquipment[];
    },
  });
};

export const useToggleProjectEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, equipmentTypeId, assigned }: { projectId: string; equipmentTypeId: string; assigned: boolean }) => {
      if (assigned) {
        // Remove
        const { error } = await supabase
          .from('project_equipment')
          .delete()
          .eq('project_id', projectId)
          .eq('equipment_type_id', equipmentTypeId);
        if (error) throw error;
      } else {
        // Add
        const { error } = await supabase
          .from('project_equipment')
          .insert({ project_id: projectId, equipment_type_id: equipmentTypeId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_equipment'] });
    },
  });
};
