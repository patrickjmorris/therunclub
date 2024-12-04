"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "@radix-ui/react-icons";
import AddPodcastForm from "./AddPodcastForm";

export default function AddPodcastDialog() {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className="mr-2 h-4 w-4" />
					Add Podcast
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New Podcast</DialogTitle>
					<DialogDescription>
						Enter the RSS feed URL of the podcast you want to add.
					</DialogDescription>
				</DialogHeader>
				<AddPodcastForm />
			</DialogContent>
		</Dialog>
	);
}
