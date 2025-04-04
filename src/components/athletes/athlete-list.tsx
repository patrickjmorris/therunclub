"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AthleteReference {
	id: string;
	name: string;
	imageUrl: string | null;
	slug: string;
}

export function AthleteList({ mentions }: { mentions: AthleteReference[] }) {
	const [showAll, setShowAll] = useState(false);
	const displayedMentions = showAll ? mentions : mentions.slice(0, 3);
	const hasMore = mentions.length > 3;

	return (
		<div className="space-y-4">
			<div className="grid gap-4">
				{displayedMentions.map((mention) => (
					<Card key={mention.id}>
						<CardContent className="p-4">
							<div className="flex items-start gap-4">
								<Avatar className="h-12 w-12">
									<AvatarImage
										src={mention.imageUrl ?? ""}
										alt={mention.name}
									/>
									<AvatarFallback>
										{mention.name.substring(0, 2)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 space-y-2">
									<div className="flex items-start justify-between gap-2">
										<div className="space-y-1">
											<Link
												href={`/athletes/${mention.slug}`}
												className="text-lg font-medium hover:underline"
											>
												{mention.name}
											</Link>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			{hasMore && (
				<div className="flex justify-center">
					<Button
						variant="outline"
						onClick={() => setShowAll(!showAll)}
						className="mt-4"
					>
						{showAll ? "Show Less" : `Show All (${mentions.length})`}
					</Button>
				</div>
			)}
		</div>
	);
}
