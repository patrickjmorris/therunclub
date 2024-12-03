"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryState } from "nuqs";
import { type ReactNode } from "react";

interface TabsWithStateProps {
	tabs: {
		value: string;
		label: string;
		content: ReactNode;
	}[];
	className?: string;
}

export function TabsWithState({ tabs, className }: TabsWithStateProps) {
	const [tab, setTab] = useQueryState("tab", {
		defaultValue: "description",
		history: "push",
	});

	return (
		<Tabs value={tab} onValueChange={setTab} className={className}>
			<TabsList className="justify-start">
				{tabs.map((tab) => (
					<TabsTrigger key={tab.value} value={tab.value}>
						{tab.label}
					</TabsTrigger>
				))}
			</TabsList>
			{tabs.map((tab) => (
				<TabsContent key={tab.value} value={tab.value}>
					{tab.content}
				</TabsContent>
			))}
		</Tabs>
	);
}
