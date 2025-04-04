import { Icons } from "@/components/common/icons";

export function ComingSoon() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
			<Icons.logo className="h-16 w-16 mb-4" />
			<h1 className="text-3xl font-bold mb-2">Coming Soon</h1>
			<p className="text-muted-foreground">
				We're working hard to bring you this content. Stay tuned!
			</p>
		</div>
	);
}
