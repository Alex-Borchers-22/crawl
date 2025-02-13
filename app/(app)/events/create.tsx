import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../lib/supabase';

export default function CreateEventScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [isPrivate, setIsPrivate] = useState(true);
  const [isScavengerHunt, setIsScavengerHunt] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreateEvent() {
    if (!title.trim()) {
      alert('Please enter an event title');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to create an event');
        return;
      }

      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        title: title.trim(),
        event_date: eventDate.toISOString(),
        is_private: isPrivate,
        is_scavenger_hunt: isScavengerHunt,
        status: 'planning'
      });

      if (error) throw error;
      
      router.back();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-6">
        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Event Title
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              placeholder="Enter event title"
              value={title}
              onChangeText={setTitle}
              maxLength={255}
            />
          </View>

          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Date & Time
            </Text>
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex-row items-center"
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="event" size={24} color="#6b7280" />
              <Text className="ml-2 text-gray-700 dark:text-gray-300">
                {eventDate.toLocaleString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="datetime"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setEventDate(date);
                }}
              />
            )}
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-gray-700 dark:text-gray-300 font-medium">
              Private Event
            </Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#9ca3af', true: '#9333ea' }}
            />
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-gray-700 dark:text-gray-300 font-medium">
              Scavenger Hunt Mode
            </Text>
            <Switch
              value={isScavengerHunt}
              onValueChange={setIsScavengerHunt}
              trackColor={{ false: '#9ca3af', true: '#9333ea' }}
            />
          </View>

          <TouchableOpacity
            className={`mt-6 bg-purple-600 p-4 rounded-lg ${
              loading ? 'opacity-50' : ''
            }`}
            onPress={handleCreateEvent}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? 'Creating Event...' : 'Create Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 