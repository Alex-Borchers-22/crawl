import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LandingLogo } from '@/components/landing-logo';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/context/supabase-provider';
import { supabase } from '@/config/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('amb035@morningside.edu');
  const [password, setPassword] = useState('Password1!');
  const [loading, setLoading] = useState(false);
  const { signInWithPassword } = useSupabase();
  const scrollViewRef = useRef<ScrollView>(null);

  async function handleEmailLogin() {
    try {
      setLoading(true);
      await signInWithPassword(email, password);
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

            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="mb-2"
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                }, 50);
              }}
            />

            <TouchableOpacity
              className="bg-purple-600 py-4 rounded-lg mb-2"
              onPress={handleEmailLogin}
              disabled={loading}
            >
              <Text className="text-white text-center font-semibold">
                {loading ? 'Loading...' : 'Login'}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex-row justify-center items-center"
              onPress={handleGoogleLogin}
            >
              <MaterialIcons name="google" size={24} color="#DB4437" />
              <Text className="ml-2 font-semibold">Continue with Google</Text>
            </TouchableOpacity> */}

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 