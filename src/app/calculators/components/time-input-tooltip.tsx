import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function TimeInputTooltip() {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Info className="h-4 w-4 text-muted-foreground inline-block ml-2" />
				</TooltipTrigger>
				<TooltipContent className="max-w-xs">
					<div className="space-y-2">
						<p className="font-medium">Keyboard Shortcuts:</p>
						<ul className="text-sm space-y-1">
							<li>↑/↓: Change seconds by 1</li>
							<li>Shift + ↑/↓: Change seconds by 5</li>
							<li>Ctrl/Cmd + ↑/↓: Change minutes by 1</li>
							<li>Shift + Ctrl/Cmd + ↑/↓: Change minutes by 5</li>
						</ul>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
