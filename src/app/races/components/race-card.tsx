import { format } from "date-fns";
import { Race } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { MapPin, Calendar, Timer, Users } from "lucide-react";

interface RaceCardProps {
	race: Race;
}

export function RaceCard({ race }: RaceCardProps) {
	return (
		<Card className="flex flex-col">
			{race.images?.header && (
				<div className="relative h-32 w-full overflow-hidden rounded-t-lg">
					<img
						src={race.images.header}
						alt={race.name}
						className="object-cover w-full h-full"
					/>
					{race.images.logo && (
						<div className="absolute bottom-2 right-2 h-12 w-12 rounded-full overflow-hidden bg-white shadow-md">
							<img
								src={race.images.logo}
								alt="Race logo"
								className="object-contain w-full h-full p-1"
							/>
						</div>
					)}
				</div>
			)}

			<CardHeader>
				<div className="flex justify-between items-start gap-2">
					<CardTitle className="line-clamp-2">{race.name}</CardTitle>
					<Badge variant={getRegistrationBadgeVariant(race.registrationStatus)}>
						{formatRegistrationStatus(race.registrationStatus)}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="flex-grow space-y-4">
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Calendar className="h-4 w-4" />
						<span>{format(race.date, "PPP")}</span>
					</div>

					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<MapPin className="h-4 w-4" />
						<span>{race.location}</span>
					</div>

					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Timer className="h-4 w-4" />
						<span>{formatDistance(race.distance)}</span>
					</div>

					{race.currentParticipants !== null && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Users className="h-4 w-4" />
							<span>
								{race.currentParticipants}
								{race.maxParticipants && ` / ${race.maxParticipants}`}{" "}
								participants
							</span>
						</div>
					)}
				</div>

				<div className="flex flex-wrap gap-2">
					<Badge variant="secondary">{race.type}</Badge>
					<Badge variant="secondary">{race.terrain}</Badge>
					{race.isVirtual && <Badge variant="secondary">Virtual</Badge>}
					{race.price && (
						<Badge variant="secondary">${(race.price / 100).toFixed(2)}</Badge>
					)}
				</div>
			</CardContent>

			<CardFooter>
				<Button className="w-full" asChild>
					<a
						href={race.website ?? `/races/${race.id}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						View Details
					</a>
				</Button>
			</CardFooter>
		</Card>
	);
}

function formatDistance(meters: number): string {
	const kilometers = meters / 1000;
	if (kilometers >= 1) {
		return `${kilometers.toFixed(1)}km`;
	}
	return `${meters}m`;
}

function formatRegistrationStatus(status: Race["registrationStatus"]): string {
	switch (status) {
		case "not_open":
			return "Not Open";
		case "open":
			return "Registration Open";
		case "closed":
			return "Registration Closed";
		case "waitlist":
			return "Waitlist";
		case null:
			return "Status Unknown";
	}
}

function getRegistrationBadgeVariant(
	status: Race["registrationStatus"],
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "open":
			return "default";
		case "waitlist":
			return "secondary";
		case "closed":
			return "destructive";
		case null:
		case "not_open":
			return "outline";
	}
}
