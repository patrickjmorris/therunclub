import Link from "next/link";
import { X, Globe, Podcast } from "lucide-react";
import { Facebook, Instagram, Youtube } from "@/components/common/brand-icons";
import { convertToAlpha2 } from "@/lib/utils/country-codes";
import { AthleteImage } from "@/components/athletes/AthleteImage";

function getCountryFlag(countryCode: string | null) {
	if (!countryCode) return null;
	const alpha2Code = convertToAlpha2(countryCode);
	const codePoints = alpha2Code
		.toUpperCase()
		.split("")
		.map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
}

interface SocialMedia {
	twitter?: string;
	instagram?: string;
	facebook?: string;
	website?: string;
	youtube?: string;
	podcast?: string;
}

interface ProfileSectionProps {
	name: string;
	bio?: string | null;
	socialMedia?: SocialMedia | null;
	verified?: boolean;
	imageUrl?: string | null;
	countryName?: string | null;
	countryHref?: string;
	countryCode?: string | null;
}

export function ProfileSection({
	name,
	bio,
	socialMedia,
	verified,
	imageUrl,
	countryName,
	countryHref,
	countryCode,
}: ProfileSectionProps) {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-start">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-bold dark:text-gray-100">{name}</h1>
						{verified && (
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
								Verified
							</span>
						)}
					</div>
					{countryName && countryCode && (
						<p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
							<span className="text-xl" aria-hidden="true">
								{getCountryFlag(countryCode)}
							</span>
							{countryHref ? (
								<Link href={countryHref} className="hover:underline">
									{countryName}
								</Link>
							) : (
								<span>{countryName}</span>
							)}
						</p>
					)}
				</div>
			</div>

			<div className="flex flex-col lg:flex-row gap-8">
				<div className="relative w-48 h-48 rounded-lg overflow-hidden shrink-0 mx-auto lg:mx-0">
					<AthleteImage
						src={imageUrl}
						name={name}
						alt={name}
						fill
						sizes="192px"
						priority
						className="object-cover"
					/>
				</div>

				<div className="grow space-y-4">
					{bio && (
						<div className="prose dark:prose-invert max-w-none">
							<p className="text-gray-600 dark:text-gray-300">{bio}</p>
						</div>
					)}

					{socialMedia && (
						<div className="flex gap-4">
							{socialMedia.twitter && (
								<a
									href={`${socialMedia.twitter}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
									title="X (formerly Twitter)"
								>
									<X className="h-5 w-5" />
									<span className="sr-only">X</span>
								</a>
							)}
							{socialMedia.instagram && (
								<a
									href={`${socialMedia.instagram}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
									title="Instagram"
								>
									<Instagram className="h-5 w-5" />
									<span className="sr-only">Instagram</span>
								</a>
							)}
							{socialMedia.facebook && (
								<a
									href={socialMedia.facebook}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
									title="Facebook"
								>
									<Facebook className="h-5 w-5" />
									<span className="sr-only">Facebook</span>
								</a>
							)}
							{socialMedia.website && (
								<a
									href={socialMedia.website}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
									title="Website"
								>
									<Globe className="h-5 w-5" />
									<span className="sr-only">Website</span>
								</a>
							)}
							{socialMedia.youtube && (
								<a
									href={socialMedia.youtube}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
									title="YouTube"
								>
									<Youtube className="h-5 w-5" />
									<span className="sr-only">YouTube</span>
								</a>
							)}
							{socialMedia.podcast && (
								<a
									href={socialMedia.podcast}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
									title="Podcast"
								>
									<Podcast className="h-5 w-5" />
									<span className="sr-only">Podcast</span>
								</a>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
