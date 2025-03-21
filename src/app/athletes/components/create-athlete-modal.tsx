"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createAthlete } from "../actions";

const athleteFormSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	slug: z.string().min(2, "Slug must be at least 2 characters"),
	categoryId: z.string().uuid("Invalid category"),
	worldAthleticsId: z.string().optional(),
	countryCode: z.string().optional(),
	countryName: z.string().optional(),
	dateOfBirth: z.string().optional(),
	bio: z.string().optional(),
	socialMedia: z
		.object({
			twitter: z.string().optional(),
			instagram: z.string().optional(),
			facebook: z.string().optional(),
			website: z.string().optional(),
			strava: z.string().optional(),
		})
		.optional(),
});

type AthleteFormValues = z.infer<typeof athleteFormSchema>;

interface CreateAthleteModalProps {
	categories: {
		id: string;
		name: string;
	}[];
	trigger?: React.ReactNode;
	canEdit?: boolean;
}

export function CreateAthleteModal({
	categories,
	trigger,
	canEdit = false,
}: CreateAthleteModalProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Don't render anything if user can't edit
	if (!canEdit) return null;

	const form = useForm<AthleteFormValues>({
		resolver: zodResolver(athleteFormSchema),
		defaultValues: {
			name: "",
			slug: "",
			categoryId: "",
			worldAthleticsId: "",
			countryCode: "",
			countryName: "",
			dateOfBirth: "",
			bio: "",
			socialMedia: {
				twitter: "",
				instagram: "",
				facebook: "",
				website: "",
				strava: "",
			},
		},
	});

	async function onSubmit(data: AthleteFormValues) {
		try {
			setIsLoading(true);
			await createAthlete(data);
			toast.success("Athlete created successfully");
			setOpen(false);
			form.reset();
			// Redirect to the new athlete's page
			router.push(`/athletes/${data.slug}`);
		} catch (error) {
			console.error("Error creating athlete:", error);
			toast.error("Failed to create athlete");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || <Button>Create Athlete</Button>}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Athlete</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6 py-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="Athlete name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="slug"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Slug</FormLabel>
									<FormControl>
										<Input placeholder="athlete-name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="categoryId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Category</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a category" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{categories.map((category) => (
												<SelectItem key={category.id} value={category.id}>
													{category.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="worldAthleticsId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>World Athletics ID</FormLabel>
									<FormControl>
										<Input placeholder="Optional" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="countryCode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Country Code</FormLabel>
										<FormControl>
											<Input placeholder="USA" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="countryName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Country Name</FormLabel>
										<FormControl>
											<Input placeholder="United States" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="dateOfBirth"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date of Birth</FormLabel>
									<FormControl>
										<Input type="date" {...field} />
									</FormControl>
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
											placeholder="Athlete biography"
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="space-y-4">
							<h3 className="text-lg font-medium">Social Media</h3>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="socialMedia.twitter"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Twitter</FormLabel>
											<FormControl>
												<Input placeholder="@username" {...field} />
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
											<FormLabel>Instagram</FormLabel>
											<FormControl>
												<Input placeholder="@username" {...field} />
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
											<FormLabel>Facebook</FormLabel>
											<FormControl>
												<Input placeholder="URL" {...field} />
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
											<FormLabel>Website</FormLabel>
											<FormControl>
												<Input placeholder="URL" {...field} />
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
											<FormLabel>Strava</FormLabel>
											<FormControl>
												<Input placeholder="URL" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Creating..." : "Create Athlete"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
