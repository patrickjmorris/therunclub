import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { RecentlyMentionedAthlete } from "@/lib/services/athlete-service";

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
		<Link href={`/athletes/${athlete.slug}`} className="block w-[150px]">
			<Card className="overflow-hidden transition-transform hover:scale-105">
				<CardContent className="p-0 flex flex-col items-center text-center">
					<div className="aspect-square w-full relative mb-2">
						<Image
							src={athlete.imageUrl || "/placeholder-athlete.svg"} // Use a placeholder if no image
							alt={athlete.name || "Athlete"}
							fill
							className="object-cover rounded-full border-2 border-background"
							priority // Prioritize loading images in the initial viewport
						/>
					</div>
					<div className="p-2 pt-0">
						<h3 className="text-sm font-semibold truncate" title={athlete.name}>
							{athlete.name}
						</h3>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
