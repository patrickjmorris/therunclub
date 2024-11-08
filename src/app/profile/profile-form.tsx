"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { profiles } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
interface ProfileFormProps {
	initialProfile: {
		id: string;
		fullName?: string;
		avatarUrl?: string;
	};
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const supabase = createClient();

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsLoading(true);

		try {
			const formData = new FormData(event.currentTarget);
			const fullName = formData.get("fullName") as string;
			const avatarFile = formData.get("avatar") as File;

			let avatarUrl = initialProfile.avatarUrl;

			// Upload new avatar if provided
			if (avatarFile.size > 0) {
				const fileExt = avatarFile.name.split(".").pop();
				const fileName = `${initialProfile.id}/${Date.now()}.${fileExt}`;

				const { error: uploadError, data } = await supabase.storage
					.from("avatars")
					.upload(fileName, avatarFile, {
						upsert: true,
						cacheControl: "3600",
					});

				if (uploadError) throw uploadError;

				const {
					data: { publicUrl },
				} = supabase.storage.from("avatars").getPublicUrl(fileName);

				avatarUrl = publicUrl;
			}

			// Update profile
			try {
				await db
					.update(profiles)
					.set({
						fullName: fullName,
						avatarUrl: avatarUrl,
						updatedAt: new Date(),
					})
					.where(eq(profiles.id, initialProfile.id));

				toast.success("Profile updated successfully");
				router.refresh();
			} catch (error) {
				// You can be more specific with error messages
				if (error instanceof Error) {
					toast.error(`Failed to update profile: ${error.message}`);
				} else {
					toast.error("Failed to update profile");
				}
				console.error(error);
			}
		} catch (error) {
			toast.error("Error updating profile");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card>
			<CardContent className="pt-6">
				<form onSubmit={onSubmit} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="avatar">Profile Picture</Label>
						<div className="flex items-center space-x-4">
							<Avatar className="h-16 w-16">
								<AvatarImage src={initialProfile.avatarUrl ?? ""} />
								<AvatarFallback>
									{initialProfile?.fullName?.[0] ?? "U"}
								</AvatarFallback>
							</Avatar>
							<Input id="avatar" name="avatar" type="file" accept="image/*" />
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="fullName">Full Name</Label>
						<Input
							id="fullName"
							name="fullName"
							defaultValue={initialProfile.fullName ?? ""}
							placeholder="Enter your full name"
						/>
					</div>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "Saving..." : "Save Changes"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
