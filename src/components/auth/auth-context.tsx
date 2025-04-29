"use client";

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { type User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { signOut as serverSignOut } from "@/app/login/actions";

// Export User type if needed elsewhere, or keep it internal
export { type User };

// Keep UserProfile interface
export interface UserProfile {
	id: string;
	email: string;
	fullName?: string | null;
	avatarUrl?: string | null;
}

// Keep AuthContextValue interface
interface AuthContextValue {
	user: User | null;
	userProfile: UserProfile | null;
	loading: boolean;
	logout: () => void;
	refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Define Props for AuthProvider
type AuthProviderProps = {
	children: React.ReactNode;
	initialUser: User | null;
	initialProfile: UserProfile | null;
};

export function AuthProvider({
	children,
	initialUser,
	initialProfile,
}: AuthProviderProps) {
	// console.log(
	// 	"[AuthProvider] Component executing. Initial Props -> User:",
	// 	initialUser?.id,
	// 	"Profile:",
	// 	initialProfile,
	// );
	const supabase = useMemo(() => createClient(), []);

	// Initialize state to null/true initially.
	const [user, setUser] = useState<User | null>(null);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [isLoadingClient, setIsLoadingClient] = useState(true); // Start true

	// console.log(
	// 	`[AuthProvider] Initial useState call results: isLoadingClient=${isLoadingClient}, user=${user?.id}, profile=`,
	// 	userProfile,
	// );

	// Profile fetch function (used by listener and refresh)
	const fetchProfile = useCallback(
		async (sbUser: User | null) => {
			// console.log("[AuthProvider] fetchProfile called with user:", sbUser?.id);
			if (!sbUser || !sbUser.email) {
				setUserProfile(null);
				if (isLoadingClient) setIsLoadingClient(false);
				return;
			}
			if (userProfile?.id === sbUser.id) {
				// console.log("[AuthProvider] Profile already loaded, skipping fetch.");
				if (isLoadingClient) setIsLoadingClient(false);
				return;
			}
			// console.log("[AuthProvider] fetchProfile setting isLoadingClient true.");
			setIsLoadingClient(true);
			try {
				const { data, error } = await supabase
					.from("profiles")
					.select("full_name, avatar_url")
					.eq("id", sbUser.id)
					.single();
				if (error) {
					console.error(
						"[AuthProvider] Error fetching profile:",
						error.message || error,
					);
					setUserProfile({
						id: sbUser.id,
						email: sbUser.email,
					});
				} else {
					// console.log("[AuthProvider] Profile fetched successfully:", data);
					setUserProfile({
						id: sbUser.id,
						email: sbUser.email,
						fullName: data?.full_name,
						avatarUrl: data?.avatar_url,
					});
				}
			} catch (err) {
				console.error("[AuthProvider] Unexpected profile fetch error:", err);
				setUserProfile(null);
			} finally {
				setIsLoadingClient(false);
				// console.log(
				// 	"[AuthProvider] fetchProfile setting isLoadingClient false.",
				// );
			}
		},
		[supabase, userProfile, isLoadingClient],
	);

	// Effect to synchronize state with initial props from server
	useEffect(() => {
		let isMounted = true;
		// console.log("[AuthProvider] Initial Prop Sync Effect START.");
		if (isMounted) {
			// console.log("[AuthProvider] Syncing state with initial props...");
			setUser(initialUser);
			setUserProfile(initialProfile);
			setIsLoadingClient(false); // Hydration complete, set loading false
			// console.log(
			// 	`[AuthProvider] State synced from props. isLoading=${false}, user=${
			// 		initialUser?.id
			// 	}, profile=`,
			// 	initialProfile,
			// );
		}
		return () => {
			isMounted = false;
		};
		// Run ONLY when initial props change (should be only once on client)
	}, [initialUser, initialProfile]);

	// Effect for Supabase auth listener
	useEffect(() => {
		// console.log("[AuthProvider] Listener setup Effect START.");
		let isMounted = true;

		// Don't run listener setup until initial state sync is done (isLoadingClient is false)
		if (isLoadingClient) {
			// console.log(
			// 	"[AuthProvider] Skipping listener setup, still loading initial state.",
			// );
			return;
		}

		// console.log("[AuthProvider] Setting up onAuthStateChange listener.");
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			if (!isMounted) return;
			// console.log("[AuthProvider] onAuthStateChange fired:", {
			// 	_event,
			// 	userId: session?.user?.id,
			// });
			const currentUser = session?.user ?? null;
			const currentUserID = currentUser?.id;
			const previousUserID = user?.id;

			if (currentUserID !== previousUserID) {
				setUser(currentUser);
				await fetchProfile(currentUser);
			} else if (!currentUser && previousUserID) {
				setUser(null);
				setUserProfile(null);
				if (isLoadingClient) setIsLoadingClient(false);
			} else {
				setUser(currentUser);
			}
		});

		return () => {
			isMounted = false;
			subscription?.unsubscribe();
		};
		// Depend on supabase client, the fetch callback, loading state, and user ID
	}, [supabase, fetchProfile, isLoadingClient, user?.id]);

	const logout = useCallback(() => {
		setUser(null);
		setUserProfile(null);
		setIsLoadingClient(false);
		serverSignOut();
	}, []);

	const refreshProfile = useCallback(async () => {
		if (!user) return;
		setIsLoadingClient(true);
		await fetchProfile(user);
	}, [user, fetchProfile]);

	const value: AuthContextValue = {
		user,
		userProfile,
		loading: isLoadingClient,
		logout,
		refreshProfile,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
