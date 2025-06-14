
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useTeam } from '@/hooks/useTeam';
import { useProfile } from '@/hooks/useProfile';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { TeamMember } from '@/hooks/useTeam';

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueTasks: number;
  averageCompletionTime: number;
  tasksByPlatform: Record<string, number>;
  tasksByPriority: Record<string, number>;
  teamProductivity: Array<{
    memberId: string;
    name: string;
    completedTasks: number;
    efficiency: number;
  }>;
  weeklyProgress: Array<{
    week: string;
    created: number;
    completed: number;
  }>;
}

interface AppDataContextType {
  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  createTask: (taskData: any) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Clients
  clients: Client[];
  clientsLoading: boolean;
  createClient: (clientData: any) => Promise<void>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  
  // Team
  teamMembers: TeamMember[];
  teamLoading: boolean;
  
  // Profile
  profile: any;
  profileLoading: boolean;
  
  // Analytics
  analytics: AnalyticsData;
  
  // Refetch functions
  refetchTasks: () => Promise<void>;
  refetchClients: () => Promise<void>;
  refetchTeam: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  // Tasks
  const { 
    tasks, 
    loading: tasksLoading, 
    createTask, 
    updateTask, 
    updateTaskStatus, 
    deleteTask, 
    refetch: refetchTasks 
  } = useTasks();
  
  // Clients
  const { 
    clients, 
    loading: clientsLoading, 
    createClient, 
    updateClient, 
    deleteClient, 
    refetch: refetchClients 
  } = useClients();
  
  // Team
  const { 
    teamMembers, 
    loading: teamLoading, 
    refetch: refetchTeam 
  } = useTeam();

  // Calculate analytics data
  const analytics = useMemo((): AnalyticsData => {
    const now = new Date();
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const overdueTasks = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < now && task.status !== 'completed'
    ).length;

    // Calculate completion rate
    const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Calculate average completion time (mock calculation)
    const averageCompletionTime = Math.round(Math.random() * 5 + 2); // 2-7 days

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
    const teamProductivity = teamMembers.map(member => ({
      memberId: member.id,
      name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
      completedTasks: member.tasks_completed || 0,
      efficiency: Math.round(Math.random() * 40 + 60), // 60-100%
    }));

    // Weekly progress (mock data for last 6 weeks)
    const weeklyProgress = Array.from({ length: 6 }, (_, i) => {
      const weekDate = new Date(now);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      return {
        week: `Week ${6-i}`,
        created: Math.floor(Math.random() * 10 + 5),
        completed: Math.floor(Math.random() * 8 + 3),
      };
    });

    return {
      totalTasks: tasks.length,
      completedTasks,
      completionRate,
      overdueTasks,
      averageCompletionTime,
      tasksByPlatform,
      tasksByPriority,
      teamProductivity,
      weeklyProgress,
    };
  }, [tasks, teamMembers]);

  // Log data for debugging
  useEffect(() => {
    console.log('=== APP DATA CONTEXT STATE ===');
    console.log('User:', user?.email);
    console.log('Profile:', profile);
    console.log('Tasks count:', tasks.length);
    console.log('Clients count:', clients.length);
    console.log('Team members count:', teamMembers.length);
    console.log('Analytics:', analytics);
    console.log('Loading states:', { tasksLoading, clientsLoading, teamLoading, profileLoading });
  }, [user, profile, tasks, clients, teamMembers, analytics, tasksLoading, clientsLoading, teamLoading, profileLoading]);

  const value: AppDataContextType = {
    // Tasks
    tasks,
    tasksLoading,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    
    // Clients
    clients,
    clientsLoading,
    createClient,
    updateClient,
    deleteClient,
    
    // Team
    teamMembers,
    teamLoading,
    
    // Profile
    profile,
    profileLoading,
    
    // Analytics
    analytics,
    
    // Refetch functions
    refetchTasks,
    refetchClients,
    refetchTeam,
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
