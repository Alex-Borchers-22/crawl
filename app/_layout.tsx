import "../global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { SupabaseProvider } from "@/context/supabase-provider";
import { useSupabase } from "@/context/supabase-provider";

function useProtectedRoute(user: any) {
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		const inAuthGroup = segments[0] === "(auth)";
		
		if (!user && !inAuthGroup) {
			// Redirect to the sign-in page if not signed in
			router.replace("/login");
		} else if (user && inAuthGroup) {
			// Redirect to the home page if signed in and trying to access auth pages
			router.replace("/");
		}
	}, [user, segments]);
}

export default function RootLayout() {
	const { session } = useSupabase();
	const user = session?.user;

	useProtectedRoute(user);

	return (
		<SupabaseProvider>
			<Slot />
		</SupabaseProvider>
	);
}
