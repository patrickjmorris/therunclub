import { db } from "@/db";
import { runningClubs } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Facebook,
	Instagram,
	Twitter,
	MapPin,
	ExternalLink,
	Footprints,
	X,
} from "lucide-react";
import { useQueryState } from "nuqs";

async function getClubs(city?: string) {
	if (city) {
		return await db
			.select()
			.from(runningClubs)
			.where(and(eq(runningClubs.city, city)))
			.orderBy(desc(runningClubs.lastUpdated));
	}

	return await db
		.select()
		.from(runningClubs)
		.orderBy(desc(runningClubs.lastUpdated));
}

async function getUniqueCities() {
	const clubs = await db.select().from(runningClubs);
	const cities = [...new Set(clubs.map((club) => club.location.city))];
	return cities.sort();
}

export default async function ClubsPage({
	searchParams,
}: {
	searchParams: { city?: string };
}) {
	const clubs = await getClubs(searchParams.city);
	const cities = await getUniqueCities();

	return (
		<div className="container py-8">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold">Running Clubs</h1>
					<p className="text-muted-foreground mt-2">
						Find and join running clubs in your area
					</p>
				</div>
				<Link href="/clubs/add">
					<Button>Add Club</Button>
				</Link>
			</div>

			{/* City Filter */}
			<div className="mb-8">
				<div className="flex flex-wrap gap-2">
					{cities.map((city) => (
						<Link
							key={city}
							href={
								searchParams.city === city ? "/clubs" : `/clubs?city=${city}`
							}
							className="inline-flex items-center"
						>
							<Badge
								variant={searchParams.city === city ? "default" : "outline"}
								className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground"
							>
								<MapPin className="h-3 w-3 mr-1" />
								{city}
								{searchParams.city === city && <X className="h-3 w-3 ml-1" />}
							</Badge>
						</Link>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{clubs.map((club) => (
					<Card key={club.id} className="flex flex-col">
						<CardHeader>
							<div className="flex items-start justify-between">
								<div>
									<CardTitle>{club.clubName}</CardTitle>
									<CardDescription className="flex items-center mt-1">
										<MapPin className="h-4 w-4 mr-1" />
										{club.location.city}
										{club.location.state && `, ${club.location.state}`}
									</CardDescription>
								</div>
							</div>
						</CardHeader>

						<CardContent className="flex-grow">
							{club.description && (
								<p className="text-sm text-muted-foreground mb-4">
									{club.description}
								</p>
							)}

							{/* {club.metadata?.tags && (
								<div className="flex flex-wrap gap-2 mb-4">
									{club.metadata.tags.map((tag) => (
										<Badge key={tag} variant="outline">
											{tag}
										</Badge>
									))}
								</div>
							)}

							{club.metadata?.meetupSchedule && (
								<p className="text-sm">
									<span className="font-medium">Meetups: </span>
									{club.metadata.meetupSchedule}
								</p>
							)} */}
						</CardContent>

						<CardFooter className="flex flex-wrap gap-2">
							{/* Website Link */}
							{club.website && (
								<Button variant="outline" size="sm" asChild>
									<a
										href={club.website}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center"
									>
										<ExternalLink className="h-4 w-4 mr-2" />
										Website
									</a>
								</Button>
							)}

							{/* Social Media Links */}
							{club.socialMedia?.strava && (
								<Button variant="outline" size="sm" asChild>
									<a
										href={club.socialMedia.strava}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center"
									>
										<Footprints className="h-4 w-4 mr-2" />
										Strava
									</a>
								</Button>
							)}

							{club.socialMedia?.instagram && (
								<Button variant="outline" size="sm" asChild>
									<a
										href={club.socialMedia.instagram}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center"
									>
										<Instagram className="h-4 w-4 mr-2" />
										Instagram
									</a>
								</Button>
							)}

							{club.socialMedia?.twitter && (
								<Button variant="outline" size="sm" asChild>
									<a
										href={club.socialMedia.twitter}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center"
									>
										<Twitter className="h-4 w-4 mr-2" />
										Twitter
									</a>
								</Button>
							)}

							{club.socialMedia?.facebook && (
								<Button variant="outline" size="sm" asChild>
									<a
										href={club.socialMedia.facebook}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center"
									>
										<Facebook className="h-4 w-4 mr-2" />
										Facebook
									</a>
								</Button>
							)}
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
