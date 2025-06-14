
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
      console.log('No user found, skipping team fetch');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log('=== STARTING TEAM FETCH ===');
    console.log('Current user ID:', user.id);
    
    try {
      // Get current user's profile with organization_id
      console.log('Fetching current user profile...');
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, role, email')
        .eq('id', user.id)
        .single();

      console.log('Current user profile:', currentUserProfile);
      console.log('Profile fetch error:', profileError);

      if (profileError) {
        console.error('Error fetching current user profile:', profileError);
        setTeamMembers([]);
        return;
      }

      if (!currentUserProfile) {
        console.error('No profile found for current user');
        setTeamMembers([]);
        return;
      }

      const organizationId = currentUserProfile.organization_id;
      console.log('Organization ID:', organizationId);

      if (!organizationId) {
        console.error('User does not have an organization_id');
        setTeamMembers([]);
        return;
      }

      // Fetch all team members from the same organization
      console.log('Fetching team members for organization:', organizationId);
      const { data: teamData, error: teamError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId);

      console.log('Team data raw:', teamData);
      console.log('Team fetch error:', teamError);

      if (teamError) {
        console.error('Error fetching team members:', teamError);
        setTeamMembers([]);
        return;
      }

      if (!teamData || teamData.length === 0) {
        console.log('No team members found');
        setTeamMembers([]);
        return;
      }

      console.log('Found team members:', teamData.length);

      // Calculate stats for each team member
      const membersWithStats = await Promise.all(
        teamData.map(async (member) => {
          console.log(`Processing member: ${member.email}`);
          
          // Get completed tasks
          const { data: completedTasks, error: completedError } = await supabase
            .from('tasks')
            .select('id', { count: 'exact' })
            .eq('assignee_id', member.id)
            .eq('status', 'completed');

          if (completedError) {
            console.error(`Error fetching completed tasks for ${member.email}:`, completedError);
          }

          // Get in-progress tasks
          const { data: inProgressTasks, error: progressError } = await supabase
            .from('tasks')
            .select('id', { count: 'exact' })
            .eq('assignee_id', member.id)
            .in('status', ['todo', 'in-progress', 'review']);

          if (progressError) {
            console.error(`Error fetching in-progress tasks for ${member.email}:`, progressError);
          }
            
          const tasksCompleted = completedTasks?.length || 0;
          const tasksInProgress = inProgressTasks?.length || 0;
          const workload = Math.min(100, Math.max(0, (tasksInProgress * 15) + (Math.random() * 30)));

          console.log(`Stats for member ${member.email}:`, {
            tasksCompleted,
            tasksInProgress,
            workload: Math.round(workload)
          });

          return {
            ...member,
            tasks_completed: tasksCompleted,
            tasks_in_progress: tasksInProgress,
            workload: Math.round(workload),
          };
        })
      );

      console.log('=== FINAL RESULT ===');
      console.log('Final team members with stats:', membersWithStats);
      console.log('Total team members to display:', membersWithStats.length);
      
      setTeamMembers(membersWithStats);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useTeam effect triggered, user:', user?.id);
    if (user) {
      fetchTeamMembers();
    }

    // Set up realtime subscription for profile changes
    const channel = supabase
      .channel('team-profiles-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Profile change detected:', payload);
          // Refetch team members when profiles change
          if (user) {
            fetchTeamMembers();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up team subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { teamMembers, loading, refetch: fetchTeamMembers };
};
