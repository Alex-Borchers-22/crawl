import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

type Event = {
  id: string;
  title: string;
  event_date: string;
  status: string;
  is_private: boolean;
  is_scavenger_hunt: boolean;
};

export default function HomeScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function loadEvents() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`user_id.eq.${user.id},event_participants.user_id.eq.${user.id}`)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-sm"
      onPress={() => router.push(`/events/${item.id}`)}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {item.title}
        </Text>
        <View className="flex-row items-center">
          {item.is_private && (
            <MaterialIcons name="lock" size={16} color="#9333ea" />
          )}
          {item.is_scavenger_hunt && (
            <MaterialIcons name="search" size={16} color="#9333ea" className="ml-2" />
          )}
        </View>
      </View>
      
      <View className="flex-row items-center">
        <MaterialIcons name="event" size={16} color="#6b7280" />
        <Text className="ml-1 text-gray-600 dark:text-gray-400">
          {format(new Date(item.event_date), 'MMM d, yyyy h:mm a')}
        </Text>
      </View>
      
      <View className="mt-2">
        <Text
          className={`text-sm ${
            item.status === 'planning'
              ? 'text-yellow-600'
              : item.status === 'active'
              ? 'text-green-600'
              : 'text-gray-600'
          }`}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        className="p-4"
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-500 dark:text-gray-400 text-lg">
              {loading ? 'Loading events...' : 'No events found'}
            </Text>
          </View>
        }
      />

      <Link href="/events/create" asChild>
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-purple-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        >
          <MaterialIcons name="add" size={30} color="white" />
        </TouchableOpacity>
      </Link>
    </View>
  );
} 