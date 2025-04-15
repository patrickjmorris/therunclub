import { Suspense } from "react";
// Uncomment and import created components
import TagListTable from "./_components/tag-list-table";
import ConsolidateTagForm from "./_components/consolidate-tag-form";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

// Define the props for the page, accepting searchParams
interface AdminTagManagementPageProps {
	searchParams?: {
		page?: string;
	};
}

export default async function AdminTagManagementPage({
	searchParams,
}: AdminTagManagementPageProps) {
	// Fix: Destructure page safely from searchParams
	const { page } = (await searchParams) || {}; // Default to empty object if undefined
	const currentPage = Number(page) || 1;

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
						<BreadcrumbPage>Tag Management</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="space-y-6">
				{/* Use standard elements for title/description for now */}
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Tag Management</h1>
					<p className="text-muted-foreground">
						View existing tags and manually consolidate variants into canonical
						forms.
					</p>
				</div>

				{/* Section for the consolidation form */}
				<ConsolidateTagForm />

				{/* Section to display existing tags */}
				<Suspense fallback={<div>Loading tags...</div>}>
					{/* Pass calculated currentPage down as a prop */}
					<TagListTable currentPage={currentPage} />
				</Suspense>
			</div>
		</div>
	);
}
