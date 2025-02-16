import { Stack } from "expo-router";
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View } from "react-native";

export const unstable_settings = {
	initialRouteName: "(root)",
};

export default function AppLayout() {
	const hiddenRoutes = ["/venues/add", "events/create", "events/[id]", "events/[id]/challenges", "venues", "events/[id]/leaderboard", "+not-found"];

	return (
		<View className="flex-1 bg-purple-50 dark:bg-gray-950 text-black dark:text-white">
			<Tabs
				screenOptions={{
					headerShown: true,
					tabBarActiveTintColor: '#9333ea', // purple-600
					tabBarInactiveTintColor: '#6b7280', // gray-500
					tabBarStyle: {
						borderTopWidth: 1,
						borderTopColor: '#e5e7eb', // gray-200
						paddingBottom: 4,
						paddingTop: 4,
					},
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: 'Home',
						tabBarIcon: ({ color }) => (
							<MaterialIcons name="home" size={24} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="events"
					options={{
						title: 'Events',
						tabBarIcon: ({ color }) => (
							<MaterialIcons name="event" size={24} color={color} />
						),
					}}
				/>
				{/* <Tabs.Screen
					name="scavenger-hunt"
					options={{
						title: 'Hunt',
						tabBarIcon: ({ color }) => (
							<MaterialIcons name="search" size={24} color={color} />
						),
					}}
				/> */}
				<Tabs.Screen
					name="profile"
					options={{
						title: 'Profile',
						tabBarIcon: ({ color }) => (
							<MaterialIcons name="person" size={24} color={color} />
						),
					}}
				/>

				{/* hidden routes */}
				{hiddenRoutes.map((route) => (
					<Tabs.Screen
						key={route}
						name={route}
						options={{
							href: null,
						}}
					/>
				))}
				
			</Tabs>
		</View>
	);
}
