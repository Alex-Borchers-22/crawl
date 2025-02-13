import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

type UserProfile = {
  email: string;
  avatar_url: string | null;
  location_sharing_enabled?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('event_participants')
        .select('location_sharing_enabled')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfile({
        email: user.email!,
        avatar_url: user.user_metadata?.avatar_url,
        location_sharing_enabled: profileData?.location_sharing_enabled,
      });
      setLocationSharing(profileData?.location_sharing_enabled || false);
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Error loading profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAvatar() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to update your avatar!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const photo = result.assets[0];
        const ext = photo.uri.substring(photo.uri.lastIndexOf('.') + 1);
        const fileName = `${Date.now()}.${ext}`;

        const formData = new FormData();
        formData.append('file', {
          uri: photo.uri,
          name: fileName,
          type: `image/${ext}`,
        } as any);

        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData);

        if (uploadError) throw uploadError;

        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: data.path },
        });

        if (updateError) throw updateError;

        await loadProfile();
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Error updating avatar. Please try again.');
    }
  }

  async function handleLocationSharingToggle(value: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('event_participants')
        .upsert({
          user_id: user.id,
          location_sharing_enabled: value,
        });

      if (error) throw error;

      setLocationSharing(value);
    } catch (error) {
      console.error('Error updating location sharing:', error);
      alert('Error updating settings');
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Please sign in to view your profile</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-6">
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handleUpdateAvatar}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900 items-center justify-center">
                <MaterialIcons name="person" size={48} color="#9333ea" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2">
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </View>
          </TouchableOpacity>

          <Text className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {profile.email}
          </Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-gray-700 dark:text-gray-300 font-medium">
              Location Sharing
            </Text>
            <Switch
              value={locationSharing}
              onValueChange={handleLocationSharingToggle}
              trackColor={{ false: '#9ca3af', true: '#9333ea' }}
            />
          </View>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Allow friends to see your location during events
          </Text>
        </View>

        <TouchableOpacity
          className="bg-red-500 p-4 rounded-lg"
          onPress={handleSignOut}
        >
          <Text className="text-white text-center font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
} 