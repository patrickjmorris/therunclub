import { getProfile } from "@/lib/services/profile-service";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canManageContent } from "@/lib/auth-utils";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function DashboardPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/login");
	}

	// Get profile data using Drizzle
	const profile = await getProfile(user.id);
	const canManage = await canManageContent();

	if (!canManage) {
		redirect("/");
	}

	return (
		<div className="container py-6 space-y-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Dashboard</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<h1 className="text-2xl font-bold mb-8">
				Welcome back, {profile?.[0]?.fullName || user.email}
			</h1>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Link
					href="/dashboard/athletes"
					className="p-4 border rounded-lg hover:bg-accent transition-colors"
				>
					<h2 className="text-xl font-semibold mb-2">Athletes</h2>
					<p className="text-muted-foreground">
						Manage athlete profiles and their disciplines
					</p>
				</Link>

				<Link
					href="/dashboard/podcasts"
					className="p-4 border rounded-lg hover:bg-accent transition-colors"
				>
					<h2 className="text-xl font-semibold mb-2">Podcasts</h2>
					<p className="text-muted-foreground">
						Manage podcast feeds and episodes
					</p>
				</Link>

				<Link
					href="/dashboard/videos"
					className="p-4 border rounded-lg hover:bg-accent transition-colors"
				>
					<h2 className="text-xl font-semibold mb-2">Videos</h2>
					<p className="text-muted-foreground">
						Manage YouTube channels and videos
					</p>
				</Link>
			</div>

			<div className="hidden">
				<code>{JSON.stringify(profile, null, 2)}</code>
				<code>{JSON.stringify(user, null, 2)}</code>
			</div>
		</div>
	);
}
