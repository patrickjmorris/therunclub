"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
}

export function SimplePagination({
	currentPage,
	totalPages,
}: PaginationControlsProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const createPageURL = (pageNumber: number | string) => {
		const params = new URLSearchParams(searchParams);
		params.set("page", pageNumber.toString());
		return `${pathname}?${params.toString()}`;
	};

	const isFirstPage = currentPage <= 1;
	const isLastPage = currentPage >= totalPages;

	return (
		<div className="flex items-center justify-center space-x-2 py-4">
			<Button
				asChild
				variant="outline"
				size="icon"
				disabled={isFirstPage}
				aria-disabled={isFirstPage}
			>
				<Link href={createPageURL(currentPage - 1)} scroll={false}>
					<span className="sr-only">Previous page</span>
					<ChevronLeftIcon className="h-4 w-4" />
				</Link>
			</Button>
			<span className="text-sm text-muted-foreground">
				Page {currentPage} of {totalPages}
			</span>
			<Button
				asChild
				variant="outline"
				size="icon"
				disabled={isLastPage}
				aria-disabled={isLastPage}
			>
				<Link href={createPageURL(currentPage + 1)} scroll={false}>
					<span className="sr-only">Next page</span>
					<ChevronRightIcon className="h-4 w-4" />
				</Link>
			</Button>
		</div>
	);
}
