import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleResetPassword() {
    if (!email.trim()) {
      alert('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'nightoutplanner://reset-password',
      });

      if (error) throw error;

      setSent(true);
    } catch (error) {
      console.error(error);
      alert('Error sending reset password email');
    } finally {
      setLoading(false);
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
          Reset Password
        </Text>
      </View>

      {sent ? (
        <View className="items-center">
          <MaterialIcons name="check-circle" size={64} color="#9333ea" />
          <Text className="text-lg text-gray-700 dark:text-gray-300 text-center mt-4">
            Check your email for a password reset link.
          </Text>
          <TouchableOpacity
            className="mt-6"
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text className="text-purple-600 dark:text-purple-400">
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="space-y-4">
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-4">
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>

          <TextInput
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            className="bg-purple-600 p-4 rounded-lg"
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text className="text-white text-center font-semibold">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-purple-600 dark:text-purple-400">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      )}
    </View>
  );
} 