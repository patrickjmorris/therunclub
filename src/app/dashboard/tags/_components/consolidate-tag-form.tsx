"use client";

import { useRef, useEffect, useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
	consolidateTagsAction,
	type ConsolidateTagsState,
} from "@/app/actions/admin/tag-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

function SubmitButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending}>
			{pending ? "Consolidating..." : "Consolidate Tags"}
		</Button>
	);
}

export default function ConsolidateTagForm() {
	const initialState: ConsolidateTagsState = { success: false };
	const [state, formAction] = useActionState(
		consolidateTagsAction,
		initialState,
	);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (state.success && state.message) {
			toast.success(state.message);
			formRef.current?.reset();
		}
		if (!state.success && state.error) {
			toast.error(state.error);
		}
	}, [state]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Consolidate Tags Manually</CardTitle>
				<CardDescription>
					Enter a tag to replace (variant) and the tag it should become
					(canonical).
				</CardDescription>
			</CardHeader>
			<form ref={formRef} action={formAction}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="variantTag">Variant Tag (To Replace)</Label>
						<Input
							id="variantTag"
							name="variantTag"
							placeholder="e.g., grand slam ultra"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="canonicalTag">Canonical Tag (Target)</Label>
						<Input
							id="canonicalTag"
							name="canonicalTag"
							placeholder="e.g., grand slam of ultrarunning"
							required
						/>
					</div>
				</CardContent>
				<CardFooter>
					<SubmitButton />
				</CardFooter>
			</form>
		</Card>
	);
}
