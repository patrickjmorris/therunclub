"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
	email: string; // We'll ensure this is non-null in our state
	fullName?: string | null;
	avatarUrl?: string | null;
}

// No longer needs user prop passed in
export function UserNav() {
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	// Wrap fetchUserProfile in useCallback to stabilize its identity
	const fetchUserProfile = useCallback(async () => {
		setLoading(true); // Set loading true at the start of every fetch
		const supabase = createClient();
		try {
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();

			if (sessionError) {
				console.error("[UserNav] Error fetching session:", sessionError);
				setUserProfile(null);
				return; // Exit early on session error
			}

			if (session?.user) {
				const user = session.user;

				if (!user.email) {
					console.error("[UserNav] User object missing email:", user.id);
					setUserProfile(null);
					return; // Exit early if email is missing
				}

				// Fetch profile information
				const { data: profileData, error: profileError } = await supabase
					.from("profiles")
					.select("full_name, avatar_url")
					.eq("id", user.id)
					.single();

				if (profileError) {
					console.error(
						"[UserNav] Error fetching profile:",
						profileError.message || profileError,
					);
					// Set basic user profile even if profile fetch fails
					setUserProfile({
						id: user.id,
						email: user.email,
					});
				} else {
					// Set full profile
					setUserProfile({
						id: user.id,
						email: user.email,
						fullName: profileData?.full_name,
						avatarUrl: profileData?.avatar_url,
					});
				}
			} else {
				setUserProfile(null); // No session, clear profile
			}
		} catch (error) {
			console.error("[UserNav] Unexpected error fetching user profile:", error);
			setUserProfile(null); // Clear profile on unexpected error
		} finally {
			setLoading(false); // Always set loading false at the end
		}
	}, []); // No dependencies needed for useCallback here

	useEffect(() => {
		// Initial fetch on component mount
		fetchUserProfile();

		const supabase = createClient();
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			// Re-fetch profile on any auth change
			fetchUserProfile();

			// Refresh page data on sign in/out to update potentially protected routes
			if (_event === "SIGNED_IN" || _event === "SIGNED_OUT") {
				router.refresh();
			}
		});

		return () => {
			subscription?.unsubscribe();
		};
		// Add fetchUserProfile to dependency array
	}, [fetchUserProfile, router]);

	if (loading) {
		return <Skeleton className="h-8 w-8 rounded-full" />;
	}

	if (!userProfile) {
		return (
			<Button variant="ghost" asChild>
				<Link href="/login">Login</Link>
			</Button>
		);
	}

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
						signOut();
					}}
				>
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
