import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTeam } from '@/hooks/useTeam';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';
import { Task } from '@/types';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in-progress', 'review', 'completed']),
  assignee_id: z.string().nullable().optional(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'linkedin', 'twitter']).nullable().optional(),
  client_id: z.string().nullable().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface ScheduleTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialDate?: Date;
}

const ScheduleTaskDialog: React.FC<ScheduleTaskDialogProps> = ({ open, onOpenChange, onSuccess, initialDate }) => {
  const { user } = useAuth();
  const { teamMembers } = useTeam();
  const { clients } = useClients();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, register, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: initialDate ? initialDate.toISOString().split('T')[0] : '',
      priority: 'medium',
      status: 'todo',
      assignee_id: 'unassigned',
      platform: undefined,
      client_id: undefined,
    },
  });

  useEffect(() => {
    if (initialDate) {
      reset({ due_date: initialDate.toISOString().split('T')[0] });
    }
  }, [initialDate, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const taskData: Omit<Task, 'id' | 'created_at'> = {
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        priority: data.priority,
        status: data.status,
        platform: data.platform,
        organization_id: currentUserProfile?.organization_id,
        assignee_id: data.assignee_id === 'unassigned' ? null : data.assignee_id,
        client_id: data.client_id === 'unassigned' ? null : data.client_id,
      };

      const { error } = await supabase.from('tasks').insert(taskData);

      if (error) {
        throw error;
      }

      toast.success('Task scheduled successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to schedule task:', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a New Task</DialogTitle>
          <DialogDescription>Fill in the details below to add a new task to the calendar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('title')}
              placeholder="Task Title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <Textarea
            {...register('description')}
            placeholder="Task Description (optional)"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                {...register('due_date')}
                type="date"
                className={errors.due_date ? 'border-red-500' : ''}
              />
              {errors.due_date && <p className="text-red-500 text-xs mt-1">{errors.due_date.message}</p>}
            </div>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              name="assignee_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="platform"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No Client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTaskDialog; 
