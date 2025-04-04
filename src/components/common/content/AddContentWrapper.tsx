import { canManageContent } from "@/lib/auth-utils";
import AddContentDialog from "./AddContentDialog";

interface AddContentWrapperProps {
	defaultTab?: "podcast" | "channel";
}

export default async function AddContentWrapper({
	defaultTab,
}: AddContentWrapperProps) {
	const hasPermission = await canManageContent();

	if (!hasPermission) return null;

	return <AddContentDialog defaultTab={defaultTab} />;
}
