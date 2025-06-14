import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useActivity } from '@/hooks/useActivity';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AppDataContextType {
  // Tasks data
  tasks: any[];
  tasksLoading: boolean;
  refreshTasks: () => Promise<void>;
  
  // Team data
  teamMembers: any[];
  teamLoading: boolean;
  refreshTeam: () => Promise<void>;
  
  // Activity data
  activities: any[];
  activitiesLoading: boolean;
  refreshActivities: () => Promise<void>;
  
  // Global refresh
  refreshAll: () => Promise<void>;
  
  // Analytics data
  analytics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionTime: number;
    tasksByPlatform: Record<string, number>;
    tasksByPriority: Record<string, number>;
    teamProductivity: Array<{ memberId: string; name: string; completedTasks: number; efficiency: number }>;
    weeklyProgress: Array<{ week: string; completed: number; created: number }>;
  };
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, refetch: refreshTasks } = useTasks();
  const { teamMembers, loading: teamLoading, refetch: refreshTeam } = useTeam();
  const { activities, loading: activitiesLoading, refetch: refreshActivities } = useActivity();
  
  const [analytics, setAnalytics] = useState<AppDataContextType['analytics']>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    averageCompletionTime: 0,
    tasksByPlatform: {},
    tasksByPriority: {},
    teamProductivity: [],
    weeklyProgress: []
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Realtime change received!', payload);
          refreshTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshTasks]);

  // Calculate analytics whenever tasks or team data changes
  useEffect(() => {
    if (!tasks.length) return;

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const overdueTasks = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < now && task.status !== 'completed'
    ).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate average completion time
    const completedTasksWithDates = tasks.filter(task => 
      task.status === 'completed' && task.created_at && task.completed_at
    );
    const averageCompletionTime = completedTasksWithDates.length > 0 
      ? completedTasksWithDates.reduce((acc, task) => {
          const created = new Date(task.created_at);
          const completed = new Date(task.completed_at);
          return acc + (completed.getTime() - created.getTime());
        }, 0) / completedTasksWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Tasks by platform
    const tasksByPlatform = tasks.reduce((acc, task) => {
      const platform = task.platform || 'general';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Tasks by priority
    const tasksByPriority = tasks.reduce((acc, task) => {
      const priority = task.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Team productivity
    const teamProductivity = teamMembers.map(member => {
      const memberTasks = tasks.filter(task => task.assignee_id === member.id);
      const memberCompletedTasks = memberTasks.filter(task => task.status === 'completed').length;
      const efficiency = memberTasks.length > 0 
        ? Math.round((memberCompletedTasks / memberTasks.length) * 100)
        : 0;
      
      return {
        memberId: member.id,
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown',
        completedTasks: memberCompletedTasks,
        efficiency
      };
    });

    // Weekly progress (last 8 weeks)
    const weeklyProgress = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });
      
      const weekCompleted = weekTasks.filter(task => 
        task.status === 'completed' && 
        task.completed_at && 
        new Date(task.completed_at) >= weekStart && 
        new Date(task.completed_at) <= weekEnd
      ).length;

      weeklyProgress.push({
        week: `Week ${8 - i}`,
        completed: weekCompleted,
        created: weekTasks.length
      });
    }

    setAnalytics({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      tasksByPlatform,
      tasksByPriority,
      teamProductivity,
      weeklyProgress
    });
  }, [tasks, teamMembers]);

  const refreshAll = async () => {
    await Promise.all([
      refreshTasks(),
      refreshTeam(),
      refreshActivities()
    ]);
  };

  const value = {
    // Tasks
    tasks,
    tasksLoading,
    refreshTasks,
    
    // Team
    teamMembers,
    teamLoading,
    refreshTeam,
    
    // Activities
    activities,
    activitiesLoading,
    refreshActivities,
    
    // Global
    refreshAll,
    
    // Analytics
    analytics
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

