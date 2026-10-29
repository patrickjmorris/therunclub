import Link from "next/link";
import { ExternalLink, Footprints, MapPin } from "lucide-react";
import { Instagram } from "@/components/common/brand-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { RunningClub } from "@/db/schema";
import type { OpenGraphData } from "@/lib/og";
import { ClubLinkPreview } from "./club-link-preview";

interface ClubCardProps {
	club: RunningClub;
	ogData?: OpenGraphData | null;
	cityHref?: string;
}

export function ClubCard({ club, ogData, cityHref }: ClubCardProps) {
	const place = `${club.location.city}${
		club.location.state ? `, ${club.location.state}` : ""
	}`;
	const schedule = club.metadata?.meetupSchedule;
	const level = club.metadata?.difficultyLevel;
	const links = [
		{ href: club.website, label: "Website", Icon: ExternalLink },
		{ href: club.socialMedia?.strava, label: "Strava", Icon: Footprints },
		{ href: club.socialMedia?.instagram, label: "Instagram", Icon: Instagram },
	].filter((link): link is typeof link & { href: string } =>
		Boolean(link.href),
	);

	return (
		<Card className="flex flex-col">
			<CardHeader>
				<CardTitle>{club.clubName}</CardTitle>
				<CardDescription className="flex items-center mt-1">
					<MapPin className="h-4 w-4 mr-1" />
					{cityHref ? (
						<Link href={cityHref} className="hover:underline">
							{place}
						</Link>
					) : (
						place
					)}
				</CardDescription>
			</CardHeader>

			<CardContent className="grow space-y-2">
				{club.website && ogData && (
					<ClubLinkPreview website={club.website} ogData={ogData} />
				)}
				{club.description && (
					<p className="text-sm text-muted-foreground">{club.description}</p>
				)}
				{schedule && <p className="text-sm">Meets: {schedule}</p>}
				{level && <Badge variant="secondary">{level}</Badge>}
			</CardContent>

			{links.length > 0 && (
				<CardFooter className="flex flex-wrap gap-2">
					{links.map(({ href, label, Icon }) => (
						<Button key={label} variant="outline" size="sm" asChild>
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center"
							>
								<Icon className="h-4 w-4 mr-2" />
								{label}
							</a>
						</Button>
					))}
				</CardFooter>
			)}
		</Card>
	);
}
