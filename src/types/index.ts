export interface Task {
  id: string;
  created_at: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  assignee_id?: string | null;
  platform?: 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter' | null;
  organization_id?: string | null;
  completed_at?: string | null;
  client_id?: string | null;
  is_timer_running?: boolean;
  timer_started_at?: string | null;
  timer_duration?: number;
} 
