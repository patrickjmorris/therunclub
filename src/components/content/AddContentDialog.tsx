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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon } from "@radix-ui/react-icons";
import AddPodcastForm from "@/components/content/AddPodcastForm";
import AddChannelForm from "@/components/content/AddChannelForm";

interface AddContentDialogProps {
	defaultTab?: "podcast" | "channel";
}

export default function AddContentDialog({
	defaultTab = "podcast",
}: AddContentDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button>
					<PlusIcon className="mr-2 h-4 w-4" />
					Add Content
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New Content</DialogTitle>
					<DialogDescription>
						Add a new podcast or YouTube channel to the platform.
					</DialogDescription>
				</DialogHeader>
				<Tabs defaultValue={defaultTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="podcast">Podcast</TabsTrigger>
						<TabsTrigger value="channel">YouTube Channel</TabsTrigger>
					</TabsList>
					<TabsContent value="podcast">
						<AddPodcastForm />
					</TabsContent>
					<TabsContent value="channel">
						<AddChannelForm />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
