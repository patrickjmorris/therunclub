"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { addVideo } from "@/app/actions/videos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { useState, useEffect, useRef, useTransition } from "react";

const initialState = {
	errors: {},
	message: "",
};

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending}>
			{pending ? "Importing Video..." : "Import Video"}
		</Button>
	);
}

export function VideoImportDialog() {
	const [open, setOpen] = useState(false);
	const [state, formAction] = useActionState(addVideo, initialState);
	const formRef = useRef<HTMLFormElement>(null);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	// Track whether we've shown success and should close
	const hasShownSuccessRef = useRef(false);

	// Handle dialog close - reset state
	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);

		// If dialog is opening, reset internal state
		if (newOpen) {
			hasShownSuccessRef.current = false;
			if (formRef.current) {
				formRef.current.reset();
			}

			// Reset the form state when reopening
			startTransition(() => {
				// Reset form state without submitting
				// Using an empty FormData to reset the state
				formAction(new FormData());
			});
		}
	};

	// Handle successful submission
	useEffect(() => {
		// If we have a success message and no errors, show success then close dialog
		if (
			state.message &&
			!state.errors?._form &&
			!state.errors?.url &&
			!hasShownSuccessRef.current
		) {
			// Mark that we've handled this success
			hasShownSuccessRef.current = true;

			// Short timeout to allow user to see success message
			const timer = setTimeout(() => {
				setOpen(false);

				// Reset form after closing
				if (formRef.current) {
					formRef.current.reset();
				}

				// Revalidate the page data using a transition to prevent
				// interrupting the current render cycle
				startTransition(() => {
					router.refresh();
				});
			}, 2000); // Increased timeout to 2 seconds to ensure message is seen

			return () => clearTimeout(timer);
		}
	}, [state, router]);

	// Handle form submission
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		// Use startTransition to properly wrap the formAction call
		startTransition(() => {
			formAction(formData);
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className="flex items-center gap-1">
					<PlusCircle className="h-4 w-4" />
					Import Video
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Import YouTube Video</DialogTitle>
					<DialogDescription>
						Enter a YouTube video URL to import it to The Run Club
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="url">YouTube Video URL</Label>
							<Input
								id="url"
								name="url"
								type="text"
								placeholder="https://www.youtube.com/watch?v=..."
								required
								className="w-full"
							/>
							{state.errors?.url && (
								<p className="text-sm text-red-500">{state.errors.url[0]}</p>
							)}
						</div>

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="forceUpdate"
								name="forceUpdate"
								className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							/>
							<Label htmlFor="forceUpdate" className="text-sm">
								Force update (reimport video even if it exists)
							</Label>
						</div>

						{state.errors?._form && (
							<Alert variant="destructive">
								<AlertDescription>{state.errors._form[0]}</AlertDescription>
							</Alert>
						)}

						{state.message && !state.errors?._form && (
							<Alert>
								<AlertDescription>{state.message}</AlertDescription>
							</Alert>
						)}
					</div>
					<DialogFooter>
						<SubmitButton />
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
