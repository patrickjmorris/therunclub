import Link from "next/link";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, MapPinIcon, ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate as formatRunSignupDate } from "@/lib/utils/event-helpers";
import { format as formatDateFns } from "date-fns";
import { RaceImageWithFallback } from "./RaceImageWithFallback";

interface RaceCardProps {
	title: string;
	imageUrl?: string | null;
	location: string;
	date: string | Date;
	isOpen: boolean;
	raceId: number | string;
	className?: string;
}

const FALLBACK_IMAGE_URL = "/race-placeholder.png";

export function RaceCard({
	title,
	imageUrl,
	location,
	date,
	isOpen,
	raceId,
	className,
}: RaceCardProps) {
	const formattedDate =
		typeof date === "string"
			? formatRunSignupDate(date)
			: date instanceof Date
			  ? formatDateFns(date, "MMM dd, yyyy")
			  : "Invalid Date";
	const displayImageUrl = imageUrl || FALLBACK_IMAGE_URL;

	return (
		<Card
			className={cn("w-full max-w-sm overflow-hidden flex flex-col", className)}
		>
			<CardHeader className="p-0 relative">
				<RaceImageWithFallback
					src={imageUrl}
					fallbackSrc={FALLBACK_IMAGE_URL}
					alt={`Image for ${title}`}
					width={400}
					height={200}
					className="object-cover w-full h-48"
				/>
				{isOpen && (
					<Badge variant="destructive" className="absolute top-2 right-2">
						Open Now
					</Badge>
				)}
			</CardHeader>
			<CardContent className="p-4 space-y-2 flex-grow">
				<CardTitle className="text-lg font-semibold line-clamp-2">
					{title}
				</CardTitle>
				<div className="flex items-center text-sm text-muted-foreground">
					<MapPinIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
					<span>{location}</span>
				</div>
				<div className="flex items-center text-sm text-muted-foreground">
					<CalendarIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
					<span>{formattedDate}</span>
				</div>
			</CardContent>
			<CardFooter className="p-4 pt-0">
				<Button variant="outline" size="sm" asChild className="w-full">
					<Link href={`/races/${raceId}`}>
						View Details
						<ArrowRightIcon className="ml-1.5 h-4 w-4" />
					</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}
