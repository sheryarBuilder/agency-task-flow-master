import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'team_lead' | 'team_member' | 'client';
  avatar_url: string | null;
  email: string;
  bio: string | null;
  skills: string[] | null;
  tasks_completed: number;
  tasks_in_progress: number;
  workload: number;
  organization_id: string | null;
}

export const useTeam = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !currentUserProfile) {
        console.error('Error fetching current user profile:', profileError);
        setTeamMembers([]);
        return;
      }

      const organizationId = currentUserProfile.organization_id;

      if (!organizationId) {
        console.error('User does not have an organization_id');
        setTeamMembers([]);
        return;
      }

      const { data: teamData, error: teamError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .neq('id', user.id);

      if (teamError) {
        console.error('Error fetching team members:', teamError);
        setTeamMembers([]);
        return;
      }

      const membersWithStats = await Promise.all(
        (teamData || []).map(async (member) => {
          const { data: completedTasks } = await supabase
              .from('tasks')
              .select('id', { count: 'exact' })
              .eq('assignee_id', member.id)
              .eq('status', 'completed');

          const { data: inProgressTasks, error } = await supabase
            .from('tasks')
            .select('id', { count: 'exact' })
            .eq('assignee_id', member.id)
            .in('status', ['todo', 'in-progress', 'review']);
            
          const tasksCompleted = completedTasks?.length || 0;
          const tasksInProgress = inProgressTasks?.length || 0;
          const workload = Math.min(100, Math.max(0, (tasksInProgress * 15) + (Math.random() * 30)));

          return {
            ...member,
            tasks_completed: tasksCompleted,
            tasks_in_progress: tasksInProgress,
            workload: Math.round(workload),
          };
        })
      );
      
      setTeamMembers(membersWithStats);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user?.id]);

  return { teamMembers, loading, refetch: fetchTeamMembers };
};

