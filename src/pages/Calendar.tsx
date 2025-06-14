import React, { useState, useMemo } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import ScheduleTaskDialog from '@/components/ScheduleTaskDialog';
import { useAuth } from '@/hooks/useAuth';

const Calendar = () => {
  const { user } = useAuth();
  const { tasks, tasksLoading, teamMembers, refreshTasks } = useAppData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isScheduleTaskDialogOpen, setIsScheduleTaskDialogOpen] = useState(false);

  const visibleTasks = useMemo(() => {
    if (user?.role === 'team_lead') {
      return tasks;
    }
    return tasks.filter(task => task.assignee_id === user?.id);
  }, [tasks, user]);

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get tasks for specific date
  const getTasksForDate = (date: Date) => {
    return visibleTasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  // Calendar navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Task summary for current month
  const monthTasks = useMemo(() => {
    return visibleTasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return isSameMonth(taskDate, currentDate);
    });
  }, [visibleTasks, currentDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'todo': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const handleAddTaskSuccess = () => {
    setIsScheduleTaskDialogOpen(false);
    refreshTasks();
  };

  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading calendar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="text-gray-600">Track deadlines and schedule your social media tasks</p>
          </div>
          <Button className="flex items-center gap-2" onClick={() => setIsScheduleTaskDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Schedule Task
          </Button>
        </div>

        {/* Calendar Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{monthTasks.length}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due Today</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {getTasksForDate(new Date()).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {visibleTasks.filter(task => 
                      task.due_date && 
                      new Date(task.due_date) < new Date() && 
                      task.status !== 'completed'
                    ).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Tasks</p>
                  <p className="text-2xl font-bold text-green-600">
                    {monthTasks.filter(task => task.assignee_id).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(day => {
                    const dayTasks = getTasksForDate(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    
                    return (
                      <div
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          relative p-2 h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                          ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}
                          ${isSelected ? 'ring-2 ring-blue-500' : ''}
                        `}
                      >
                        <div className={`text-sm ${isToday(day) ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
                          {format(day, 'd')}
                        </div>
                        
                        {/* Task indicators */}
                        <div className="mt-1 space-y-1">
                          {dayTasks.slice(0, 2).map((task, index) => (
                            <div
                              key={task.id}
                              className={`h-1 rounded ${getStatusColor(task.status)}`}
                              title={task.title}
                            />
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayTasks.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Date Tasks */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-3">
                    {selectedDateTasks.length > 0 ? (
                      selectedDateTasks.map(task => {
                        const assignee = teamMembers.find(member => member.id === task.assignee_id);
                        return (
                          <div key={task.id} className={`p-3 rounded-lg border-l-4 ${getPriorityColor(task.priority)}`}>
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                              <Badge className="capitalize">
                                {task.status}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{task.priority} priority</span>
                              {assignee && (
                                <span>{assignee.first_name} {assignee.last_name}</span>
                              )}
                            </div>
                            {task.platform && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.platform}
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center py-8">No tasks scheduled for this date</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Click on a date to view scheduled tasks</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visibleTasks
                    .filter(task => 
                      task.due_date && 
                      new Date(task.due_date) >= new Date() && 
                      task.status !== 'completed'
                    )
                    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                    .slice(0, 5)
                    .map(task => {
                      const daysUntilDue = Math.ceil(
                        (new Date(task.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.title}</p>
                            <p className="text-xs text-gray-500">
                              {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days`}
                            </p>
                          </div>
                          <Badge className="capitalize">
                            {task.priority}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ScheduleTaskDialog
        open={isScheduleTaskDialogOpen}
        onOpenChange={setIsScheduleTaskDialogOpen}
        onSuccess={handleAddTaskSuccess}
        initialDate={selectedDate ?? new Date()}
      />
    </div>
  );
};

export default Calendar;

