import { Session, User } from "@supabase/supabase-js";
import { useRouter, useSegments, SplashScreen } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from "@/config/supabase";

SplashScreen.preventAutoHideAsync();

type SupabaseContextProps = {
	user: User | null;
	session: Session | null;
	initialized?: boolean;
	signUp: (email: string, password: string) => Promise<void>;
	signInWithPassword: (email: string, password: string) => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
};

type SupabaseProviderProps = {
	children: React.ReactNode;
};

export const SupabaseContext = createContext<SupabaseContextProps>({
	user: null,
	session: null,
	initialized: false,
	signUp: async () => {},
	signInWithPassword: async () => {},
	signInWithGoogle: async () => {},
	signOut: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
	const router = useRouter();
	const segments = useSegments();
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [initialized, setInitialized] = useState<boolean>(false);

	const signUp = async (email: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
		});
		if (error) {
			throw error;
		}
	};

	const signInWithPassword = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) {
			throw error;
		}
	};

	const signInWithGoogle = async () => {
		try {
			const redirectUrl = Linking.createURL('google-auth');

			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: redirectUrl,
					skipBrowserRedirect: true,
				},
			});

			if (error) throw error;
			if (!data.url) throw new Error('No OAuth URL');

			const result = await WebBrowser.openAuthSessionAsync(
				data.url,
				redirectUrl,
			);

			if (result.type === 'success') {
				const { url } = result;
				const urlObject = new URL(url);
				const params = Object.fromEntries(urlObject.searchParams.entries());
				
				if (params?.code) {
					const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
					if (error) throw error;
					if (data.session) {
						setSession(data.session);
						setUser(data.session.user);
					}
				}
			}
		} catch (error) {
			console.error('Error signing in with Google:', error);
			throw error;
		}
	};

	const signOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			
			// Explicitly clear the session and user state
			setSession(null);
			setUser(null);
			
			// Force navigation to login
			console.log("signing out");
			router.replace("/(auth)/login");
		} catch (error) {
			console.error('Error signing out:', error);
			throw error;
		}
	};

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session ? session.user : null);
			setInitialized(true);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session ? session.user : null);
		});
	}, []);

	useEffect(() => {
		if (!initialized) return;

		const inAuthGroup = segments[0] === "(auth)";
		const inAppGroup = segments[0] === "(app)";

		if (session && inAuthGroup) {
			router.replace("/(app)");
		} else if (!session && inAppGroup) {
			router.replace("/(auth)/login");
		}

		setTimeout(() => {
			SplashScreen.hideAsync();
		}, 500);
	}, [initialized, session, segments]);

	return (
		<SupabaseContext.Provider
			value={{
				user,
				session,
				initialized,
				signUp,
				signInWithPassword,
				signInWithGoogle,
				signOut,
			}}
		>
			{children}
		</SupabaseContext.Provider>
	);
};
