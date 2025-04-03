"use client";

import { useFormStatus } from "react-dom";
import { addChannel } from "@/app/actions/channels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import type { AddChannelState } from "@/app/actions/types";
import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
					<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
					Adding...
				</>
			) : (
				"Add Channel"
			)}
		</Button>
	);
}

export default function AddChannelForm() {
	const [state, formAction] = useActionState<AddChannelState, FormData>(
		addChannel,
		initialState,
	);
	const router = useRouter();

	useEffect(() => {
		if (state?.redirect) {
			router.push(state.redirect);
		}
	}, [state?.redirect, router]);

	return (
		<form action={formAction} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="url">YouTube Channel URL</Label>
				<Input
					id="url"
					name="url"
					type="url"
					placeholder="https://youtube.com/@channel"
					required
					aria-describedby="url-error"
				/>
				{state.errors?.url && (
					<p className="text-sm text-red-500" id="url-error">
						{state.errors.url}
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
