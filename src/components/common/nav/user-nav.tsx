"use client";

// (state handled by AuthContext)
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
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

// No longer needs user prop passed in
export function UserNav() {
	const { userProfile, loading, logout } = useAuth();

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
						logout();
					}}
				>
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
