"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateProfile, updateAthleteImage } from "../actions";
import Image from "next/image";
import { X, Instagram, Facebook, Globe, Youtube, Podcast } from "lucide-react";
import { convertToAlpha2 } from "@/lib/utils/country-codes";

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
	athleteSlug: string;
	name: string;
	bio?: string | null;
	socialMedia?: SocialMedia | null;
	verified?: boolean;
	isAdmin?: boolean;
	imageUrl?: string | null;
	countryName?: string | null;
	countryCode?: string | null;
}

export function ProfileSection({
	athleteSlug,
	name,
	bio,
	socialMedia,
	verified,
	isAdmin,
	imageUrl,
	countryName,
	countryCode,
}: ProfileSectionProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [isLoadingImage, setIsLoadingImage] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = {
			bio: formData.get("bio") as string,
			socialMedia: {
				twitter: formData.get("twitter") as string,
				instagram: formData.get("instagram") as string,
				facebook: formData.get("facebook") as string,
				website: formData.get("website") as string,
				youtube: formData.get("youtube") as string,
				podcast: formData.get("podcast") as string,
			},
			verified: isAdmin ? formData.get("verified") === "on" : verified,
			imageUrl: (formData.get("imageUrl") as string) || undefined,
		};

		try {
			await updateProfile(athleteSlug, data);
			setIsEditing(false);
		} catch (error) {
			console.error("Error updating profile:", error);
			alert("Failed to update profile. Please try again.");
		}
	};

	const handleFetchImage = async () => {
		try {
			setIsLoadingImage(true);
			await updateAthleteImage(athleteSlug);
		} catch (error) {
			console.error("Error fetching image:", error);
			alert("Failed to find a suitable image. Please try again later.");
		} finally {
			setIsLoadingImage(false);
		}
	};

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
							<span>{countryName}</span>
						</p>
					)}
				</div>
				{!isEditing && isAdmin && (
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={handleFetchImage}
							disabled={isLoadingImage}
						>
							{isLoadingImage ? "Finding Image..." : "Find Image"}
						</Button>
						<Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
					</div>
				)}
			</div>

			<div className="flex flex-col lg:flex-row gap-8">
				{imageUrl && (
					<div className="relative w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 mx-auto lg:mx-0">
						<Image
							src={imageUrl}
							alt={name}
							width={192}
							height={192}
							priority
						/>
					</div>
				)}

				<div className="flex-grow space-y-4">
					{bio && (
						<div className="prose dark:prose-invert max-w-none">
							<p className="text-gray-600 dark:text-gray-300">{bio}</p>
						</div>
					)}

					{socialMedia && (
						<div className="flex gap-4">
							{socialMedia.twitter && (
								<a
									href={`https://x.com/${socialMedia.twitter}`}
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
									href={`https://instagram.com/${socialMedia.instagram}`}
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

			{isEditing && (
				<Card className="p-4">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid gap-4">
							<div>
								<Label htmlFor="bio">Bio</Label>
								<Textarea
									id="bio"
									name="bio"
									defaultValue={bio || ""}
									rows={4}
								/>
							</div>
							<div>
								<Label htmlFor="twitter">X Username</Label>
								<Input
									id="twitter"
									name="twitter"
									defaultValue={socialMedia?.twitter || ""}
									placeholder="@username"
								/>
							</div>
							<div>
								<Label htmlFor="instagram">Instagram Username</Label>
								<Input
									id="instagram"
									name="instagram"
									defaultValue={socialMedia?.instagram || ""}
									placeholder="username"
								/>
							</div>
							<div>
								<Label htmlFor="facebook">Facebook URL</Label>
								<Input
									id="facebook"
									name="facebook"
									type="url"
									defaultValue={socialMedia?.facebook || ""}
									placeholder="https://facebook.com/..."
								/>
							</div>
							<div>
								<Label htmlFor="website">Personal Website</Label>
								<Input
									id="website"
									name="website"
									type="url"
									defaultValue={socialMedia?.website || ""}
									placeholder="https://..."
								/>
							</div>
							<div>
								<Label htmlFor="youtube">YouTube Channel</Label>
								<Input
									id="youtube"
									name="youtube"
									type="url"
									defaultValue={socialMedia?.youtube || ""}
									placeholder="https://youtube.com/..."
								/>
							</div>
							<div>
								<Label htmlFor="podcast">Podcast Link</Label>
								<Input
									id="podcast"
									name="podcast"
									type="url"
									defaultValue={socialMedia?.podcast || ""}
									placeholder="https://..."
								/>
							</div>
							<div>
								<Label htmlFor="imageUrl">Image URL</Label>
								<Input
									id="imageUrl"
									name="imageUrl"
									type="url"
									defaultValue={imageUrl || ""}
									placeholder="https://..."
								/>
							</div>
							{isAdmin && (
								<div className="flex items-center space-x-2">
									<Switch
										id="verified"
										name="verified"
										defaultChecked={verified}
									/>
									<Label htmlFor="verified">Verified Athlete</Label>
								</div>
							)}
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsEditing(false)}
							>
								Cancel
							</Button>
							<Button type="submit">Save Changes</Button>
						</div>
					</form>
				</Card>
			)}
		</div>
	);
}
