import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { DEFAULT_PROJECTS } from '@/constants';

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching projects:', error);
        // Return default projects if fetch fails
        return DEFAULT_PROJECTS;
      }

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
      }));
    },
  });
};
