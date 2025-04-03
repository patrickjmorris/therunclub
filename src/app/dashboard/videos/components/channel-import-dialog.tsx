"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { addChannel } from "@/app/actions/channels";
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
import { Loader2, Youtube } from "lucide-react";
import { useState, useEffect, useRef, useTransition } from "react";
import type { AddChannelState } from "@/app/actions/types";

const initialState: AddChannelState = {
	errors: {},
	message: undefined,
};

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending}>
			{pending ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Adding...
				</>
			) : (
				"Add Channel"
			)}
		</Button>
	);
}

// Helper function to process YouTube channel URLs and handles
function processYouTubeChannelInput(input: string): string {
	console.log("Processing channel input:", input);
	const trimmed = input.trim();

	// Direct handle: @username
	if (/^@[\w\.-]+$/.test(trimmed)) {
		console.log("Direct handle format detected:", trimmed);
		return trimmed;
	}

	// Username without @: add it
	if (/^[\w\.-]+$/.test(trimmed) && !trimmed.startsWith("UC")) {
		console.log("Adding @ to username:", trimmed);
		return `@${trimmed}`;
	}

	// Channel ID: just return it
	if (/^UC[\w-]{21,22}$/.test(trimmed)) {
		console.log("Channel ID detected:", trimmed);
		return trimmed;
	}

	// youtube.com/@handle format
	if (trimmed.includes("youtube.com/@")) {
		const match = trimmed.match(/youtube\.com\/@([\w\.-]+)/i);
		if (match?.[1]) {
			console.log("Extracted handle from URL:", match[1]);
			return `@${match[1]}`;
		}
	}

	// youtube.com/channel/UC... format
	const channelMatch = trimmed.match(
		/youtube\.com\/channel\/(UC[\w-]{21,22})/i,
	);
	if (channelMatch?.[1]) {
		console.log("Extracted channel ID from URL:", channelMatch[1]);
		return channelMatch[1];
	}

	// No transformation needed/possible, return as is
	console.log("No transformation applied, returning as is");
	return trimmed;
}

export function ChannelImportDialog() {
	const [open, setOpen] = useState(false);
	const [state, formAction] = useActionState<AddChannelState, FormData>(
		addChannel,
		initialState,
	);
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
				// Using any empty FormData to reset the state
				formAction(new FormData());
			});
		}
	};

	// Handle successful submission
	useEffect(() => {
		// If we have a success message and no errors, show success then close dialog
		if (
			state?.message &&
			!state?.errors?._form &&
			!state?.errors?.url &&
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

	// Display the first error message if it's an array
	const getErrorMessage = (errorField: string[] | string | undefined) => {
		if (Array.isArray(errorField)) return errorField[0];
		return errorField;
	};

	// Handle form submission with preprocessing
	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// Get form data
		const formData = new FormData(event.currentTarget);
		const url = formData.get("url") as string;

		// Process the URL to handle various formats
		const processedUrl = processYouTubeChannelInput(url);

		// Create new FormData with processed URL
		const newFormData = new FormData();
		newFormData.append("url", processedUrl);

		// Log the processed URL
		console.log("Submitting channel with processed URL:", processedUrl);

		// Use startTransition to wrap the formAction call
		startTransition(() => {
			formAction(newFormData);
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="outline" className="flex items-center gap-1">
					<Youtube className="h-4 w-4" />
					Import Channel
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Import YouTube Channel</DialogTitle>
					<DialogDescription>
						Enter a YouTube channel URL or handle to import all videos
					</DialogDescription>
				</DialogHeader>
				<form ref={formRef} onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="url">YouTube Channel URL or Handle</Label>
							<Input
								id="url"
								name="url"
								type="text"
								placeholder="https://youtube.com/@channelname or @channelname"
								required
								className="w-full"
							/>
							<p className="text-xs text-muted-foreground">
								Examples: https://youtube.com/@tracknationtv, @tracknationtv, or
								just tracknationtv
							</p>
							{state?.errors?.url && (
								<p className="text-sm text-red-500" id="url-error">
									{getErrorMessage(state.errors.url)}
								</p>
							)}
						</div>

						{state?.errors?._form && (
							<Alert variant="destructive">
								<AlertDescription>
									{getErrorMessage(state.errors._form)}
								</AlertDescription>
							</Alert>
						)}

						{state?.message && !state?.errors && (
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
