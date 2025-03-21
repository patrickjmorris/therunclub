"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCategory, deleteCategory, updateCategory } from "../actions";

const categoryFormSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface Category {
	id: string;
	name: string;
	description: string | null;
}

interface CategoryManagementProps {
	categories: Category[];
}

export function CategoryManagement({ categories }: CategoryManagementProps) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);

	const form = useForm<CategoryFormValues>({
		resolver: zodResolver(categoryFormSchema),
		defaultValues: {
			name: "",
			description: "",
		},
	});

	async function onSubmit(data: CategoryFormValues) {
		try {
			setIsLoading(true);
			if (editingCategory) {
				await updateCategory(editingCategory.id, data);
				toast.success("Category updated successfully");
			} else {
				await createCategory(data);
				toast.success("Category created successfully");
			}
			setOpen(false);
			form.reset();
			setEditingCategory(null);
		} catch (error) {
			console.error("Error saving category:", error);
			toast.error("Failed to save category");
		} finally {
			setIsLoading(false);
		}
	}

	async function handleDelete(categoryId: string) {
		try {
			await deleteCategory(categoryId);
			toast.success("Category deleted successfully");
		} catch (error) {
			console.error("Error deleting category:", error);
			toast.error("Failed to delete category");
		}
	}

	function handleEdit(category: Category) {
		setEditingCategory(category);
		form.reset({
			name: category.name,
			description: category.description || "",
		});
		setOpen(true);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-semibold">Athlete Categories</h2>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>Add Category</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{editingCategory ? "Edit Category" : "Create Category"}
							</DialogTitle>
						</DialogHeader>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4"
							>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input placeholder="Category name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Category description"
													className="resize-none"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex justify-end gap-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setOpen(false);
											setEditingCategory(null);
										}}
									>
										Cancel
									</Button>
									<Button type="submit" disabled={isLoading}>
										{isLoading
											? "Saving..."
											: editingCategory
											  ? "Update Category"
											  : "Create Category"}
									</Button>
								</div>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-4">
				{categories.map((category) => (
					<div
						key={category.id}
						className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
					>
						<div>
							<h3 className="font-semibold">{category.name}</h3>
							{category.description && (
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{category.description}
								</p>
							)}
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleEdit(category)}
							>
								Edit
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => handleDelete(category.id)}
							>
								Delete
							</Button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
