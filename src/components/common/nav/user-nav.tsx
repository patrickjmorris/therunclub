"use client";

import { useState, useEffect } from "react";
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

	useEffect(() => {
		const supabase = createClient();

		const fetchUserProfile = async (isInitialFetch = false) => {
			if (isInitialFetch) setLoading(true);
			const {
				data: { session },
				error: sessionError,
			} = await supabase.auth.getSession();

			if (sessionError) {
				console.error("[UserNav] Error fetching session:", sessionError);
				if (isInitialFetch) setLoading(false);
				return;
			}

			if (session?.user) {
				const user = session.user;

				// Ensure email exists before proceeding
				if (!user.email) {
					console.error("[UserNav] User object missing email:", user.id);
					setUserProfile(null); // Treat as logged out if email is missing
					if (isInitialFetch) setLoading(false);
					return;
				}

				if (userProfile?.id === user.id && !isInitialFetch) {
					if (isInitialFetch) setLoading(false);
					return;
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
					// Set basic user profile (email is checked above)
					setUserProfile({
						id: user.id,
						email: user.email, // Now safe
					});
				} else {
					// Set full profile (email is checked above)
					setUserProfile({
						id: user.id,
						email: user.email, // Now safe
						fullName: profileData?.full_name,
						avatarUrl: profileData?.avatar_url,
					});
				}
			} else {
				setUserProfile(null);
			}
			if (isInitialFetch) setLoading(false);
		};

		fetchUserProfile(true);

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (_event, session) => {
			await fetchUserProfile(false);

			if (_event === "SIGNED_IN" && !userProfile) {
				router.refresh();
			}

			if (_event === "SIGNED_OUT") {
				router.refresh();
			}
		});

		return () => {
			subscription?.unsubscribe();
		};
	}, [userProfile, router]);

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
