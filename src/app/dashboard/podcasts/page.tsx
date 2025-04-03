import { redirect } from "next/navigation";
import { canManageContent } from "@/lib/auth-utils";
import { getAllPodcastsForManagement } from "@/app/actions/podcasts";
import PodcastManagementClient from "@/app/dashboard/podcasts/podcast-management-client";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default async function PodcastsPage() {
	const hasPermission = await canManageContent();

	if (!hasPermission) {
		redirect("/");
	}

	const podcasts = await getAllPodcastsForManagement();

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
						<BreadcrumbLink asChild>
							<Link href="/dashboard">Dashboard</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Podcasts</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<PodcastManagementClient initialPodcasts={podcasts} />
		</div>
	);
}
