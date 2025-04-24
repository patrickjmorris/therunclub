"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/login/actions"; // Server action, safe to call from client
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"; // Import client-side Supabase client
import { type User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";

// Define a type for the combined user and profile data
interface UserProfile {
	id: string;
	email: string;
	fullName?: string | null;
	avatarUrl?: string | null;
}

// No longer needs user prop passed in
export function UserNav() {
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const supabase = createClient();

		const fetchUserProfile = async () => {
			setLoading(true);
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();

			if (sessionError) {
				console.error("Error fetching session:", sessionError);
				setLoading(false);
				return;
			}

			if (session?.user) {
				const user = session.user;
				// Fetch profile information
				const { data: profileData, error: profileError } = await supabase
					.from("profiles") // Assuming your table is named 'profiles'
					.select("full_name, avatar_url")
					.eq("id", user.id)
					.single();

				if (profileError) {
					console.error("Error fetching profile:", profileError);
					// Still set user data even if profile fetch fails
					setUserProfile({
						id: user.id,
						// biome-ignore lint/style/noNonNullAssertion: Checked above
						email: user.email!,
					});
				} else {
					setUserProfile({
						id: user.id,
						// biome-ignore lint/style/noNonNullAssertion: Checked above
						email: user.email!,
						fullName: profileData?.full_name,
						avatarUrl: profileData?.avatar_url,
					});
				}
			} else {
				setUserProfile(null);
			}
			setLoading(false);
		};

		fetchUserProfile();

		// Listen for auth changes to update UI in real-time
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			// Re-fetch profile when auth state changes
			// This handles login/logout events happening in other tabs/windows
			fetchUserProfile();
		});

		// Cleanup subscription on unmount
		return () => {
			subscription?.unsubscribe();
		};
	}, []); // Empty dependency array ensures this runs once on mount

	// Show skeleton while loading
	if (loading) {
		return <Skeleton className="h-8 w-8 rounded-full" />;
	}

	// Show login button if not logged in
	if (!userProfile) {
		return (
			<Button variant="ghost" asChild>
				<Link href="/login">Login</Link>
			</Button>
		);
	}

	// Show user menu if logged in
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full">
					<Avatar className="h-8 w-8">
						<AvatarImage
							src={userProfile.avatarUrl ?? undefined}
							alt={userProfile.fullName ?? "User avatar"}
						/>
						<AvatarFallback>
							{userProfile.fullName?.[0] ?? userProfile.email[0].toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">
							{userProfile.fullName}
						</p>
						<p className="text-xs leading-none text-muted-foreground">
							{userProfile.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/profile">Profile</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/dashboard">Dashboard</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-red-600 cursor-pointer"
					onSelect={(event) => {
						event.preventDefault();
						signOut(); // Call the server action to sign out
					}}
				>
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
