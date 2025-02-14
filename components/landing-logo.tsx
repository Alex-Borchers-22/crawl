import { Image } from 'react-native';

export function LandingLogo() {
  return (
    <Image
      source={require('../assets/logo.png')}
      className="h-[300px] w-[300px] mb-4 rounded-3xl overflow-hidden"
      resizeMode="contain"
    />
  );
} 