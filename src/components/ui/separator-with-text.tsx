import * as React from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SeparatorWithTextProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

export function SeparatorWithText({
	children,
	className,
	...props
}: SeparatorWithTextProps) {
	return (
		<div
			className={cn("relative flex items-center justify-center", className)}
			{...props}
		>
			<Separator className="absolute inset-0 flex-1" />
			<span className="relative z-10 bg-background px-2 text-sm text-muted-foreground">
				{children}
			</span>
		</div>
	);
}
