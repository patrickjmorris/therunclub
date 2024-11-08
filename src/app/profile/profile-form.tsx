"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { updateProfile, uploadAvatar } from "./actions";

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
				const result = await uploadAvatar(initialProfile.id, avatarFile);
				if (result.error) {
					throw new Error(result.error);
				}
				avatarUrl = result.publicUrl;
			}

			// Update profile
			const result = await updateProfile(initialProfile.id, {
				fullName,
				avatarUrl,
			});

			if (result.error) {
				throw new Error(result.error);
			}

			toast.success("Profile updated successfully");
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Error updating profile",
			);
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
