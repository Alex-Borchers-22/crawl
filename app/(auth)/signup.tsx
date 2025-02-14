import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { LandingLogo } from '@/components/landing-logo';
import { Input } from '@/components/ui/input';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      alert('Check your email for the confirmation link!');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error(error);
      alert('Error signing up');
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
              Create Account
            </Text>
          </View>

          <View className="space-y-4">
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

            <View className="relative">
              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="mb-2 pr-12"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                  }, 50);
                }}
              />
              <TouchableOpacity 
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={24} 
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="bg-purple-600 py-4 rounded-lg mb-2"
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold">
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 