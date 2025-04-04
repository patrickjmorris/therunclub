import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MentionErrorProps {
	title?: string;
	message?: string;
}

export function MentionError({
	title = "Error Loading Mentions",
	message = "There was a problem loading the mentions. Please try again later.",
}: MentionErrorProps) {
	return (
		<Alert variant="destructive">
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>{title}</AlertTitle>
			<AlertDescription>{message}</AlertDescription>
		</Alert>
	);
}
