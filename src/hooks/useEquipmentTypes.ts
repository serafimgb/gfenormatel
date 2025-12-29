import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EquipmentType } from '@/types';
import { DEFAULT_EQUIPMENT_TYPES } from '@/constants';

export const useEquipmentTypes = () => {
  return useQuery({
    queryKey: ['equipment_types'],
    queryFn: async (): Promise<EquipmentType[]> => {
      const { data, error } = await supabase
        .from('equipment_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching equipment types:', error);
        // Return default equipment types if fetch fails
        return DEFAULT_EQUIPMENT_TYPES;
      }

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        color: row.color,
        icon: row.icon,
      }));
    },
  });
};
