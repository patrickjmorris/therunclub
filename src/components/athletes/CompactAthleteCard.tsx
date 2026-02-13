import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { RecentlyMentionedAthlete } from "@/lib/services/athlete-service";
import { AthleteImage } from "@/components/athletes/AthleteImage";

interface CompactAthleteCardProps {
	athlete: RecentlyMentionedAthlete;
}

export function CompactAthleteCard({ athlete }: CompactAthleteCardProps) {
	if (!athlete.slug) {
		// Handle case where slug might be missing - ideally shouldn't happen with isNotNull filter
		console.warn("Athlete missing slug:", athlete.name);
		return null;
	}

	return (
		<Link
			href={`/athletes/${athlete.slug}`}
			className="block w-[150px] flex-shrink-0"
		>
			<Card className="w-[150px] overflow-hidden transition-transform hover:scale-105">
				<CardContent className="p-0 flex flex-col items-center">
					<div className="aspect-square w-full relative mb-2">
						<AthleteImage
							src={athlete.imageUrl}
							name={athlete.name}
							alt={athlete.name || "Athlete"}
							fill
							sizes="150px"
							className="object-cover rounded-full border-2 border-background"
							priority // Prioritize loading images in the initial viewport
						/>
					</div>
					<div className="h-10 w-full flex items-center justify-center px-2 text-center">
						<h3
							className="text-sm font-semibold leading-tight truncate"
							title={athlete.name}
						>
							{athlete.name}
						</h3>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
