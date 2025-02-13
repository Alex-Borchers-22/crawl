import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../../lib/supabase';

type Challenge = {
  id: string;
  description: string;
  points: number;
  is_ai_generated: boolean;
  completion?: {
    status: string;
    proof_photo_url: string | null;
  };
};

export default function ChallengesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
    getCurrentUser();
  }, [id]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function loadChallenges() {
    try {
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_completions (
            status,
            proof_photo_url
          )
        `)
        .eq('event_id', id);

      if (challengeError) throw challengeError;

      const challengesWithCompletions = challengeData.map((challenge: any) => ({
        ...challenge,
        completion: challenge.challenge_completions?.[0] || null,
      }));

      setChallenges(challengesWithCompletions);
    } catch (error) {
      console.error('Error loading challenges:', error);
      alert('Error loading challenges');
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadProof(challengeId: string) {
    if (!userId) {
      alert('Please sign in to complete challenges');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload proof!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const photo = result.assets[0];
        const ext = photo.uri.substring(photo.uri.lastIndexOf('.') + 1);
        const fileName = `${userId}/${challengeId}/${Date.now()}.${ext}`;

        const formData = new FormData();
        formData.append('file', {
          uri: photo.uri,
          name: fileName,
          type: `image/${ext}`,
        } as any);

        const { data, error: uploadError } = await supabase.storage
          .from('challenge-proofs')
          .upload(fileName, formData);

        if (uploadError) throw uploadError;

        const { error: completionError } = await supabase
          .from('challenge_completions')
          .upsert({
            challenge_id: challengeId,
            user_id: userId,
            proof_photo_url: data.path,
            status: 'pending',
          });

        if (completionError) throw completionError;

        await loadChallenges();
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Error uploading proof. Please try again.');
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading challenges...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Scavenger Hunt
          </Text>
          <TouchableOpacity
            className="bg-purple-600 px-4 py-2 rounded-lg"
            onPress={() => router.push(`/events/${id}/leaderboard`)}
          >
            <Text className="text-white">View Leaderboard</Text>
          </TouchableOpacity>
        </View>

        {challenges.map((challenge) => (
          <View
            key={challenge.id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4"
          >
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 mr-4">
                {challenge.description}
              </Text>
              <View className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                <Text className="text-purple-800 dark:text-purple-200">
                  {challenge.points} pts
                </Text>
              </View>
            </View>

            {challenge.completion?.proof_photo_url && (
              <Image
                source={{ uri: challenge.completion.proof_photo_url }}
                className="w-full h-40 rounded-lg mb-2"
                resizeMode="cover"
              />
            )}

            <View className="flex-row justify-between items-center mt-2">
              {challenge.is_ai_generated && (
                <View className="flex-row items-center">
                  <MaterialIcons name="auto-awesome" size={16} color="#9333ea" />
                  <Text className="ml-1 text-purple-600 dark:text-purple-400">
                    AI Generated
                  </Text>
                </View>
              )}

              {challenge.completion ? (
                <Text
                  className={`text-sm ${
                    challenge.completion.status === 'pending'
                      ? 'text-yellow-600'
                      : challenge.completion.status === 'approved'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {challenge.completion.status.charAt(0).toUpperCase() +
                    challenge.completion.status.slice(1)}
                </Text>
              ) : (
                <TouchableOpacity
                  className="bg-purple-600 px-4 py-2 rounded-lg"
                  onPress={() => handleUploadProof(challenge.id)}
                >
                  <Text className="text-white">Upload Proof</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
} 