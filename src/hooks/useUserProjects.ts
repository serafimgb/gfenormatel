import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserProjects = () => {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['user-projects', user?.id, isAdmin],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];

      // Admins see all projects
      if (isAdmin) {
        const { data } = await supabase.from('projects').select('id');
        return (data || []).map(p => p.id);
      }

      const { data, error } = await supabase
        .from('user_projects')
        .select('project_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user projects:', error);
        return [];
      }

      return (data || []).map(r => r.project_id);
    },
    enabled: !!user,
  });
};
