import React, { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useTeam } from '@/hooks/useTeam';
import { useClients } from '@/hooks/useClients';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import TaskHeader from '@/components/TaskHeader';
import TaskFilters from '@/components/TaskFilters';
import TaskStats from '@/components/TaskStats';
import TaskListView from '@/components/TaskListView';
import TaskBoard from '@/components/TaskBoard';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import CreateClientDialog from '@/components/CreateClientDialog';
import ClientCard from '@/components/ClientCard';
import ClientTaskView from '@/components/ClientTaskView';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

const Tasks = () => {
  const { tasks, loading, refetch } = useTasks();
  const { teamMembers } = useTeam();
  const { clients } = useClients();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'clients'>('kanban');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createClientDialogOpen, setCreateClientDialogOpen] = useState(false);

  const isTeamLead = profile?.role === 'team_lead';

  // Filter tasks based on user role
  const userTasks = isTeamLead ? tasks : tasks.filter(task => task.assignee_id === user?.id);

  const filteredTasks = userTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesPlatform = platformFilter === 'all' || task.platform === platformFilter;
    const matchesAssignee = assigneeFilter === 'all' || task.assignee_id === assigneeFilter;
    const matchesClient = clientFilter === 'all' || task.client_id === clientFilter;

    // Date filter
    if (task.due_date) {
      const dueDate = parseISO(task.due_date);
      if (dateFilter === 'today' && !isToday(dueDate)) return false;
      if (dateFilter === 'week' && !isThisWeek(dueDate, { weekStartsOn: 1 })) return false;
      if (dateFilter === 'month' && !isThisMonth(dueDate)) return false;
    } else if (dateFilter !== 'all') {
      return false;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesPlatform && matchesAssignee && matchesClient;
  });

  const handleTaskCreated = () => {
    setCreateDialogOpen(false);
    refetch();
  };

  const handleClientCreated = () => {
    setCreateClientDialogOpen(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setPlatformFilter('all');
    setAssigneeFilter('all');
    setClientFilter('all');
    setDateFilter('all');
  };

  const getClientTaskCount = (clientId: string) => {
    return userTasks.filter(task => task.client_id === clientId).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <TaskHeader 
          viewMode={viewMode}
          setViewMode={setViewMode}
          onCreateTask={() => setCreateDialogOpen(true)}
          showClientView={isTeamLead}
        />

        {viewMode === 'clients' ? (
          <ClientTaskView clients={clients} tasks={userTasks} teamMembers={teamMembers} />
        ) : (
          <>
            {(viewMode === 'list' || viewMode === 'kanban') && (
              <TaskFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                platformFilter={platformFilter}
                setPlatformFilter={setPlatformFilter}
                assigneeFilter={assigneeFilter}
                setAssigneeFilter={setAssigneeFilter}
                clientFilter={clientFilter}
                setClientFilter={setClientFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                teamMembers={isTeamLead ? teamMembers : []}
                clients={isTeamLead ? clients : []}
                onClearFilters={handleClearFilters}
                showAssigneeFilter={isTeamLead}
                showClientFilter={isTeamLead}
              />
            )}

            <TaskStats tasks={userTasks} />

            {viewMode === 'kanban' ? (
              <TaskBoard
                tasks={filteredTasks}
                teamMembers={isTeamLead ? teamMembers : []}
                onTaskUpdate={refetch}
              />
            ) : viewMode === 'list' ? (
              <TaskListView
                filteredTasks={filteredTasks}
                teamMembers={isTeamLead ? teamMembers : []}
              />
            ) : null}
          </>
        )}

        <CreateTaskDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleTaskCreated}
        />

        {isTeamLead && (
          <CreateClientDialog 
            open={createClientDialogOpen} 
            onOpenChange={setCreateClientDialogOpen}
            onSuccess={handleClientCreated}
          />
        )}
      </div>
    </div>
  );
};

export default Tasks;
