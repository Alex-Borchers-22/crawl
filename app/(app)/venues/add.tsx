import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../../lib/supabase';

const VENUE_TYPES = [
  'bar',
  'restaurant',
  'club',
  'pub',
  'cafe',
  'brewery',
  'other'
];

export default function AddVenueScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [venueType, setVenueType] = useState(VENUE_TYPES[0]);
  const [loading, setLoading] = useState(false);

  async function handleAddVenue() {
    if (!name.trim() || !address.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to add a venue');
        return;
      }

      const { error } = await supabase.from('venues').insert({
        name: name.trim(),
        address: address.trim(),
        venue_type: venueType,
        status: 'pending'
      });

      if (error) throw error;
      
      router.back();
    } catch (error) {
      console.error('Error adding venue:', error);
      alert('Error adding venue. Please try again.');
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
              Venue Name*
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              placeholder="Enter venue name"
              value={name}
              onChangeText={setName}
              maxLength={255}
            />
          </View>

          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Address*
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              placeholder="Enter venue address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          <View>
            <Text className="text-gray-700 dark:text-gray-300 mb-1 font-medium">
              Venue Type
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Picker
                selectedValue={venueType}
                onValueChange={(itemValue) => setVenueType(itemValue)}
                style={{ color: '#374151' }}
              >
                {VENUE_TYPES.map((type) => (
                  <Picker.Item
                    key={type}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    value={type}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            className={`mt-6 bg-purple-600 p-4 rounded-lg ${
              loading ? 'opacity-50' : ''
            }`}
            onPress={handleAddVenue}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? 'Adding Venue...' : 'Add Venue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 