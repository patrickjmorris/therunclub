import Link from "next/link";
import { Fragment } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/common/json-ld";
import { breadcrumbList } from "@/lib/seo";

type Crumb = { name: string; path: string };

// The last crumb is the current page.
export function PageBreadcrumbs({ items }: { items: Crumb[] }) {
	const last = items.length - 1;
	return (
		<>
			<Breadcrumb className="mb-6">
				<BreadcrumbList>
					{items.map((item, index) => (
						<Fragment key={item.path}>
							<BreadcrumbItem>
								{index === last ? (
									<BreadcrumbPage>{item.name}</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link href={item.path}>{item.name}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{index < last && <BreadcrumbSeparator />}
						</Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>
			<JsonLd data={breadcrumbList(items)} />
		</>
	);
}
