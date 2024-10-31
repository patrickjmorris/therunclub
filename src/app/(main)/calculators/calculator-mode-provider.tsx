"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaceCalculator from "@/components/calculator/pace-calculator";
import { useQueryState } from "nuqs";
import { QuickTips } from "./quick-tips";
import { AdvancedTips } from "./advanced-tips";

export function CalculatorModeProvider() {
	const [calculatorMode, setCalculatorMode] = useQueryState("mode", {
		defaultValue: "simple",
		parse: (value) => value as "simple" | "advanced",
		serialize: (value) => value,
	});

	return (
		<Tabs
			defaultValue={calculatorMode}
			value={calculatorMode}
			className="space-y-8"
			onValueChange={(value) => setCalculatorMode(value)}
		>
			<TabsList>
				<TabsTrigger value="simple">Simple Calculator</TabsTrigger>
				<TabsTrigger value="advanced">Advanced Calculator</TabsTrigger>
			</TabsList>

			<TabsContent value="simple" className="space-y-8">
				<div className="grid md:grid-cols-[1fr,300px] gap-8">
					<PaceCalculator mode="simple" />
					<QuickTips />
				</div>
			</TabsContent>

			<TabsContent value="advanced" className="space-y-8">
				<div className="grid md:grid-cols-[1fr,300px] gap-8">
					<PaceCalculator mode="advanced" />
					<AdvancedTips />
				</div>
			</TabsContent>
		</Tabs>
	);
}

export default CalculatorModeProvider;
