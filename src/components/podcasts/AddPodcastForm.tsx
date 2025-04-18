"use client";

import { useActionState } from "react";
import { addPodcast } from "@/app/actions/podcasts";
import type { AddPodcastState } from "@/app/actions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useFormStatus } from "react-dom";

const initialState: AddPodcastState = {
	errors: {},
	message: null,
};

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending}>
			{pending ? (
				<>
					<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
					Adding...
				</>
			) : (
				"Add Podcast"
			)}
		</Button>
	);
}

export default function AddPodcastForm() {
	const [state, formAction] = useActionState<AddPodcastState, FormData>(
		addPodcast,
		initialState,
	);

	return (
		<form action={formAction} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="feedUrl">Podcast RSS Feed URL</Label>
				<Input
					id="feedUrl"
					name="feedUrl"
					type="url"
					placeholder="https://example.com/feed.xml"
					required
					aria-describedby="feedUrl-error"
				/>
				{state.errors?.feedUrl && (
					<p className="text-sm text-red-500" id="feedUrl-error">
						{state.errors.feedUrl}
					</p>
				)}
			</div>

			{state.errors?._form && (
				<Alert variant="destructive">
					<AlertDescription>{state.errors._form}</AlertDescription>
				</Alert>
			)}

			{state.message && !state.errors && (
				<Alert>
					<AlertDescription>{state.message}</AlertDescription>
				</Alert>
			)}

			<SubmitButton />
		</form>
	);
}
