import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types/index';

function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`user_id.eq.${user.id},event_participants.user_id.eq.${user.id}`)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as Event[];
    }
  });
}

function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId
  });
}

function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newEvent: Omit<Event, 'id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert([{ ...newEvent, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
}

export {
    useEvents,
    useEvent,
    useCreateEvent
}