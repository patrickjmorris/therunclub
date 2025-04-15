"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { getAthleteData } from "@/lib/services/athlete-service";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

// Define the form schema using Zod
const formSchema = z.object({
	bio: z.string().optional(),
	imageUrl: z.string().url().or(z.literal("")).optional(),
	socialMedia: z
		.object({
			twitter: z.string().url().or(z.literal("")).optional(),
			instagram: z.string().url().or(z.literal("")).optional(),
			facebook: z.string().url().or(z.literal("")).optional(),
			website: z.string().url().or(z.literal("")).optional(),
			strava: z.string().url().or(z.literal("")).optional(),
		})
		.optional(),
	verified: z.boolean().optional(),
	// Add other fields you want to make editable here
});

type AthleteFormData = z.infer<typeof formSchema>;

interface AthleteEditFormProps {
	athlete: Awaited<ReturnType<typeof getAthleteData>>;
	updateAction: (slug: string, data: Partial<AthleteFormData>) => Promise<void>;
}

export function AthleteEditForm({
	athlete,
	updateAction,
}: AthleteEditFormProps) {
	const router = useRouter();
	const form = useForm<AthleteFormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			bio: athlete?.bio || "",
			imageUrl: athlete?.imageUrl || "",
			socialMedia: {
				twitter: athlete?.socialMedia?.twitter || "",
				instagram: athlete?.socialMedia?.instagram || "",
				facebook: athlete?.socialMedia?.facebook || "",
				website: athlete?.socialMedia?.website || "",
				strava: athlete?.socialMedia?.strava || "",
			},
			verified: athlete?.verified ?? false,
		},
	});

	const { isSubmitting } = form.formState;
	const currentImageUrl = form.watch("imageUrl");

	async function onSubmit(values: AthleteFormData) {
		if (!athlete) return;

		await toast.promise(updateAction(athlete.slug, values), {
			loading: "Updating profile...",
			success: () => {
				router.push(`/athletes/${athlete.slug}`);
				// router.refresh(); // Optionally refresh if staying on the page
				return "Profile updated successfully!";
			},
			error: (err) => err?.message || "Failed to update profile.",
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormItem>
					<FormLabel>Current Profile Image</FormLabel>
					<div className="mt-2">
						{currentImageUrl ? (
							<Image
								src={currentImageUrl}
								alt={`${athlete?.name || "Athlete"}'s profile picture`}
								width={128}
								height={128}
								className="rounded-md object-cover"
								onError={(e) => {
									e.currentTarget.style.display = "none";
								}}
							/>
						) : (
							<div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400">
								No Image
							</div>
						)}
					</div>
				</FormItem>

				<FormField
					control={form.control}
					name="imageUrl"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Profile Image URL</FormLabel>
							<FormControl>
								<Input placeholder="https://example.com/image.jpg" {...field} />
							</FormControl>
							<FormDescription>
								Enter the URL of the new profile image. The image will be
								processed automatically.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="bio"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Bio</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Tell us about the athlete..."
									className="resize-y min-h-[100px]"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="socialMedia.twitter"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Twitter URL</FormLabel>
							<FormControl>
								<Input placeholder="https://twitter.com/username" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="socialMedia.instagram"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Instagram URL</FormLabel>
							<FormControl>
								<Input
									placeholder="https://instagram.com/username"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="socialMedia.facebook"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Facebook URL</FormLabel>
							<FormControl>
								<Input placeholder="https://facebook.com/username" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="socialMedia.website"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Personal Website URL</FormLabel>
							<FormControl>
								<Input placeholder="https://example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="socialMedia.strava"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Strava Profile URL</FormLabel>
							<FormControl>
								<Input
									placeholder="https://www.strava.com/athletes/..."
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="verified"
					render={({ field }) => (
						<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 dark:border-gray-700">
							<div className="space-y-0.5">
								<FormLabel className="text-base">Verified Profile</FormLabel>
								<FormDescription>
									Mark this profile as verified by The Run Club.
								</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{isSubmitting ? "Saving..." : "Save Changes"}
				</Button>
			</form>
		</Form>
	);
}
