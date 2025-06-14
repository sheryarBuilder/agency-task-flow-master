
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
    
    try {
      console.log('=== DEBUGGING TEAM FETCH ===');
      console.log('Current user ID:', user.id);
      console.log('Current user email:', user.email);
      
      // First, let's see ALL profiles in the database
      const { data: allProfiles, error: allError } = await supabase
        .from('profiles')
        .select('*');
      
      console.log('=== ALL PROFILES IN DATABASE ===');
      console.log('Total profiles found:', allProfiles?.length || 0);
      console.log('All profiles:', allProfiles);
      if (allError) console.error('Error fetching all profiles:', allError);

      // Get current user's profile
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('=== CURRENT USER PROFILE ===');
      console.log('Current user profile:', currentUserProfile);
      if (profileError) console.error('Profile fetch error:', profileError);

      if (!currentUserProfile) {
        console.error('No profile found for current user');
        setLoading(false);
        return;
      }

      // For now, let's get ALL other profiles (not just by organization)
      // to see if the organization filtering is the issue
      const { data: allOtherProfiles, error: allOthersError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      console.log('=== ALL OTHER PROFILES (excluding current user) ===');
      console.log('Other profiles count:', allOtherProfiles?.length || 0);
      console.log('Other profiles:', allOtherProfiles);
      if (allOthersError) console.error('Error fetching other profiles:', allOthersError);

      // Now try organization-based filtering
      const organizationId = currentUserProfile.organization_id;
      console.log('=== ORGANIZATION FILTERING ===');
      console.log('Current user organization_id:', organizationId);

      let teamData = [];
      
      if (organizationId) {
        // Try to fetch by organization
        const { data: orgTeamData, error: orgError } = await supabase
          .from('profiles')
          .select('*')
          .eq('organization_id', organizationId)
          .neq('id', user.id);

        console.log('Org-based team query result:', orgTeamData);
        console.log('Org-based team query error:', orgError);
        teamData = orgTeamData || [];
      } else {
        console.log('No organization_id found, using all other profiles');
        teamData = allOtherProfiles || [];
      }

      console.log('=== FINAL TEAM DATA ===');
      console.log('Final team data:', teamData);
      console.log('Team members count:', teamData.length);

      // Get task counts for each team member
      const membersWithStats = await Promise.all(
        teamData.map(async (member) => {
          try {
            const { data: completedTasks } = await supabase
              .from('tasks')
              .select('id')
              .eq('assignee_id', member.id)
              .eq('status', 'completed');

            const { data: inProgressTasks } = await supabase
              .from('tasks')
              .select('id')
              .eq('assignee_id', member.id)
              .in('status', ['todo', 'in-progress', 'review']);

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
          } catch (taskError) {
            console.error('Error fetching tasks for member:', member.id, taskError);
            return {
              ...member,
              tasks_completed: 0,
              tasks_in_progress: 0,
              workload: 0,
            };
          }
        })
      );

      console.log('=== FINAL RESULT ===');
      console.log('Final team members with stats:', membersWithStats);
      console.log('Total team members to display:', membersWithStats.length);
      
      setTeamMembers(membersWithStats);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('useTeam: User found, fetching team members');
      fetchTeamMembers();
    } else {
      console.log('useTeam: No user, setting loading to false');
      setLoading(false);
    }
  }, [user?.id]);

  return { teamMembers, loading, refetch: fetchTeamMembers };
};
