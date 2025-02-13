import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleEmailLogin() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.replace('/(app)');
    } catch (error) {
      console.error(error);
      alert('Error logging in');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      console.error(error);
      alert('Error logging in with Google');
    }
  }

  return (
    <View className="flex-1 justify-center px-6">
      <View className="mb-12 items-center">
        <Image
          source={require('../../assets/logo.png')}
          className="h-24 w-24 mb-4"
        />
        <Text className="text-3xl font-bold text-purple-800 dark:text-purple-200">
          Night Out Planner
        </Text>
      </View>

      <View className="space-y-4">
        <TextInput
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className="bg-purple-600 p-4 rounded-lg"
          onPress={handleEmailLogin}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold">
            {loading ? 'Loading...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex-row justify-center items-center"
          onPress={handleGoogleLogin}
        >
          <MaterialIcons name="google" size={24} color="#DB4437" />
          <Text className="ml-2 font-semibold">Continue with Google</Text>
        </TouchableOpacity>

        <View className="flex-row justify-between mt-4">
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-purple-600 dark:text-purple-400">
                Create Account
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity>
              <Text className="text-purple-600 dark:text-purple-400">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
} 