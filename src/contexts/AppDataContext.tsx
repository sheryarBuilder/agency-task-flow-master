
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useTeam } from '@/hooks/useTeam';
import { useProfile } from '@/hooks/useProfile';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { TeamMember } from '@/hooks/useTeam';

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

  // Log data for debugging
  useEffect(() => {
    console.log('=== APP DATA CONTEXT STATE ===');
    console.log('User:', user?.email);
    console.log('Profile:', profile);
    console.log('Tasks count:', tasks.length);
    console.log('Clients count:', clients.length);
    console.log('Team members count:', teamMembers.length);
    console.log('Loading states:', { tasksLoading, clientsLoading, teamLoading, profileLoading });
  }, [user, profile, tasks, clients, teamMembers, tasksLoading, clientsLoading, teamLoading, profileLoading]);

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
