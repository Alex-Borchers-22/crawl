import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  return (
    <View className="flex-1 bg-purple-50 dark:bg-gray-950 text-black dark:text-white">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
          animation: 'slide_from_right',
          animationDuration: 200,
          presentation: 'card',
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="signup" 
          options={{
            gestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{
            gestureEnabled: true,
          }}
        />
      </Stack>
    </View>
  );
} 