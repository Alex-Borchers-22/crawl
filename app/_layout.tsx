import 'react-native-get-random-values';
import "../global.css";
import { Slot } from "expo-router";
import { SupabaseProvider } from "@/context/supabase-provider";

export default function RootLayout() {
	return (
		<SupabaseProvider>
			<Slot />
		</SupabaseProvider>
	);
}
