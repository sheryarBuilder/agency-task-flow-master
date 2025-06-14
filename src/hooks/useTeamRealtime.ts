
import { supabase } from '@/integrations/supabase/client';

// Global singleton for team realtime subscription
let globalTeamChannel: any = null;
let teamSubscriberCount = 0;
let globalTeamUserId: string | null = null;
let isTeamSubscribing = false;

export const useTeamRealtime = () => {
  const setupGlobalTeamRealtime = async (userId: string) => {
    if (globalTeamChannel || !userId || isTeamSubscribing) return;

    console.log('Setting up global team realtime subscription for user:', userId);
    isTeamSubscribing = true;
    
    try {
      globalTeamChannel = supabase
        .channel(`team-global-${userId}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => { 
            console.log('Team profiles updated via realtime:', payload);
            // Trigger refetch for all subscribers
            window.dispatchEvent(new CustomEvent('team-updated'));
          }
        );

      await globalTeamChannel.subscribe((status: string) => {
        console.log('Global team realtime status:', status);
        isTeamSubscribing = false;
      });
    } catch (error) {
      console.error('Error setting up team realtime subscription:', error);
      isTeamSubscribing = false;
      globalTeamChannel = null;
    }
  };

  const cleanupGlobalTeamRealtime = () => {
    if (globalTeamChannel && teamSubscriberCount === 0) {
      console.log('Cleaning up global team realtime subscription');
      supabase.removeChannel(globalTeamChannel);
      globalTeamChannel = null;
      globalTeamUserId = null;
      isTeamSubscribing = false;
    }
  };

  const subscribeToTeamRealtime = (userId: string) => {
    teamSubscriberCount++;
    
    // Set up global realtime if user changed or doesn't exist
    if (globalTeamUserId !== userId) {
      if (globalTeamChannel) {
        supabase.removeChannel(globalTeamChannel);
        globalTeamChannel = null;
        isTeamSubscribing = false;
      }
      globalTeamUserId = userId;
      setupGlobalTeamRealtime(userId);
    } else if (!globalTeamChannel && !isTeamSubscribing) {
      setupGlobalTeamRealtime(userId);
    }
  };

  const unsubscribeFromTeamRealtime = () => {
    teamSubscriberCount = Math.max(0, teamSubscriberCount - 1);
    // Clean up global channel if no more subscribers
    setTimeout(cleanupGlobalTeamRealtime, 100);
  };

  return {
    subscribeToTeamRealtime,
    unsubscribeFromTeamRealtime
  };
};
