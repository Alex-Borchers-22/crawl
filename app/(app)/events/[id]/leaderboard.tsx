import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';

type LeaderboardEntry = {
  user_id: string;
  user_details: {
    email: string;
    avatar_url?: string;
  };
  completed_challenges: number;
  total_points: number;
  rank?: number;
};

export default function LeaderboardScreen() {
  const { id } = useLocalSearchParams();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [id]);

  async function loadLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('challenge_completions')
        .select(`
          user_id,
          challenges (points),
          user_details:auth.users (email, avatar_url)
        `)
        .eq('status', 'approved')
        .eq('challenges.event_id', id);

      if (error) throw error;

      // Group and calculate totals by user
      const userTotals = data.reduce((acc: { [key: string]: LeaderboardEntry }, entry: any) => {
        const userId = entry.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user_id: userId,
            user_details: entry.user_details,
            completed_challenges: 0,
            total_points: 0,
          };
        }
        acc[userId].completed_challenges += 1;
        acc[userId].total_points += entry.challenges?.points || 0;
        return acc;
      }, {});

      // Convert to array and sort by points
      const sortedLeaderboard = Object.values(userTotals)
        .sort((a, b) => b.total_points - a.total_points)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setLeaderboard(sortedLeaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      alert('Error loading leaderboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Leaderboard
        </Text>

        {leaderboard.map((entry) => (
          <View
            key={entry.user_id}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 flex-row items-center"
          >
            <Text
              className={`text-2xl font-bold mr-4 ${
                entry.rank === 1
                  ? 'text-yellow-500'
                  : entry.rank === 2
                  ? 'text-gray-400'
                  : entry.rank === 3
                  ? 'text-amber-600'
                  : 'text-gray-600'
              }`}
            >
              #{entry.rank}
            </Text>

            <View className="flex-row items-center flex-1">
              {entry.user_details.avatar_url ? (
                <Image
                  source={{ uri: entry.user_details.avatar_url }}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 mr-3 items-center justify-center">
                  <MaterialIcons name="person" size={24} color="#9333ea" />
                </View>
              )}

              <View className="flex-1">
                <Text className="text-gray-900 dark:text-gray-100 font-medium">
                  {entry.user_details.email.split('@')[0]}
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-sm">
                  {entry.completed_challenges} challenges completed
                </Text>
              </View>

              <View className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded">
                <Text className="text-purple-800 dark:text-purple-200 font-semibold">
                  {entry.total_points} pts
                </Text>
              </View>
            </View>
          </View>
        ))}

        {leaderboard.length === 0 && (
          <View className="bg-white dark:bg-gray-800 p-6 rounded-lg items-center">
            <Text className="text-gray-600 dark:text-gray-400 text-lg text-center">
              No completed challenges yet.
              {'\n'}
              Be the first to score points!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
} 