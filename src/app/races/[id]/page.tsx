import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { getRaceById } from "@/app/actions/races";
import { MapPin, Calendar, Trophy, Users } from "lucide-react";

interface RacePageProps {
	params: {
		id: string;
	};
}

export default async function RacePage({ params }: RacePageProps) {
	const race = await getRaceById(params.id);

	if (!race) {
		notFound();
	}

	return (
		<Shell>
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-4xl font-bold mb-6">{race.name}</h1>

					<div className="grid gap-8 md:grid-cols-2">
						{/* Main Info */}
						<div className="space-y-6">
							<div className="flex items-start gap-3">
								<Calendar className="w-5 h-5 mt-1 text-muted-foreground" />
								<div>
									<h3 className="font-semibold">Date</h3>
									<p>{format(new Date(race.date), "PPP")}</p>
									{race.registrationDeadline && (
										<p className="text-sm text-muted-foreground mt-1">
											Registration deadline:{" "}
											{format(new Date(race.registrationDeadline), "PPP")}
										</p>
									)}
								</div>
							</div>

							<div className="flex items-start gap-3">
								<MapPin className="w-5 h-5 mt-1 text-muted-foreground" />
								<div>
									<h3 className="font-semibold">Location</h3>
									<p>{race.location}</p>
								</div>
							</div>

							<div className="flex flex-col gap-8">
								<div>
									<h3 className="font-semibold">Race Details</h3>
									<p>Distance: {(race.distance / 1000).toFixed(1)} km</p>
									<p className="capitalize">Type: {race.type}</p>
									<p className="capitalize">Terrain: {race.terrain}</p>
									{race.elevation && <p>Elevation: {race.elevation}m</p>}
								</div>
							</div>

							{(race.maxParticipants || race.currentParticipants) && (
								<div className="flex items-start gap-3">
									<Users className="w-5 h-5 mt-1 text-muted-foreground" />
									<div>
										<h3 className="font-semibold">Participants</h3>
										<p>
											{race.currentParticipants || 0}
											{race.maxParticipants ? ` / ${race.maxParticipants}` : ""}{" "}
											registered
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Registration and Description */}
						<div className="space-y-6">
							{race.price && (
								<div>
									<h3 className="font-semibold mb-2">Registration Fee</h3>
									<p className="text-2xl font-bold">
										${(race.price / 100).toFixed(2)}
									</p>
								</div>
							)}

							{race.description && (
								<div>
									<h3 className="font-semibold mb-2">About the Race</h3>
									<p className="text-muted-foreground">{race.description}</p>
								</div>
							)}

							{race.website && (
								<Button
									className="w-full"
									onClick={() =>
										race.website && window.open(race.website, "_blank")
									}
								>
									Register Now
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</Shell>
	);
}
