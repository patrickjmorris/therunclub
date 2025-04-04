import { CommandMenu } from "@/components/common/command-menu";
import { MainNav } from "@/components/common/nav/main-nav";
import { MobileNav } from "@/components/common/mobile-nav";
import { ModeToggle } from "@/components/common/mode-toggle";
import { UserNav } from "@/components/common/nav/user-nav";
import { createClient } from "@/utils/supabase/server";
import { getProfile } from "@/lib/services/profile-service";

export async function SiteHeader() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	let profileData = null;
	if (user) {
		const [profile] = await getProfile(user.id);
		profileData = profile;
	}

	const profile = user
		? {
				// biome-ignore lint/style/noNonNullAssertion: primary key
				email: user.email!,
				fullName: profileData?.fullName,
				avatarUrl: profileData?.avatarUrl,
		  }
		: null;
	return (
		<header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 max-w-screen-2xl items-center">
				<MainNav />
				<MobileNav />
				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<div className="w-full flex-1 md:w-auto md:flex-none">
						<CommandMenu />
					</div>

					<div className="ml-auto flex items-center space-x-4">
						<UserNav user={profile} />
						<ModeToggle />
					</div>
				</div>
			</div>
		</header>
	);
}
