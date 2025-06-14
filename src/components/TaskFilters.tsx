import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { TeamMember } from '@/hooks/useTeam';
import { Client } from '@/types/client';
import { Search } from 'lucide-react';

interface TaskFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  platformFilter: string;
  setPlatformFilter: (platform: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (assignee: string) => void;
  clientFilter: string;
  setClientFilter: (client: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
  teamMembers: TeamMember[];
  clients: Client[];
  onClearFilters: () => void;
  showAssigneeFilter?: boolean;
  showClientFilter?: boolean;
}

const TaskFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  platformFilter,
  setPlatformFilter,
  assigneeFilter,
  setAssigneeFilter,
  clientFilter,
  setClientFilter,
  dateFilter,
  setDateFilter,
  teamMembers,
  clients,
  onClearFilters,
  showAssigneeFilter = true,
  showClientFilter = true
}: TaskFiltersProps) => {
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || 
                          platformFilter !== 'all' || assigneeFilter !== 'all' || clientFilter !== 'all';

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date Filters */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <Button
            variant={dateFilter === 'today' ? 'default' : 'outline'}
            onClick={() => setDateFilter('today')}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant={dateFilter === 'week' ? 'default' : 'outline'}
            onClick={() => setDateFilter('week')}
            size="sm"
          >
            This Week
          </Button>
          <Button
            variant={dateFilter === 'month' ? 'default' : 'outline'}
            onClick={() => setDateFilter('month')}
            size="sm"
          >
            This Month
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Status */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        {/* Platform */}
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee */}
        {showAssigneeFilter && (
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Client */}
        {showClientFilter && (
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        <Button variant="ghost" onClick={onClearFilters} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <X className="w-4 h-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default TaskFilters;
