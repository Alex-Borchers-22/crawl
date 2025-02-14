import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { LandingLogo } from '@/components/landing-logo';
import { Input } from '../../components/ui/input';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
    >
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <View className="flex-1 justify-start px-6 pt-12">
          <View className="mb-8 items-center mt-8">
            <LandingLogo />
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

              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="mb-2"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 100, animated: true });
                  }, 50);
                }}
              />

              <TouchableOpacity
                className="bg-purple-600 py-4 rounded-lg mb-2"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 