// import Link from "next/link";
// import { createClient } from "@/utils/supabase/server";
// import { UserNav } from "./user-nav";
// import { getProfile } from "@/lib/services/profile-service";

// export async function MainNav() {
// 	const supabase = await createClient();
// 	const {
// 		data: { user },
// 	} = await supabase.auth.getUser();

// 	let profileData = null;
// 	if (user) {
// 		const [profile] = await getProfile(user.id);
// 		profileData = profile;
// 	}

// 	const profile = user
// 		? {
// 				// biome-ignore lint/style/noNonNullAssertion: primary key
// 				email: user.email!,
// 				fullName: profileData?.fullName,
// 				avatarUrl: profileData?.avatarUrl,
// 		  }
// 		: null;

// 	return (
// 		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
// 			<div className="container flex h-14 items-center">
// 				<div className="mr-4 flex">
// 					<Link href="/" className="mr-6 flex items-center space-x-2">
// 						<span className="font-bold">Your App</span>
// 					</Link>
// 					<nav className="flex items-center space-x-6 text-sm font-medium">
// 						<Link
// 							href="/podcasts"
// 							className="transition-colors hover:text-foreground/80"
// 						>
// 							Podcasts
// 						</Link>
// 						<Link
// 							href="/videos"
// 							className="transition-colors hover:text-foreground/80"
// 						>
// 							Videos
// 						</Link>
// 					</nav>
// 				</div>
// 				<div className="ml-auto flex items-center space-x-4">
// 					<UserNav user={profile} />
// 				</div>
// 			</div>
// 		</header>
// 	);
// }

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { docsConfig } from "@/config/docs";

export function MainNav() {
	const pathname = usePathname();

	return (
		<div className="mr-4 hidden md:flex">
			<Link href="/" className="mr-6 flex items-center space-x-2">
				<Icons.logo className="h-6 w-6" />
				<span className="hidden font-bold sm:inline-block">
					{siteConfig.name}
				</span>
			</Link>
			<nav className="flex items-center space-x-6 text-sm font-medium">
				{docsConfig.mainNav.map((item) => (
					<Link
						key={item.href}
						prefetch={true}
						href={item.href || "#"}
						className={cn(
							"transition-colors hover:text-foreground/80",
							pathname === item.href ? "text-foreground" : "text-foreground/60",
						)}
					>
						{item.title}
					</Link>
				))}
			</nav>
		</div>
	);
}
