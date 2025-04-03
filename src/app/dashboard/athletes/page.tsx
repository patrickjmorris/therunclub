import { getAthletesForManagement } from "@/app/actions/athlete-management";
import { getAllCategories } from "@/lib/services/athlete-service";
import { canManageContent } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import AthleteManagementClient from "./athlete-management-client";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default async function AthletesPage() {
	const hasPermission = await canManageContent();

	if (!hasPermission) {
		redirect("/");
	}

	const [athletes, categories] = await Promise.all([
		getAthletesForManagement(),
		getAllCategories(),
	]);

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
						<BreadcrumbPage>Athletes</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<AthleteManagementClient
				initialAthletes={athletes}
				initialCategories={categories}
			/>
		</div>
	);
}
