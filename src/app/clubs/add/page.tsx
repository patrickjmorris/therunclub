"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "next-safe-action/hooks";
import { extractClubInfo_Action } from "@/app/clubs/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AddClubPage() {
	const router = useRouter();

	const { execute, status, result } = useAction(extractClubInfo_Action, {
		onSuccess: (data) => {
			// console.log("Success:", data);
			toast.success("Club information extracted successfully");
			router.push("/clubs");
		},
		onError: (error) => {
			console.error("Error:", error);
			toast.error(error.error?.serverError || "Something went wrong");
		},
		onExecute: () => {
			// console.log("Executing action...");
		},
	});

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const form = e.currentTarget;
		const formData = new FormData(form);
		const text = formData.get("text");

		console.log("Submitting form with text:", text);

		try {
			execute({ text: text as string });
		} catch (error) {
			console.error("Form submission error:", error);
			toast.error("Failed to submit form");
		}
	}

	return (
		<div className="container max-w-2xl py-8">
			<h1 className="text-2xl font-bold mb-6">Add Running Club</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<Textarea
					name="text"
					placeholder="Paste running club information here..."
					className="min-h-[200px]"
					required
					aria-label="Running club information"
					disabled={status === "executing"}
				/>

				{result?.serverError && (
					<p className="text-sm text-destructive" role="alert">
						{result.serverError}
					</p>
				)}

				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/clubs")}
						disabled={status === "executing"}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={status === "executing"}>
						{status === "executing" ? "Processing..." : "Extract Club Info"}
					</Button>
				</div>
			</form>
		</div>
	);
}
