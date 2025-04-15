import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getUniqueTags } from "@/app/actions/admin/tag-actions";
import { Badge } from "@/components/ui/badge";
import { SimplePagination } from "./simple-pagination";

const TAGS_PER_PAGE = 50;

interface TagCount {
	tag: string;
	count: number;
}

interface TagListTableProps {
	currentPage: number;
}

export default async function TagListTable({ currentPage }: TagListTableProps) {
	const offset = (currentPage - 1) * TAGS_PER_PAGE;

	const { tags, totalCount, success, error } = await getUniqueTags(
		TAGS_PER_PAGE,
		offset,
	);

	if (!success) {
		return <p className="text-destructive">Error loading tags: {error}</p>;
	}

	if (tags.length === 0) {
		return <p>No tags found.</p>;
	}

	const totalPages = Math.ceil(totalCount / TAGS_PER_PAGE);

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Showing {tags.length} of {totalCount} unique tags.
			</p>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[70%]">Tag</TableHead>
						<TableHead className="text-right">Count</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{tags.map(({ tag, count }: TagCount) => (
						<TableRow key={tag}>
							<TableCell className="font-medium">{tag}</TableCell>
							<TableCell className="text-right">
								<Badge variant="secondary">{count}</Badge>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{totalPages > 1 && (
				<SimplePagination currentPage={currentPage} totalPages={totalPages} />
			)}
		</div>
	);
}
