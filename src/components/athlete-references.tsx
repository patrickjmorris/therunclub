import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AthleteReference {
	id: string;
	context: string;
	confidence: string;
	source: "title" | "description";
	athlete: {
		id: string;
		name: string;
		imageUrl: string | null;
		slug: string;
		bio: string | null;
	};
}

interface AthleteReferencesProps {
	references: AthleteReference[];
	title?: string;
}

export function AthleteReferences({
	references,
	title = "Athletes Mentioned",
}: AthleteReferencesProps) {
	if (references.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			<h3 className="text-lg font-semibold">{title}</h3>
			<div className="grid gap-4">
				{references.map((reference) => (
					<Card key={reference.id}>
						<CardContent className="p-4">
							<div className="flex items-start gap-4">
								<Avatar className="h-12 w-12">
									<AvatarImage
										src={reference.athlete.imageUrl ?? ""}
										alt={reference.athlete.name}
									/>
									<AvatarFallback>
										{reference.athlete.name.substring(0, 2)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 space-y-2">
									<div className="flex items-start justify-between gap-2">
										<div className="space-y-1">
											<Link
												href={`/athletes/${reference.athlete.slug}`}
												className="text-lg font-medium hover:underline"
											>
												{reference.athlete.name}
											</Link>
											{reference.athlete.bio && (
												<p className="text-sm text-muted-foreground line-clamp-2">
													{reference.athlete.bio}
												</p>
											)}
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
